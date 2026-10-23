# ArchGen 3D - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Python 3.8+ with virtual environment
- Node.js 16+ and npm
- TensorFlow installed in virtual environment
- All dependencies installed

### Starting the System

#### Option 1: One-Click Start (Recommended)
```batch
run.bat
```
This starts all services automatically:
- Main Backend (Port 8080)
- Recommendation API (Port 8000)
- ArchGen 3D UI (Port 5173) ⭐ **Main Interface**

Wait 15 seconds for all services to start, then:
- **Access the system**: `http://localhost:5173`
- System access page opens automatically in browser

#### Option 2: Start Individual Services

**Backend Only:**
```batch
cd server
python main.py
```

**ArchGen UI Only:**
```batch
cd archgenui
START_ARCHGENUI.bat
```

## 📋 User Workflow

### Step 1: Open ArchGen 3D UI
Navigate to: `http://localhost:5173`

### Step 2: Create Account or Login
- **Register**: Click "Login" → Switch to "Register" tab
  - Fill in your details (name, email, password, etc.)
  - Click "Create Account"
  
- **Login with Email**: 
  - Enter email and password
  - Click "Sign In"
  
- **Login with Google**: 
  - Click "Continue with Google"
  - Select your Google account

### Step 3: Navigate to AI Parser
After logging in:
1. Click "AI Parse" in the navigation menu
2. **You will be automatically redirected** to `http://localhost:8080`
3. This is the actual floor plan processing interface

### Step 4: Upload Floor Plan
On the backend interface:
1. Click "Upload Image" or drag & drop your floor plan
2. Supported formats: PNG, JPG, JPEG, WebP
3. Wait for processing (AI detection takes 10-30 seconds)

### Step 5: View 3D Model
1. After processing, your 3D model appears
2. Use mouse to rotate, zoom, and explore
3. Click "Get AI Recommendations" for design suggestions

### Step 6: Get Recommendations
1. The recommendation system analyzes your floor plan
2. View AI-generated suggestions for improvements
3. Get detailed room-by-room analysis

## 🎯 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **ArchGen UI** | `http://localhost:5173` | Main interface - **Start here** |
| Backend API | `http://localhost:8080` | AI processing & 3D viewer |
| Recommendation | `http://localhost:8000` | AI recommendation engine |

## 🔐 Authentication Features

### Available on ArchGen UI (localhost:5173)

#### Public Pages (No Login Required)
- **Home** (`/`) - Hero animation and feature overview
- **AR/VR** (`/ar-vr`) - AR/VR features showcase
- **About** (`/about`) - Mission and technology
- **Contact** (`/contact`) - Contact form

#### Protected Pages (Login Required)
- **AI Parse** (`/ai-parse`) - Redirects to backend processor
- **Profile** (`/profile`) - User profile management

### Firebase Authentication
- Email/Password registration and login
- Google Sign-In integration
- Password reset via email
- Profile data stored in Firebase Realtime Database

## ⚙️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  User Browser                                               │
│  http://localhost:5173 (ArchGen 3D UI)                     │
│  ↓                                                          │
│  Login/Register → Navigate to "AI Parse"                   │
│  ↓                                                          │
│  AUTO-REDIRECT to http://localhost:8080                    │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend Server (Port 8080)                                 │
│  - Upload floor plan image                                  │
│  - AI processes with Mask R-CNN                             │
│  - Generates 3D model                                       │
│  - Displays in Three.js viewer                              │
│  ↓                                                          │
│  Click "Get AI Recommendations"                             │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│  Recommendation API (Port 8000)                             │
│  - Analyzes floor plan structure                            │
│  - Generates AI recommendations                             │
│  - Returns suggestions to viewer                            │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Troubleshooting

### "Port already in use" Error
**Problem**: Port 5173, 8080, or 8000 is already in use

**Solutions**:
```batch
# Find process using port
netstat -ano | findstr :5173
netstat -ano | findstr :8080
netstat -ano | findstr :8000

# Kill process by PID
taskkill /F /PID <process_id>
```

### ArchGen UI won't load
**Check**:
1. Node.js is installed: `node --version`
2. Dependencies installed: `cd archgenui && npm install`
3. Port 5173 is free
4. Check browser console for errors

### Backend won't start
**Check**:
1. Virtual environment is activated
2. TensorFlow is installed: `python -c "import tensorflow"`
3. Model weights exist: `weights/maskrcnn_15_epochs.h5`
4. Port 8080 is free

### Auto-redirect not working
**Check**:
1. User is logged in (check navbar shows profile picture/initials)
2. Backend is running on port 8080
3. Browser allows redirects (not blocked by popup blocker)
4. Check browser console for JavaScript errors

### Firebase authentication errors
**Check**:
1. Internet connection is active
2. Firebase project is active and configured
3. Check `archgenui/src/firebase.js` configuration
4. Browser console shows specific Firebase error code

## 📊 Feature Checklist

### ArchGen UI Features
- ✅ User registration (email/password)
- ✅ User login (email/password)
- ✅ Google Sign-In
- ✅ Password reset
- ✅ Profile management
- ✅ Protected routes (authentication required)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Modern UI with animations

### Backend Features
- ✅ Floor plan upload
- ✅ AI-powered wall detection (Mask R-CNN)
- ✅ Door and window detection
- ✅ 3D model generation
- ✅ Interactive 3D viewer (Three.js)
- ✅ VR mode support
- ✅ Network access (QR code for mobile devices)

### Recommendation Features
- ✅ Room type classification
- ✅ Area calculations
- ✅ Natural lighting analysis
- ✅ Ventilation assessment
- ✅ Space utilization suggestions
- ✅ AI-generated recommendations
- ✅ Conversational Q&A

## 🔄 Integration Flow Summary

### What Changed
1. **AIParsePage.jsx** - Now auto-redirects to backend
2. **run.bat** - Starts ArchGen UI as main interface
3. **Startup order** - ArchGen UI listed as primary entry point

### What Stayed the Same
- Backend processing logic (unchanged)
- AI models and detection (unchanged)
- Recommendation engine (unchanged)
- 3D viewer functionality (unchanged)
- Firebase configuration (unchanged)

### Integration Method
- **Loose coupling**: ArchGen UI and backend are separate services
- **Navigation-based**: Uses browser redirect, not API calls
- **Authentication-gated**: Users must login to access AI Parse
- **Minimal changes**: Backend code completely unchanged

## 🎓 Best Practices

### For Development
1. Always start backend before testing AI Parse
2. Keep all terminal windows open while testing
3. Check console logs for debugging
4. Use network URLs for testing on mobile devices

### For Production
1. Consider embedding backend in iframe instead of redirect
2. Implement backend API integration for tighter coupling
3. Store processing results in Firebase for history
4. Add WebSocket support for real-time progress updates
5. Deploy with HTTPS for security

## 📞 Need Help?

### Common Issues
1. **Authentication not working**: Check Firebase console
2. **Redirect fails**: Verify backend is running on 8080
3. **Upload fails**: Check file size and format
4. **3D model issues**: Check browser console and backend logs

### Debug Mode
Enable detailed logging:
```javascript
// In browser console
localStorage.setItem('debug', 'true')
```

### Logs Location
- **Backend**: Terminal window running `python main.py`
- **Frontend**: Browser Developer Tools → Console
- **Network**: Browser Developer Tools → Network tab

## 🎉 Success Indicators

System is working correctly when:
- ✅ `run.bat` starts all services without errors
- ✅ ArchGen UI loads at localhost:5173
- ✅ Can register/login successfully
- ✅ Navbar shows user profile/avatar after login
- ✅ "AI Parse" link appears in navbar when logged in
- ✅ Clicking "AI Parse" redirects to localhost:8080
- ✅ Can upload floor plan and see 3D model
- ✅ Recommendations button works and returns suggestions

---

**Version**: 1.0  
**Last Updated**: October 2026  
**Project**: ArchGen 3D - Floor Plan to 3D Converter
