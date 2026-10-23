# 🌐 NGROK Setup Guide - Access ArchGen 3D on Your Phone

This guide will help you set up ngrok to access your ArchGen 3D project from your phone.

---

## 📋 What is NGROK?

**ngrok** creates secure public URLs (tunnels) that allow you to access your local server from anywhere, including your phone, even if you're on a different network.

**Benefits:**
- ✅ Access from any device, anywhere
- ✅ HTTPS support (required for VR features)
- ✅ Works even on different WiFi networks
- ✅ Easy to set up and use

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install ngrok

**Option A: Download Manually**
1. Go to: https://ngrok.com/download
2. Download `ngrok.exe` for Windows
3. Extract `ngrok.exe` to your project folder:
   ```
   c:\Users\VIVEK\Desktop\miniprosem5\floor-plan-to-3d\ngrok.exe
   ```

**Option B: Use winget (if available)**
```powershell
winget install ngrok
```

### Step 2: Sign Up for ngrok (Free)

1. Visit: https://dashboard.ngrok.com/signup
2. Create a free account (takes 1 minute)
3. You'll get an **authtoken** - copy it!

### Step 3: Add Your Authtoken

Open Command Prompt in your project folder and run:
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

Replace `YOUR_AUTHTOKEN_HERE` with the token from step 2.

Example:
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl
```

### Step 4: Start the Project with NGROK

**Double-click:** `START_WITH_NGROK.bat`

OR run in Command Prompt:
```bash
START_WITH_NGROK.bat
```

---

## 📱 Using on Your Phone

### After Starting with NGROK:

1. **Wait 15-20 seconds** for all services to start
2. A browser window will open showing **PUBLIC URLS**
3. **Copy the ArchGen 3D UI URL** (looks like: `https://abcd1234.ngrok.app`)
4. **Open that URL on your phone's browser**
5. Login/Register and use the app!

### For VR Mode:

1. Copy the **Main Server URL** (3D Viewer)
2. Open on your phone
3. Click "Enter VR Walk Mode"
4. Tap "Enter VR"
5. Put phone in VR box and enjoy!

---

## 🎯 Quick Start Commands

### Start Everything with NGROK:
```bash
START_WITH_NGROK.bat
```

### Start Without NGROK (Local Only):
```bash
run.bat
```

### View NGROK Dashboard:
```
http://localhost:4040
```

---

## 📊 What Gets Started?

| Service | Port | Purpose |
|---------|------|---------|
| **ArchGen 3D UI** | 5174 | Main React interface |
| **Main Server** | 8080 | 3D Viewer & AI Parser |
| **Recommendation API** | 8000 | AI recommendations |
| **NGROK Tunnels** | Various | Public access to all services |

---

## 🔍 Troubleshooting

### Problem: "ngrok not found"

**Solution 1:** Place `ngrok.exe` in project folder:
```
c:\Users\VIVEK\Desktop\miniprosem5\floor-plan-to-3d\ngrok.exe
```

**Solution 2:** Add ngrok to Windows PATH:
1. Search "Environment Variables" in Windows
2. Edit "Path" variable
3. Add ngrok folder location

### Problem: "Authtoken not configured"

**Solution:**
```bash
ngrok config add-authtoken YOUR_TOKEN
```

Get token from: https://dashboard.ngrok.com/get-started/your-authtoken

### Problem: "Tunnel expired" (after 2 hours)

**Cause:** Free ngrok tunnels expire after 2 hours

**Solutions:**
- Restart `START_WITH_NGROK.bat` to get new URLs
- Upgrade to ngrok paid plan for permanent URLs
- Use local network access instead (see below)

### Problem: Can't access from phone

**Check:**
1. ✅ Phone has internet connection
2. ✅ Using HTTPS URL (not HTTP)
3. ✅ ngrok tunnels are running (check dashboard)
4. ✅ All services started successfully

---

## 🏠 Alternative: Local Network Access (No NGROK)

If you and your phone are on the **same WiFi network**, you don't need ngrok:

1. Run: `run.bat` (without ngrok)
2. Note your PC's IP address (shown in console)
3. On phone, open: `http://YOUR_PC_IP:5174`

**Example:**
```
http://192.168.1.100:5174
```

**Limitations:**
- ❌ Only works on same WiFi
- ❌ HTTP only (VR might not work on some browsers)
- ✅ No 2-hour limit
- ✅ Faster (no tunnel overhead)

---

## 🎨 NGROK Features

### Free Plan:
- ✅ 1 online ngrok agent
- ✅ 4 tunnels per agent
- ✅ 40 connections/minute
- ✅ HTTPS support
- ⏱️ 2-hour session limit

### Paid Plans (Optional):
- 🚀 Permanent URLs
- 🚀 No time limits
- 🚀 Custom domains
- 🚀 More concurrent tunnels

---

## 📝 Advanced Configuration

### Custom Subdomain (Paid Plan):
```bash
ngrok http 8080 --subdomain=myarchgen
```

Results in: `https://myarchgen.ngrok.app`

### Multiple Tunnels at Once:
Create `ngrok.yml`:
```yaml
tunnels:
  archgen-ui:
    proto: http
    addr: 5174
  main-server:
    proto: http
    addr: 8080
  recommendation:
    proto: http
    addr: 8000
```

Start all:
```bash
ngrok start --all
```

---

## 🔒 Security Notes

### Public URLs are Accessible by Anyone!

**Protect your app:**
1. ✅ Use authentication (ArchGen UI has this)
2. ✅ Don't share URLs publicly
3. ✅ Stop ngrok when not in use
4. ✅ Use HTTPS URLs only

**Best Practices:**
- Only share URLs with trusted people
- Stop tunnels when done testing
- Monitor traffic in ngrok dashboard
- Use ngrok's IP restrictions (paid plan)

---

## 🎓 Usage Examples

### Example 1: Testing on Phone

```bash
# On PC:
START_WITH_NGROK.bat

# Wait for URLs to appear
# Copy ArchGen UI URL (e.g., https://abc123.ngrok.app)

# On Phone:
# Open browser → paste URL → use app!
```

### Example 2: VR Mode on Phone

```bash
# On PC:
START_WITH_NGROK.bat

# Copy Main Server URL (e.g., https://def456.ngrok.app)

# On Phone:
# Open URL → Click "Enter VR Walk Mode"
# Tap "Enter VR" → Put in VR box → Enjoy!
```

### Example 3: Show to Client/Friend

```bash
# On PC:
START_WITH_NGROK.bat

# Share ArchGen UI URL with client
# They can access from anywhere!

# When done:
# Close all windows to stop
```

---

## 📞 Getting Help

### View Tunnels:
```
http://localhost:4040
```

### Check ngrok Status:
```bash
ngrok config check
```

### Test a Single Tunnel:
```bash
ngrok http 8080
```

### View ngrok Version:
```bash
ngrok version
```

---

## ⚡ Quick Reference

| Command | Purpose |
|---------|---------|
| `START_WITH_NGROK.bat` | Start everything with public URLs |
| `run.bat` | Start without ngrok (local only) |
| `http://localhost:4040` | View ngrok dashboard |
| `ngrok http 8080` | Create tunnel for port 8080 |
| `ngrok config add-authtoken TOKEN` | Set your authtoken |

---

## 🎉 Ready to Go!

You're all set! Now you can:
- ✅ Access ArchGen 3D from your phone
- ✅ Test VR mode anywhere
- ✅ Share with friends/clients
- ✅ Demo your project remotely

**Run this to start:**
```bash
START_WITH_NGROK.bat
```

Then open the public URL on any device! 🚀

---

**Need Help?** Check:
- NGROK Docs: https://ngrok.com/docs
- Dashboard: https://dashboard.ngrok.com
- Support: support@ngrok.com

---

*Last Updated: 2024*
