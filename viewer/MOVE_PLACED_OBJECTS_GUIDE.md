# 🔄 Move Placed Objects - Gesture Guide

## NEW FEATURE: Rearrange Furniture with Gestures! ✅

You can now **grab and move** already-placed furniture in your 3D scene using pinch gestures!

---

## 🖐️ How to Move Placed Objects

### Step 1: Enter Interactive Mode
1. Load a floor plan
2. Click "Interactive Assets Walkthrough" button
3. Allow camera access
4. Wait for camera to start

### Step 2: Place Some Furniture First
1. Show your hand to the camera
2. Pinch on an asset in the bottom panel to select it
3. Pinch again to place it in the scene
4. Release pinch to confirm placement

### Step 3: Move the Placed Object
1. **Point your hand at the placed furniture** (the object you just placed)
2. **Pinch your fingers** (thumb + index finger together)
3. **Keep pinching and move your hand** - The furniture moves with your hand!
4. **Release pinch** - Object stays in new position ✅

---

## 🎯 Visual Feedback

### Status Indicator Shows:
- **🔄 Moving [object name] - Release to place** (Blue, pulsing)
  - You're currently moving an object
  - Move your hand to reposition
  - Release pinch to confirm new position

- **✅ [object name] repositioned!** (Green)
  - Object successfully moved to new location
  - New position automatically saved

---

## 🔍 How It Works

### Detection Priority:
When you pinch, the system checks in this order:
1. **Are you pinching on a placed object?** → Start moving it
2. **Are you pinching on asset panel?** → Select new asset
3. **Are you pinching in empty space?** → Place selected asset

This means you can naturally:
- Grab and move existing furniture
- Select new furniture from the panel
- Place new furniture in the scene
- All with the same pinch gesture!

---

## 💡 Tips & Best Practices

### ✅ DO:
- **Point directly at the object** you want to move before pinching
- **Keep pinching** while moving - don't release until positioned
- **Move slowly** for precise positioning
- **Use good lighting** so camera can see your hands clearly
- **Face your palm** toward the camera for best detection

### ❌ DON'T:
- Don't pinch too quickly - system needs time to detect object
- Don't overlap your hands - keep them separated
- Don't move object too far from camera (max 15 meters)
- Don't release pinch accidentally - object will drop immediately

---

## 🎮 Complete Gesture Controls

| Gesture | Action | Use Case |
|---------|--------|----------|
| 👌 **Pinch on placed object** | **MOVE OBJECT** | Rearrange furniture |
| 👌 **Pinch on asset panel** | Select Asset | Choose furniture to place |
| 👌 **Pinch in empty space** | Place Asset | Add new furniture |
| 👌👌 **Two-hand pinch + spread** | Scale | Make object bigger/smaller |
| 🔄 **Two-hand pinch + rotate** | Rotate | Turn object around |
| ✌️ **Peace sign + pinch** | Delete | Remove object |
| 🖖 **Three fingers + pinch** | Duplicate | Copy object |
| 👊 **Fist** | Cancel | Stop current action |

---

## 📝 Example Workflow

### Scenario: Rearrange a Living Room

1. **Place initial furniture:**
   - Pinch on "sofa" in panel → Pinch to place → Release
   - Pinch on "table" in panel → Pinch to place → Release
   - Pinch on "chair" in panel → Pinch to place → Release

2. **Realize sofa is in wrong spot:**
   - Point at the sofa
   - Pinch on it (status shows "🔄 Moving sofa")
   - Drag hand to new position
   - Release pinch (status shows "✅ sofa repositioned!")

3. **Adjust other furniture:**
   - Point at table → Pinch → Move → Release
   - Point at chair → Pinch → Move → Release

4. **Perfect layout achieved!** 🎉

---

## 🐛 Troubleshooting

### "Can't grab object - nothing happens when I pinch it"

**Possible Causes:**
1. **Not pointing at object:** Make sure your hand is over the object from camera's view
2. **Too far away:** Object might be outside raycast range (>15m)
3. **Object not placed yet:** Can only move objects that are already in scene

**Solutions:**
- Move closer to the object in 3D space (walk with WASD)
- Point your index finger directly at the object
- Check console for "🎯 Found placed object:" message

### "Object jumps to weird position when I grab it"

**Cause:** Offset calculation issue

**Solution:**
- Release pinch and try again
- Make sure you pinch close to the object's center
- Check that camera can see both the object and your hand

### "Object keeps moving after I release pinch"

**Cause:** Pinch detection lag or stuck state

**Solution:**
- Make fist gesture (👊) to cancel
- Refresh the page
- Check lighting - poor lighting causes detection issues

### "Can't move object - says 'Already dragging'"

**Cause:** System thinks you're in placement mode

**Solution:**
- Release all pinches
- Wait for status to show "Ready"
- Try again

---

## 🔧 Technical Details

### Raycasting System:
- Uses camera's viewport to cast ray through hand position
- Intersects with placed asset meshes
- Returns closest object hit by ray

### Offset Calculation:
- When you grab an object, system calculates offset from hand to object center
- Offset maintained during drag so object doesn't "jump"
- Only X and Z position change - Y (height) stays constant

### Position Updates:
- Real-time position updates while pinching
- Smooth movement follows hand motion
- Auto-save triggered when you release

### Collision Detection:
- Currently objects CAN overlap (no collision physics)
- You can place/move objects through walls
- Future update may add collision prevention

---

## 📊 Console Logs

### Successful Move Operation:
```
🎯 Found placed object: bed_double
🔄 Started moving: bed_double
📍 Moving object to: (2.34, -1.52)
📍 Moving object to: (2.56, -1.48)
📍 Moving object to: (2.71, -1.45)
✅ Finished moving: bed_double
   Final position: (2.71, 0.00, -1.45)
💾 Saved 3 placed assets
```

### If Object Not Found:
```
⚠️ No placed object at hand position
```

---

## 🎯 State Management

### Object States:
1. **Placed & Idle** - Object sitting in scene, not selected
2. **Being Moved** - Object attached to hand, following pinch gesture
3. **Just Released** - Object dropped, position saved

### Hand States:
1. **Open Hand** - No action
2. **Pinching on Object** - Moving mode active
3. **Pinching on Panel** - Selecting new asset
4. **Pinching in Air** - Placing new asset

---

## 🚀 Advanced Tips

### Precise Positioning:
1. **Rough placement:** Use broad hand movements
2. **Fine tuning:** Move close to object in 3D space (WASD)
3. **Final adjustment:** Small hand movements for pixel-perfect placement

### Working with Multiple Objects:
1. **Move one at a time** - Don't try to pinch multiple objects
2. **Group nearby objects** - Move them together by moving one, then another
3. **Use two hands** - One hand for moving, other for distance reference

### Creating Layouts:
1. **Place all furniture first** - Get general layout
2. **Walk around scene** - View from different angles
3. **Rearrange as needed** - Use move gesture to perfect positions
4. **Save often** - Auto-saves on each move, but refresh loses unsaved work

---

## 🎨 Future Enhancements (Potential)

Could add:
- **Snap to grid** - Objects align to grid points
- **Collision detection** - Objects can't overlap
- **Multi-select** - Move multiple objects together
- **Copy while moving** - Drag + hold creates duplicate
- **Rotation while moving** - Twist hand to rotate while dragging
- **Height adjustment** - Vertical hand movement changes Y position

---

## ✅ Quick Reference

**To Move Object:**
1. Point at object
2. Pinch
3. Move hand
4. Release

**That's it! Simple and intuitive! 🎉**

---

## 📞 Help

**Still having issues?**
- Check `viewer/CAMERA_TROUBLESHOOTING.md`
- Verify camera is working (can you see preview?)
- Check console for error messages (F12)
- Make sure you're in Interactive mode
- Ensure object is actually placed in scene

**Works great?**
Enjoy rearranging your 3D spaces! 🏠✨

