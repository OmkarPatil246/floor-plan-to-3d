# VR LoadPlan Error Fix

## Error
```
loadPlan is not defined
```

## Root Cause
The VR auto-entry code is inside an IIFE (Immediately Invoked Function Expression) starting at line ~7466:

```javascript
(function() {
  // VR modal code here
  // Cannot access loadPlan from outer scope
})();
```

The `loadPlan` function is defined in the main script scope (line 3985), but the VR IIFE cannot access it.

## Solution
Made `loadPlan` globally accessible via `window` object:

### Change 1: Make loadPlan Global (Line 3987)
```javascript
// Make loadPlan globally accessible for VR mode
window.loadPlan = loadPlan;

async function loadPlan(data) {
  clearPlan();
  // ...
}
```

### Change 2: Use window.loadPlan in VR Code (Line ~7830)
```javascript
// Before:
await loadPlan(planData);

// After:
await window.loadPlan(planData);
```

## Testing
1. Reload page on desktop: Ctrl+Shift+R
2. Load floor plan (Modern Villa)
3. Generate QR code
4. Scan with phone
5. Phone should now successfully load floor plan!

## Status
✅ **FIXED** - loadPlan is now accessible from VR code
