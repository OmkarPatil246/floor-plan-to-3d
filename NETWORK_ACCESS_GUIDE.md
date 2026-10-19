# Network Access Guide - FloorPlan-to-3D

## Overview
This guide explains how to access your FloorPlan-to-3D server from any device on your local network (phone, tablet, another computer).

---

## Quick Start

### 1. Start the Server
Double-click **`run.bat`** in the project folder.

The script will:
- ✅ Detect both Python environments (`.venv` and `venv`)
- ✅ Check which environment has all dependencies installed
- ✅ Automatically select the best environment OR let you choose
- ✅ Display your network IP address for remote access
- ✅ Start the Flask server on port 8080

### 2. Access URLs

After starting, you'll see:

```
========================================
 SERVER ACCESS URLS
========================================

 Local Access (This Computer):
   http://localhost:8080
   http://127.0.0.1:8080

 Network Access (Other Devices):
   http://192.168.1.100:8080  <-- YOUR NETWORK IP
```

---

## Accessing from Other Devices

### Requirements
1. ✅ All devices must be on the **SAME WiFi network**
2. ✅ Server must be running (run.bat active)
3. ✅ Windows Firewall must allow Python (you'll be prompted)

### Steps

#### From Phone/Tablet (Android/iOS):
1. Connect to the same WiFi as your computer
2. Open any browser (Chrome, Safari, Firefox)
3. Type the network URL: `http://192.168.1.100:8080`
4. Press Enter/Go
5. You should see the FloorPlan-to-3D interface

#### From Another Computer:
1. Connect to the same WiFi network
2. Open any browser
3. Type the network URL: `http://192.168.1.100:8080`
4. Press Enter
5. Upload floorplans and generate 3D models

---

## Troubleshooting

### Problem: Cannot connect from other devices

**Solution 1: Check Firewall**
- When you first run `run.bat`, Windows will ask:
  ```
  Windows Defender Firewall has blocked some features of this app.
  Python
  ```
- Click **"Allow access"** for **Private networks**

**Solution 2: Manually Add Firewall Rule**
1. Open **Windows Firewall with Advanced Security**
2. Click **Inbound Rules** → **New Rule**
3. Select **Port** → Next
4. TCP, Specific local ports: **8080** → Next
5. Allow the connection → Next
6. Check all profiles → Next
7. Name: `FloorPlan-to-3D Server` → Finish

**Solution 3: Check Network Type**
- Make sure your WiFi is set to **Private**, not Public
- Open Settings → Network & Internet → WiFi → Properties
- Change Network profile type to **Private**

### Problem: "Connection refused" or "Unable to connect"

**Possible Causes:**
1. ❌ Server not running on host computer
2. ❌ Different WiFi networks (guest WiFi vs main network)
3. ❌ Firewall blocking port 8080
4. ❌ VPN active on either device
5. ❌ Wrong IP address (IP changed after router restart)

**Solutions:**
- Verify server is running (check command prompt window)
- Restart `run.bat` to get updated IP address
- Disable VPN temporarily
- Check both devices are on same network (same WiFi name)

### Problem: Both environments detected, which to choose?

The script will prompt:
```
========================================
 MULTIPLE ENVIRONMENTS DETECTED
========================================

Please select which Python environment to use:

  1. .venv  - Python 3.11.9
     [Status: Dependencies OK]

  2. venv   - Python 3.11.9
     [Status: Missing dependencies]

Enter your choice (1 or 2):
```

**Recommendation:** Choose the one that says **"Dependencies OK"**

If both say "Dependencies OK", it doesn't matter which you choose - both will work!

### Problem: "Missing dependencies" error

**Solution:**
```batch
REM Activate the environment (choose .venv or venv)
.venv\Scripts\activate

REM Install all dependencies
pip install -r requirements.txt

REM Deactivate
deactivate

REM Run again
run.bat
```

### Problem: Port 8080 already in use

**Solution 1: Find and close the process**
```powershell
# Find what's using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

**Solution 2: Change the port** (modify `config/settings.py`):
```python
PORT = 8081  # Change from 8080 to 8081
```

---

## How It Works

### Server Configuration
The server is configured in `config/settings.py`:
```python
HOST = '0.0.0.0'  # Listen on all network interfaces
PORT = 8080        # Port number
CORS_ORIGINS = "*" # Allow cross-origin requests
```

- **`0.0.0.0`** means the server accepts connections from:
  - localhost (127.0.0.1)
  - Your local network IP (192.168.x.x)
  - Any device on the same network

- **Port 8080** is the communication channel
  - Not secured (no HTTPS) - suitable for local networks only
  - Do NOT expose this to the internet without proper security

### Network Flow
```
[Your Computer]
    ↓
  Python Flask Server (0.0.0.0:8080)
    ↓
  WiFi Router (192.168.1.x network)
    ↓
  [Phone/Tablet/Other PC] → Browser → http://192.168.1.100:8080
```

---

## Security Notes

### ✅ Safe Usage
- ✅ On private home/office WiFi networks
- ✅ Behind a router firewall
- ✅ For personal or team projects

### ⚠️ Not Recommended
- ❌ On public WiFi (coffee shops, airports)
- ❌ Exposing to the internet directly
- ❌ Storing sensitive floorplans without authentication

### 🔒 If You Need Public Access
Consider:
1. **Use HTTPS** (SSL/TLS certificates)
2. **Add authentication** (username/password)
3. **Use a VPN** (Tailscale, WireGuard, ZeroTier)
4. **Cloud deployment** (AWS, Azure, Google Cloud)
5. **Tunnel service** (ngrok, Cloudflare Tunnel)

---

## Advanced: Static IP Configuration

If your IP keeps changing, set a static IP:

### Windows:
1. Open **Settings** → **Network & Internet**
2. Click **WiFi** → **Properties**
3. Scroll to **IP assignment** → **Edit**
4. Change to **Manual**
5. Enable **IPv4**
6. Set:
   - IP address: `192.168.1.100` (choose unused IP)
   - Subnet mask: `255.255.255.0`
   - Gateway: `192.168.1.1` (your router IP)
   - DNS: `8.8.8.8` (Google DNS)
7. Save

Now your server will always be at the same IP!

---

## Testing Checklist

Before accessing from other devices, verify:

- [ ] Server is running (command prompt shows logs)
- [ ] Local access works: `http://localhost:8080` ✅
- [ ] Network access works from same PC: `http://192.168.1.100:8080` ✅
- [ ] Python allowed through firewall ✅
- [ ] Other device on same WiFi network ✅
- [ ] Browser on other device: `http://192.168.1.100:8080` ✅

---

## Example Session

```
C:\...\floorplan-to-3d> run.bat

========================================
 FloorPlan-to-3D Server Starting...
========================================

[INFO] Scanning for Python environments...

[FOUND] Environment 1: .venv
        Location: C:\Users\praja\...\floorplan-to-3d\.venv
        Version:  Python 3.11.9

[FOUND] Environment 2: venv
        Location: C:\Users\praja\...\floorplan-to-3d\venv
        Version:  Python 3.11.9

[INFO] Checking installed dependencies...

[CHECK] Checking .venv for TensorFlow and Flask...
[OK] .venv has all required packages installed

[CHECK] Checking venv for TensorFlow and Flask...
[WARNING] venv is MISSING some required packages

[AUTO-SELECT] Using .venv (has all dependencies installed)

========================================
 SELECTED ENVIRONMENT: .venv
========================================

[INFO] Python details:
Python 3.11.9
        Path: C:\Users\praja\...\floorplan-to-3d\.venv\Scripts\python.exe

[INFO] Verifying critical dependencies...
[OK] TensorFlow: 2.13.0
[OK] Flask: 2.3.3
[OK] OpenCV: 4.8.1.78
[OK] NumPy: 1.24.3

========================================
 SERVER ACCESS URLS
========================================

 Local Access (This Computer):
   http://localhost:8080
   http://127.0.0.1:8080

 Network Access (Other Devices):
   http://192.168.1.100:8080

 INSTRUCTIONS FOR REMOTE ACCESS:
 --------------------------------
 1. Ensure other devices are on SAME WiFi
 2. Open browser on phone/tablet/PC
 3. Enter URL: http://192.168.1.100:8080

 FIREWALL: Allow Python when prompted

========================================
 Press Ctrl+C to stop the server
========================================

[INFO] Starting Flask server with .venv...

Starting model initialization …
Initializing Mask R-CNN model …
Model loaded successfully!  weights=weights/maskrcnn_15_epochs.h5
=========== Starting Merged FloorPlan-to-3D Server ==========
Running on 0.0.0.0:8080
 * Serving Flask app 'main'
 * Running on http://0.0.0.0:8080
 * Running on http://127.0.0.1:8080
 * Running on http://192.168.1.100:8080
```

**Server is ready!** 🎉

---

## FAQ

**Q: Can I use this on mobile data / cellular network?**
A: No, you need WiFi. Both devices must be on the same local network.

**Q: Will this work if my phone is on 4G/5G?**
A: No, mobile data is a different network. Connect to WiFi first.

**Q: How do I know my IP address changed?**
A: Restart `run.bat` - it always shows the current IP address.

**Q: Can I access this from outside my home?**
A: Not by default. You need port forwarding or a VPN. Not recommended for security reasons.

**Q: Does this use the internet?**
A: No! Everything runs locally. No data leaves your network. The model runs on your computer's CPU/GPU.

**Q: What if I don't have WiFi, only Ethernet?**
A: It still works! The server uses your network IP regardless of connection type (WiFi or Ethernet).

---

## Support

If you encounter issues not covered here:
1. Check Windows Firewall settings
2. Verify both devices are on the same network
3. Try pinging the server IP from the client device
4. Restart the router if IP detection fails
5. Check antivirus software (may block Python)

---

**Last Updated:** 2026-10-16
**Project:** FloorPlan-to-3D
**Version:** 1.0
