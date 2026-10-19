# Network Access Troubleshooting Guide

## Your Problem: Friend Can't Access the Server

This guide will help you fix network access issues step by step.

---

## 🔍 Step 1: Run Diagnostics

### Option A: Automated Diagnostics
```batch
test_network.bat
```
This will:
- Check your network configuration
- Detect APIPA issues (169.254.x.x addresses)
- Verify port 8080 availability
- Test firewall status
- Create a shareable HTML page with QR code

### Option B: Manual Check
```batch
ipconfig
```
Look for your IPv4 Address:
- ✅ **GOOD:** `192.168.x.x` or `10.x.x.x`
- ❌ **BAD:** `169.254.x.x` (APIPA - not connected properly)
- ❌ **BAD:** No IP address shown

---

## ⚠️ Common Problem: APIPA Address (169.254.x.x)

### What is APIPA?
- **Automatic Private IP Addressing**
- Windows assigns this when it CAN'T get an IP from your router
- **Result:** Your computer is NOT properly connected to the network
- **Effect:** Only localhost works, NO network access

### Why This Happens:
1. ❌ Not connected to WiFi
2. ❌ WiFi connected but no internet/router communication
3. ❌ DHCP server (router) not responding
4. ❌ Network adapter issues
5. ❌ Ethernet cable unplugged

---

## 🔧 Solutions (Try in Order)

### Solution 1: Reconnect to WiFi
```
1. Click WiFi icon in taskbar
2. Disconnect from current network
3. Wait 5 seconds
4. Reconnect to the same WiFi
5. Wait for connection
6. Run: ipconfig
7. Check if IP changed from 169.254.x.x to 192.168.x.x
```

### Solution 2: Release and Renew IP
```batch
REM Open Command Prompt as Administrator
REM Right-click Start > Terminal (Admin) or Command Prompt (Admin)

ipconfig /release
ipconfig /renew
ipconfig
```

Expected result:
```
IPv4 Address. . . . . . : 192.168.1.XXX
```

### Solution 3: Restart Network Adapter
```
1. Press Windows + X
2. Click "Device Manager"
3. Expand "Network adapters"
4. Right-click your WiFi adapter
5. Select "Disable device"
6. Wait 5 seconds
7. Right-click again > "Enable device"
8. Reconnect to WiFi
```

### Solution 4: Restart Router
```
1. Unplug router power cable
2. Wait 10-15 seconds
3. Plug back in
4. Wait 1-2 minutes for full boot
5. Reconnect computer to WiFi
6. Run: ipconfig /renew
```

### Solution 5: Use Ethernet Instead
```
1. Connect computer directly to router with Ethernet cable
2. Wait 10 seconds
3. Run: ipconfig
4. Check for valid IP (192.168.x.x)
```

### Solution 6: Reset TCP/IP Stack
```batch
REM Open Command Prompt as Administrator

netsh winsock reset
netsh int ip reset
ipconfig /release
ipconfig /renew
ipconfig /flushdns
```

Then restart your computer.

---

## 🔥 Firewall Configuration

Even with a valid IP, Windows Firewall may block connections.

### Check Firewall Status
```batch
netsh advfirewall show allprofiles state
```

### Allow Python Through Firewall

#### Method 1: When Prompted
- First time you run `run.bat`, Windows will show a popup
- ✅ Check **"Private networks"**
- ✅ Click **"Allow access"**

#### Method 2: Manual Rule (Recommended)
```
1. Press Windows + R
2. Type: wf.msc
3. Press Enter
4. Click "Inbound Rules" in left panel
5. Click "New Rule..." in right panel
6. Select "Port" > Next
7. Select TCP, Specific local ports: 8080
8. Click Next
9. Select "Allow the connection"
10. Click Next
11. Check all three: Domain, Private, Public
12. Click Next
13. Name: FloorPlan-to-3D-Server
14. Click Finish
```

#### Method 3: PowerShell (Quick)
```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "FloorPlan-to-3D" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

---

## 📱 Verify Both Devices Are on Same Network

### On Your Computer:
```batch
ipconfig | findstr "IPv4"
```
Note the IP, e.g., `192.168.1.100`

### On Friend's Computer/Phone:
Check WiFi settings:
- WiFi Name must be **EXACTLY** the same
- NOT guest network vs main network
- NOT 2.4GHz vs 5GHz (if separate SSIDs)

### Test Same Network:
On friend's device, ping your computer:
```batch
ping 192.168.1.100
```

Expected result:
```
Reply from 192.168.1.100: bytes=32 time=2ms TTL=128
Reply from 192.168.1.100: bytes=32 time=1ms TTL=128
```

If you see:
```
Request timed out
```
= NOT on same network or firewall blocking

---

## 🌐 Verify Server is Running

### Check Process
```batch
netstat -ano | findstr :8080
```

Expected output:
```
TCP    0.0.0.0:8080    0.0.0.0:0    LISTENING    12345
```

If nothing appears = server not running

### Check Server Logs
Look at the Command Prompt window where you ran `run.bat`:
```
Model loaded successfully!
=========== Starting Merged FloorPlan-to-3D Server ==========
Running on 0.0.0.0:8080
 * Running on http://127.0.0.1:8080
 * Running on http://192.168.1.100:8080
```

This means server is ready!

---

## 📋 Complete Checklist

Before asking friend to connect:

- [ ] Your IP is NOT 169.254.x.x (check with `ipconfig`)
- [ ] Your IP is 192.168.x.x or 10.x.x.x
- [ ] Server is running (`run.bat` window is open)
- [ ] Port 8080 is listening (`netstat -ano | findstr :8080`)
- [ ] Firewall rule created or Python allowed
- [ ] Friend is on SAME WiFi network (check WiFi name)
- [ ] You can access server locally: `http://localhost:8080` works
- [ ] You can access via local IP: `http://192.168.1.100:8080` works
- [ ] Friend can ping your IP: `ping 192.168.1.100` replies

---

## 🎯 Step-by-Step Testing

### Test 1: Local Access (Your Computer)
```
1. Open browser
2. Go to: http://localhost:8080
3. Should see FloorPlan-to-3D interface
```
✅ **Pass** = Server works  
❌ **Fail** = Server not running or crashed

### Test 2: Local IP Access (Your Computer)
```
1. Open browser
2. Go to: http://192.168.1.100:8080 (use YOUR IP)
3. Should see same interface
```
✅ **Pass** = Network stack works  
❌ **Fail** = Firewall or binding issue

### Test 3: Ping Test (Friend's Device)
```
1. Open Command Prompt or Terminal
2. Type: ping 192.168.1.100
3. Should see replies
```
✅ **Pass** = Network connection works  
❌ **Fail** = Different networks or firewall

### Test 4: Browser Access (Friend's Device)
```
1. Open any browser
2. Go to: http://192.168.1.100:8080
3. Should see FloorPlan-to-3D interface
```
✅ **Pass** = Everything works!  
❌ **Fail** = Port blocked or server down

---

## 🚨 Error Messages and Fixes

### "This site can't be reached"
**Cause:** Can't connect to server  
**Fix:**
1. Verify server is running
2. Check firewall
3. Verify same network
4. Try different browser

### "Connection refused"
**Cause:** Port 8080 blocked  
**Fix:**
1. Add firewall rule for port 8080
2. Check antivirus software
3. Verify server is on 0.0.0.0 (not 127.0.0.1)

### "Took too long to respond"
**Cause:** Different networks or router issue  
**Fix:**
1. Verify both on same WiFi
2. Check router settings
3. Try disabling VPN on both devices

### "404 Not Found"
**Cause:** Server running but path wrong  
**Fix:**
1. Use exact URL: `http://192.168.1.100:8080`
2. Don't add /index.html or other paths
3. Make sure port :8080 is included

---

## 🔍 Advanced Diagnostics

### Check Server Binding
Your `config/settings.py` should have:
```python
HOST = '0.0.0.0'  # ← Must be 0.0.0.0, not 127.0.0.1
PORT = 8080
```

### Test with curl (Windows)
```powershell
curl http://192.168.1.100:8080
```

Should return HTML content.

### Check CORS Settings
Your `config/settings.py` should have:
```python
CORS_ORIGINS = "*"  # ← Allows all origins
```

### Network Interface Verification
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress, InterfaceAlias
```

Look for your active adapter with valid IP.

---

## 📱 Mobile-Specific Issues

### iPhone/iPad:
- Disable "Private WiFi Address" in WiFi settings
- Turn off VPN if active
- Clear browser cache
- Try Safari and Chrome

### Android:
- Disable "Randomized MAC address"
- Turn off mobile data (use WiFi only)
- Clear browser cache
- Try Chrome and Firefox

### General Mobile:
- Make sure phone is not on "Guest WiFi"
- Restart phone if issues persist
- Try airplane mode ON, then WiFi ON

---

## 🎓 Understanding the Network Flow

```
[Your Computer]
     ↓
   Python Server (0.0.0.0:8080)
     ↓
   Windows Firewall (must allow port 8080)
     ↓
   Network Adapter (WiFi/Ethernet)
     ↓
   Router (192.168.1.1)
     ↓
   Same Network (192.168.1.x)
     ↓
[Friend's Device] → Browser → http://192.168.1.100:8080
```

Any break in this chain = connection fails

---

## ✅ Success Indicators

You know it's working when:
1. ✅ `run.bat` shows: `Running on http://192.168.1.X:8080`
2. ✅ `network_access.html` opens automatically
3. ✅ QR code displays correctly
4. ✅ You can access locally via IP
5. ✅ Friend can ping your IP
6. ✅ Friend sees the interface in browser
7. ✅ Friend can upload images
8. ✅ 3D models generate successfully

---

## 🆘 Still Not Working?

### Last Resort Options:

#### Option 1: Try Different Port
Edit `config/settings.py`:
```python
PORT = 8081  # or 8082, 8888, 5000
```
Update firewall rule for new port.

#### Option 2: Temporarily Disable Firewall (Testing Only)
```batch
netsh advfirewall set allprofiles state off
```
⚠️ **WARNING:** Only for testing! Re-enable after:
```batch
netsh advfirewall set allprofiles state on
```

#### Option 3: Use Ngrok (Tunnel)
```batch
ngrok http 8080
```
Provides public URL that works anywhere.

#### Option 4: Use Localhost Forwarding
If friend is tech-savvy, they can use SSH tunnel:
```bash
ssh -L 8080:localhost:8080 user@your-ip
```

---

## 📞 Quick Reference Commands

```batch
REM Check IP
ipconfig

REM Release and renew
ipconfig /release
ipconfig /renew

REM Check server is running
netstat -ano | findstr :8080

REM Test from your computer
curl http://localhost:8080

REM Check firewall
netsh advfirewall show allprofiles

REM Add firewall rule
netsh advfirewall firewall add rule name="FloorPlan3D" dir=in action=allow protocol=TCP localport=8080

REM Restart network
ipconfig /release
ipconfig /renew
```

---

## 📊 Diagnostic Checklist for Support

If asking for help, provide this info:

```
1. Your IP address: _____________ (from ipconfig)
2. Friend's IP: _____________ (from their ipconfig)
3. Same WiFi name? Yes / No
4. Can ping work? Yes / No
5. Localhost works? Yes / No
6. Local IP works? Yes / No
7. Firewall rule added? Yes / No
8. Error message: _____________
9. Browser used: _____________
10. Operating systems: _____________
```

---

**Last Updated:** 2026-10-16  
**Version:** 2.0  
**Project:** FloorPlan-to-3D
