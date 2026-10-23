# 🚀 ArchGen 3D - Simple Startup Guide

## Quick Start (3 Simple Steps!)

### 1️⃣ **START Everything**
```
Double-click: START_ALL_SERVICES.bat
```
This single file starts ALL services automatically:
- ✅ Main Server (Port 8080)
- ✅ ArchGen UI (Port 5173)
- ✅ Recommendation Backend (Port 8000)
- ✅ Recommendation Frontend (Port 5176)
- ✅ Ngrok Public URL for phone access

### 2️⃣ **GET Your Phone URL**
After starting, the script will:
- Open a webpage (`PHONE_ACCESS.html`) with your public URL
- Show the URL in the terminal window
- Open ngrok dashboard at `http://localhost:4040`

**Copy the public URL** (looks like: `https://xxxxx.ngrok-free.dev`)

### 3️⃣ **USE On Your Phone**
- Open the public URL on your phone's browser
- Upload a floor plan
- View in 3D
- Try VR mode!

---

## 🛑 Stop Everything

When you're done:
```
Double-click: STOP_ALL_SERVICES.bat
```
This cleanly stops ALL services.

---

## 📊 Port Configuration (No Conflicts!)

| Service | Port | Purpose |
|---------|------|---------|
| **ArchGen UI** | 5173 | Main web interface |
| **Main Server** | 8080 | 3D Viewer & Upload |
| **Recommendation UI** | 5176 | AI Suggestions display |
| **Recommendation API** | 8000 | AI Backend |
| **Ngrok** | 4040 | Dashboard (internal) |

**Important:** Recommendation UI runs on port **5176** (NOT 5173) to avoid conflict with ArchGen UI!

---

## 🌐 Access URLs

### For Phone (Anywhere with Internet):
```
https://xxxxx.ngrok-free.dev
```
Get this URL from:
- The startup terminal window
- `PHONE_ACCESS.html` (opens automatically)
- Ngrok dashboard: `http://localhost:4040`

### For Computer/Same WiFi:
```
ArchGen UI:        http://localhost:5173
Main Viewer:       http://localhost:8080
Recommendation:    http://localhost:5176
API:               http://localhost:8000
```

### On Same WiFi Network (from other devices):
Replace `localhost` with your computer's IP (e.g., `10.141.113.231`)

---

## 🔧 What Each File Does

### Main Files:
- **START_ALL_SERVICES.bat** ⭐ - Run this to start everything
- **STOP_ALL_SERVICES.bat** - Run this to stop everything
- **PHONE_ACCESS.html** - Opens automatically, shows all URLs with copy buttons

### Old Files (Not Needed):
- `START_WITH_NGROK.bat` - Old version, use `START_ALL_SERVICES.bat` instead
- `RUN_WITH_PUBLIC_ACCESS.bat` - Old version, use `START_ALL_SERVICES.bat` instead

---

## 🎯 Usage Flow

1. **Start services** → `START_ALL_SERVICES.bat`
2. **Open on phone** → Use public URL
3. **Upload floor plan** → On main viewer page
4. **View 3D model** → Automatically generated
5. **Get AI suggestions** → Click "Get AI Recommendations"
6. **Try VR mode** → Click "Enter VR Walk Mode"
7. **Stop when done** → `STOP_ALL_SERVICES.bat`

---

## 🐛 Troubleshooting

### Services Won't Start?
1. Check if ports are already in use
2. Run `STOP_ALL_SERVICES.bat` first
3. Then run `START_ALL_SERVICES.bat` again

### Can't Access from Phone?
1. Make sure ngrok is running (check terminal window)
2. Open `http://localhost:4040` to see public URL
3. Copy the HTTPS URL (not HTTP)

### Recommendation UI Not Working?
- It runs on port **5176** (not 5173)
- Check: `http://localhost:5176`
- Make sure the service window is still open

### Terminal Windows Keep Closing?
- Don't close the terminal windows manually
- Use `STOP_ALL_SERVICES.bat` instead

---

## ✅ Features & Fixes

### What's Fixed:
- ✅ VR ceiling view bug (now shows proper interior at 1.6m eye height)
- ✅ Black screen errors (removed duplicate code)
- ✅ Port conflicts (all services on different ports)
- ✅ Navigation routing (AI recommendations work correctly)
- ✅ Simple one-click startup

### What Works:
- ✅ Floor plan upload
- ✅ 3D model generation
- ✅ AI recommendations
- ✅ VR walk mode
- ✅ Phone access via ngrok
- ✅ Local network access
- ✅ Touch controls in VR
- ✅ Wall collision detection

---

## 📱 Phone Access Notes

- **Public URL works from ANYWHERE** (home, work, coffee shop, etc.)
- **Local URLs only work on SAME WiFi** network
- **Ngrok free plan** may timeout after 2 hours
- **HTTPS URLs** work best for VR mode
- **Keep terminal windows open** while using

---

## 🎮 VR Mode Tips

1. Upload a floor plan first
2. Wait for 3D model to load
3. Click "Enter VR Walk Mode"
4. Use touch controls to move around
5. Camera is at realistic eye height (1.6m)
6. Walls have collision detection

---

## 💡 Pro Tips

1. **Bookmark the public URL** on your phone for easy access
2. **Use HTTPS URL** (ngrok provides this automatically)
3. **Keep all terminal windows open** - closing them stops services
4. **Check ngrok dashboard** (`localhost:4040`) to see traffic and URL
5. **Use STOP script** to cleanly shut down everything

---

## 📞 Quick Reference

**Start:** `START_ALL_SERVICES.bat`  
**Stop:** `STOP_ALL_SERVICES.bat`  
**Phone URLs:** Open `PHONE_ACCESS.html`  
**Ngrok Dashboard:** `http://localhost:4040`  
**Main Viewer:** `http://localhost:8080`  

---

That's it! Just run `START_ALL_SERVICES.bat` and you're ready to go! 🎉
