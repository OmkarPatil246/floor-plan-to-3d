# Collision Hitbox Fix - No More Invisible Walls

## Problem Description

**Issue:** When walking in the 3D viewer (walkthrough mode), you would hit invisible collision boxes (hitboxes) even though there was nothing visible there. This made navigation frustrating because you'd get blocked by "invisible walls" that shouldn't exist.

### What Was Happening:
1. ❌ Invisible helper objects had collision
2. ❌ Hidden meshes (like input image planes) had collision
3. ❌ Light effects and decals had collision
4. ❌ Transparent objects (opacity near 0) had collision
5. ❌ Objects with `.visible = false` still blocked movement

---

## Solution

The collision system now **ONLY includes visible, solid objects**.

### What Changed:

#### 1. **New Helper Functions**

**`_isObjectOrParentInvisible(obj)`**
- Checks if an object or any of its parent objects are invisible
- Prevents hidden nested objects from having collision

**`_shouldHaveCollision(obj)`**
- Central filter that determines if an object should block movement
- Checks multiple criteria:
  - ✅ Object must be visible
  - ✅ Parent objects must be visible
  - ✅ Cannot be a helper object (hitbox, input image, lights)
  - ✅ Cannot be nearly transparent (opacity < 0.01)
  - ✅ Cannot be a line or decorative element

#### 2. **Updated Collision Functions**

**`rebuildColliders()`**
- Now filters out invisible objects when building collision data
- Skips helper meshes automatically
- Only includes objects that pass `_shouldHaveCollision()` check
- Logs count of active colliders for debugging

**`resolvePlayerMovement()`**
- Filters colliders in real-time using `_shouldHaveCollision()`
- Only considers visible, solid objects when checking movement
- Open doors are still properly excluded from collision

**`checkPreciseCollision()`**
- Updated to use `_shouldHaveCollision()` filter
- Ensures position checks only test against visible objects

---

## Technical Details

### Objects Excluded from Collision

The following object types are now **automatically excluded** from collision:

```javascript
// Helper/Debug Objects
- obj.userData.isHitbox (debug visualization)
- obj.userData.isInputImage (reference floorplan image)

// Lighting Effects
- obj.userData.isDownlightPool (light pools on floor)
- obj.userData.isCeilingSpot (light spots on ceiling)
- obj.userData.isCeilingScatter (ceiling light scatter)
- obj.userData.isWallGrazing (wall lighting effects)
- obj.userData.isCoveGlow (LED strip glow halos)
- obj.userData.isCoveGlass (LED strip glass)

// Ambient Occlusion
- obj.userData.isFloorAO (floor shadow borders)

// Lines and Wireframes
- obj.isLine
- obj.isLineSegments

// Invisible/Transparent Objects
- obj.visible === false
- parent.visible === false
- material.transparent && material.opacity < 0.01
```

### Collision System Flow

```
User tries to move
    ↓
resolvePlayerMovement() called
    ↓
Traverse all objects in scene
    ↓
For each object with a collider:
    → Check _shouldHaveCollision()
        → Is visible? ✓
        → Parents visible? ✓
        → Not a helper? ✓
        → Not transparent? ✓
        → Not a line? ✓
    ↓
If ALL checks pass → Include in collision
If ANY check fails → Skip (no collision)
    ↓
Test movement against ONLY included colliders
    ↓
Resolve position (no invisible walls!)
```

---

## Benefits

### Before (Broken):
```
❌ Walking blocks on invisible objects
❌ Can't walk through empty space
❌ Collision on light effects
❌ Collision on debug helpers
❌ Collision on hidden meshes
❌ Frustrating navigation experience
```

### After (Fixed):
```
✅ Only visible walls block movement
✅ Only visible doors block when closed
✅ Only visible windows block movement
✅ Light effects don't block
✅ Debug hitboxes don't block
✅ Transparent objects don't block
✅ Smooth, predictable navigation
```

---

## Testing

### Test 1: Basic Movement
1. Enter walkthrough mode (press W)
2. Walk around the floorplan
3. Should ONLY collide with visible walls, doors, windows
4. Should NOT hit invisible barriers

### Test 2: Door Interaction
1. Walk up to a closed door
2. Should block movement ✓
3. Press E to open door
4. Should allow walking through ✓
5. Door still visible but no collision ✓

### Test 3: Ceiling Visibility
1. Toggle ceiling off (Settings panel)
2. Walk around
3. Should NOT collide with hidden ceiling
4. Toggle ceiling on
5. Ceiling visible but still no collision (ceiling is above player)

### Test 4: Show Hitboxes
1. Enable "Show Collision Hitboxes" in settings
2. Debug wireframes appear
3. Debug wireframes should NOT block movement ✓
4. Only the actual walls/doors/windows block ✓

### Test 5: Light Effects
1. Walk through light pools on floor
2. Should pass through without collision ✓
3. Walk near LED ceiling strips
4. Should NOT collide with glow effects ✓

---

## Code Changes

### File Modified
- `viewer/index.html`

### Functions Added
```javascript
_isObjectOrParentInvisible(obj)
_shouldHaveCollision(obj)
```

### Functions Modified
```javascript
rebuildColliders(data, scale, cx, cy)
resolvePlayerMovement(oldPos, targetPos)
checkPreciseCollision(position)
```

### Lines of Code
- **Added:** ~80 lines (helper functions + filtering logic)
- **Modified:** ~40 lines (collision checks)
- **Net Change:** ~120 lines

---

## Performance Impact

### Before:
- Checking collision against ALL objects (including invisible)
- More collision tests per frame
- Slower due to unnecessary checks

### After:
- Checking collision against ONLY visible objects
- Fewer collision tests per frame
- **Faster** due to filtering

**Result:** ✅ **Better performance + correct behavior**

---

## Debug Console Output

When colliders are rebuilt, you'll see:
```
[Collision System] Active colliders: Walls=12, Windows=4, Doors=3
```

This shows exactly how many objects have collision enabled.

---

## Edge Cases Handled

### 1. Nested Invisible Parents
```javascript
Group (visible: false)
  └─ Wall (visible: true, has collider)
     → No collision (parent hidden)
```

### 2. Animated Visibility
```javascript
Ceiling animating down
  - ceiling.visible = false (during animation start)
  → No collision while invisible
  - ceiling.visible = true (after animation)
  → Still no collision (above player height)
```

### 3. Nearly Transparent Materials
```javascript
Window glass (opacity: 0.001)
  → No collision (too transparent)
  
Window frame (opacity: 1.0)
  → Has collision (solid)
```

### 4. Helper Objects
```javascript
Hitbox visualization (isHitbox: true)
  → No collision (debug only)
  
Actual wall (isHitbox: false)
  → Has collision (real geometry)
```

---

## Future Improvements

Possible enhancements:
1. ⭐ Dynamic collision toggle per object type
2. ⭐ Collision layers (walls vs furniture vs decor)
3. ⭐ Adjustable player radius per mode
4. ⭐ Collision sound effects
5. ⭐ Soft collision (slowdown instead of hard stop)

---

## Troubleshooting

### Problem: Still hitting invisible walls
**Check:**
1. Is the object actually invisible? (use browser dev tools)
2. Check console for collider count
3. Enable "Show Collision Hitboxes" to see what has collision
4. Verify object doesn't have `userData.collider` if it shouldn't

### Problem: Walking through walls
**Check:**
1. Walls should have `userData.collider` property
2. Walls should be visible
3. Check console for collider count (should be > 0)
4. Verify player radius isn't too small

### Problem: Performance issues
**Check:**
1. How many colliders are active? (check console)
2. If > 100, consider optimizing polygon complexity
3. Use "Show Collision Hitboxes" to visualize

---

## Related Files

- `viewer/index.html` - Main viewer with collision system
- `EXPORT_FIX_SUMMARY.md` - GLB export fixes
- `LED_CEILING_STRIPS.md` - LED strip documentation
- `NETWORK_ACCESS_GUIDE.md` - Network setup guide

---

## Summary

✅ **Fixed:** Invisible collision boxes  
✅ **Result:** Only visible, solid objects block movement  
✅ **Benefit:** Smooth, predictable navigation  
✅ **Performance:** Actually improved (fewer collision checks)  

**The 3D viewer now works as expected - what you see is what you collide with!**

---

**Author:** Kiro AI Assistant  
**Date:** 2026-10-16  
**Version:** 3.0 (Collision Fix)  
**Project:** FloorPlan-to-3D
