# Camera Troubleshooting Guide

## Quick Camera Test

### Step 1: Start the Server
```bash
cd viewer
python -m http.server 8000
```

### Step 2: Open Browser
Navigate to: `http://localhost:8000`

### Step 3: Check Browser Console (F12)
Before clicking anything, check that the page loaded without errors.

### Step 4: Enter Interactive Mode
Click "Interactive Assets Walkthrough" button

### Step 5: Allow Camera Permission
When browser asks for camera access, click **"Allow"**

---

## Expected Console Output (Success) ✅

```
🎥 Initializing MediaPipe Hands...
✅ MediaPipe Hands initialized
📹 Starting camera...
✅ Camera started successfully
```

**Visual Confirmation:**
- Small camera preview appears in bottom-right corner
- Status shows: "Show both hands to begin"
- You can see yourself in the preview

---

## Common Issues & Solutions

### Issue 1: "Camera access denied" ❌

**Symptoms:**
- Console shows: `❌ Camera access denied:`
- Alert: "Please allow camera access for gesture control"
- Status: "Camera access denied"

**Solutions:**
1. **Check browser permissions:**
   - Chrome: Click padlock icon in address bar → Camera → Allow
   - Firefox: Click camera icon in address bar → Allow
   - Edge: Click padlock icon → Camera → Allow

2. **Reset permissions:**
   - Chrome: Settings → Privacy and security → Site Settings → Camera
   - Find localhost:8000 and set to "Allow"

3. **Try incognito/private mode:**
   - Sometimes permissions get stuck, private mode forces a fresh prompt

### Issue 2: "Failed to initialize MediaPipe" ❌

**Symptoms:**
- Console shows: `❌ Failed to initialize MediaPipe:`
- Status: "Camera initialization failed"
- No camera preview

**Solutions:**
1. **Check internet connection:**
   - MediaPipe loads from CDN: `cdn.jsdelivr.net`
   - Test: Open https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js in browser
   - Should download a JS file (not 404)

2. **Check firewall/antivirus:**
   - Some firewalls block CDN requests
   - Temporarily disable to test

3. **Try different browser:**
   - Chrome/Edge recommended (best MediaPipe support)
   - Firefox works but may be slower

### Issue 3: Camera Preview Shows But No Gesture Detection

**Symptoms:**
- Camera preview visible
- But pinch/gestures don't work
- Status stuck on "Show both hands to begin"

**Solutions:**
1. **Check lighting:**
   - MediaPipe needs good lighting to see hands
   - Face a light source, not a window

2. **Show both hands clearly:**
   - Hold hands in front of camera
   - Keep hands apart (not overlapping)
   - Face palms toward camera

3. **Check console for hand detection:**
   ```javascript
   // Open console (F12) and check:
   gestureSystem.leftHand  // Should show landmarks when left hand visible
   gestureSystem.rightHand // Should show landmarks when right hand visible
   ```

### Issue 4: No Console Logs at All

**Symptoms:**
- No "Initializing MediaPipe" logs
- No camera logs
- Nothing happens when clicking Interactive mode

**Solutions:**
1. **Check gesture system is initialized:**
   ```javascript
   // In console:
   console.log(gestureSystem); 
   // Should show: GestureDetectionSystem {video: video, canvas: canvas, ...}
   // NOT: null or undefined
   ```

2. **If gestureSystem is null:**
   - Check line 8099 in viewer/index.html
   - Should be: `gestureSystem = new GestureDetectionSystem();`
   - NOT commented out with `//` or `/* */`

3. **Refresh page:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clears cache and reloads all scripts

### Issue 5: "Identifier 'gestureSystem' has already been declared"

**Symptoms:**
- Console shows red error
- Page doesn't load properly

**Solution:**
- This was fixed at line 8112
- Should be: `gestureSystem = null;` (no `let`)
- NOT: `let gestureSystem = null;`

### Issue 6: Camera Starts Then Immediately Stops

**Symptoms:**
- Brief camera flash
- Then preview disappears
- Console shows errors

**Solutions:**
1. **Check for conflicting code:**
   - 3D Assets System should be DISABLED
   - Check these files exist with .DISABLED extension:
     - `../3d Assets System and justure system/index.html.DISABLED`
     - `../3d Assets System and justure system/app.js.DISABLED`

2. **Only ONE camera instance allowed:**
   - MediaPipe can't share camera with two systems
   - Make sure you're only opening `viewer/index.html`

---

## Advanced Debugging

### Check Video Stream:
```javascript
// In browser console:
gestureSystem.video.srcObject
// Should show: MediaStream {id: "...", active: true}
// NOT: null
```

### Check MediaPipe Hands:
```javascript
gestureSystem.hands
// Should show: Hands {locateFile: ƒ, setOptions: ƒ, ...}
// NOT: null or undefined
```

### Check Camera Object:
```javascript
gestureSystem.mediaPipeCamera
// Should show: Camera {video: video, ...}
// NOT: null
```

### Force Camera Start Manually:
```javascript
// If camera won't start, try manually:
gestureSystem.startCamera()
  .then(() => console.log('Camera started!'))
  .catch(err => console.error('Camera failed:', err));
```

---

## Browser Compatibility

### ✅ Fully Supported:
- **Chrome 88+** (Recommended)
- **Edge 88+** (Recommended)
- **Opera 74+**

### ⚠️ Partial Support:
- **Firefox 85+** (May be slower, gestures work)
- **Safari 14+** (MediaPipe support limited)

### ❌ Not Supported:
- Internet Explorer (use Edge instead)
- Very old mobile browsers

---

## Performance Tips

### If Gestures Are Laggy:

1. **Close other tabs** - Free up browser resources

2. **Check CPU usage** - MediaPipe is CPU-intensive

3. **Lower video quality** (in startCamera function):
   ```javascript
   width: { ideal: 640 },   // Lower from 1280
   height: { ideal: 480 },  // Lower from 720
   ```

4. **Reduce model complexity** (in initMediaPipe):
   ```javascript
   modelComplexity: 0,  // Lower from 1 (faster but less accurate)
   ```

---

## Still Not Working?

### Last Resort Checks:

1. **Verify files aren't corrupted:**
   - Check viewer/index.html line 8099: `gestureSystem = new GestureDetectionSystem();`
   - Check lines 1835-1840 have video/canvas elements
   - Check lines 10-12 have MediaPipe script tags

2. **Test on different device:**
   - Try another computer/laptop
   - Ensure camera physically works (test in native camera app first)

3. **Check server logs:**
   - Look at terminal where `python -m http.server` is running
   - Should show: `GET /index.html 200` (not 404 or 500)

4. **Create minimal test:**
   ```html
   <!-- Save as test.html in viewer folder -->
   <!DOCTYPE html>
   <html>
   <head>
     <title>Camera Test</title>
   </head>
   <body>
     <video id="test-video" autoplay playsinline width="640" height="480"></video>
     <script>
       navigator.mediaDevices.getUserMedia({ video: true })
         .then(stream => {
           document.getElementById('test-video').srcObject = stream;
           console.log('✅ Camera works!');
         })
         .catch(err => console.error('❌ Camera failed:', err));
     </script>
   </body>
   </html>
   ```
   - Open: `http://localhost:8000/test.html`
   - If this works, camera hardware is fine
   - If this fails, it's a browser/permission issue

---

## Contact Info

If you've tried everything and it still doesn't work:
1. Copy the error message from console (F12)
2. Note which step failed (initialization, camera start, etc.)
3. Include browser name and version
4. Include OS (Windows/Mac/Linux)

---

## Success Indicators ✅

You'll know it's working when you see:
- ✅ Camera preview in bottom-right
- ✅ Console logs show "Camera started successfully"
- ✅ Status shows "Show both hands to begin"
- ✅ When you show hands, status changes to "Ready"
- ✅ When you pinch, status shows gesture name

**Happy Gesture Controlling! 🖐️**
