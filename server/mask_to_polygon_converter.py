"""Bridge module: converts Mask R-CNN instance detections to the polygon format
expected by the Three.js 3D viewer.

The viewer expects JSON in this shape:
    {
        "canvas_size": [W, H],
        "content_rect": [left, top, inner_w, inner_h],
        "polygons": {
            "wall":   [{"outer": [[x,y], ...], "holes": [[[x,y], ...], ...]}, ...],
            "door":   [...],
            "window": [...]
        },
        "input_image_b64": "..."
    }

Mask R-CNN produces per-detection results:
    {
        "rois":      [[y1,x1,y2,x2], ...],        # bounding boxes
        "class_ids": [1, 2, 3, ...],               # 1=wall, 2=window, 3=door
        "scores":    [0.99, ...],                   # confidence scores
        "masks":     3D bool array (H, W, N)        # per-instance masks
    }

Pipeline per class:
    1. Combine all instance masks of the class into one binary mask.
    2. For walls, subtract door and window regions so walls have proper gaps
       (matching the semantic segmentation behavior where door/window pixels
       override wall pixels).
    3. Morphological closing (3x3) to bridge 1-px gaps.
    4. cv2.findContours(RETR_CCOMP) for outer contours + one level of holes.
    5. cv2.approxPolyDP to collapse pixel staircases.
    6. Drop polygons below MIN_POLYGON_AREA_PX.
"""

from __future__ import annotations

import base64
import io
import logging

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------
# Parameters — kept identical to the original extract_polygons.py so the
# visual quality of the 3D output matches what the viewer was designed for.
# --------------------------------------------------------------------------
CLOSING_KERNEL_PX: int = 5  # Increased from 3 to better connect wall segments
APPROX_EPSILON_PX: float = 1.2  # Reduced from 1.5 to preserve more detail
MIN_POLYGON_AREA_PX: float = 20.0  # Reduced from 30.0 to capture smaller rooms

# Mask R-CNN class IDs (from the FloorPlanTo3D-API training config)
CLASS_WALL: int = 1
CLASS_WINDOW: int = 2
CLASS_DOOR: int = 3


def _is_l_shaped(polygon_points: np.ndarray) -> bool:
    """Detect if a polygon is L-shaped (corner window).
    
    An L-shaped polygon typically has:
    - More than 4 vertices (after simplification)
    - High perimeter to area ratio
    - Concave shape
    """
    if len(polygon_points) < 6:  # L-shape needs at least 6 points
        return False
    
    area = cv2.contourArea(polygon_points)
    perimeter = cv2.arcLength(polygon_points, True)
    
    if area < MIN_POLYGON_AREA_PX or perimeter == 0:
        return False
    
    # Calculate compactness (circularity) - L-shapes have low compactness
    compactness = (4 * np.pi * area) / (perimeter * perimeter)
    
    # L-shapes are less compact than rectangles (compactness < 0.3)
    # and have high perimeter relative to area
    if compactness < 0.35:
        # Check if it's concave (has inward angles)
        hull = cv2.convexHull(polygon_points)
        hull_area = cv2.contourArea(hull)
        if hull_area > 0:
            solidity = area / hull_area
            # L-shapes have low solidity (< 0.85)
            if solidity < 0.85:
                return True
    
    return False


def _find_corner_column(contour: np.ndarray, wall_mask: np.ndarray) -> tuple[bool, tuple[int, int] | None]:
    """Detect if there's a column (wall) at the corner of an L-shaped window.
    
    Returns:
        (has_column, corner_position): Boolean indicating if column exists, and its position
    """
    # Get the bounding box of the window
    x, y, w, h = cv2.boundingRect(contour)
    
    # Calculate potential corner positions (inner corner of L-shape)
    # Check the center region of the bounding box for wall presence
    center_x = x + w // 2
    center_y = y + h // 2
    
    # Define a search region around the center (likely corner location)
    search_radius = min(w, h) // 4
    if search_radius < 3:
        search_radius = 3
    
    # Extract the region around potential corner
    y1 = max(0, center_y - search_radius)
    y2 = min(wall_mask.shape[0], center_y + search_radius)
    x1 = max(0, center_x - search_radius)
    x2 = min(wall_mask.shape[1], center_x + search_radius)
    
    corner_region = wall_mask[y1:y2, x1:x2]
    
    # If there's significant wall presence in the corner region, we have a column
    wall_pixels = np.sum(corner_region > 0)
    total_pixels = corner_region.size
    
    if total_pixels == 0:
        return False, None
    
    wall_ratio = wall_pixels / total_pixels
    
    # If more than 40% of the corner region is wall, consider it a column
    if wall_ratio > 0.4:
        logger.debug(f"Column detected at corner ({center_x}, {center_y}), wall ratio: {wall_ratio:.2f}")
        return True, (center_x, center_y)
    
    return False, None


def _split_l_shaped_polygon(contour: np.ndarray, binary_mask: np.ndarray, wall_mask: np.ndarray) -> list[np.ndarray]:
    """Split an L-shaped polygon into separate rectangular segments.
    
    Strategy:
    1. Check if there's a column at the corner - if yes, use targeted splitting
    2. Create a mask for this contour only
    3. If column detected, use it as a splitting guide
    4. Apply morphological opening to separate the L into components
    5. Find new contours in the separated mask
    
    Args:
        contour: The L-shaped window contour to split
        binary_mask: The full window mask
        wall_mask: The wall mask to detect columns/pillars at corners
    """
    # First, check if there's a column at the corner
    has_column, corner_pos = _find_corner_column(contour, wall_mask)
    
    # Create a mask containing only this contour
    mask_h, mask_w = binary_mask.shape
    single_contour_mask = np.zeros((mask_h, mask_w), dtype=np.uint8)
    cv2.drawContours(single_contour_mask, [contour], -1, 255, -1)
    
    if has_column and corner_pos:
        # If there's a column, use targeted erosion around the corner
        logger.debug("Using column-guided splitting")
        
        # Create a splitting line through the column
        cx, cy = corner_pos
        x, y, w, h = cv2.boundingRect(contour)
        
        # Draw a cross through the column to separate the window
        line_thickness = max(3, min(w, h) // 10)
        
        # Create a mask to subtract (the column area)
        split_mask = single_contour_mask.copy()
        
        # Draw lines through the column position to create separation
        cv2.line(split_mask, (cx - line_thickness, cy - line_thickness), 
                 (cx + line_thickness, cy + line_thickness), 0, line_thickness * 2)
        cv2.line(split_mask, (cx - line_thickness, cy + line_thickness), 
                 (cx + line_thickness, cy - line_thickness), 0, line_thickness * 2)
        
        # Also erode slightly to clean up the split
        erode_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        split_mask = cv2.erode(split_mask, erode_kernel, iterations=1)
        
        opened = split_mask
    else:
        # No column detected, use standard morphological opening
        logger.debug("Using standard morphological splitting")
        
        # Use morphological opening with a larger kernel to separate L-shape
        separation_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        opened = cv2.morphologyEx(single_contour_mask, cv2.MORPH_OPEN, separation_kernel, iterations=2)
        
        # If opening didn't work well, try erosion followed by dilation
        if opened.sum() < single_contour_mask.sum() * 0.3:  # Lost too much area
            erode_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            eroded = cv2.erode(single_contour_mask, erode_kernel, iterations=3)
            opened = cv2.dilate(eroded, erode_kernel, iterations=2)
    
    # Find separate contours in the opened mask
    separated_contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    
    # Filter by minimum area
    valid_contours = [
        c for c in separated_contours 
        if cv2.contourArea(c) >= MIN_POLYGON_AREA_PX
    ]
    
    # If we got valid separate contours, return them; otherwise return original
    if len(valid_contours) >= 2:
        logger.info(f"Split L-shaped window into {len(valid_contours)} segments" + 
                   (" (column-guided)" if has_column else ""))
        return valid_contours
    else:
        logger.debug("Could not split L-shaped polygon, keeping original")
        return [contour]


def _extract_polygons_from_mask(binary_mask: np.ndarray, split_l_shapes: bool = False, wall_mask: np.ndarray = None) -> list[dict]:
    """Extract simplified polygons (outer ring + holes) from a binary mask.

    Uses the same pipeline as the original buildingcv.extract_polygons module:
    closing → findContours(RETR_CCOMP) → approxPolyDP → area filter.
    
    Args:
        binary_mask: Binary mask to extract polygons from
        split_l_shapes: If True, detect and split L-shaped polygons (corner windows)
        wall_mask: Wall mask for detecting columns at corners (required if split_l_shapes=True)
    """
    if binary_mask.sum() == 0:
        return []

    # Ensure uint8 for OpenCV
    mask = binary_mask.astype(np.uint8)

    # Bridge hairline gaps without smoothing real ~5px door openings
    kernel = cv2.getStructuringElement(
        cv2.MORPH_RECT, (CLOSING_KERNEL_PX, CLOSING_KERNEL_PX)
    )
    closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    # RETR_CCOMP: two-level hierarchy (outer contours + immediate child holes)
    contours, hierarchy = cv2.findContours(
        closed, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE
    )
    if hierarchy is None:
        return []
    hierarchy = hierarchy[0]  # shape (N, 4) — [next, prev, child, parent]

    # Group child holes under their parent outer contour
    holes_by_parent: dict[int, list[int]] = {}
    for i, (_, _, _, parent) in enumerate(hierarchy):
        if parent != -1:
            holes_by_parent.setdefault(parent, []).append(i)

    polygons: list[dict] = []
    for i, (_, _, _, parent) in enumerate(hierarchy):
        if parent != -1:
            continue  # this is a hole — handled via its parent

        if cv2.contourArea(contours[i]) < MIN_POLYGON_AREA_PX:
            continue

        # Check if this is an L-shaped polygon that should be split
        contours_to_process = [contours[i]]
        if split_l_shapes and _is_l_shaped(contours[i]):
            if wall_mask is not None:
                contours_to_process = _split_l_shaped_polygon(contours[i], mask, wall_mask)
            else:
                logger.warning("L-shape splitting requested but no wall_mask provided")
        
        # Process each contour (original or split segments)
        for contour in contours_to_process:
            if cv2.contourArea(contour) < MIN_POLYGON_AREA_PX:
                continue
                
            # Simplify outer ring (kill pixel staircases)
            outer = cv2.approxPolyDP(contour, APPROX_EPSILON_PX, closed=True)
            outer = outer.reshape(-1, 2).astype(float).tolist()
            if len(outer) < 3:
                continue

            # Collect and simplify hole rings (only for original unsplit contours)
            holes: list[list[list[float]]] = []
            if contour is contours[i]:  # Original contour, check for holes
                for j in holes_by_parent.get(i, []):
                    if cv2.contourArea(contours[j]) < MIN_POLYGON_AREA_PX:
                        continue
                    ring = cv2.approxPolyDP(contours[j], APPROX_EPSILON_PX, closed=True)
                    ring = ring.reshape(-1, 2).astype(float).tolist()
                    if len(ring) >= 3:
                        holes.append(ring)

            polygons.append({"outer": outer, "holes": holes})

    return polygons


def convert_detections_to_viewer_json(
    model_results: dict,
    original_image: Image.Image,
) -> dict:
    """Convert Mask R-CNN detections to the JSON format the Three.js viewer expects.

    Args:
        model_results: dict with keys 'rois', 'class_ids', 'scores', 'masks'
                       as returned by ``model.detect()``.
        original_image: PIL Image of the original floor plan (used for the
                        base-64 floor texture and to determine canvas dimensions).

    Returns:
        dict matching the viewer's ``ExtractionResult`` schema.
    """
    w, h = original_image.size
    class_ids = model_results["class_ids"]
    masks = model_results["masks"]  # (H, W, N) boolean

    # ------------------------------------------------------------------
    # 1. Combine instance masks per class
    # ------------------------------------------------------------------
    wall_mask = np.zeros((h, w), dtype=np.uint8)
    door_mask = np.zeros((h, w), dtype=np.uint8)
    window_mask = np.zeros((h, w), dtype=np.uint8)

    for i, cid in enumerate(class_ids):
        if i >= masks.shape[2]:
            continue
        instance_mask = masks[:, :, i].astype(np.uint8)
        if cid == CLASS_WALL:
            wall_mask = np.maximum(wall_mask, instance_mask)
        elif cid == CLASS_WINDOW:
            window_mask = np.maximum(window_mask, instance_mask)
        elif cid == CLASS_DOOR:
            door_mask = np.maximum(door_mask, instance_mask)

    logger.info(
        "Mask pixel counts — wall: %d, door: %d, window: %d",
        wall_mask.sum(), door_mask.sum(), window_mask.sum(),
    )

    # ------------------------------------------------------------------
    # 2. Subtract door/window regions from the wall mask & apply overlap
    # ------------------------------------------------------------------
    wall_mask[door_mask > 0] = 0
    wall_mask[window_mask > 0] = 0

    # Dilate masks slightly (2px) to bridge approximation gaps at junctions
    overlap_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    wall_mask_ext = cv2.dilate(wall_mask, overlap_kernel, iterations=1)
    door_mask_ext = cv2.dilate(door_mask, overlap_kernel, iterations=1)
    window_mask_ext = cv2.dilate(window_mask, overlap_kernel, iterations=1)

    # ------------------------------------------------------------------
    # 3. Extract polygons from each expanded class mask
    # ------------------------------------------------------------------
    wall_polygons = _extract_polygons_from_mask(wall_mask_ext, split_l_shapes=False)
    door_polygons = _extract_polygons_from_mask(door_mask_ext, split_l_shapes=False)
    # Enable L-shape splitting for windows to handle corner windows properly
    # Pass wall_mask to detect columns at corners
    window_polygons = _extract_polygons_from_mask(
        window_mask_ext, 
        split_l_shapes=True, 
        wall_mask=wall_mask_ext
    )

    logger.info(
        "Polygon counts — wall: %d, door: %d, window: %d",
        len(wall_polygons), len(door_polygons), len(window_polygons),
    )

    # ------------------------------------------------------------------
    # 4. Encode the original image as base-64 PNG for the floor texture
    # ------------------------------------------------------------------
    buf = io.BytesIO()
    # Convert to RGB to strip alpha (if any) and keep file size small
    original_image.convert("RGB").save(buf, format="PNG")
    input_image_b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    return {
        "canvas_size": [w, h],
        "content_rect": [0, 0, w, h],
        "polygons": {
            "wall": wall_polygons,
            "door": door_polygons,
            "window": window_polygons,
        },
        "input_image_b64": input_image_b64,
    }
