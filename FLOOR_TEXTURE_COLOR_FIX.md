# Floor Texture Color Fix

## Problem Description

**Issue:** When uploading a custom floor texture (tile), it appeared with a brown/chocolate color tint instead of showing the true colors of the uploaded image.

### What Was Happening:
- ❌ Floor material had a brown/oak color (`0xd4a870` and `0xb8936a`)
- ❌ This brown color was **multiplied** with the uploaded texture
- ❌ Result: All floor textures looked brownish/chocolate-tinted
- ❌ Custom white/grey/colored tiles appeared brown

### Example:
```
Your white marble tile    +    Brown floor color    =    Brown-tinted marble
     (texture)                  (material.color)              (final result)
```

---

## Solution

Changed the floor material color from **brown** to **white** (`0xffffff`).

### Why This Works:

In Three.js, the material color is **multiplied** with the texture:
```
Final Color = Texture Color × Material Color
```

- **Before:** Texture Color × Brown (`0xd4a870`) = Brown-tinted texture
- **After:** Texture Color × White (`0xffffff`) = True texture colors

White (`0xffffff` = RGB 255,255,255) doesn't change the texture:
```
Any Color × White = Same Color
```

---

## Changes Made

### 1. **Initial Floor Material** (Line ~1775)
```javascript
// BEFORE (Wrong):
floorMat = new THREE.MeshStandardMaterial({
  color: 0xd4a870,  // ❌ Brown/oak tone - tints textures
  map: _floorTex,
  // ...
});

// AFTER (Fixed):
floorMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,  // ✅ WHITE - no color tint, shows textures accurately
  map: _floorTex,
  // ...
});
```

### 2. **Floor Texture Reset** (Line ~1938)
```javascript
// BEFORE (Wrong):
else if (type === 'floor') {
  floorMat.map = _floorTex;
  floorMat.color.set(0xb8936a);  // ❌ Brown oak color
  // ...
}

// AFTER (Fixed):
else if (type === 'floor') {
  floorMat.map = _floorTex;
  floorMat.color.set(0xffffff);  // ✅ WHITE - no color tint
  // ...
}
```

### 3. **Custom Texture Upload** (Line ~2072)
```javascript
// BEFORE (Missing):
else if (type === 'floor') {
  const floorTexture = texture.clone();
  applyTexture(floorMat, floorTexture, type);
}

// AFTER (Fixed):
else if (type === 'floor') {
  const floorTexture = texture.clone();
  applyTexture(floorMat, floorTexture, type);
  floorMat.color.set(0xffffff);  // ✅ Ensure white for accurate display
  floorMat.needsUpdate = true;
}
```

---

## Benefits

### Before (Broken):
```
❌ All floor textures looked brown-tinted
❌ White tiles appeared beige/tan
❌ Grey tiles appeared dark brown
❌ Colored tiles had muted, muddy colors
❌ Texture colors didn't match the uploaded image
```

### After (Fixed):
```
✅ Floor textures show TRUE colors
✅ White tiles are white
✅ Grey tiles are grey
✅ Colored tiles show vibrant, accurate colors
✅ What you upload is what you see
```

---

## Testing

### Test 1: Default Floor
1. Load a floorplan (no custom texture)
2. Check floor appearance
3. Should see: Light hardwood texture (NOT brown)

### Test 2: White Tile
1. Upload white marble/ceramic tile texture
2. Should see: White tile (NOT beige or tan)
3. Color should match original image

### Test 3: Grey Tile
1. Upload grey concrete/stone texture
2. Should see: True grey (NOT dark brown)
3. Color should match original image

### Test 4: Colored Tile
1. Upload colored tile (blue, red, green, etc.)
2. Should see: Vibrant true colors (NOT muted/muddy)
3. Color should match original image

### Test 5: Reset to Default
1. Upload custom texture
2. Select "None" from texture dropdown
3. Should see: Light hardwood (NOT brown oak)

---

## Technical Explanation

### Color Multiplication in Three.js

When rendering, Three.js combines material color with texture:

```glsl
// Shader pseudocode:
vec3 textureColor = texture2D(map, uv).rgb;
vec3 materialColor = color.rgb / 255.0;
vec3 finalColor = textureColor * materialColor;
```

### Example Calculations:

**1. White Texture + Brown Material:**
```
Texture:  RGB(255, 255, 255) = White
Material: RGB(212, 168, 112) = Brown (0xd4a870)

Result: (255×212/255, 255×168/255, 255×112/255)
      = (212, 168, 112) = Brown ❌
```

**2. White Texture + White Material:**
```
Texture:  RGB(255, 255, 255) = White
Material: RGB(255, 255, 255) = White (0xffffff)

Result: (255×255/255, 255×255/255, 255×255/255)
      = (255, 255, 255) = White ✅
```

**3. Blue Texture + Brown Material:**
```
Texture:  RGB(50, 100, 200) = Blue
Material: RGB(212, 168, 112) = Brown

Result: (50×212/255, 100×168/255, 200×112/255)
      = (41, 66, 88) = Muddy Dark Blue ❌
```

**4. Blue Texture + White Material:**
```
Texture:  RGB(50, 100, 200) = Blue
Material: RGB(255, 255, 255) = White

Result: (50×255/255, 100×255/255, 200×255/255)
      = (50, 100, 200) = True Blue ✅
```

---

## File Modified

- ✏️ `viewer/index.html`
  - Line ~1775: Floor material initialization
  - Line ~1938: Floor texture reset function
  - Line ~2072: Custom texture upload handler

---

## Related Settings

### Floor Texture Locations in UI:
1. **Settings Panel** → **Materials** → **Floor Texture** dropdown
2. Options:
   - None (default hardwood)
   - Hardwood
   - Marble
   - Concrete
   - Tile
   - Custom (upload your own)

### Upload Custom Texture:
1. Select "Custom" from dropdown
2. File picker opens
3. Choose image file (JPG, PNG, etc.)
4. Texture applies with **true colors** (no brown tint)

---

## Color Reference

### Color Values:
```javascript
0xffffff = RGB(255, 255, 255) = White   ✅ NEW (Correct)
0xd4a870 = RGB(212, 168, 112) = Brown   ❌ OLD (Wrong)
0xb8936a = RGB(184, 147, 106) = Oak     ❌ OLD (Wrong)
```

### Hex Color Breakdown:
```
0xd4a870 (Brown Oak)
  ↓
  d4 = 212 (Red)
  a8 = 168 (Green)
  70 = 112 (Blue)
  = Warm brown/tan color

0xffffff (White)
  ↓
  ff = 255 (Red)
  ff = 255 (Green)
  ff = 255 (Blue)
  = Pure white (neutral, no tint)
```

---

## Comparison Examples

### Example 1: White Marble
```
BEFORE: Upload white marble → See beige/tan marble
AFTER:  Upload white marble → See white marble ✓
```

### Example 2: Dark Grey Concrete
```
BEFORE: Upload grey concrete → See brown concrete
AFTER:  Upload grey concrete → See grey concrete ✓
```

### Example 3: Blue Ceramic Tile
```
BEFORE: Upload blue tile → See muddy dark blue-brown
AFTER:  Upload blue tile → See vibrant blue ✓
```

### Example 4: Red Terracotta
```
BEFORE: Upload red terracotta → See dark brown-red
AFTER:  Upload red terracotta → See true terracotta red ✓
```

---

## Edge Cases

### 1. Procedural Hardwood Texture
- Default texture is still visible
- Now appears lighter (no brown tint)
- Grain pattern preserved
- Looks more natural

### 2. Texture with Transparency
- Alpha channel preserved
- Color multiplication: `RGB × White = RGB` (correct)
- Transparency works as expected

### 3. Low-Light Scenes
- Even with dim lighting, colors remain accurate
- Lighting affects brightness, not hue
- No brown color cast

---

## Troubleshooting

### Problem: Floor still looks brown
**Solution:**
1. Hard refresh browser: `Ctrl + Shift + R`
2. Clear browser cache: `Ctrl + Shift + Delete`
3. Close and reopen browser
4. Restart server with `run.bat`

### Problem: Custom texture not applying
**Solution:**
1. Check file format (JPG, PNG supported)
2. Check file size (< 10MB recommended)
3. Try different texture image
4. Check browser console for errors (F12)

### Problem: Texture looks washed out
**Cause:** May be expected - without brown tint, textures are lighter
**Solution:** This is correct behavior. Adjust texture brightness in image editor if needed.

---

## Performance Impact

✅ **No performance impact**
- Only changed color value
- Same rendering pipeline
- No additional computations
- Same frame rate

---

## Backward Compatibility

✅ **Fully compatible**
- Existing textures work correctly
- No breaking changes
- Custom uploaded textures from before will now show correct colors
- Just reload texture if needed

---

## Summary

**What Changed:**
- Floor material color: Brown → White
- Floor texture reset: Brown → White  
- Custom texture upload: Added explicit white color

**Why:**
- White color doesn't tint textures
- Textures show true, accurate colors
- Works correctly with Three.js color multiplication

**Result:**
- ✅ Custom tiles show true colors
- ✅ No brown/chocolate tint
- ✅ What you upload is what you see

**The floor now displays textures accurately!** 🎉

---

**Author:** Kiro AI Assistant  
**Date:** 2026-10-16  
**Version:** 5.0 (Floor Texture Fix)  
**Project:** FloorPlan-to-3D
