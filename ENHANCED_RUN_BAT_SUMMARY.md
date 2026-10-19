# Enhanced run.bat - Summary

## What Changed

The `run.bat` file has been completely rewritten to provide intelligent Python environment detection and network access support.

---

## Key Features

### 1. **Dual Environment Detection**
- Detects both `.venv` and `venv` folders
- Shows Python version for each environment
- Displays location paths

### 2. **Dependency Verification**
- Automatically checks if TensorFlow, Flask, OpenCV, NumPy, and Pillow are installed
- Shows status for each environment:
  - ✅ "Dependencies OK" - Ready to use
  - ⚠️ "Missing dependencies" - Needs `pip install`

### 3. **Smart Environment Selection**

**Auto-Selection Logic:**
```
If only one environment exists:
  → Use that environment

If both exist:
  → Prioritize the one with all dependencies installed
  
If both have dependencies (or both don't):
  → Let user choose interactively
```

**Interactive Selection:**
```
========================================
 MULTIPLE ENVIRONMENTS DETECTED
========================================

Please select which Python environment to use:

  1. .venv  - Python 3.11.9
     [Status: Dependencies OK]

  2. venv   - Python 3.11.9
     [Status: Missing dependencies]

Enter your choice (1 or 2): _
```

### 4. **Network Access Support**

**Local IP Detection:**
- Automatically detects your computer's network IP address
- Filters out localhost (127.0.0.1)
- Shows multiple access URLs

**Display Example:**
```
========================================
 SERVER ACCESS URLS
========================================

 Local Access (This Computer):
   http://localhost:8080
   http://127.0.0.1:8080

 Network Access (Other Devices):
   http://192.168.1.100:8080
```

### 5. **Comprehensive Validation**

Before starting the server, the script checks:
- ✅ Python environment exists
- ✅ Python executable is functional
- ✅ Core dependencies are installed (TensorFlow, Flask, OpenCV, NumPy)
- ✅ Model weights file exists (`weights/maskrcnn_15_epochs.h5`)
- ✅ Network IP is detected

### 6. **Detailed Error Handling**

**If server fails to start:**
```
========================================
[ERROR] Server failed to start!
========================================

Common issues:
  - Port 8080 already in use
  - Missing dependencies
  - Model weights not found
  - Python version incompatible

To install dependencies in .venv:
  .venv\Scripts\activate
  pip install -r requirements.txt
```

### 7. **Status Indicators**

The script uses clear status prefixes:
- `[INFO]` - Informational message
- `[OK]` - Success
- `[FOUND]` - Detection result
- `[CHECK]` - Verification in progress
- `[WARNING]` - Non-critical issue
- `[ERROR]` - Critical failure
- `[AUTO-SELECT]` - Automatic decision made
- `[SELECTED]` - User's choice confirmed

---

## How It Works

### Step-by-Step Execution

```
1. Scan for Python Environments
   ↓
2. Check Dependencies in Each
   ↓
3. Select Best Environment (or ask user)
   ↓
4. Verify Python Works
   ↓
5. Verify Core Dependencies
   ↓
6. Check Model Weights
   ↓
7. Detect Network IP Address
   ↓
8. Display Access URLs
   ↓
9. Start Flask Server
   ↓
10. Handle Exit/Errors
```

---

## Usage Examples

### Scenario 1: Only `.venv` exists with dependencies
```batch
C:\...\floorplan-to-3d> run.bat

[INFO] Scanning for Python environments...

[FOUND] Environment 1: .venv
        Version: Python 3.11.9

[OK] .venv has all required packages installed

[AUTO-SELECT] Using .venv (only environment found)

... server starts automatically ...
```

### Scenario 2: Both exist, `.venv` has dependencies
```batch
[FOUND] Environment 1: .venv
[OK] .venv has all required packages installed

[FOUND] Environment 2: venv
[WARNING] venv is MISSING some required packages

[AUTO-SELECT] Using .venv (has all dependencies installed)

... server starts automatically ...
```

### Scenario 3: Both exist, both have dependencies
```batch
[FOUND] Environment 1: .venv
[OK] .venv has all required packages installed

[FOUND] Environment 2: venv
[OK] venv has all required packages installed

========================================
 MULTIPLE ENVIRONMENTS DETECTED
========================================

Please select which Python environment to use:

  1. .venv  - Python 3.11.9
     [Status: Dependencies OK]

  2. venv   - Python 3.11.9
     [Status: Dependencies OK]

Enter your choice (1 or 2): 1

[SELECTED] Using .venv

... server starts ...
```

### Scenario 4: Environment exists but missing dependencies
```batch
[FOUND] Environment 1: .venv
[WARNING] .venv is MISSING some required packages

[AUTO-SELECT] Using .venv (only environment found)

[INFO] Verifying critical dependencies...
[ERROR] TensorFlow not found!
[ERROR] Flask not found!
[OK] OpenCV: 4.8.1.78
[OK] NumPy: 1.24.3

... server may fail to start ...

To install dependencies in .venv:
  .venv\Scripts\activate
  pip install -r requirements.txt
```

---

## Configuration

### Server Host and Port
Configured in `config/settings.py`:
```python
HOST = '0.0.0.0'  # Accept connections from any network interface
PORT = 8080       # Server port
```

### Why `0.0.0.0`?
- `127.0.0.1` (localhost) → Only this computer can connect
- `0.0.0.0` → Any device on the network can connect
- This allows phones, tablets, and other PCs to access the server

---

## Network Access Requirements

### Same Network
✅ **Required:** All devices must be on the SAME WiFi network
- Home WiFi: `MyHomeWiFi`
- Office WiFi: `CompanyNet`

❌ **Won't work:**
- Computer on WiFi, phone on mobile data (4G/5G)
- Computer on `WiFi-5GHz`, phone on `WiFi-2.4GHz` (if separate networks)
- Computer on `MainWiFi`, phone on `GuestWiFi`

### Firewall
Windows Firewall must allow Python to accept incoming connections:
1. First time running, you'll see a popup
2. Check **"Private networks"**
3. Click **"Allow access"**

### Browser Compatibility
✅ Works on all modern browsers:
- Chrome (mobile & desktop)
- Safari (iOS & macOS)
- Firefox
- Edge
- Samsung Internet
- Opera

---

## Troubleshooting

### Problem: Can't detect IP address
**Symptom:**
```
Network Access (Other Devices):
  http://Unable to detect:8080
```

**Solution:**
```batch
REM Check your IP manually
ipconfig

REM Look for IPv4 Address under your active adapter
REM Example: 192.168.1.100

REM Use that IP in your browser
```

### Problem: Connection refused from phone
**Possible Causes:**
1. Firewall blocking Python
2. Different WiFi networks
3. Server not running
4. Wrong IP address

**Solutions:**
1. Allow Python through Windows Firewall
2. Verify same WiFi network (check WiFi name on both devices)
3. Ensure `run.bat` is still running (don't close the window)
4. Restart `run.bat` to refresh IP address

### Problem: Port 8080 already in use
**Symptom:**
```
[ERROR] Server failed to start!
```

**Solution:**
```powershell
# Find what's using port 8080
netstat -ano | findstr :8080

# Kill that process (replace PID)
taskkill /PID <PID> /F

# Or change the port in config/settings.py
PORT = 8081
```

---

## Testing

### Local Testing
1. Start server: `run.bat`
2. Open browser: `http://localhost:8080`
3. Should see the FloorPlan-to-3D interface ✅

### Network Testing (Same Computer)
1. Note your IP: e.g., `192.168.1.100`
2. Open browser: `http://192.168.1.100:8080`
3. Should see the same interface ✅

### Remote Device Testing
1. Connect phone/tablet to same WiFi
2. Open browser on device
3. Enter: `http://192.168.1.100:8080` (use your actual IP)
4. Should see the interface ✅
5. Upload a floorplan image
6. Generate 3D model
7. Download GLB/GLTF/OBJ ✅

---

## Security Considerations

### Safe for Local Networks
✅ Home WiFi
✅ Private office network
✅ Personal hotspot

### Not Safe for Public Networks
❌ Coffee shop WiFi
❌ Airport WiFi
❌ Public hotspots

### Why?
- No HTTPS (unencrypted)
- No authentication (anyone can access)
- No access control
- Suitable ONLY for trusted local networks

### Making it Secure
If you need public access, consider:
1. Add HTTPS (SSL/TLS)
2. Implement authentication (login system)
3. Use VPN (Tailscale, WireGuard)
4. Deploy to cloud with proper security (AWS, Azure, GCP)

---

## Benefits of This Enhancement

### Before (Old run.bat)
```batch
@echo off
cd /d "%~dp0"
python server/main.py
pause
```

❌ No environment detection
❌ No dependency checking
❌ No network access info
❌ Silent failures
❌ Manual troubleshooting

### After (New run.bat)
```batch
@echo off
setlocal enabledelayedexpansion
... 200+ lines of intelligent setup ...
```

✅ Automatic environment detection (.venv + venv)
✅ Dependency verification
✅ Smart environment selection
✅ Network IP detection and display
✅ Comprehensive error messages
✅ Firewall instructions
✅ Model weights verification
✅ Python version display
✅ Clear status indicators
✅ Helpful troubleshooting hints

---

## Files Modified/Created

### Modified
- ✏️ `run.bat` - Complete rewrite (200+ lines)

### Created
- 📄 `NETWORK_ACCESS_GUIDE.md` - Complete network access documentation
- 📄 `ENHANCED_RUN_BAT_SUMMARY.md` - This file

### Unchanged
- ✅ `config/settings.py` - Already configured with `HOST = '0.0.0.0'`
- ✅ `server/main.py` - Already supports Flask with CORS
- ✅ All Python code - No changes needed

---

## Batch File Technical Details

### Key Technologies Used

**1. Delayed Expansion**
```batch
setlocal enabledelayedexpansion
set "VAR=value"
echo !VAR!  REM Uses delayed expansion
```
Allows variables to be updated and read within loops and conditionals.

**2. Error Level Checking**
```batch
command 2>nul
if !errorlevel! equ 0 (
    echo Success
) else (
    echo Failed
)
```

**3. For Loop for Command Output**
```batch
for /f "delims=" %%v in ('python --version 2^>^&1') do set "VERSION=%%v"
```
Captures command output into a variable.

**4. String Operations**
```batch
REM Trim leading spaces
for /f "tokens=* delims= " %%a in ("!VAR!") do set "VAR=%%a"
```

**5. Conditional Jumps**
```batch
goto :label
:label
echo Jumped here
```

**6. Interactive User Input**
```batch
choice /c 12 /n /m "Enter your choice (1 or 2): "
if errorlevel 2 (
    echo User chose 2
) else (
    echo User chose 1
)
```

---

## Performance Impact

### Startup Time
- Detection + Verification: ~2-3 seconds
- Model Loading: ~5-10 seconds (unchanged)
- Total: ~7-13 seconds

The additional checks add minimal overhead but provide significant value in preventing startup failures.

---

## Future Enhancements

Possible improvements:
1. ⭐ Save user's environment preference
2. ⭐ Auto-install missing dependencies (with confirmation)
3. ⭐ Check for Python 3.11 specifically
4. ⭐ Port availability check before starting
5. ⭐ Log server output to file
6. ⭐ QR code generation for mobile access (display QR of URL)
7. ⭐ Auto-open browser after startup
8. ⭐ Service mode (run as Windows service)

---

## Conclusion

The enhanced `run.bat` provides a professional, user-friendly startup experience:

✅ Zero-configuration network access
✅ Intelligent environment detection
✅ Automatic dependency verification
✅ Clear, actionable error messages
✅ Support for dual Python environments
✅ Comprehensive troubleshooting guidance

**Result:** Users can now easily access the FloorPlan-to-3D application from any device on their network with minimal setup!

---

**Author:** Kiro AI Assistant  
**Date:** 2026-10-16  
**Project:** FloorPlan-to-3D  
**Version:** 2.0 (Enhanced Network Access)
