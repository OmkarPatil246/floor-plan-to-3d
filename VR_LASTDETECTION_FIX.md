# VR Modal Error Fix - lastDetectionResult undefined

## Error
```
Failed to open VR modal: ReferenceError: lastDetectionResult is not defined
    at HTMLButtonElement.openVRModal ((index):7563:7)
```

## Root Cause
The variable `lastDetectionResult` was declared with `let` inside the main script scope (line 3488), but the VR modal functions are wrapped in an IIFE (Immediately Invoked Function Expression) starting at line 7466:

```javascript
(function() {
  // VR modal code here
  // Cannot access lastDetectionResult from outer scope
})();
```

This created a **scope isolation issue** - the VR functions couldn't access `lastDetectionResult` from the outer scope.

## Solution
Changed `lastDetectionResult` from a local variable to a **global window property**:

### Before (Line 3488):
```javascript
let lastDetectionResult = null;
```

### After:
```javascript
window.lastDetectionResult = null; // Global scope for VR access
```

## All Changes Made

### 1. Declaration (Line 3488)
```javascript
window.lastDetectionResult = null;
```

### 2. AI Recommendation Check (Line 3494)
```javascript
if (!window.lastDetectionResult) {
```

### 3. AI Recommendation API Call (Line 3507)
```javascript
body: JSON.stringify({ detection_result: window.lastDetectionResult })
```

### 4. Detection Result Storage (Line 5062)
```javascript
window.lastDetectionResult = data;
```

### 5. VR Modal Floor Plan Check (Line 7563)
```javascript
if (!window.lastDetectionResult) {
```

### 6. VR Modal API Call (Line 7612)
```javascript
body: JSON.stringify({ detection_result: window.lastDetectionResult })
```

### 7. VR Modal Fallback Data (Lines 7629-7634)
```javascript
const fallbackData = {
  floorPlan: {
    rooms: window.lastDetectionResult.rooms || [],
    walls: window.lastDetectionResult.walls || [],
    doors: window.lastDetectionResult.doors || [],
    windows: window.lastDetectionResult.windows || [],
    image_width: window.lastDetectionResult.image_width,
    image_height: window.lastDetectionResult.image_height
  }
};
```

### 8. VR Auto-Entry Storage (Line 7807)
```javascript
window.lastDetectionResult = {
  rooms: fp.rooms,
  doors: fp.doors || [],
  // ...
};
```

## Impact
- ✅ VR modal can now access floor plan data
- ✅ QR code generation will work
- ✅ AI recommendations still work (same variable, global scope)
- ✅ Floor plan loading in VR auto-entry still works

## Testing
1. Load floor plan at http://localhost:8080/
2. Click "Enter VR Mode"
3. QR code should now generate successfully
4. Console should show:
   ```
   ✅ Floor plan data saved for VR mode (via server)
   ```
   OR
   ```
   ✅ Floor plan data saved for VR mode (fallback method)
   ```

## Why window.lastDetectionResult?
Using `window.` makes the variable:
- Globally accessible from any scope (including IIFEs)
- Accessible in browser console for debugging
- Still maintains single instance (not duplicated)
- Compatible with all existing code

## Files Modified
- `viewer/index.html` (8 occurrences updated)

## Status
✅ **FIXED** - VR modal can now access floor plan data and generate QR codes
