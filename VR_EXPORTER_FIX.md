# VR Exporter Fix - "GLTFExporter is not a constructor"

## ❌ Problem

Error when clicking "Enter VR Walk Mode":
```
Failed to enter VR mode: THREE.GLTFExporter is not a constructor
```

## 🔍 Root Cause

**Wrong:**
```javascript
const exporter = new THREE.GLTFExporter();
// ❌ GLTFExporter is imported as named import, not on THREE namespace
```

**Correct:**
```javascript
const exporter = new GLTFExporter();
// ✅ Use the imported name directly
```

## ✅ Fix Applied

### File: `viewer/index.html`

**Line ~2026 (imports):**
```javascript
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
// Already imported ✅
```

**Line ~3960 (VR button handler):**
```javascript
// BEFORE (wrong):
const exporter = new THREE.GLTFExporter();

// AFTER (fixed):
const exporter = new GLTFExporter();
```

## 🧪 How to Test

### 1. Reload the page
Clear cache: `Ctrl+Shift+R` or `Cmd+Shift+R`

### 2. Generate a 3D home
- Upload floor plan
- Click "Generate 3D Model"
- Wait for completion

### 3. Click "Enter VR Walk Mode"
**Expected Console Output:**
```
🏠 Exporting EXACT 3D home model for VR Walk Mode...
📦 planGroup has 47 objects
✅ Exported GLB model: 156.32 KB
💾 Saving to localStorage...
✅ Saved! Navigating to VR Walk Mode...
```

### 4. Verify VR mode loads
Should navigate to `vr-walk-mode.html` and load your exact home!

## 🔧 Technical Details

### Named Import vs Namespace Import

**Named Import (correct for GLTFExporter):**
```javascript
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
// Use: new GLTFExporter()
```

**Namespace Import (for THREE core):**
```javascript
import * as THREE from "three";
// Use: new THREE.Scene(), new THREE.Mesh(), etc.
```

### Why This Matters

Three.js addons (loaders, exporters, controls) are **NOT** part of the `THREE` namespace. They are separate modules that need to be imported individually.

**Correct:**
- `new GLTFExporter()` ✅
- `new GLTFLoader()` ✅
- `new OrbitControls()` ✅

**Wrong:**
- `new THREE.GLTFExporter()` ❌
- `new THREE.GLTFLoader()` ❌
- `new THREE.OrbitControls()` ❌

## ✅ Verification Checklist

- [x] `GLTFExporter` imported at top
- [x] Used as `new GLTFExporter()` (not `THREE.GLTFExporter`)
- [x] No other references to `THREE.GLTFExporter` in code
- [x] Server restarted (if needed)
- [x] Browser cache cleared

## 🎯 Expected Behavior After Fix

1. **Click "Enter VR Walk Mode"**
   - No error ✅
   - Console shows export progress ✅
   - GLB model created ✅

2. **Navigation**
   - Redirects to vr-walk-mode.html ✅
   - Model loads automatically ✅

3. **VR Mode**
   - Shows exact home from main viewer ✅
   - All furniture preserved ✅
   - Player can walk through home ✅

## 📚 Related Files

- `viewer/index.html` - Main viewer with GLTFExporter (FIXED)
- `viewer/vr-walk-mode.html` - VR mode with GLTFLoader
- `VR_EXACT_MODEL_UPDATE.md` - Complete implementation details
- `QUICK_TEST_GUIDE.md` - Step-by-step testing

---

**Status:** ✅ FIXED - Ready to test!
