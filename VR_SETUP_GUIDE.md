# 🚀 VR Mobile Sharing - Complete Setup Guide

This guide will help you set up the VR mobile sharing feature for the Floor Plan 3D Viewer.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [How to Use](#how-to-use)
5. [Ngrok Setup (Optional)](#ngrok-setup-optional)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js** (v14 or higher)
   - Download: https://nodejs.org/
   - Verify installation: Open terminal and run `node --version`

2. **NPM** (comes with Node.js)
   - Verify: `npm --version`

### Optional (for Remote Access)

3. **Ngrok** (for sharing outside your local network)
   - Download: https://ngrok.com/download
   - Create free account: https://dashboard.ngrok.com/signup

### Hardware Requirements

- **Desktop/Laptop**: Any modern computer with WebGL support
- **Mobile Phone**: iPhone 6+ or Android 5.0+ with gyroscope sensor
- **VR Headset**: Google Cardboard, VR Box, or any similar mobile VR headset

---

## Installation

### Step 1: Install Dependencies

Open terminal/command prompt in the `viewer` directory:

```bash
cd viewer
npm install
```

This will install:
- `express` - Web server
- `ws` - WebSocket library

### Step 2: Verify Installation

Check if files are installed:

```bash
# Windows
dir node_modules

# Mac/Linux
ls node_modules
```

You should see `express` and `ws` folders.

### Step 3: Install Ngrok (Optional)

**Windows:**
1. Download ngrok from https://ngrok.com/download
2. Extract `ngrok.exe` to a folder
3. Add to PATH or copy to `C:\Windows\System32\`
4. Verify: Open cmd and run `ngrok version`

**Mac:**
```bash
brew install ngrok/ngrok/ngrok
```

**Linux:**
```bash
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz -C /usr/local/bin
```

### Step 4: Configure Ngrok (Optional)

If you installed ngrok, add your auth token:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken

---

## Quick Start

### Method 1: Using Batch File (Windows)

1. Double-click `START_VR_SERVER.bat` in the `viewer` folder
2. Server will start automatically
3. Open browser to `http://localhost:3001`

### Method 2: Using Command Line

```bash
cd viewer
npm start
```

### Method 3: Manual Start

```bash
cd viewer
node vr-signaling-server.js
```

### Expected Output

```
╔═══════════════════════════════════════════════════════════╗
║   Floor Plan VR Sharing Server                            ║
╚═══════════════════════════════════════════════════════════╝

🚀 Local server running on http://localhost:3001
🔌 WebSocket: ws://localhost:3001

📊 API Endpoints:
   Health: http://localhost:3001/api/health
   Sessions: http://localhost:3001/api/sessions
   Ngrok URL: http://localhost:3001/api/ngrok-url

🚇 Starting ngrok tunnel...
✅ Ngrok tunnel established: https://abc123.ngrok-free.app

╔═══════════════════════════════════════════════════════════╗
║   🌐 PUBLIC URL (Share this with mobile devices)          ║
╚═══════════════════════════════════════════════════════════╝

   https://abc123.ngrok-free.app

📱 Mobile VR URL will be generated from this base URL

Press Ctrl+C to stop
═══════════════════════════════════════════════════════════
```

---

## How to Use

### Step-by-Step Guide

#### 1. Start the Server

Run the VR server as shown above. Keep the terminal window open.

#### 2. Open the Viewer on Desktop

- Open your browser
- Go to `http://localhost:3001` (or the ngrok URL if using remote access)
- Upload or select a floor plan
- Wait for the 3D model to load

#### 3. Enter Interactive Walk Mode

- Click the **"Walk"** button in the viewer
- Navigate using WASD keys or mouse

#### 4. Click "Enter VR Mode"

- Find the **"Enter VR Mode"** button in the sidebar
- Click it
- A modal will appear with a QR code

#### 5. Connect Your Mobile Device

**Option A: Scan QR Code**
1. Open your phone's camera app
2. Point at the QR code on your computer screen
3. Tap the notification to open the link
4. Your phone's browser will open the VR view

**Option B: Copy Link**
1. Click "📋 Copy" button in the modal
2. Send the link to your phone (WhatsApp, email, etc.)
3. Open the link on your phone

#### 6. Enable Sensors (Mobile)

- When the page loads on your phone, you'll see a permission request
- Tap **"Enable Sensors"** button
- Allow motion sensors when prompted (iOS requires this)

#### 7. Wait for Connection

- On desktop: Wait for "✅ Mobile device connected!" message
- On mobile: Wait for "Connected" status at top
- This usually takes 2-5 seconds

#### 8. Continue to VR

- On desktop: Click **"Continue to VR"** button
- Modal will close, streaming continues in background

#### 9. Put Phone in VR Headset

- Your phone now shows split-screen stereo view
- Insert phone into Google Cardboard or VR headset
- Adjust phone position for best clarity
- The view automatically updates as you move your head

#### 10. Look Around!

- Move your head to look around the 3D space
- The desktop camera will follow your phone's movements
- Navigate on desktop using keyboard/mouse
- Mobile shows the VR view with head tracking

---

## Ngrok Setup (Optional)

Ngrok allows you to share your VR experience with anyone on the internet.

### Why Use Ngrok?

- ✅ Share with friends/clients remotely
- ✅ Works across different WiFi networks
- ✅ Provides HTTPS (required for iOS gyroscope)
- ✅ No router configuration needed
- ✅ Free tier available

### Setup Instructions

#### 1. Create Ngrok Account

1. Go to https://dashboard.ngrok.com/signup
2. Sign up with email or GitHub
3. Verify your email

#### 2. Get Auth Token

1. Go to https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your auth token
3. Run in terminal:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

#### 3. Start Server with Ngrok

The server automatically starts ngrok if it's installed:

```bash
cd viewer
npm start
```

You'll see the public URL in the output:
```
https://abc123.ngrok-free.app
```

#### 4. Share the URL

- Use this URL instead of localhost
- Works from anywhere with internet
- Share with mobile devices anywhere

### Manual Ngrok (Alternative)

If automatic ngrok doesn't work:

**Terminal 1:**
```bash
cd viewer
npm start
```

**Terminal 2:**
```bash
ngrok http 3001
```

Copy the `https://` URL from ngrok output.

---

## Troubleshooting

### Server Won't Start

**Error: "Node.js is not installed"**
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

**Error: "Cannot find module 'express'"**
```bash
cd viewer
npm install
```

**Error: "Port 3001 already in use"**
- Close other applications using port 3001
- Or change port in `vr-signaling-server.js`:
  ```javascript
  const PORT = process.env.PORT || 3002; // Change to 3002
  ```

### QR Code Won't Scan

**Solution 1: Copy Link Manually**
- Click "Copy" button
- Paste in mobile browser

**Solution 2: Increase Brightness**
- Make computer screen brighter
- Try different angles

**Solution 3: Use URL Directly**
- Type the URL manually on phone
- Format: `http://YOUR-IP:3001/vr-mobile.html?session=SESSION-ID`

### Mobile Can't Connect

**Check 1: Same Network**
- Desktop and mobile must be on same WiFi
- Or use ngrok for remote access

**Check 2: Firewall**
- Windows: Allow Node.js through firewall
- Mac: System Preferences → Security → Firewall → Allow Node

**Check 3: Server Running**
- Check terminal - server should be active
- Try http://localhost:3001/api/health in browser

**Check 4: Correct URL**
- Make sure QR code URL is correct
- Check for typos if entering manually

### Gyroscope Not Working

**iOS (iPhone/iPad):**
- Must use HTTPS (ngrok provides this automatically)
- Must tap "Enable Sensors" button
- Safari only (Chrome won't work)

**Android:**
- Usually works without special permissions
- Try Chrome or Firefox

**All Devices:**
- Check if phone has gyroscope:
  - Go to https://www.sensorsdata.net/
  - Look for "Gyroscope" sensor

### Video Lag / Stuttering

**Solution 1: Reduce Quality**
- Edit `vr-integration.js`
- Change `this.quality = 0.5;` (lower = faster)

**Solution 2: Reduce Frame Rate**
- Edit `vr-integration.js`
- Change `this.frameInterval = 1000 / 20;` (20 FPS)

**Solution 3: Better WiFi**
- Move closer to router
- Use 5GHz band if available
- Close other apps using internet

**Solution 4: Reduce 3D Complexity**
- Lower texture quality in viewer settings
- Hide outdoor environment
- Reduce lighting effects

### Black Screen on Mobile

**Wait 5-10 seconds**
- First frame may take time to load

**Check Connection**
- Look for status at top of screen
- Should say "Connected" in green

**Reload Page**
- Swipe down to refresh
- Or close and reopen link

**Check Desktop**
- Make sure 3D scene is visible on desktop
- Try moving camera on desktop

### Distorted VR View

**Adjust Eye Separation**
- Edit `vr-mobile.html`
- Change `const IPD = 64;` to different value (50-80)
- Lower = less 3D depth
- Higher = more 3D depth

**Adjust Barrel Distortion**
- Edit `vr-mobile.html`
- Change `const k = 0.15;` in `applyBarrelDistortion()`
- Match your VR headset's lenses

### Ngrok Issues

**Error: "ngrok not found"**
- Install ngrok (see installation section)
- Make sure it's in PATH

**Error: "authentication failed"**
```bash
ngrok config add-authtoken YOUR_TOKEN
```

**Error: "tunnel session failed"**
- Check internet connection
- Try again in a few minutes
- Free tier has connection limits

**Ngrok URL Changes**
- Free tier gives random URL each time
- Upgrade to paid plan for custom domain
- Or use local network only

---

## Testing Checklist

Before showing to clients/users:

- [ ] Server starts without errors
- [ ] Can access http://localhost:3001 in browser
- [ ] Floor plan loads correctly
- [ ] VR button appears in sidebar
- [ ] Clicking VR button shows QR code
- [ ] QR code can be scanned
- [ ] Mobile page loads
- [ ] "Enable Sensors" button appears
- [ ] Connection status shows "Connected"
- [ ] Video appears on mobile
- [ ] Head tracking works (move phone, view changes)
- [ ] Desktop camera follows mobile movements
- [ ] No lag or stuttering
- [ ] Stereo view looks correct
- [ ] Works in VR headset

---

## Performance Benchmarks

### Expected Performance

**Good Setup:**
- Latency: 50-100ms
- Frame rate: 25-30 FPS
- Connection time: 2-5 seconds

**Acceptable Setup:**
- Latency: 100-200ms
- Frame rate: 15-20 FPS
- Connection time: 5-10 seconds

**Poor Setup (needs improvement):**
- Latency: >200ms
- Frame rate: <15 FPS
- Connection time: >10 seconds

### Hardware Requirements

**Minimum:**
- Desktop: Intel i3 / 4GB RAM / Integrated graphics
- Mobile: iPhone 6 / Android 5.0 / 2GB RAM
- Network: 2.4GHz WiFi / 10 Mbps

**Recommended:**
- Desktop: Intel i5 / 8GB RAM / Dedicated GPU
- Mobile: iPhone 8+ / Android 8.0+ / 3GB RAM
- Network: 5GHz WiFi / 50+ Mbps

---

## Quick Reference

### Important URLs

- **Viewer**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Sessions**: http://localhost:3001/api/sessions
- **Ngrok Status**: http://localhost:4040 (when ngrok is running)

### Important Files

- **Server**: `viewer/vr-signaling-server.js`
- **Integration**: `viewer/vr-integration.js`
- **Mobile View**: `viewer/vr-mobile.html`
- **Start Script**: `viewer/START_VR_SERVER.bat`

### Important Commands

```bash
# Start server
npm start

# Install dependencies
npm install

# Check ngrok
ngrok version

# Test server
curl http://localhost:3001/api/health
```

---

## Next Steps

Once setup is complete:

1. **Test locally** first (same WiFi network)
2. **Test with ngrok** for remote access
3. **Optimize settings** for your hardware
4. **Create presets** for different scenarios
5. **Share with users!**

For detailed usage instructions, see `VR_SHARING_README.md`.

---

## Support

If you need help:
1. Check [Troubleshooting](#troubleshooting) section above
2. Review `VR_SHARING_README.md` for detailed documentation
3. Check browser console (F12) for error messages
4. Check server terminal for error logs

---

**Happy VR Sharing! 🥽✨**
