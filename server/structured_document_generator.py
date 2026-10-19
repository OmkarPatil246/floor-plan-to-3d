"""Generate structured documents from floor plan detection results.

This module converts the 3D viewer polygon format into a structured JSON document
that describes the floor plan in terms of rooms, walls, windows, doors, and their
spatial relationships. This document can be consumed by AI recommendation systems
to provide design suggestions and improvements.
"""

import logging
from typing import List, Dict, Any
import numpy as np

logger = logging.getLogger(__name__)


def _calculate_polygon_area(polygon_points: List[List[float]]) -> float:
    """Calculate area of a polygon using the shoelace formula."""
    if len(polygon_points) < 3:
        return 0.0
    
    points = np.array(polygon_points)
    x = points[:, 0]
    y = points[:, 1]
    
    return 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))


def _calculate_polygon_perimeter(polygon_points: List[List[float]]) -> float:
    """Calculate perimeter of a polygon."""
    if len(polygon_points) < 2:
        return 0.0
    
    perimeter = 0.0
    for i in range(len(polygon_points)):
        p1 = np.array(polygon_points[i])
        p2 = np.array(polygon_points[(i + 1) % len(polygon_points)])
        perimeter += np.linalg.norm(p2 - p1)
    
    return perimeter


def _get_polygon_bounds(polygon_points: List[List[float]]) -> Dict[str, float]:
    """Get bounding box of a polygon."""
    if not polygon_points:
        return {"left": 0, "top": 0, "right": 0, "bottom": 0, "width": 0, "height": 0}
    
    points = np.array(polygon_points)
    left = float(np.min(points[:, 0]))
    right = float(np.max(points[:, 0]))
    top = float(np.min(points[:, 1]))
    bottom = float(np.max(points[:, 1]))
    
    return {
        "left": left,
        "top": top,
        "right": right,
        "bottom": bottom,
        "width": right - left,
        "height": bottom - top,
    }


def _get_orientation(bounds: Dict[str, float]) -> str:
    """Determine orientation based on aspect ratio."""
    width = bounds["width"]
    height = bounds["height"]
    
    if width == 0 and height == 0:
        return "point"
    
    ratio = width / height if height > 0 else float('inf')
    
    if ratio > 1.5:
        return "horizontal"
    elif ratio < 0.67:
        return "vertical"
    else:
        return "square"


def _find_connected_elements(
    wall_polygons: List[Dict],
    windows: List[Dict],
    doors: List[Dict],
    proximity_threshold: float = 50.0
) -> Dict[int, Dict[str, List[int]]]:
    """Find which windows and doors are connected to each wall.
    
    Args:
        wall_polygons: List of wall polygon dictionaries
        windows: List of window dictionaries with bounds
        doors: List of door dictionaries with bounds
        proximity_threshold: Maximum distance to consider elements connected
    
    Returns:
        Dictionary mapping wall index to connected window and door indices
    """
    connections = {}
    
    for wall_idx, wall in enumerate(wall_polygons):
        wall_outer = np.array(wall["outer"])
        connected_windows = []
        connected_doors = []
        
        # Check each window
        for win_idx, window in enumerate(windows):
            win_center_x = (window["bounds"]["left"] + window["bounds"]["right"]) / 2
            win_center_y = (window["bounds"]["top"] + window["bounds"]["bottom"]) / 2
            win_center = np.array([win_center_x, win_center_y])
            
            # Calculate minimum distance from window center to wall
            distances = np.linalg.norm(wall_outer - win_center, axis=1)
            min_distance = np.min(distances)
            
            if min_distance < proximity_threshold:
                connected_windows.append(win_idx)
        
        # Check each door
        for door_idx, door in enumerate(doors):
            door_center_x = (door["bounds"]["left"] + door["bounds"]["right"]) / 2
            door_center_y = (door["bounds"]["top"] + door["bounds"]["bottom"]) / 2
            door_center = np.array([door_center_x, door_center_y])
            
            # Calculate minimum distance from door center to wall
            distances = np.linalg.norm(wall_outer - door_center, axis=1)
            min_distance = np.min(distances)
            
            if min_distance < proximity_threshold:
                connected_doors.append(door_idx)
        
        connections[wall_idx] = {
            "windows": connected_windows,
            "doors": connected_doors
        }
    
    return connections


def _classify_room_type(area: float, doors: int, windows: int, bounds: Dict[str, float], room_idx: int, total_rooms: int) -> str:
    """Classify room type based on characteristics.
    
    Args:
        area: Room area in square units
        doors: Number of doors
        windows: Number of windows
        bounds: Room bounding box
        room_idx: Index of this room (0-based)
        total_rooms: Total number of rooms
    
    Returns:
        Room type string
    """
    # Convert area from pixels to approximate square meters (rough estimate)
    # Assuming 1 pixel ≈ 0.1 meters, so 1 sq pixel ≈ 0.01 sq meters
    # This is a rough heuristic - adjust based on your floor plan scale
    approx_area_m2 = area * 0.01
    
    # Room type classification logic
    # Based on typical room sizes and characteristics
    
    # Very small rooms (< 4 m²) - likely bathroom or closet
    if approx_area_m2 < 4:
        if windows == 0 or windows == 1:
            return "Bathroom"
        return "Storage"
    
    # Small rooms (4-8 m²) - bathroom, small bedroom, or utility
    elif approx_area_m2 < 8:
        if windows == 0:
            return "Bathroom"
        elif windows >= 1:
            return "Bedroom"
        return "Utility"
    
    # Medium-small rooms (8-12 m²) - bedroom, kitchen, or bathroom
    elif approx_area_m2 < 12:
        if windows == 0:
            return "Bathroom"
        elif doors >= 2:
            return "Kitchen"
        elif windows >= 2:
            return "Bedroom"
        else:
            return "Bedroom"
    
    # Medium rooms (12-18 m²) - bedroom, kitchen, or dining
    elif approx_area_m2 < 18:
        if windows >= 2 and doors <= 2:
            return "Bedroom"
        elif doors >= 2:
            return "Dining"
        else:
            return "Kitchen"
    
    # Large rooms (18+ m²) - living room, master bedroom, or combined spaces
    else:
        if windows >= 2 and doors <= 2:
            # Prioritize living room for largest room
            if room_idx == 0:  # First/largest room
                return "Living Room"
            else:
                return "Bedroom"
        elif doors == 1 and windows >= 2:
            return "Living Room"
        else:
            return "Living Room"
    
    return "Room"


def _point_in_polygon(point: np.ndarray, polygon: np.ndarray) -> bool:
    """Check if a point is inside a polygon using ray casting algorithm."""
    x, y = point
    n = len(polygon)
    inside = False
    
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    
    return inside


def _get_polygon_centroid(polygon_points: List[List[float]]) -> np.ndarray:
    """Calculate the centroid of a polygon."""
    points = np.array(polygon_points)
    return np.mean(points, axis=0)


def _identify_rooms_from_walls(wall_polygons: List[Dict]) -> List[Dict]:
    """Identify actual room spaces from wall polygons using spatial analysis.
    
    This improved function:
    1. First checks for holes in walls (proper room detection)
    2. If no holes, analyzes wall segments to find enclosed spaces
    3. Groups nearby wall segments to identify distinct rooms
    4. Uses spatial clustering to separate different room areas
    """
    rooms = []
    
    if not wall_polygons:
        logger.warning("No wall polygons provided for room identification")
        return rooms
    
    logger.info(f"Analyzing {len(wall_polygons)} wall segments to identify rooms")
    
    room_count = 0
    used_wall_indices = set()
    
    # Step 1: Check for walls with holes (proper room detection)
    for idx, wall in enumerate(wall_polygons):
        holes = wall.get("holes", [])
        
        if holes:
            for hole_idx, hole in enumerate(holes):
                area = _calculate_polygon_area(hole)
                perimeter = _calculate_polygon_perimeter(hole)
                bounds = _get_polygon_bounds(hole)
                
                if area < 1000:  # Skip tiny holes
                    continue
                
                room_count += 1
                used_wall_indices.add(idx)
                
                rooms.append({
                    "id": f"room_{room_count}",
                    "name": f"Room {room_count}",
                    "roomType": "Room",
                    "area": float(area),
                    "perimeter": float(perimeter),
                    "bounds": bounds,
                    "orientation": _get_orientation(bounds),
                    "wallIndices": [idx],
                })
                
                logger.info(f"  Found room {room_count} (from hole): area={area:.1f} sq units")
    
    # Step 2: For walls without holes, use spatial clustering
    # Group wall segments that are close together and form enclosed spaces
    remaining_walls = [
        (idx, wall) for idx, wall in enumerate(wall_polygons)
        if idx not in used_wall_indices
    ]
    
    if remaining_walls:
        logger.info(f"Analyzing {len(remaining_walls)} remaining walls for spatial rooms")
        
        # Calculate centroids and areas for clustering
        wall_data = []
        for idx, wall in remaining_walls:
            area = _calculate_polygon_area(wall["outer"])
            bounds = _get_polygon_bounds(wall["outer"])
            centroid = _get_polygon_centroid(wall["outer"])
            
            # Only consider walls with reasonable area
            if 1000 <= area <= 10000:  # Reasonable room size range
                wall_data.append({
                    "idx": idx,
                    "wall": wall,
                    "area": area,
                    "bounds": bounds,
                    "centroid": centroid
                })
        
        # Group walls by spatial proximity (simple clustering)
        room_clusters = []
        visited = set()
        
        for i, data in enumerate(wall_data):
            if i in visited:
                continue
            
            cluster = [data]
            visited.add(i)
            
            # Find nearby walls (within 100 units)
            for j, other_data in enumerate(wall_data):
                if j in visited or i == j:
                    continue
                
                dist = np.linalg.norm(data["centroid"] - other_data["centroid"])
                if dist < 150:  # Proximity threshold
                    cluster.append(other_data)
                    visited.add(j)
            
            room_clusters.append(cluster)
        
        # Create rooms from clusters
        for cluster in room_clusters:
            # Combine areas and bounds
            total_area = sum(w["area"] for w in cluster)
            
            # Calculate combined bounds
            all_bounds = [w["bounds"] for w in cluster]
            combined_bounds = {
                "left": min(b["left"] for b in all_bounds),
                "top": min(b["top"] for b in all_bounds),
                "right": max(b["right"] for b in all_bounds),
                "bottom": max(b["bottom"] for b in all_bounds),
            }
            combined_bounds["width"] = combined_bounds["right"] - combined_bounds["left"]
            combined_bounds["height"] = combined_bounds["bottom"] - combined_bounds["top"]
            
            # Calculate perimeter from combined bounds (approximation)
            perimeter = 2 * (combined_bounds["width"] + combined_bounds["height"])
            
            room_count += 1
            wall_indices = [w["idx"] for w in cluster]
            
            rooms.append({
                "id": f"room_{room_count}",
                "name": f"Room {room_count}",
                "roomType": "Room",
                "area": float(total_area),
                "perimeter": float(perimeter),
                "bounds": combined_bounds,
                "orientation": _get_orientation(combined_bounds),
                "wallIndices": wall_indices,
            })
            
            logger.info(
                f"  Found room {room_count} (from {len(cluster)} wall segments): "
                f"area={total_area:.1f} sq units"
            )
    
    # If still no rooms found, create one room per reasonable-sized wall segment
    if not rooms:
        logger.warning("No rooms found through clustering, falling back to individual walls")
        for idx, wall in enumerate(wall_polygons):
            area = _calculate_polygon_area(wall["outer"])
            perimeter = _calculate_polygon_perimeter(wall["outer"])
            bounds = _get_polygon_bounds(wall["outer"])
            
            # Only reasonable room sizes
            if 1000 <= area <= 50000:
                room_count += 1
                rooms.append({
                    "id": f"room_{room_count}",
                    "name": f"Room {room_count}",
                    "roomType": "Room",
                    "area": float(area),
                    "perimeter": float(perimeter),
                    "bounds": bounds,
                    "orientation": _get_orientation(bounds),
                    "wallIndices": [idx],
                })
                
                logger.info(f"  Found room {room_count} (individual): area={area:.1f} sq units")
    
    logger.info(f"Total rooms identified: {len(rooms)}")
    return rooms


def generate_structured_document(detection_result: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a structured document describing the floor plan.
    
    Args:
        detection_result: The viewer-format JSON from mask_to_polygon_converter
    
    Returns:
        Structured document with rooms, walls, windows, doors, and their relationships
    """
    logger.info("Generating structured document from detection result")
    
    canvas_size = detection_result.get("canvas_size", [0, 0])
    polygons = detection_result.get("polygons", {})
    
    wall_polygons = polygons.get("wall", [])
    window_polygons = polygons.get("window", [])
    door_polygons = polygons.get("door", [])
    
    # Process walls
    walls = []
    for idx, wall in enumerate(wall_polygons):
        area = _calculate_polygon_area(wall["outer"])
        perimeter = _calculate_polygon_perimeter(wall["outer"])
        bounds = _get_polygon_bounds(wall["outer"])
        
        walls.append({
            "id": f"wall_{idx}",
            "area": float(area),
            "length": float(perimeter),
            "bounds": bounds,
            "orientation": _get_orientation(bounds),
            "vertices": len(wall["outer"]),
            "hasHoles": len(wall.get("holes", [])) > 0,
            "holeCount": len(wall.get("holes", []))
        })
    
    # Process windows
    windows = []
    for idx, window in enumerate(window_polygons):
        area = _calculate_polygon_area(window["outer"])
        perimeter = _calculate_polygon_perimeter(window["outer"])
        bounds = _get_polygon_bounds(window["outer"])
        
        windows.append({
            "id": f"window_{idx}",
            "area": float(area),
            "perimeter": float(perimeter),
            "bounds": bounds,
            "orientation": _get_orientation(bounds),
            "vertices": len(window["outer"])
        })
    
    # Process doors
    doors = []
    for idx, door in enumerate(door_polygons):
        area = _calculate_polygon_area(door["outer"])
        perimeter = _calculate_polygon_perimeter(door["outer"])
        bounds = _get_polygon_bounds(door["outer"])
        
        doors.append({
            "id": f"door_{idx}",
            "area": float(area),
            "perimeter": float(perimeter),
            "bounds": bounds,
            "orientation": _get_orientation(bounds),
            "vertices": len(door["outer"])
        })
    
    # Find connections between walls, windows, and doors
    connections = _find_connected_elements(wall_polygons, windows, doors)
    
    # Add connection information to walls
    for wall_idx, wall in enumerate(walls):
        if wall_idx in connections:
            conn = connections[wall_idx]
            wall["connectedWindows"] = [f"window_{i}" for i in conn["windows"]]
            wall["connectedDoors"] = [f"door_{i}" for i in conn["doors"]]
            wall["windowCount"] = len(conn["windows"])
            wall["doorCount"] = len(conn["doors"])
    
    # Identify rooms (simplified approach)
    rooms = _identify_rooms_from_walls(wall_polygons)
    
    # Add window and door counts to rooms based on connections
    for room in rooms:
        room_windows = set()
        room_doors = set()
        
        for wall_idx in room["wallIndices"]:
            if wall_idx in connections:
                conn = connections[wall_idx]
                room_windows.update(conn["windows"])
                room_doors.update(conn["doors"])
        
        room["windows"] = len(room_windows)
        room["doors"] = len(room_doors)
        room["connectedRooms"] = []  # Would need spatial analysis to determine
    
    # Convert to recommendation system format
    recommendation_input = {
        "floorPlan": {
            "canvasSize": {
                "width": canvas_size[0],
                "height": canvas_size[1]
            },
            "totalArea": float(sum(room["area"] for room in rooms)),
            "rooms": [
                {
                    "name": room["name"],
                    "roomType": room["roomType"],
                    "area": room["area"],
                    "doors": room["doors"],
                    "windows": room["windows"],
                    "wallLength": room["perimeter"],
                    "orientation": room["orientation"],
                    "connectedRooms": room["connectedRooms"],
                    "bounds": room["bounds"]
                }
                for room in rooms
            ]
        },
        "detectionStats": {
            "wallsDetected": len(walls),
            "windowsDetected": len(windows),
            "doorsDetected": len(doors),
            "roomsIdentified": len(rooms)
        },
        "geometryDetails": {
            "walls": [
                {
                    **wall,
                    "polygon": wall_polygons[idx]["outer"] if idx < len(wall_polygons) else []
                }
                for idx, wall in enumerate(walls)
            ],
            "windows": [
                {
                    **window,
                    "polygon": window_polygons[idx]["outer"] if idx < len(window_polygons) else []
                }
                for idx, window in enumerate(windows)
            ],
            "doors": [
                {
                    **door,
                    "polygon": door_polygons[idx]["outer"] if idx < len(door_polygons) else []
                }
                for idx, door in enumerate(doors)
            ]
        }
    }
    
    logger.info(
        "Structured document generated: %d rooms, %d walls, %d windows, %d doors",
        len(rooms), len(walls), len(windows), len(doors)
    )
    
    return recommendation_input
