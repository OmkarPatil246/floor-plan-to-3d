# How to Run FloorPlan-to-3D Server

## Quick Start (Windows)

### Option 1: Double-click `run.bat` (Recommended)
1. Double-click `run.bat` in the project folder
2. The script will automatically detect your network IP
3. URLs will be displayed in the console window
4. Keep the window open while using the application

### Option 2: PowerShell Script (Advanced)
1. Right-click `run.ps1` → **Run with PowerShell**
2. Enhanced network detection with multiple IPs
3. Includes QR code URL for easy mobile access

### Option 3: Manual Start
```cmd
cd "C:\Users\praja\Desktop\Floor Image Processing\floorplan-to-3d"
python server/main.py
```

## Access URLs

After starting the server, you'll see:

```
========================================
 SERVER ACCESS URLS
========================================

 Local Access (This Computer):
   http://localhost:8080
   http://127.0.0.1:8080

 Network Access (Other Devices):
   http://192.168.1.100:8080

 To access from phone/tablet:
   1. Connect device to same WiFi network
   2. Open browser and navigate to:
      http://192.168.1.100:8080

========================================
 Press Ctrl+C to stop the server
========================================
```

## Usage Examples

### On the Same Computer
1. Start server using `run.bat`
2. Open browser and go to: `http://localhost:8080`
3. Upload floorplan image and view 3D model

### From Phone/Tablet
1. Start server on computer using `run.bat`
2. Note the "Network Access" URL (e.g., `http://192.168.1.100:8080`)
3. On your phone/tablet:
   - Connect to **same WiFi** as computer
   - Open browser (Chrome/Safari/Firefox)
   - Enter the network URL
   - Upload and view floorplans

### From Another Computer
1. Start server on main computer
2. On another computer on same network:
   - Open browser
   - Enter the network URL (e.g., `http://192.168.1.100:8080`)
   - Full functionality available

## Features Available

✅ Upload floorplan images (PNG, JPG, JPEG, BMP, TIFF)  
✅ Upload SVG floorplans (automatically converted)  
✅ Real-time 3D model generation  
✅ Interactive 3D viewer with orbit controls  
✅ LED ceiling strips with warm lighting  
✅ Download 3D models (GLB, GLTF, OBJ formats)  
✅ Works on mobile devices  
✅ Multiple users can access simultaneously  

## Stopping the Server

Press `Ctrl+C` in the console window, or simply close the window.

## Troubleshooting

### Cannot access from other devices?
See detailed solutions in `NETWORK_ACCESS_GUIDE.md`

Quick fixes:
1. **Check WiFi**: All devices must be on same network
2. **Firewall**: Allow Python through Windows Firewall
3. **Verify IP**: Run `run.bat` again to see current IP address

### Port 8080 already in use?
Edit `config/settings.py` and change:
```python
PORT = 3000  # Use a different port
```

### Model not loading?
Ensure `weights/maskrcnn_15_epochs.h5` exists (256 MB file)

## Requirements

- ✅ Python 3.11 installed
- ✅ All dependencies installed (`pip install -r requirements.txt`)
- ✅ Model weights file present (`weights/maskrcnn_15_epochs.h5`)
- ✅ Port 8080 available (or change in config)

## Network Architecture

```
Your Computer (Server)          Other Devices
     ┌─────────┐                 ┌──────────┐
     │ Python  │◄───── WiFi ────►│  Browser │
     │ :8080   │                 │  (Phone) │
     └─────────┘                 └──────────┘
         ↑
    localhost                   Network IP
   127.0.0.1:8080            192.168.x.x:8080
```

## What Happens When You Run

1. **Model Loading** (5-10 seconds)
   - Loads Mask R-CNN model with pre-trained weights
   - Initializes TensorFlow and Keras
   
2. **Server Start**
   - Binds to `0.0.0.0:8080` (all network interfaces)
   - Ready to accept connections from any device
   
3. **Request Processing**
   - Image uploaded → Mask R-CNN inference → Polygon extraction → JSON response
   - Frontend renders 3D model using Three.js

## Performance Notes

- **First request**: 3-5 seconds (model warmup)
- **Subsequent requests**: 1-2 seconds
- **Concurrent users**: Supported (requests queued)
- **Max image size**: 2048px (auto-resized)
- **Supported formats**: PNG, JPG, JPEG, BMP, TIFF, WebP, SVG

## Security Notes

⚠️ **Local Network Only**
- Server is accessible to all devices on your network
- No password protection
- Do NOT expose to the internet
- Use on trusted networks only

---

**Ready to go!** Just double-click `run.bat` and start converting floorplans to 3D! 🏠✨
