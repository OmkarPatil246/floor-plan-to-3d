# VR Box + Gesture Control Implementation Plan

## Overview
Integrate full VR experience with QR code access, stereo view, hand gesture controls for door opening and furniture placement.

## Components to Integrate

### 1. **QR Code Generation & Mobile VR Access**
- Generate QR code when user clicks "VR Mode" button
- QR contains current floorplan 3D model URL
- Mobile device scans QR → Opens in browser → Auto-enters VR mode
- Implements WebXR polyfill for cardboard VR boxes

### 2. **Stereo View (VR Box Mode)**
Reference: `vr box mode option view.html`
- Dual lens-distorted eye views
- Device orientation tracking
- Head movement controls camera
- Walk-on-the-spot locomotion using:
  - Accelerometer step detection
  - GPS position tracking
  - Hybrid mode combining both

### 3. **Hand Gesture Recognition (Primary Device)**
Reference: `gestureController.js`
- Uses MediaPipe Hand Landmarker AI
- Detects gestures via webcam on primary device (PC/laptop)
- Sends real-time gesture commands to mobile VR view
- Supported gestures:
  - **Pinch (Thumb+Index)**: Select/Grab objects
  - **Open Palm**: Hover/Navigation
  - **Thumbs Up**: Confirm action
  - **Closed Fist**: Cancel/Deselect
  - **Peace Sign (V)**: Cycle interaction modes
  - **Hand Movement**: Control position

### 4. **Door Interaction via Gesture**
- Detect "door opening" gesture (forward hand sweep)
- Raycast from hand position to door
- Animate door swing open/close
- Apply to all door objects in scene

### 5. **Furniture Placement in VR**
Reference: `app.js` FurniturePlacementSystem
- Place furniture using hand gestures
- Modes: SELECT, MOVE, ROTATE, SCALE
- Real-time sync between PC gesture detection → Mobile VR view
- Snap-to-grid option
- Visual feedback (selection box, hand reticle)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIMARY DEVICE (PC/Laptop)                │
│                                                              │
│  ┌──────────────────────┐      ┌─────────────────────────┐ │
│  │   Webcam Stream      │      │   Main 3D Viewer        │ │
│  │   MediaPipe Hand     │──────│   viewer/index.html     │ │
│  │   Landmarker AI      │      │                         │ │
│  └──────────────────────┘      │   • Floorplan 3D model  │ │
│           ↓                     │   • Door meshes         │ │
│   Gesture Recognition          │   • Furniture objects   │ │
│   (gestureController.js)       │                         │ │
│           ↓                     └─────────────────────────┘ │
│   ┌─────────────────┐                      ↓                │
│   │  WebSocket/     │←─────────────────────┘                │
│   │  Signal Server  │                                       │
│   └─────────────────┘                                       │
└────────────↓─────────────────────────────────────────────────┘
             │ Real-time Commands
             │ {gesture, position, action}
             ↓
┌─────────────────────────────────────────────────────────────┐
│                  MOBILE DEVICE (Phone in VR Box)             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   VR Stereo View (WebXR + Cardboard Polyfill)       │  │
│  │                                                      │  │
│  │   [Left Eye View]        [Right Eye View]          │  │
│  │   ┌─────────────┐        ┌─────────────┐           │  │
│  │   │  🏠 3D Home │        │  🏠 3D Home │           │  │
│  │   │             │        │             │           │  │
│  │   │  🚪→ Door   │        │  🚪→ Door   │           │  │
│  │   │  🪑 Chairs  │        │  🪑 Chairs  │           │  │
│  │   └─────────────┘        └─────────────┘           │  │
│  │                                                      │  │
│  │   • Device Orientation = Camera Rotation            │  │
│  │   • Walk-in-place = Forward Movement               │  │
│  │   • GPS = Position Correction                       │  │
│  │   • Receives gesture commands from PC               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  QR Code Access: https://[IP]:8000/?vr=auto&model=[ID]     │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: VR Mode Button + QR Code
1. Add "VR Mode" button to viewer UI
2. Generate QR code with URL: `https://[LOCAL_IP]:8000/viewer/?vr=auto&model=[current]`
3. Use QRCode.js library
4. Display QR in modal overlay

### Phase 2: Mobile VR View Integration
1. Copy VR locomotion code from `vr box mode option view.html`
2. Integrate into `viewer/index.html`
3. Auto-detect `?vr=auto` URL parameter → enter VR immediately
4. Implement stereo rendering with WebXR polyfill
5. Add walk-in-place step detection
6. Add GPS position tracking

### Phase 3: Gesture Controller Integration
1. Copy `gestureController.js` to `viewer/Assets/`
2. Initialize MediaPipe HandLandmarker
3. Add webcam preview PIP (picture-in-picture)
4. Implement gesture state machine
5. Add visual feedback (hand cursor, pinch indicator)

### Phase 4: WebSocket Communication
1. Add Socket.IO to server (`server/main.py`)
2. Create gesture command protocol:
   ```json
   {
     "type": "gesture",
     "gesture": "pinch|openPalm|thumbsUp|fist|peace",
     "position": {"x": 0.5, "y": 0.5, "z": 0},
     "action": "doorOpen|furniturePlace|move|rotate|scale",
     "targetId": "door_123"
   }
   ```
3. Mobile VR client subscribes to gesture events
4. Apply actions in real-time

### Phase 5: Door Gesture Control
1. Detect "forward sweep" gesture (hand moves forward with palm open)
2. Raycast from hand position
3. Find nearest door within 3 meters
4. Animate door rotation:
   ```javascript
   door.userData.isOpen = !door.userData.isOpen;
   const targetRotation = door.userData.isOpen ? -Math.PI/2 : 0;
   gsap.to(door.rotation, {y: targetRotation, duration: 0.8});
   ```
5. Add sound effect (door creak)
6. Sync state across all connected clients

### Phase 6: Furniture Placement
1. Copy furniture placement system from `app.js`
2. Adapt for VR environment
3. Modes:
   - **SELECT**: Pinch toolbar slot → spawn furniture at hand position
   - **MOVE**: Pinch + hand movement → drag furniture
   - **ROTATE**: Pinch + horizontal hand movement → rotate
   - **SCALE**: Pinch + vertical hand movement → scale
4. Add collision detection with walls/doors
5. Snap-to-grid option
6. Visual feedback (selection box, placement ghost)

### Phase 7: UI & Polish
1. Add mode indicators in VR view
2. Gesture tutorial overlay (first-time users)
3. Haptic feedback (if supported)
4. Loading states and error handling
5. Performance optimization for mobile
6. Network latency compensation

## Files to Create/Modify

### New Files
- `viewer/Assets/gestureController.js` (copy from reference)
- `viewer/Assets/qrcode.min.js` (QR code library)
- `viewer/Assets/vrLocomotion.js` (walk-in-place + GPS)
- `viewer/Assets/furniturePlacement.js` (VR furniture system)
- `server/gesture_socket.py` (WebSocket handler)

### Modified Files
- `viewer/index.html` (add VR mode, gesture controls, furniture placement)
- `server/main.py` (add Socket.IO routes)
- `viewer/Assets/door.js` (add gesture-controlled animation)

## Gesture Commands Protocol

```javascript
// Door Open
{
  type: 'gesture',
  action: 'door_open',
  handPosition: {x: 0.5, y: 1.6, z: -2.0},
  targetDoorId: 'door_front_entrance',
  gestureType: 'forward_sweep'
}

// Furniture Spawn
{
  type: 'gesture',
  action: 'furniture_spawn',
  furnitureType: 'chair',
  mode: 'SELECT',
  position: {x: 2.0, y: 0, z: -3.0},
  gestureType: 'pinch'
}

// Furniture Transform
{
  type: 'gesture',
  action: 'furniture_transform',
  targetId: 'furniture_chair_001',
  mode: 'ROTATE',
  delta: {rotation: 0.1},
  gestureType: 'pinch_move'
}

// Confirm
{
  type: 'gesture',
  action: 'confirm',
  gestureType: 'thumbs_up'
}
```

## Technical Requirements

### Libraries/Dependencies
- **MediaPipe Tasks Vision** (v0.10.14): Hand tracking AI
- **QRCode.js**: QR code generation
- **WebXR Polyfill**: Cardboard VR support
- **Socket.IO**: Real-time communication
- **GSAP** (optional): Smooth animations

### Browser Compatibility
- **Primary Device**: Chrome/Edge/Firefox desktop (webcam required)
- **Mobile VR**: Chrome/Safari on Android/iOS (HTTPS required for sensors)

### Network Requirements
- HTTPS (for device sensors and camera access)
- Same WiFi network or accessible IP
- Low latency (<100ms for responsive gestures)

### Performance Targets
- **Mobile VR**: 60 FPS minimum (90 FPS ideal)
- **Gesture Recognition**: 30 FPS hand tracking
- **Network Latency**: <50ms command delivery

## Testing Checklist

- [ ] QR code generates correctly
- [ ] Mobile device scans and opens VR view
- [ ] Stereo view renders properly
- [ ] Head tracking works smoothly
- [ ] Walk-in-place detection accurate
- [ ] GPS position syncs (outdoor test)
- [ ] Webcam hand tracking initializes
- [ ] All 5 gestures recognized correctly
- [ ] Door opening gesture works from 1-3 meters
- [ ] Furniture placement in all 4 modes
- [ ] Real-time sync between devices
- [ ] Collision detection prevents furniture overlap
- [ ] Performance remains 60+ FPS on mobile
- [ ] Works with/without internet (local network)
- [ ] Error handling for camera/sensor denied

## Next Steps

1. **Review this plan** - Confirm approach and architecture
2. **Phase 1 Implementation** - Start with QR code + VR button
3. **Test incrementally** - Verify each phase before moving on
4. **Iterate based on testing** - Adjust gesture thresholds, UI, etc.

Would you like me to proceed with Phase 1 implementation?
