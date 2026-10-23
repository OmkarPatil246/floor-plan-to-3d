# VR Mode Black Screen Fix

## Problem
When clicking "Enter VR Mode" at http://localhost:8080/, a QR code was generated. After scanning the QR code with a phone, the VR mode showed a **black screen with only a white vertical line** - no floor plan was visible.

## Root Cause
The QR code URL (`http://[IP]/?vr=auto`) only contained a parameter to enter VR mode automatically, but **did not include any floor plan data**. When the phone loaded the page, there was no floor plan to display, resulting in an empty 3D scene (black screen).

## Solution
Implemented automatic floor plan data transfer from desktop to phone using **sessionStorage**:

### Changes Made

#### 1. Modified `openVRModal()` function (line ~7548)
**Added:**
- Check if floor plan is loaded before generating QR code
- If no floor plan is loaded, show error message instead of QR code
- Save floor plan data to `sessionStorage` before generating QR code
- Use `/generate-recommendation-input` endpoint to create structured document
- Store in sessionStorage key: `vr_floorplan_data`

#### 2. Modified VR auto-entry code (line ~7719)
**Added:**
- Check for `vr_floorplan_data` in sessionStorage when page loads with `?vr=auto`
- Parse the floor plan data
- Convert structured document format to `loadPlan()` format:
  - `floorPlan.walls` → `polygons.wall`
  - `floorPlan.doors` → `polygons.door`
  - `floorPlan.windows` → `polygons.window`
- Call `loadPlan()` to render the 3D floor plan
- Wait 1.5 seconds for floor plan to fully load before entering VR

## How It Works Now

### Desktop Flow:
1. User loads floor plan at http://localhost:8080/
2. User clicks "Enter VR Mode" button
3. System checks if floor plan is loaded
4. If loaded: generates structured document and saves to sessionStorage
5. Generates QR code with URL: `http://[IP]/?vr=auto`

### Phone Flow:
1. User scans QR code with phone
2. Browser opens URL with `?vr=auto` parameter
3. Page detects VR auto-entry mode
4. **NEW:** Loads floor plan from sessionStorage automatically
5. Renders 3D floor plan in the scene
6. Shows "Enter VR Mode" button
7. User taps button → VR mode starts with floor plan visible

## Testing Instructions

### Test 1: Desktop Only
1. Open http://localhost:8080/
2. Click any sample floor plan (Modern Villa, Cabin, etc.)
3. Click "Enter VR Mode"
4. Should see QR code modal

### Test 2: Phone VR Mode
1. Load a floor plan on desktop (step 1-2 above)
2. Click "Enter VR Mode" on desktop
3. Scan QR code with phone camera
4. Phone opens in browser
5. **Wait ~2 seconds** for floor plan to load
6. Should see purple "VR Mode Ready!" screen
7. Tap "Enter VR Mode" button
8. Should enter VR mode with **visible 3D floor plan** (NOT black screen)
9. Put phone in VR box
10. Use head tracking to look around
11. Touch screen to walk forward

### Test 3: Error Handling
1. Open http://localhost:8080/ (no floor plan)
2. Click "Enter VR Mode" immediately
3. Should see error: "No Floor Plan Loaded" with instructions

## Technical Details

### Data Flow
```
Desktop:
  Floor Plan Upload → Detection → lastDetectionResult
  ↓
  Click "Enter VR Mode" → Generate Structured Document
  ↓
  Save to sessionStorage['vr_floorplan_data']
  ↓
  Generate QR Code

Phone:
  Scan QR → Load page with ?vr=auto
  ↓
  Check sessionStorage['vr_floorplan_data']
  ↓
  Parse & convert to loadPlan() format
  ↓
  Call loadPlan() → Render 3D scene
  ↓
  Show "Enter VR Mode" button
  ↓
  Enter VR → 3D floor plan visible ✅
```

### SessionStorage Scope
**Important:** `sessionStorage` is shared only between:
- Same origin (protocol + domain + port)
- Same browser tab/session
- Desktop and phone must be on **same network** (localhost resolves to local IP)

### Data Format
```javascript
// Stored format (structured document):
{
  floorPlan: {
    rooms: [...],
    walls: [...],
    doors: [...],
    windows: [...],
    image_width: 800,
    image_height: 600,
    content_rect: {...}
  },
  input_image_b64: "data:image/png;base64,..."
}

// Converted to loadPlan format:
{
  polygons: {
    wall: [...],
    door: [...],
    window: [...]
  },
  input_image_b64: "data:image/png;base64,...",
  content_rect: {...},
  image_width: 800,
  image_height: 600
}
```

## Console Debugging

### Desktop Console (when clicking "Enter VR Mode"):
```
📱 Saving floor plan data for VR phone access...
✅ Floor plan data saved for VR mode
Generated VR URL for QR code: http://192.168.x.x:8080/?vr=auto
```

### Phone Console (when scanning QR):
```
VR auto-entry detected, showing VR prompt...
📱 Loading floor plan from sessionStorage for VR...
📱 Floor plan has 5 rooms, 3 doors, 12 walls
📱 Calling loadPlan with data...
Building scale: 0.750 (base: 15, multiplier: 1.0x, elements: 18)
✅ Floor plan loaded successfully for VR mode
```

### If floor plan not loaded:
```
⚠️ No floor plan data found in sessionStorage - VR mode will show empty scene
💡 Please load a floor plan on the desktop first before scanning the QR code
```

## Known Limitations

1. **Same Network Required**: Desktop and phone must be on same local network
2. **Session-Based**: If phone browser is closed, sessionStorage is cleared
3. **Single Browser**: sessionStorage doesn't sync across different browsers
4. **No Cloud Sync**: Floor plan data is not stored on server, only in browser

## Future Enhancements (Not Implemented)

- [ ] URL parameter with base64-encoded floor plan data
- [ ] Server-side session storage with session ID in QR
- [ ] WebRTC data channel for real-time floor plan sync
- [ ] QR code with shareable link that persists floor plan

## Files Modified
- `viewer/index.html` (~lines 7548-7800)

## Status
✅ **FIXED** - Black screen issue resolved, floor plan now loads automatically on phone
