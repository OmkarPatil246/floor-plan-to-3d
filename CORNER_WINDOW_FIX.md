# Corner Window (L-Shaped) Fix - Enhanced with Column Detection

## Problem
When windows wrap around a corner (L-shaped hitbox), they were being detected as a single window instead of being split into separate windows for each wall side. This is especially critical when there's a column/pillar at the corner junction.

## Solution
Added intelligent L-shaped polygon detection and splitting logic to `server/mask_to_polygon_converter.py`, with **column detection at the corner** to provide accurate splitting when structural elements are present.

## Implementation Details

### 1. L-Shape Detection (`_is_l_shaped`)
The algorithm detects L-shaped polygons using multiple geometric criteria:

- **Vertex count**: At least 6 vertices (L-shapes need more points than rectangles)
- **Compactness**: Low compactness ratio (< 0.35) - L-shapes are less compact than rectangles
  - Formula: `(4 * π * area) / (perimeter²)`
- **Solidity**: Low solidity (< 0.85) - indicates concave shape
  - Formula: `polygon_area / convex_hull_area`

### 2. **NEW: Column Detection** (`_find_corner_column`)
Detects if there's a wall/column at the inner corner of an L-shaped window:

**Algorithm:**
1. Calculate the bounding box of the window
2. Identify the center region (likely location of the inner corner)
3. Define a search radius around the center (1/4 of the smallest dimension)
4. Check for wall presence in the corner region
5. If >40% of the corner region contains wall pixels → column detected

**Why this matters:**
- Columns/pillars naturally divide corner windows into two separate windows
- Provides architectural accuracy - two distinct window openings
- Enables targeted splitting using the column position as a guide

### 3. L-Shape Splitting (`_split_l_shaped_polygon`)
Once an L-shaped window is detected, it's split using column-aware logic:

**Strategy A: Column-Guided Splitting** (when column detected)
1. Use the detected column position as the split point
2. Draw crossing lines through the column to create separation
3. Line thickness scales with window size for robust splitting
4. Apply light erosion to clean up the split edges

**Strategy B: Morphological Splitting** (no column detected)
1. Apply morphological opening (erosion + dilation) to break the corner connection
2. Primary: Opening with 5x5 kernel, 2 iterations
3. Fallback: Erosion (3 iterations) + Dilation (2 iterations) with 3x3 kernel

**Result:**
- Returns multiple contours if successfully split (minimum 2 segments)
- Falls back to original contour if splitting fails
- Logs whether column-guided or standard splitting was used

### 4. Integration
- The splitting is **only applied to windows** (corner windows are the main issue)
- **Wall mask is passed to window processing** to enable column detection
- Walls and doors continue to use the original polygon extraction
- Parameter `split_l_shapes=True` enables the feature

## Code Changes

### Modified Functions
```python
_extract_polygons_from_mask(binary_mask, split_l_shapes=False, wall_mask=None)
_split_l_shaped_polygon(contour, binary_mask, wall_mask)
```

### New Functions
```python
_is_l_shaped(polygon_points) -> bool
_find_corner_column(contour, wall_mask) -> (has_column, corner_position)
_split_l_shaped_polygon(contour, binary_mask, wall_mask) -> list[contour]
```

### Usage
```python
# In convert_detections_to_viewer_json():
wall_polygons = _extract_polygons_from_mask(wall_mask_ext, split_l_shapes=False)
door_polygons = _extract_polygons_from_mask(door_mask_ext, split_l_shapes=False)
window_polygons = _extract_polygons_from_mask(
    window_mask_ext, 
    split_l_shapes=True,      # ← Enable L-shape detection
    wall_mask=wall_mask_ext   # ← Pass wall mask for column detection
)
```

## Benefits

1. **Column awareness**: Automatically detects columns at corners and splits accordingly
2. **Accurate representation**: Corner windows are properly represented as separate windows on each wall
3. **Better 3D visualization**: Each window segment renders correctly on its respective wall
4. **Architectural accuracy**: Matches real-world plans where corner windows are separated by structural elements
5. **Dual strategy**: Uses targeted splitting when columns exist, morphological splitting otherwise
6. **Maintained compatibility**: Non-L-shaped windows remain unchanged

## Algorithm Workflow

```
Input: L-shaped window contour + wall mask
    ↓
1. Detect L-shape geometry (compactness, solidity)
    ↓
2. Check for column at corner
    ↓
   ┌─────────────────┴─────────────────┐
   ↓                                   ↓
Column Found                    No Column
   ↓                                   ↓
3a. Column-guided split          3b. Morphological split
   • Use column position              • Opening/erosion
   • Draw crossing lines              • Break at narrow point
   ↓                                   ↓
4. Find separate contours
    ↓
5. Validate & return split windows
```

## Testing

To test the fix:
1. Upload a floor plan with corner/L-shaped windows
2. **With column**: If there's a pillar/wall at the corner, it will be detected and used for precise splitting
3. **Without column**: The system will use morphological operations to separate the window
4. Check the 3D viewer - corner windows should appear as separate windows on each wall
5. Check server logs for:
   - `"Column detected at corner (x, y), wall ratio: X.XX"` - Column found
   - `"Split L-shaped window into N segments (column-guided)"` - Successfully split using column
   - `"Split L-shaped window into N segments"` - Successfully split using morphological method

## Parameters

You can tune the detection sensitivity by adjusting:

**L-Shape Detection:**
- `compactness < 0.35` - Lower = more aggressive L-shape detection
- `solidity < 0.85` - Lower = require more concavity
- Minimum 6 vertices for L-shape consideration

**Column Detection:**
- `wall_ratio > 0.4` - Wall presence threshold (40% of corner region)
- `search_radius = min(w, h) // 4` - Search area around center
- Minimum search radius: 3 pixels

**Splitting:**
- `line_thickness = max(3, min(w, h) // 10)` - Column split line width
- `separation_kernel` size (5, 5) - Morphological splitting aggressiveness
- `MIN_POLYGON_AREA_PX = 30.0` - Minimum area threshold for split segments

## Server Status

✅ Server restarted successfully with column detection enabled
✅ Changes are now active at http://localhost:8080

## Example Scenarios

### Scenario 1: L-Window with Column
```
Floor Plan:        Detection:           Result:
┌────────┐         ┌────────┐          ┌────────┐
│  Room  │         │  Room  │          │  Room  │
│ [Win1] ■ [Win2]  │ [####] ■ [####]   │ [Win1] ■ [Win2]
└────────┘         └────────┘          └────────┘
   ■ = Column detected → Split into 2 windows
```

### Scenario 2: L-Window without Column
```
Floor Plan:        Detection:           Result:
┌────────┐         ┌────────┐          ┌────────┐
│  Room  │         │  Room  │          │  Room  │
│ [Wind──┐         │ [####──┐          │ [Win1──┐
│        │ow]      │        │###]      │     Win2]
└────────┘         └────────┘          └────────┘
   Morphological split → 2 windows
```
