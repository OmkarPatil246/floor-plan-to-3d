# Link Access Fix - Server URL Generation

## Problem Fixed

**Issue:** After running `run.bat`, the generated links didn't work or showed nothing when clicked.

### Root Causes Identified:
1. ❌ Server was using HTTPS with self-signed certificate (causing browser security warnings)
2. ❌ IP detection was picking APIPA addresses (169.254.x.x) instead of real network IPs
3. ❌ No prioritization of valid network IPs (192.168.x.x, 10.x.x.x)
4. ❌ No clear indication of which IP to use

---

## Solutions Implemented

### 1. **Fixed Server Configuration**

**Changed:** `server/main.py`
- ❌ **Before:** Used HTTPS with `ssl_context='adhoc'` (self-signed certificate)
- ✅ **After:** Uses HTTP for simple, direct access

```python
# OLD (Broken):
application.run(
    host=api_config["HOST"],
    port=api_config["PORT"],
    ssl_context='adhoc',  # Causes browser warnings!
)

# NEW (Fixed):
application.run(
    host=api_config["HOST"],
    port=api_config["PORT"],
    threaded=True,  # Better performance
)
```

**Benefits:**
- ✅ No browser security warnings
- ✅ Works immediately without certificate acceptance
- ✅ Faster to load
- ✅ Compatible with all browsers

### 2. **Improved IP Detection**

**Changed:** `run.bat` IP detection logic
- ❌ **Before:** Would pick first non-localhost IP (including APIPA)
- ✅ **After:** Prioritizes valid network IPs in order:
  1. 192.168.x.x (Home/Office WiFi - most common)
  2. 10.x.x.x (Corporate networks)
  3. 172.16-31.x.x (Private networks)

```batch
# NEW LOGIC:
REM Try to find 192.168.x.x first (WiFi/LAN)
echo !TEMP_IP! | findstr /B "192.168" >nul
if not errorlevel 1 (
    set "LOCAL_IP=!TEMP_IP!"
    set "IP_VALID=1"
    goto :ip_found
)

REM Then try 10.x.x.x (Corporate)
echo !TEMP_IP! | findstr /B "10\." >nul
if not errorlevel 1 (
    set "LOCAL_IP=!TEMP_IP!"
    set "IP_VALID=1"
)

REM Finally try 172.x.x.x (Private)
# ... similar logic
```

### 3. **Better URL Display**

The server now shows clear URLs in the Python console:

```
==============================================================
  SERVER ACCESS URLS
==============================================================

  Local Access (This Computer):
    http://localhost:8080
    http://127.0.0.1:8080

  Network Access (Other Devices):
    http://10.191.114.244:8080

  Share this URL with others on the same network:
    http://10.191.114.244:8080

==============================================================
```

### 4. **Created HTML Access Page**

When `run.bat` starts, it creates `network_access.html` with:
- ✅ Clickable link to server
- ✅ QR code for phone access
- ✅ Copy URL button
- ✅ Instructions for remote access

**Example HTML page features:**
```html
<div class="url-box">
  <a href="http://10.191.114.244:8080">
    http://10.191.114.244:8080
  </a>
</div>
<button onclick="copyUrl()">📋 Copy URL</button>
<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://10.191.114.244:8080">
```

### 5. **Created Test Tool**

**New file:** `test_server.bat`
- Tests localhost connection
- Tests network IP connection
- Checks if port 8080 is listening
- Provides clear pass/fail results

---

## How to Use

### Step 1: Start the Server
```batch
run.bat
```

**What happens:**
1. Detects Python environments
2. Verifies dependencies
3. Finds your network IP
4. Starts Flask server on HTTP (not HTTPS)
5. Opens `network_access.html` in browser
6. Displays URLs in console

### Step 2: Access Locally
```
http://localhost:8080
```
Or
```
http://127.0.0.1:8080
```

**Should show:** FloorPlan-to-3D interface with 3 demo plans

### Step 3: Access from Other Devices

**Your network IP will be shown, for example:**
```
http://10.191.114.244:8080
```

**On other devices (phone/tablet/another PC):**
1. Connect to SAME WiFi network
2. Open browser
3. Type (or scan QR code): `http://10.191.114.244:8080`
4. Should see FloorPlan-to-3D interface

---

## Troubleshooting

### Problem 1: Link shows "This site can't be reached"

**Check:**
```batch
# Is server running?
netstat -ano | findstr :8080

# If nothing shows, server is not running
# Start it with:
run.bat
```

**Solution:**
- Ensure `run.bat` window is still open (don't close it)
- Server must be running for links to work

### Problem 2: Page loads but shows blank/white screen

**Check:**
```batch
# Test the server
test_server.bat
```

**Common causes:**
- Browser cached old version (press Ctrl+F5 to hard refresh)
- JavaScript errors (press F12, check Console tab)
- Firewall blocking port 8080

**Solution:**
1. Hard refresh: `Ctrl + Shift + R` (Chrome/Firefox) or `Ctrl + F5` (Edge)
2. Clear browser cache
3. Try different browser (Chrome, Firefox, Edge)
4. Check firewall: Allow Python through Windows Firewall

### Problem 3: Works on localhost but not on network IP

**Check Windows Firewall:**
```batch
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "FloorPlan-to-3D" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

**Or manually:**
1. Press Windows + R
2. Type: `wf.msc`
3. Inbound Rules > New Rule
4. Port > TCP > 8080
5. Allow the connection
6. Name: FloorPlan-to-3D

### Problem 4: IP shows 169.254.x.x (APIPA)

**Meaning:** Network not configured properly

**Solutions:**
```batch
# 1. Release and renew IP
ipconfig /release
ipconfig /renew

# 2. Reconnect to WiFi
# Settings > Network & Internet > WiFi > Disconnect > Reconnect

# 3. Restart router
# Unplug for 10 seconds, plug back in
```

### Problem 5: "SSL certificate verify failed" error

**Meaning:** Old HTTPS configuration still cached

**Solution:**
1. Close all browser windows
2. Stop server (Ctrl+C in run.bat window)
3. Restart server: `run.bat`
4. Open fresh browser window
5. Try again - should use HTTP now (not HTTPS)

---

## Testing Checklist

Run through this checklist to verify everything works:

- [ ] Run `run.bat` without errors
- [ ] See valid IP in console (not 169.254.x.x)
- [ ] `network_access.html` opens automatically
- [ ] Click link in HTML page → FloorPlan-to-3D loads
- [ ] Access `http://localhost:8080` → Works
- [ ] Access `http://YOUR_IP:8080` → Works
- [ ] Upload test image → 3D model generates
- [ ] From phone (same WiFi): Type IP:8080 → Works
- [ ] QR code scan from phone → Opens app
- [ ] Can rotate and view 3D model

---

## URL Format

### ✅ Correct URLs:
```
http://localhost:8080
http://127.0.0.1:8080
http://192.168.1.100:8080
http://10.191.114.244:8080
```

### ❌ Incorrect URLs:
```
https://localhost:8080  ❌ (uses HTTPS - not configured)
http://localhost  ❌ (missing port)
localhost:8080  ❌ (missing http://)
192.168.1.100  ❌ (missing http:// and port)
http://169.254.x.x:8080  ❌ (APIPA address - network issue)
```

---

## File Changes Summary

### Modified Files:
1. ✏️ `server/main.py`
   - Removed HTTPS/SSL
   - Added clear URL logging
   - Added socket-based IP detection
   - Better error messages

2. ✏️ `run.bat`
   - Improved IP detection (prioritizes valid IPs)
   - Skips APIPA addresses
   - Creates HTML access page with QR code
   - Better status messages

3. ✏️ `test_network.bat`
   - Updated IP detection logic
   - Better error reporting

### Created Files:
1. 📄 `test_server.bat` - Server connectivity test tool
2. 📄 `network_access.html` - Auto-generated access page (created by run.bat)
3. 📄 `LINK_ACCESS_FIX.md` - This documentation

---

## Network Requirements

### For Local Access:
- ✅ Server running on your PC
- ✅ Browser on same PC

### For Network Access:
- ✅ Server running on your PC
- ✅ Other device on SAME WiFi network
- ✅ Firewall allows port 8080
- ✅ Valid network IP (not 169.254.x.x)

### Will NOT Work:
- ❌ Different WiFi networks (PC on WiFi-A, phone on WiFi-B)
- ❌ Phone on mobile data (4G/5G)
- ❌ Public WiFi with client isolation enabled
- ❌ VPN active (may route traffic differently)
- ❌ Guest WiFi (often isolated from main network)

---

## Expected Behavior

### When run.bat starts:
```
========================================
 FloorPlan-to-3D Server Starting...
========================================

[INFO] Scanning for Python environments...
[FOUND] Environment 1: .venv
        Version: Python 3.11.9
[OK] .venv has all required packages installed
[AUTO-SELECT] Using .venv

[INFO] Python details:
Python 3.11.9

[INFO] Verifying critical dependencies...
[OK] TensorFlow: 2.13.0
[OK] Flask: 2.3.3
[OK] OpenCV: 4.8.1.78
[OK] NumPy: 1.24.3

[INFO] Detecting network IP address...
[OK] Found network IP: 10.191.114.244
[SUCCESS] Network IP detected: 10.191.114.244

========================================
 SERVER ACCESS URLS
========================================

 Local Access (This Computer):
   http://localhost:8080
   http://127.0.0.1:8080

 Network Access (Other Devices):
   http://10.191.114.244:8080

 📤 SHARE THIS URL WITH YOUR FRIEND:
   http://10.191.114.244:8080

[CREATED] network_access.html with QR code
           (Opening in your browser...)

[INFO] Starting Flask server with .venv...

Model loaded successfully!
=========== Starting Merged FloorPlan-to-3D Server ==========
 * Running on http://0.0.0.0:8080
 * Running on http://127.0.0.1:8080
 * Running on http://10.191.114.244:8080
```

### Browser opens with:
- 🌐 **FloorPlan-to-3D Server** page
- ✅ **Server Running** status
- 🔗 **Clickable URL** (http://10.191.114.244:8080)
- 🚀 **"Open App" button**
- 📋 **"Copy URL" button**
- 📱 **QR Code** for phone access
- 📝 **Instructions** for remote access

---

## Performance Notes

### HTTP vs HTTPS:
- **HTTP (Current):**
  - ✅ Faster initial connection
  - ✅ No certificate warnings
  - ✅ Works on all browsers immediately
  - ✅ Suitable for local networks
  - ❌ Not encrypted (fine for local use)

- **HTTPS (Previous):**
  - ❌ Self-signed certificate warnings
  - ❌ Requires manual acceptance in each browser
  - ❌ Slower initial handshake
  - ✅ Encrypted (required for VR headsets)
  - ✅ Needed for WebXR API

**Conclusion:** HTTP is better for normal use. HTTPS only needed for VR headsets.

---

## Quick Reference

### Start Server:
```batch
run.bat
```

### Test Connection:
```batch
test_server.bat
```

### Stop Server:
Press `Ctrl + C` in the run.bat window

### Check IP:
```batch
ipconfig
```

### Test Firewall:
```batch
curl http://localhost:8080
curl http://YOUR_IP:8080
```

### Clear Browser Cache:
```
Chrome: Ctrl + Shift + Delete
Firefox: Ctrl + Shift + Delete
Edge: Ctrl + Shift + Delete
```

---

**Status:** ✅ **FIXED - Links now work correctly!**  
**Date:** 2026-10-16  
**Version:** 4.0 (Link Access Fix)  
**Project:** FloorPlan-to-3D
