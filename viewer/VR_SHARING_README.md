# 🥽 VR Mobile Sharing Feature

Share your 3D floor plan walkthrough to your mobile device for immersive VR viewing with Google Cardboard or similar VR headsets.

## 🎯 Overview

This feature allows you to:
1. **View on Desktop**: Navigate the 3D floor plan on your computer
2. **Stream to Mobile**: Share the view to your phone in real-time
3. **VR Mode**: Experience it in stereo VR with head tracking using your phone's gyroscope
4. **Remote Access**: Share with anyone via ngrok tunnel (optional)

## 🚀 Quick Start

### 1. Start the VR Server

**Windows:**
```bash
cd viewer
START_VR_SERVER.bat
```

**Mac/Linux:**
```bash
cd viewer
npm install
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║   Floor Plan VR Sharing Server                            ║
╚═══════════════════════════════════════════════════════════╝

🚀 Local server running on http://localhost:3001
🔌 WebSocket: ws://localhost:3001

🌐 PUBLIC URL (Share this with mobile devices)
   https://abc123.ngrok-free.app
```

### 2. Open the Floor Plan Viewer

1. Open your browser to `http://localhost:3001` (or use the public ngrok URL)
2. Upload or select a floor plan
3. Click **"Enter VR Mode"** button in the sidebar

### 3. Connect Your Mobile Device

**Option A: Scan QR Code** (Easiest)
1. A QR code will appear on your computer screen
2. Scan it with your phone's camera
3. Your phone's browser will open the VR view

**Option B: Copy Link**
1. Click "Copy" button next to the link in the modal
2. Send the link to your phone (email, messaging, etc.)
3. Open the link on your phone

### 4. Put Phone in VR Headset

1. Wait for "Mobile device connected!" message
2. Click "Continue to VR" on your computer
3. Tap "Enable Sensors" on your phone to allow gyroscope access
4. Put your phone in a Google Cardboard or similar VR headset
5. Move your head to look around!

## 📱 How It Works

```
┌─────────────────┐                    ┌──────────────────┐
│    COMPUTER     │◄──────WebRTC──────►│   MOBILE PHONE   │
│  (Primary)      │   (Video Stream)   │   (Secondary)    │
│                 │                    │                  │
│ • 3D Rendering  │                    │ • Stereo View    │
│ • Walk Mode     │◄───WebSocket────►  │ • Gyro Tracking  │
│ • Controls      │  (Head Movement)   │ • VR Headset     │
│ • Asset Panel   │                    │ • Cardboard UI   │
└─────────────────┘                    └──────────────────┘
         │                                      │
         └──────── Signaling Server ───────────┘
              (WebSocket on port 3001)
                     │
                     ▼
                  Ngrok Tunnel
             (Public HTTPS URL)
```

### Technology Stack

- **WebRTC**: Peer-to-peer video streaming (low latency)
- **WebSocket**: Signaling and gyroscope data exchange
- **Ngrok**: Creates public HTTPS tunnel for remote access
- **Three.js**: 3D rendering on both devices

## 🎮 Features

### Desktop (Primary Device)
✅ Interactive 3D walkthrough  
✅ Real-time frame streaming (30 FPS)  
✅ Gesture controls (if enabled)  
✅ Asset placement and editing  
✅ Camera follows mobile head movements  
✅ Session management with QR codes  

### Mobile (Secondary Device)
✅ Stereo VR view (side-by-side)  
✅ Gyroscope head tracking  
✅ Barrel distortion correction  
✅ Screen wake lock (prevents dimming)  
✅ Low-latency WebRTC streaming  
✅ Touch interaction (optional)  
✅ FPS counter (triple-tap to show)  

## ⚙️ Configuration

### Frame Rate & Quality

Edit `vr-integration.js`:

```javascript
// Change frame rate (default: 30 FPS)
this.frameInterval = 1000 / 30; // 20 FPS = 1000/20

// Change image quality (default: 0.7)
this.quality = 0.7; // Range: 0.1 to 1.0
```

Lower values = less bandwidth, lower quality  
Higher values = more bandwidth, higher quality

### Eye Separation (IPD)

Edit `vr-mobile.html`:

```javascript
const IPD = 64; // Inter-pupillary distance in pixels
```

Adjust for your VR headset and personal comfort (typical range: 50-80).

### Barrel Distortion

For better VR lens correction, modify the `applyBarrelDistortion()` function in `vr-mobile.html`:

```javascript
const k = 0.15; // Distortion coefficient (0.1 - 0.3)
```

## 🌐 Network Setup

### Local Network Only (Default)

Both devices must be on the same WiFi network. Use:
- Computer: `http://localhost:3001`
- Mobile: Scan QR code or use local IP

### Internet Access (with Ngrok)

1. **Install Ngrok**:
   - Download from: https://ngrok.com/download
   - Create free account: https://dashboard.ngrok.com/signup
   - Install auth token:
     ```bash
     ngrok config add-authtoken YOUR_TOKEN
     ```

2. **Start Server** (ngrok will auto-start):
   ```bash
   npm start
   ```

3. **Share Public URL**:
   - Server will display: `https://abc123.ngrok-free.app`
   - Share this URL with anyone, anywhere
   - They can scan QR code or open link directly

### Manual Ngrok (Alternative)

If auto-start doesn't work:

```bash
# Terminal 1: Start VR server
npm start

# Terminal 2: Start ngrok
ngrok http 3001
```

Copy the `https://` URL from ngrok and share it.

## 🐛 Troubleshooting

### QR Code Won't Scan
- **Solution 1**: Copy the link manually and paste in mobile browser
- **Solution 2**: Increase screen brightness
- **Solution 3**: Use the direct link instead

### Mobile Can't Connect
- **Check 1**: Both devices on same WiFi (if using local mode)
- **Check 2**: Server is running (`http://localhost:3001/api/health`)
- **Check 3**: Firewall allows port 3001
- **Check 4**: Try the public ngrok URL instead

### Gyroscope Not Working
- **iOS**: Safari requires HTTPS and user permission
  - Tap "Enable Sensors" button
  - Use ngrok (provides HTTPS automatically)
- **Android**: Usually works without extra permissions
- **Check**: Phone has gyroscope sensor (most smartphones do)

### Poor Video Quality / Lag
1. **Reduce frame rate**: Change `frameInterval` to 40-50ms
2. **Lower quality**: Change `quality` to 0.5
3. **Check WiFi**: Use 5GHz band if available
4. **Close apps**: Free up phone resources

### Connection Drops
- **Check**: Phone screen doesn't sleep (wake lock should prevent this)
- **Check**: WiFi is stable
- **Try**: Use cable connection (USB tethering) instead of WiFi

### Black Screen on Mobile
- **Wait**: May take 3-5 seconds for first frame
- **Check**: Connection status at top of screen
- **Try**: Reload page on mobile
- **Debug**: Triple-tap screen to show FPS counter

## 📊 Performance Tips

### Optimal Settings

**Good WiFi (5GHz, close range):**
- Frame rate: 30 FPS
- Quality: 0.7
- Expected latency: 50-100ms

**Average WiFi (2.4GHz, medium range):**
- Frame rate: 20 FPS
- Quality: 0.5
- Expected latency: 100-200ms

**Poor WiFi / Mobile Data:**
- Frame rate: 15 FPS
- Quality: 0.4
- Expected latency: 200-500ms

### Bandwidth Usage

Approximate data consumption:
- **Low (0.4 quality, 15 FPS)**: ~1-2 MB/minute
- **Medium (0.5 quality, 20 FPS)**: ~2-3 MB/minute  
- **High (0.7 quality, 30 FPS)**: ~4-6 MB/minute

## 🔒 Security & Privacy

- **Sessions expire after 2 hours** of inactivity
- **No authentication** by default (anyone with link can join)
- **Local network** mode is secure (no internet exposure)
- **Ngrok tunnels** are temporary (close when server stops)
- **No data stored** on server (pure peer-to-peer streaming)

### Adding Authentication (Optional)

To restrict access, modify `vr-signaling-server.js`:

```javascript
const ALLOWED_SESSIONS = new Set(['secret-code-123']);

// In handleRegister function:
if (!ALLOWED_SESSIONS.has(sessionId)) {
  ws.send(JSON.stringify({ type: 'error', message: 'Invalid session' }));
  ws.close();
  return;
}
```

## 📚 API Endpoints

### Health Check
```bash
GET http://localhost:3001/api/health
```
Returns server status, active connections, and ngrok URL.

### Active Sessions
```bash
GET http://localhost:3001/api/sessions
```
Lists all active VR sessions.

### Ngrok URL
```bash
GET http://localhost:3001/api/ngrok-url
```
Returns the current public ngrok URL.

## 🎨 Customization

### Change VR Button

Edit `viewer/index.html`:

```html
<button class="btn primary" id="vr-mode-btn">
  🥽 Enter VR Mode
</button>
```

### Change QR Code Style

Edit `vr-integration.js` in the `generateQRCode()` function:

```javascript
new QRCode(document.getElementById(containerId), {
  text: text,
  width: 300,        // Larger QR code
  height: 300,
  colorDark: '#667eea',  // Purple QR code
  colorLight: '#ffffff',
  correctLevel: QRCode.CorrectLevel.H
});
```

### Add Custom Controls

Modify `vr-mobile.html` to add touch controls for walking forward:

```javascript
document.addEventListener('touchstart', (e) => {
  // Send walking command to primary device
  ws.send(JSON.stringify({
    type: 'walk-forward',
    sessionId: sessionId
  }));
});
```

## 🆘 Support

### Check Logs

**Browser Console** (F12):
- Primary device: Check for WebRTC connection status
- Mobile device: Check for sensor permissions

**Server Logs**:
- Look for connection messages
- Check for error messages
- Verify ngrok tunnel status

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `No session ID provided` | Invalid URL | Scan QR code again |
| `WebSocket error` | Server not running | Start server with `npm start` |
| `Data channel error` | WebRTC failed | Check firewall, try ngrok |
| `Permission denied` | No gyro access | Tap "Enable Sensors" |

## 🔗 Integration with Main Viewer

The VR mode is integrated into the main viewer at `viewer/index.html`. To add it to your custom viewer:

1. **Include QR Code Library**:
```html
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
```

2. **Import VR Module**:
```javascript
import { VRIntegration } from './vr-integration.js';
```

3. **Initialize VR**:
```javascript
const vr = new VRIntegration(scene, camera, renderer);

document.getElementById('vr-mode-btn').addEventListener('click', async () => {
  await vr.startVRMode();
});
```

4. **Update Camera Loop** (to receive mobile head movements):
```javascript
function animate() {
  requestAnimationFrame(animate);
  // VR integration automatically updates camera
  renderer.render(scene, camera);
}
```

## 📄 Files Structure

```
viewer/
├── vr-signaling-server.js      # WebSocket server + ngrok
├── vr-integration.js            # Desktop VR controller
├── vr-mobile.html               # Mobile VR view
├── START_VR_SERVER.bat          # Windows startup script
├── package.json                 # Node.js dependencies
└── VR_SHARING_README.md         # This file
```

## 🎓 How to Use (Step-by-Step)

### For First-Time Users

1. **Start the server** (one-time setup):
   ```bash
   cd viewer
   npm install
   npm start
   ```

2. **Open desktop view**:
   - Go to `http://localhost:3001`
   - Load a floor plan
   - Enter walkthrough mode

3. **Click "Enter VR Mode"**:
   - QR code will appear
   - Don't close this modal yet

4. **On your phone**:
   - Scan the QR code
   - Allow sensor permissions when prompted
   - Wait for "Connected" status

5. **Continue**:
   - Click "Continue to VR" on desktop
   - Put phone in VR headset
   - Look around by moving your head!

### Tips for Best Experience

- ✅ Use a **5GHz WiFi** connection
- ✅ Keep phone **charged** (VR is battery-intensive)
- ✅ **Calibrate** gyroscope by looking straight ahead when entering VR
- ✅ Start in **seated position** for comfort
- ✅ Use **landscape orientation** on phone
- ✅ Adjust **screen brightness** to comfortable level
- ❌ Don't use during **movement** (car, train, etc.)
- ❌ Don't use if you experience **motion sickness**

## 🆕 Future Enhancements

Planned features:
- [ ] Multi-user VR (multiple phones viewing same session)
- [ ] Voice chat between desktop and mobile
- [ ] Touch controls for teleportation
- [ ] Annotation/markup tools
- [ ] 360° photo capture
- [ ] Record VR sessions

## 📞 Help & Feedback

If you encounter issues:
1. Check this README thoroughly
2. Verify all prerequisites are installed
3. Test with local network first before trying ngrok
4. Check browser console for error messages

---

**Built with ❤️ for immersive architecture visualization**

🏗️ **Compatible VR Headsets**: Google Cardboard, VR Box, Merge VR, Daydream View  
📱 **Compatible Devices**: iPhone 6+, Android 5.0+  
🌐 **Compatible Browsers**: Chrome 80+, Safari 13+, Firefox 75+
