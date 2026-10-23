# 📱 Phone Access Guide - FloorPlan-to-3D

## 🚀 Quick Start

### To Run Everything with Public Access:

**Double-click:** `RUN_WITH_PUBLIC_ACCESS.bat`

This single file will:
- ✅ Start Main Server (Port 8080)
- ✅ Start Recommendation Backend (Port 8000)  
- ✅ Start Recommendation Frontend (Port 5173)
- ✅ Create PUBLIC URLs for phone access from anywhere

---

## 📱 How to Access from Your Phone

### Method 1: PUBLIC ACCESS (Works from ANY network/anywhere in the world)

1. **Run** `RUN_WITH_PUBLIC_ACCESS.bat`

2. **Wait** for all services to start (~15-20 seconds)

3. **Open ngrok dashboard** in your browser:
   ```
   http://localhost:4040
   ```

4. **Copy the PUBLIC URL** that looks like:
   ```
   https://xxxx-xx-xx-xxx-xxx.ngrok-free.app
   ```

5. **Send this URL to your phone** (via WhatsApp, Email, etc.)

6. **Open the URL on your phone** - It works from ANYWHERE! 🌍

### Method 2: LOCAL NETWORK (Only works on same WiFi)

1. **Make sure your phone is on the SAME WiFi** as your computer

2. **Look for "Network Access" in the batch file output**
   - It will show something like: `http://192.168.x.x:8080`

3. **Type this URL in your phone's browser**

4. **Bookmark it** for easy access

---

## 🖥️ Windows That Will Open

When you run `RUN_WITH_PUBLIC_ACCESS.bat`, you'll see these windows:

1. **Main Control Window** - Shows all status messages (KEEP OPEN)
2. **Main Server (Port 8080)** - Flask server for floor plan processing
3. **Recommendation Backend (Port 8000)** - AI recommendation API
4. **Recommendation Frontend (Port 5173)** - React UI for recommendations
5. **Ngrok Tunnel #1** - Public URL for Main Server
6. **Ngrok Tunnel #2** - Public URL for Recommendations
7. **Browser Window** - Opens automatically with access links

**⚠️ IMPORTANT: Keep ALL windows open! Don't close them!**

---

## 🌐 URLs You'll Get

### Local URLs (Your Computer Only):
- Main Viewer: `http://localhost:8080`
- Recommendations: `http://localhost:5173`
- Backend API: `http://localhost:8000`

### Network URLs (Same WiFi):
- Main Viewer: `http://192.168.x.x:8080`
- Recommendations: `http://192.168.x.x:5173`

### Public URLs (Anywhere in the World):
- Get from ngrok dashboard: `http://localhost:4040`
- Will look like: `https://xxxx-xx-xx-xxx-xxx.ngrok-free.app`

---

## 📋 Step-by-Step Phone Access

### For Android/iPhone:

1. **Run** `RUN_WITH_PUBLIC_ACCESS.bat` on your computer

2. **Wait** for "ALL SERVICES RUNNING!" message

3. **Open Chrome/Safari** on your phone

4. **Go to** `http://localhost:4040` on your COMPUTER

5. **Copy the ngrok URL** (the green https link)

6. **Paste it in your phone's browser**

7. **Done!** You can now use the app from your phone 🎉

---

## 🔧 Troubleshooting

### Problem: Can't access from phone on same WiFi

**Solution:**
1. Run `viewer\ADD_FIREWALL_RULE.bat` as Administrator
2. This allows Windows Firewall to permit connections
3. Restart the server

### Problem: Ngrok not working

**Solutions:**
- Check if ngrok windows are open
- Visit `http://localhost:4040` to see status
- Free ngrok has connection limits (20 connections/minute)
- Create free account at ngrok.com for better limits

### Problem: "Service not available" on phone

**Solutions:**
- Wait 20-30 seconds for all services to fully start
- Check that all 5-6 windows are still open
- Refresh the page on your phone
- Try the ngrok dashboard to verify URLs

### Problem: URL changes every time

**Explanation:**
- Free ngrok URLs are temporary
- Each time you restart, you get a NEW URL
- To get a permanent URL, sign up free at ngrok.com

---

## 🎯 Usage Tips

### For Best Experience:

1. **Bookmark the URL** on your phone after first access

2. **Use Chrome or Safari** on phone (better WebGL support)

3. **Enable "Desktop Site"** in browser settings for full features

4. **Good internet connection** recommended for 3D models

5. **Keep computer awake** while using from phone

### Features Available on Phone:

✅ Upload floor plans  
✅ View 3D models  
✅ Get AI recommendations  
✅ Rotate and zoom 3D view  
✅ Place 3D furniture/objects (if using viewer)  
✅ VR walk mode (if using VR features)

---

## 📞 Quick Reference Commands

### Start Everything with Public Access:
```
RUN_WITH_PUBLIC_ACCESS.bat
```

### Just Local Access (No public URLs):
```
run.bat
```

### Just Viewer with Public Access:
```
viewer\SETUP_PUBLIC_ACCESS.bat
```

### Check Ngrok Dashboard:
```
http://localhost:4040
```

---

## 🎓 How It Works

1. **Main Server** processes floor plan images using AI
2. **Backend API** generates furniture recommendations
3. **Frontend UI** displays results beautifully
4. **Ngrok** creates secure tunnels to make your local server accessible worldwide
5. Your **phone connects** through the public URL to your computer

---

## ⚡ Pro Tips

### Permanent URL (Free):
1. Sign up at https://ngrok.com
2. Copy your authtoken
3. Run: `viewer\ngrok.exe authtoken YOUR_TOKEN`
4. Get custom subdomain in free plan

### Share with Friends:
- Anyone can use your public URL
- Good for demos and presentations
- Free plan supports multiple users

### Security:
- Ngrok URLs are randomly generated
- Hard to guess
- Close the batch file to stop sharing
- URLs stop working when server stops

---

## 📱 QR Code Access (Coming Soon)

Future versions will generate QR codes for instant phone access!

---

## ✅ Success Checklist

After running `RUN_WITH_PUBLIC_ACCESS.bat`:

- [ ] 5-6 terminal windows opened
- [ ] "ALL SERVICES RUNNING!" message visible
- [ ] Browser opened with access links
- [ ] Ngrok dashboard shows active tunnels
- [ ] Can access http://localhost:8080 on computer
- [ ] Phone can access ngrok URL

If all checked ✅ - You're ready to go! 🎉

---

## 📧 Need Help?

Check the terminal windows for error messages. Most issues are:
- Python environment not set up → Run `COMPLETE_INSTALL.bat`
- Port already in use → Close other programs using ports 8080, 8000, 5173
- Firewall blocking → Run `viewer\ADD_FIREWALL_RULE.bat` as admin

---

**Happy Building! 🏗️📱**
