# 🥽 VR Box Mode System

A dual-device VR system that streams the primary device's screen to a secondary device in stereo view for VR box usage.

## 🎯 System Overview

### Architecture
```
┌─────────────────┐                    ┌──────────────────┐
│ PRIMARY DEVICE  │◄──────WebRTC──────►│ SECONDARY DEVICE │
│  (Computer/     │   (Screen Stream)  │   (Phone in      │
│   Tablet)       │                    │    VR Box)       │
│                 │                    │                  │
│ • Generates QR  │◄───WebSocket────►  │ • Scans QR code  │
│ • Walk Mode     │  (Sensor Data)     │ • Stereo View    │
│ • Gesture Detect│                    │ • Gyro Tracking  │
│ • Asset List    │                    │ • Accel. Data    │
└─────────────────┘                    └──────────────────┘
         │                                      │
         └──────────── Signaling Server ───────┘
                    (WebSocket on port 3000)
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd "3d Assets System and  justure system"
npm install
```

### 2. Start the Signaling Server
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════════╗
║   VR Mode Signaling Server                     ║
╚════════════════════════════════════════════════╝

🚀 Server running on http://localhost:3000
🔌 WebSocket: ws://localhost:3000

📱 Open primary device at:
   http://localhost:3000/vr-primary.html
```

### 3. Setup Devices

**PRIMARY DEVICE** (Computer/Tablet):
1. Open `http://localhost:3000/vr-primary.html`
2. Allow camera access (for gesture detection)
3. A QR code will appear

**SECONDARY DEVICE** (Phone for VR Box):
1. Scan the QR code with your phone
2. Allow device orientation/motion sensors
3. Put phone in VR box

### 4. Enter VR Mode

Once both devices are connected:
- Primary device automatically enters "Walk Mode"
- Camera starts for gesture detection
- Asset list appears on left side
- Secondary device shows stereo VR view

## 📱 Features

### Primary Device
✅ **QR Code Generation** - Unique session for device pairing  
✅ **3D Walk Mode** - First-person navigation  
✅ **Gesture Detection** - Hand tracking via camera  
✅ **Asset List** - Left sidebar with 3D furniture  
✅ **Real-time Streaming** - 30 FPS to secondary device  
✅ **Persistent Storage** - Placed objects saved to localStorage  

### Secondary Device (VR Box)
✅ **Stereo View** - Side-by-side rendering with eye separation  
✅ **Gyroscope Tracking** - Head movement detection  
✅ **Barrel Distortion** - Lens correction (simplified)  
✅ **Low Latency** - WebRTC data channel  
✅ **Step Detection** - Accelerometer for walking (optional)  
✅ **Screen Wake Lock** - Prevents screen dimming  

## 🎮 Controls

### Primary Device
- **W/A/S/D** - Move camera (testing)
- **Mouse/Touch** - Select assets from left sidebar
- **Hand Gestures** - Select and place furniture
  - 👍 Thumbs up = Select asset
  - 👌 Pinch = Place asset
  - ✋ Open hand = Cancel

### Secondary Device (VR Box)
- **Head Movement** - Look around
- **Touch Screen** - Walk forward
- **Physical Movement** - Step detection (if supported)

## 📊 System Flow

```
1. User clicks "VR Mode" on primary device
   ↓
2. QR code displayed with session ID
   ↓
3. Secondary device scans QR code
   ↓
4. WebSocket connection established
   ↓
5. WebRTC peer connection created
   ↓
6. Primary detects secondary is connected
   ↓
7. Primary enters Walk Mode:
   - 3D scene activates
   - Camera starts for gestures
   - Asset list shown
   - Frame streaming begins
   ↓
8. Secondary receives frames:
   - Converts to stereo view
   - Applies lens distortion
   - Sends gyro data back
   ↓
9. Interactive VR Experience:
   - User walks and looks around
   - Selects assets with gestures
   - Places furniture in real-time
   - Objects saved automatically
```

## 🔧 Configuration

### Frame Rate (Primary device - vr-primary.html)
```javascript
const FRAME_INTERVAL = 1000 / 30; // 30 FPS (line 219)
```
- Lower = higher FPS, more bandwidth
- Higher = lower FPS, less bandwidth

### Eye Separation (Secondary device - vr-secondary.html)
```javascript
const eyeSeparation = 30; // pixels (line 66)
```
- Adjust for 3D depth perception
- Typical range: 20-40 pixels

### Inter-Pupillary Distance
```javascript
const IPD = 0.064; // meters (line 65)
```
- Average human IPD: 64mm
- Adjust for user comfort

## 🌐 Network Requirements

### Local Network (Recommended)
- Both devices on same WiFi
- Low latency (<50ms)
- Bandwidth: ~5-10 Mbps

### Internet (Alternative)
- TURN server required for NAT traversal
- Add to `iceServers` configuration
- Higher latency but works remotely

### STUN/TURN Configuration
```javascript
// In both vr-primary.html and vr-secondary.html
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add TURN server if needed:
    // { 
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'user',
    //   credential: 'pass'
    // }
  ]
});
```

## 🐛 Troubleshooting

### QR Code Not Scanning
- Ensure both devices on same network
- Check if server is running (`http://localhost:3000/health`)
- Try manual URL: `http://YOUR_IP:3000/vr-secondary.html?session=SESSION_ID`

### No Video Stream
- Check WebRTC connection in browser console
- Verify firewall allows UDP traffic
- Check `chrome://webrtc-internals` for details

### Gyroscope Not Working
- iOS requires HTTPS or user permission
- Tap screen to trigger permission request
- Check browser console for errors

### High Latency
- Reduce frame rate (increase FRAME_INTERVAL)
- Lower image quality (line 233: change 0.7 to 0.5)
- Check network bandwidth
- Use local network instead of internet

### Objects Not Saving
- Check browser localStorage is enabled
- Check console for errors
- Clear localStorage and retry:
  ```javascript
  localStorage.removeItem('vrPlacedObjects');
  ```

## 📈 Performance Optimization

### Reduce Bandwidth
1. Lower frame rate (20 FPS instead of 30)
2. Reduce JPEG quality (0.5 instead of 0.7)
3. Resize canvas before encoding

### Reduce Latency
1. Use `maxRetransmits: 0` on data channel ✅
2. Set `ordered: false` ✅
3. Use WebRTC instead of WebSocket for frames ✅

### Improve Quality
1. Increase resolution
2. Use WebGL for barrel distortion
3. Implement proper lens profiles

## 🔐 Security Considerations

- Sessions expire after 1 hour
- No authentication (add if needed)
- Use HTTPS in production
- Validate all incoming messages
- Rate limit WebSocket messages

## 📚 Integration with Existing System

To integrate with your floor-plan-to-3d project:

1. **Import Floor Plan Data**
```javascript
// In vr-primary.html, load the detected floor plan
const floorPlanData = sessionStorage.getItem('floorplan_data');
if (floorPlanData) {
  const plan = JSON.parse(floorPlanData);
  // Build 3D scene from floor plan
}
```

2. **Use Existing Gesture Controller**
```javascript
// Import your gestureController.js
import { HandGestureController } from './gestureController.js';
const gestureController = new HandGestureController();
```

3. **Load 3D Assets**
```javascript
// Use your existing asset paths
const furnitureList = [
  { name: 'Sofa', path: 'assets/Sofa_01_CC0/Sofa_01/Sofa_01.glb' },
  // ... your existing assets
];
```

## 🎨 Customization

### Change VR Box Profile
Edit barrel distortion parameters in `vr-secondary.html`:
```javascript
function applyBarrelDistortion(ctx, canvas) {
  // Implement proper distortion for your VR box
  // Use lens profile parameters
}
```

### Add More Gestures
In `vr-primary.html`:
```javascript
gestureController.onCustomGesture = (gesture) => {
  switch(gesture.type) {
    case 'rotate':
      // Rotate selected object
      break;
    case 'scale':
      // Scale selected object
      break;
  }
};
```

### Custom Asset Categories
Modify the asset list structure:
```javascript
const furnitureCategories = {
  'Living Room': [/* assets */],
  'Bedroom': [/* assets */],
  'Kitchen': [/* assets */]
};
```

## 📞 Support

**Server Health Check**: `http://localhost:3000/health`  
**Active Sessions**: `http://localhost:3000/sessions`  
**WebRTC Diagnostics**: `chrome://webrtc-internals`

## 📄 License

MIT License - Feel free to modify and distribute

## 🙏 Credits

- Three.js for 3D rendering
- QRCode.js for QR generation
- WebRTC for peer-to-peer streaming
- Socket.io inspiration for signaling

---

**Built with ❤️ for immersive VR experiences**
