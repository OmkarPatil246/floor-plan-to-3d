"""Merged server: Mask R-CNN detection backend + Three.js 3D viewer.

Loads the Mask R-CNN model (from FloorPlanTo3D-API) at startup and serves:
  - GET  /           → the 3D viewer HTML
  - GET  /demos/*    → pre-built demo JSON files
  - GET  /healthz    → server health + model status
  - POST /extract-image  → run detection on an uploaded image (PNG/JPG/etc.)
  - POST /extract        → run detection on an uploaded SVG (converted to image first)

The detection output is converted to the polygon format the viewer expects
via ``mask_to_polygon_converter.convert_detections_to_viewer_json``.
"""

from __future__ import annotations

import io
import logging
import os
import sys
import traceback
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ---------------------------------------------------------------------------
# Project root — derived from this file's location so paths work regardless
# of the working directory uvicorn / python is launched from.
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# --- Local imports (all copied from FloorPlanTo3D-API) --------------------
from mrcnn.config import Config as MRCNNBaseConfig
from mrcnn.model import MaskRCNN, mold_image
from numpy import expand_dims

from config.settings import get_config
from image_processing.image_loader import myImageLoader
from services.image_validation import validate_and_resize_image
from server.mask_to_polygon_converter import convert_detections_to_viewer_json
from server.structured_document_generator import generate_structured_document

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
app_config = get_config()

logging.basicConfig(
    level=getattr(logging, app_config.LOG_LEVEL),
    format=app_config.LOG_FORMAT,
)
logger = logging.getLogger(__name__)

VIEWER_DIR = PROJECT_ROOT / "viewer"
VIEWER_HTML = VIEWER_DIR / "index.html"
DEMOS_DIR = VIEWER_DIR / "demos"

# Create output directories (used by some analysis modules)
os.makedirs(PROJECT_ROOT / "outputs" / "images", exist_ok=True)
os.makedirs(PROJECT_ROOT / "outputs" / "json", exist_ok=True)

MAX_UPLOAD_BYTES = 16 * 1024 * 1024  # 16 MB


# ---------------------------------------------------------------------------
# Mask R-CNN prediction config (matches training hyper-params)
# ---------------------------------------------------------------------------
class PredictionConfig(MRCNNBaseConfig):
    NAME = app_config.MODEL_NAME
    NUM_CLASSES = app_config.NUM_CLASSES         # 4: bg + wall + window + door
    GPU_COUNT = app_config.GPU_COUNT
    IMAGES_PER_GPU = app_config.IMAGES_PER_GPU
    DETECTION_MIN_CONFIDENCE = app_config.DETECTION_MIN_CONFIDENCE
    IMAGE_MAX_DIM = app_config.IMAGE_MAX_DIM


# ---------------------------------------------------------------------------
# Flask application
# ---------------------------------------------------------------------------
application = Flask(__name__, static_folder=str(VIEWER_DIR), static_url_path="")
application.debug = False  # TF model init breaks under Flask debug (double load)
CORS(application, resources={r"/*": {"origins": app_config.CORS_ORIGINS}})

# Global model state
_model: MaskRCNN | None = None
_cfg: PredictionConfig | None = None


def _initialize_model() -> None:
    """Load the Mask R-CNN weights once at startup."""
    global _model, _cfg

    model_dir = str(PROJECT_ROOT / "mrcnn")
    weights_path = str(
        PROJECT_ROOT / app_config.WEIGHTS_FOLDER.lstrip("./")
        / app_config.WEIGHTS_FILE_NAME
    )

    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"Weights file not found: {weights_path}")

    _cfg = PredictionConfig()
    logger.info("Initializing Mask R-CNN model …")
    _model = MaskRCNN(mode="inference", model_dir=model_dir, config=_cfg)
    _model.load_weights(weights_path, by_name=True)
    logger.info("Model loaded successfully!  weights=%s", weights_path)


# ---------------------------------------------------------------------------
# Core detection pipeline
# ---------------------------------------------------------------------------

# Minimum polygon area threshold (from mask_to_polygon_converter)
MIN_POLYGON_AREA_PX: float = 20.0


def _run_detection(pil_image: Image.Image) -> dict:
    """Run Mask R-CNN on a PIL Image and return viewer-compatible JSON.

    Steps:
      1. Validate / resize the image.
      2. Detect whether it is an office plan (thin lines) and enhance if so.
      3. Preprocess for the model (``mold_image``).
      4. Run ``model.detect`` at multiple rotations to capture angled walls.
      5. Merge detections from all angles.
      6. Convert instance masks → polygon JSON via the bridge module.
    """
    if _model is None or _cfg is None:
        raise RuntimeError("Model is not initialized")

    # 1. Validate & optionally downscale
    pil_image, resize_info = validate_and_resize_image(pil_image)
    bad_reasons = {
        "image_too_small",
        "resize_would_make_too_small",
        "image_too_large_resize_disabled",
    }
    if resize_info["reason"] in bad_reasons:
        raise ValueError(f"Image validation failed: {resize_info['reason']}")

    original_image = pil_image.copy()

    # 2. Office-plan heuristic — binarise and thicken if lines are very thin
    # IMPROVED: Better detection for large complex buildings
    img_rgb = original_image.convert("RGB")
    gray = cv2.cvtColor(np.array(img_rgb), cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    
    # Calculate line density
    avg_col = np.mean(np.sum(edges > 0, axis=0))
    avg_row = np.mean(np.sum(edges > 0, axis=1))
    max_density = max(avg_col, avg_row)
    
    # Also check image size - large images often need enhancement
    # Get dimensions before checking
    temp_w, temp_h = original_image.size
    image_area = temp_w * temp_h
    is_large_image = image_area > (1500 * 1500)  # Images larger than 1500x1500
    
    # Apply enhancement if:
    # 1. Lines are thin (original logic)
    # 2. Image is large and complex (new logic)
    is_office = max_density < 10 or is_large_image  # Increased threshold from 7 to 10
    
    if is_office:
        logger.info("Applying enhancement for thin lines or large complex floor plan")

    image_arr, w, h = myImageLoader(pil_image, enhance_for_office=is_office)
    logger.info(
        "Preprocessed image %dx%d%s",
        w, h, " (office/large building enhancement)" if is_office else "",
    )

    # -------------------------------------------------------------------------
    # 3. MULTI-ANGLE DETECTION: Run detection at 0°, 45°, 90°, 135° to capture
    #    angled walls that the model (trained on mostly horizontal/vertical walls)
    #    might miss at a single orientation.
    # -------------------------------------------------------------------------
    angles_to_try = [0, 45, 90, 135]  # Degrees to rotate
    all_detections = []
    
    for angle in angles_to_try:
        # Rotate image if needed
        if angle == 0:
            rotated_arr = image_arr.copy()
        else:
            # Rotate the image
            pil_rotated = Image.fromarray(image_arr).rotate(
                angle, 
                expand=True,  # Expand canvas to fit rotated image
                fillcolor=(255, 255, 255)  # White background
            )
            rotated_arr = np.array(pil_rotated)
        
        # Preprocess for Mask R-CNN
        scaled = mold_image(rotated_arr, _cfg)
        sample = expand_dims(scaled, 0)

        # Run detection
        r = _model.detect(sample, verbose=0)[0]
        
        # Rotate masks back to original orientation if needed
        if angle != 0:
            # Rotate masks back
            rotated_masks = []
            original_h, original_w = image_arr.shape[:2]
            rotated_h, rotated_w = rotated_arr.shape[:2]
            
            for i in range(r["masks"].shape[2]):
                mask = r["masks"][:, :, i].astype(np.uint8) * 255
                # Rotate mask back
                mask_pil = Image.fromarray(mask)
                mask_rotated_back = mask_pil.rotate(
                    -angle,  # Rotate back
                    expand=True,
                    fillcolor=0
                )
                # Crop to original size (center crop)
                back_arr = np.array(mask_rotated_back)
                bh, bw = back_arr.shape
                
                # Calculate crop coordinates to get back to original dimensions
                crop_y1 = max(0, (bh - original_h) // 2)
                crop_x1 = max(0, (bw - original_w) // 2)
                crop_y2 = crop_y1 + original_h
                crop_x2 = crop_x1 + original_w
                
                # Handle cases where rotated image is smaller than original
                if bh < original_h or bw < original_w:
                    # Pad to original size
                    padded = np.zeros((original_h, original_w), dtype=np.uint8)
                    pad_y = (original_h - bh) // 2
                    pad_x = (original_w - bw) // 2
                    padded[pad_y:pad_y+bh, pad_x:pad_x+bw] = back_arr
                    back_arr = padded
                else:
                    back_arr = back_arr[crop_y1:crop_y2, crop_x1:crop_x2]
                
                # Ensure exact dimensions
                if back_arr.shape[0] != original_h or back_arr.shape[1] != original_w:
                    back_arr = cv2.resize(back_arr, (original_w, original_h), interpolation=cv2.INTER_NEAREST)
                
                rotated_masks.append(back_arr > 127)
            
            if rotated_masks:
                r["masks"] = np.stack(rotated_masks, axis=2)
            else:
                r["masks"] = np.zeros((original_h, original_w, 0), dtype=bool)
        
        all_detections.append(r)
        
        n_wall = int(sum(1 for c in r["class_ids"] if c == 1))
        n_win = int(sum(1 for c in r["class_ids"] if c == 2))
        n_door = int(sum(1 for c in r["class_ids"] if c == 3))
        logger.info(
            "Detection at %d°: %d objects (wall=%d, window=%d, door=%d)",
            angle, len(r["class_ids"]), n_wall, n_win, n_door,
        )

    # -------------------------------------------------------------------------
    # 4. MERGE DETECTIONS: Combine masks from all angles using logical OR
    #    to capture walls detected at any orientation
    # -------------------------------------------------------------------------
    logger.info("Merging detections from %d angles...", len(angles_to_try))
    
    merged_result = {
        "class_ids": [],
        "scores": [],
        "masks": None,
        "rois": []
    }
    
    # Collect all masks by class
    mask_h, mask_w = image_arr.shape[:2]
    class_masks = {1: [], 2: [], 3: []}  # wall, window, door
    class_scores = {1: [], 2: [], 3: []}
    
    for r in all_detections:
        for i, cid in enumerate(r["class_ids"]):
            if i < r["masks"].shape[2] and cid in class_masks:
                class_masks[cid].append(r["masks"][:, :, i])
                class_scores[cid].append(r["scores"][i])
    
    # Merge masks per class using OR operation
    final_masks_list = []
    final_class_ids = []
    final_scores = []
    
    for class_id in [1, 2, 3]:  # wall, window, door
        if class_masks[class_id]:
            # Combine all masks of this class using OR
            combined_mask = np.zeros((mask_h, mask_w), dtype=bool)
            for mask in class_masks[class_id]:
                combined_mask = np.logical_or(combined_mask, mask)
            
            # Only add if there's significant content
            if combined_mask.sum() > MIN_POLYGON_AREA_PX:
                final_masks_list.append(combined_mask)
                final_class_ids.append(class_id)
                # Use max score from all angles
                final_scores.append(max(class_scores[class_id]))
    
    if final_masks_list:
        merged_result["masks"] = np.stack(final_masks_list, axis=2)
    else:
        merged_result["masks"] = np.zeros((mask_h, mask_w, 0), dtype=bool)
    
    merged_result["class_ids"] = np.array(final_class_ids)
    merged_result["scores"] = np.array(final_scores)
    
    n_wall = int(sum(1 for c in merged_result["class_ids"] if c == 1))
    n_win = int(sum(1 for c in merged_result["class_ids"] if c == 2))
    n_door = int(sum(1 for c in merged_result["class_ids"] if c == 3))
    logger.info(
        "MERGED Detection: %d objects (wall=%d, window=%d, door=%d)",
        len(merged_result["class_ids"]), n_wall, n_win, n_door,
    )

    # 5. Convert to viewer polygon format
    return convert_detections_to_viewer_json(merged_result, original_image)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@application.route("/")
def index():
    """Serve the 3D viewer HTML at the root URL."""
    return send_from_directory(str(VIEWER_DIR), "index.html")


@application.route("/demos/<path:path>")
def serve_demos(path):
    """Serve pre-built demo JSON files."""
    return send_from_directory(str(DEMOS_DIR), path)


@application.route("/healthz")
def healthz():
    """Health check — the viewer probes this at startup to decide whether to
    show the upload UI."""
    return jsonify({
        "ok": True,
        "model": "mask_rcnn",
        "model_loaded": _model is not None,
    })


@application.route("/api/server-info")
def server_info():
    """Get server information including local IP address for VR QR code generation."""
    import socket
    
    try:
        # Get local IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except:
        local_ip = "localhost"
    
    api_config = app_config.get_api_config()
    
    return jsonify({
        "ok": True,
        "local_ip": local_ip,
        "port": api_config["PORT"],
        "protocol": "http",  # Change to "https" if SSL is enabled
        "vr_url": f"http://{local_ip}:{api_config['PORT']}/?vr=auto"
    })


@application.route("/extract-image", methods=["POST"])
def extract_image():
    """Run detection on an uploaded image (PNG / JPG / BMP / TIFF / WebP)."""
    if _model is None:
        return jsonify({"error": "Model not initialized"}), 503

    try:
        if "image" not in request.files:
            return jsonify({"error": "No 'image' file in request"}), 400

        raw = request.files["image"].read()
        if not raw:
            return jsonify({"error": "Empty upload"}), 400
        if len(raw) > MAX_UPLOAD_BYTES:
            return jsonify({"error": f"Upload exceeds {MAX_UPLOAD_BYTES} bytes"}), 413

        pil_image = Image.open(io.BytesIO(raw))
        result = _run_detection(pil_image)
        return jsonify(result)

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error("Error in /extract-image: %s", e)
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@application.route("/extract", methods=["POST"])
def extract_svg():
    """Run detection on an uploaded SVG.

    The SVG is first rendered to a raster image via cairosvg, then fed
    through the same Mask R-CNN pipeline as image uploads.
    """
    if _model is None:
        return jsonify({"error": "Model not initialized"}), 503

    try:
        if "svg" not in request.files:
            return jsonify({"error": "No 'svg' file in request"}), 400

        raw = request.files["svg"].read()
        if not raw:
            return jsonify({"error": "Empty upload"}), 400
        if len(raw) > MAX_UPLOAD_BYTES:
            return jsonify({"error": f"Upload exceeds {MAX_UPLOAD_BYTES} bytes"}), 413

        # Render SVG → PNG
        import cairosvg

        png_bytes = cairosvg.svg2png(bytestring=raw)
        pil_image = Image.open(io.BytesIO(png_bytes))

        result = _run_detection(pil_image)
        return jsonify(result)

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error("Error in /extract (SVG): %s", e)
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@application.route("/generate-recommendation-input", methods=["POST"])
def generate_recommendation_input():
    """Generate structured document for AI recommendation system.
    
    This endpoint takes the detection result and generates a structured JSON
    document that describes the floor plan in a format suitable for the
    recommendation AI system.
    """
    try:
        if "detection_result" not in request.json:
            return jsonify({"error": "No 'detection_result' in request"}), 400
        
        detection_result = request.json["detection_result"]
        
        # Log the input
        logger.info("Generating recommendation input from detection result")
        logger.info(f"Canvas size: {detection_result.get('canvas_size')}")
        logger.info(f"Polygons: walls={len(detection_result.get('polygons', {}).get('wall', []))}, "
                   f"doors={len(detection_result.get('polygons', {}).get('door', []))}, "
                   f"windows={len(detection_result.get('polygons', {}).get('window', []))}")
        
        structured_doc = generate_structured_document(detection_result)
        
        # Log the output
        if 'floorPlan' in structured_doc and 'rooms' in structured_doc['floorPlan']:
            rooms = structured_doc['floorPlan']['rooms']
            logger.info(f"Generated {len(rooms)} rooms for recommendation system")
            for room in rooms:
                logger.info(f"  - {room['name']} ({room['roomType']}): {room['area']:.1f} sq units, "
                          f"{room['doors']} doors, {room['windows']} windows")
        
        # Save to output folder for debugging
        import json
        output_path = PROJECT_ROOT / "outputs" / "json" / "recommendation_input.json"
        with open(output_path, 'w') as f:
            json.dump(structured_doc, f, indent=2)
        
        logger.info(f"Saved recommendation input to: {output_path}")
        logger.info("Successfully generated structured document for recommendation system")
        
        return jsonify({
            "success": True,
            "structured_document": structured_doc,
            "saved_to": str(output_path)
        })
    
    except Exception as e:
        logger.error("Error generating recommendation input: %s", e)
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
logger.info("Starting model initialization …")
try:
    _initialize_model()
    logger.info("Model initialization completed successfully!")
except Exception as e:
    logger.error("Failed to initialize model: %s", e)
    logger.error(traceback.format_exc())


if __name__ == "__main__":
    import socket
    
    api_config = app_config.get_api_config()
    logger.info("=========== Starting Merged FloorPlan-to-3D Server ==========")
    logger.info("Configuration: HOST=%s, PORT=%s", api_config["HOST"], api_config["PORT"])
    
    # Get local IP for display
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except:
        local_ip = "localhost"
    
    logger.info("")
    logger.info("=" * 60)
    logger.info("  SERVER ACCESS URLS")
    logger.info("=" * 60)
    logger.info("")
    logger.info("  Local Access (This Computer):")
    logger.info("    http://localhost:%s", api_config["PORT"])
    logger.info("    http://127.0.0.1:%s", api_config["PORT"])
    logger.info("")
    logger.info("  Network Access (Other Devices):")
    logger.info("    http://%s:%s", local_ip, api_config["PORT"])
    logger.info("")
    logger.info("  Share this URL with others on the same network:")
    logger.info("    http://%s:%s", local_ip, api_config["PORT"])
    logger.info("")
    logger.info("=" * 60)
    logger.info("")
    
    try:
        # Use HTTP by default for easier access
        # For WebXR/VR support, users can enable HTTPS manually if needed
        logger.info("Starting Flask server on http://%s:%s", api_config["HOST"], api_config["PORT"])
        application.run(
            host=api_config["HOST"],
            port=api_config["PORT"],
            debug=False,  # TF double-init guard
            threaded=True,  # Better performance for multiple connections
        )
    except Exception as e:
        logger.error("Failed to start application: %s", e)
        logger.error("Make sure port %s is not already in use", api_config["PORT"])
        logger.error("Run 'netstat -ano | findstr :%s' to check", api_config["PORT"])
    
    logger.info("=========== Server stopped ==========")
