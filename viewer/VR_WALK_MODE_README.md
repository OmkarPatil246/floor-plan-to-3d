# 🚶 VR Walk Mode - Cardboard VR Experience

## Overview

VR Walk Mode is a fully immersive Virtual Reality feature that allows you to explore your generated 3D floor plans using a Google Cardboard-style VR headset on your Android phone.

## ✨ Features

### 🥽 **Stereoscopic VR View**
- Full cardboard VR support with dual lens-distorted eye views
- Works with any Google Cardboard or compatible VR box
- Automatic viewer profile configuration

### 📱 **Gyroscope Head Tracking**
- Real-time head movement detection
- Natural looking around by moving your phone
- Smooth 360-degree rotation
- Automatic calibration and recentering

### 👣 **Step Detection Walking**
- Walk in place to move forward in VR
- Advanced accelerometer-based step detection
- Configurable sensitivity slider
- Realistic walking speed calculation using Weinberg model
- Cadence verification to prevent false detections

### 🗺️ **Multiple Movement Modes**
1. **Hybrid Mode** (Recommended): Steps + GPS for best accuracy
2. **Steps Only**: Pure pedometer-based movement
3. **GPS Look**: Move using GPS speed in look direction
4. **GPS Real Map**: True GPS navigation with compass
5. **Manual**: Button/touch controls only

### 🚪 **Automatic Door Opening**
- Look at doors for 1.5 seconds to open them automatically
- Visual prompt when looking at openable doors
- Smooth door opening animations
- No button press required - hands-free operation

### 🧭 **Advanced Navigation**
- Compass integration for true north alignment
- GPS position tracking with Kalman filtering
- Adaptive stride length calibration
- Real-time diagnostics display

## 🎮 How to Use

### Setup

1. **Start the Server**
   - Run `START_VR_WALK_MODE.bat`
   - Server starts on `http://localhost:8000`

2. **Access from Phone**
   - Find your computer's IP address:
     ```
     ipconfig
     ```
   - On your Android phone, open Chrome or Firefox
   - Navigate to: `http://YOUR_IP:8000/vr-walk-mode.html`
   - Make sure you're on the same WiFi network

3. **From Main Viewer**
   - Generate your 3D floor plan in the main viewer
   - Click the **"Enter VR Walk Mode"** button (purple gradient button)
   - Automatically transfers to VR mode

### VR Controls

#### Before Entering VR:
- **Configure Settings**:
  - Select movement mode (Hybrid recommended)
  - Adjust step sensitivity (lower = more sensitive)
- **Preview Mode**: Third-person view with touch/drag to look around

#### In VR Mode:
1. Tap **"Enter VR"** button
2. When prompted, allow:
   - Device motion/orientation access (for gyroscope)
   - Location access (for GPS modes, optional)
3. Place phone in VR headset
4. Look around naturally with head movement
5. **Walk in place** to move forward
6. **Touch screen** or use button to move forward
7. **Look at doors** to open them (automatic after 1.5s)

### Movement Controls

- **Walk Forward**: Walk in place (steps detected) or touch screen
- **Manual Controls**: Use on-screen buttons (Forward, Left, Back, Right)
- **Look Around**: Move your head/phone naturally
- **Recenter View**: Use "Recenter" button if orientation drifts

### Exiting VR

- Tap "Exit VR" button (or use headset back button)
- Click "Exit to Main" to return to the main viewer

## 📊 Movement Modes Explained

### Hybrid (Best for Indoor)
- Combines step detection with GPS
- GPS calibrates stride length over time
- Instant response from steps
- Most accurate for indoor walking

### Steps Only
- Pure accelerometer step detection
- No GPS required
- Great for offline use
- Consistent indoor movement

### GPS Look
- Uses GPS speed
- Moves in direction you're looking
- Good for outdoor exploration
- Requires clear sky view

### GPS Real Map
- True GPS positioning
- Uses compass for north alignment
- World rotates to match reality
- Best for outdoor navigation

## 🔧 Technical Details

### Step Detection Algorithm
- Peak detection in accelerometer magnitude
- Minimum step interval: 300ms
- Dynamic threshold: max(slider, 0.8σ)
- Gyroscope head-whip rejection (threshold: 250°/s)
- Cadence verification (< 1.1s between steps)
- Weinberg step length: L = K·(aₘₐₓ−aₘᵢₙ)^¼

### GPS Filtering
- 2-state Kalman filter (position + velocity)
- Doppler velocity integration when available
- Accuracy gating (rejects fixes > 35m error)
- Fade-out for stale fixes (3s timeout)

### Gyroscope Tracking
- Device orientation quaternions
- Sensor fusion with compass
- Smooth interpolation (slerp 0.65)
- Heading offset calibration
- Screen orientation compensation

### Door Detection
- Raycasting from head position
- 4-meter interaction range
- 1.5-second look timer
- Smooth cubic ease-out animation
- Automatic collision detection

## 📱 System Requirements

### Minimum Requirements
- Android phone with gyroscope
- Google Chrome or Firefox browser
- HTTPS connection or localhost
- VR headset (Google Cardboard compatible)

### Optional Features
- Accelerometer (for step detection)
- GPS (for outdoor navigation modes)
- Compass (for true north alignment)

### Recommended
- Modern Android phone (2019+)
- Good gyroscope calibration
- Clear space for walking in place
- Good lighting for step detection

## 🐛 Troubleshooting

### VR Not Available
- Ensure you're using HTTPS or localhost
- Check browser compatibility (Chrome/Firefox)
- Update browser to latest version
- Try refreshing the page

### Gyroscope Not Working
- Allow motion/orientation permissions
- Calibrate phone sensors in settings
- Check "Recenter" button
- Try phone restart

### Steps Not Detected
- Lower sensitivity slider
- Walk more pronounced
- Check flat surface
- Ensure phone is stable in headset

### Doors Not Opening
- Look directly at door center
- Stay within 4 meters
- Hold gaze for 1.5 seconds
- Check for prompt message

### GPS Issues
- Move to open area
- Allow location permissions
- Wait for GPS fix (may take 30s)
- Check accuracy indicator

## 🎯 Tips for Best Experience

1. **Calibrate First**: Use "Recenter" button when starting
2. **Adjust Sensitivity**: Lower for easier step detection
3. **Walk Naturally**: Exaggerated steps work better
4. **Good Lighting**: Helps with step detection
5. **Clear Space**: Ensure safe walking area
6. **Phone Position**: Keep stable in headset
7. **Try Hybrid Mode**: Best all-around experience
8. **Allow Permissions**: Motion and location when prompted

## 🔐 Privacy & Permissions

- **Motion/Orientation**: Required for head tracking
- **Location (Optional)**: Only for GPS movement modes
- **Camera**: Not used in VR Walk Mode
- **All data stays local**: No cloud upload

## 🆕 Future Enhancements

Potential upcoming features:
- Multiplayer VR sessions
- Voice commands for door opening
- Hand gesture controls
- Teleportation movement option
- Custom environment loading
- VR object interaction
- Furniture placement in VR
- Screenshot/recording capabilities

## 📄 Technical Reference

Based on the proven VR implementation from the reference code, featuring:
- WebXR Polyfill for Cardboard support
- Three.js r160 for rendering
- Real-time sensor fusion
- Professional movement algorithms
- Accessibility-focused design

## 🙋 Support

If you encounter issues:
1. Check this README troubleshooting section
2. Verify all system requirements
3. Test on different browser
4. Check console for error messages (F12)
5. Ensure server is running properly

---

**Enjoy your immersive VR experience! 🎮🥽**
