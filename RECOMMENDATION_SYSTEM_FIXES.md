# Recommendation System Fixes - Summary

## ✅ What I Fixed

### 1. **Model Download Script** (`download_recommendation_model.py`)
- Created automated download script for Qwen2.5-0.5B-Instruct model
- Includes verification of downloaded files
- Handles existing models gracefully
- Total size: ~500MB

### 2. **Updated START_AI_SYSTEM.bat**
- Added automatic model detection
- Prompts user to download if missing
- Falls back to rule-based recommendations if model unavailable
- Better error messages and guidance

### 3. **Updated run.bat**  
- Added recommendation model checking
- Shows status of both main and recommendation models
- Provides clear instructions for model downloads

### 4. **Improved Recommendation Bridge** (`viewer/recommendation_bridge.html`)
- Added backend connectivity check
- Added frontend availability check
- Better error messages with specific troubleshooting steps
- Data validation before redirect
- Checks for minimum room count

### 5. **Created Helper Scripts**
- `test_recommendation_system.bat` - Comprehensive diagnostic tool
- `start_backend.bat` - Standalone backend launcher with dependency checks

## ⚠️ Current Status

### Model Status
✅ Model files exist: `Qwen2.5-0.5B-Instruct` (953 MB)

### Dependencies Status
✅ Backend environment: Found (Python 3.14.2)
✅ FastAPI, Uvicorn, Pydantic: Installed
❌ PyTorch: Installing (IN PROGRESS - slow download)
❌ Transformers: Installing (IN PROGRESS)

### What's Left
The installation of PyTorch and Transformers is currently in progress but taking a very long time due to slow download speeds (12.8 MB downloading at ~40 KB/s will take hours).

## 🚀 Quick Start Guide

### Option 1: Install Dependencies Manually (RECOMMENDED)
Since the automatic installation is very slow, install manually:

```bash
cd Recommendation\backend
.\venv\Scripts\activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers accelerate
```

This might be faster if you have a better connection or can resume downloads.

### Option 2: Use Rule-Based Mode (NO AI)
The system works without AI using deterministic rules:

1. Just run `START_AI_SYSTEM.bat`
2. When prompted about downloading the model, select **"Skip"**
3. System will use rule-based recommendations (no AI, but functional)

### Option 3: Start Everything (Once Dependencies Ready)
```bash
START_AI_SYSTEM.bat
```

This will:
1. Check for AI model
2. Start main server (port 8080)
3. Start recommendation backend (port 8000)
4. Start recommendation frontend (port 5173)
5. Open browser

## 🔧 Troubleshooting

### Test the System
```bash
test_recommendation_system.bat
```

This diagnostic tool checks:
- AI model files
- Backend environment and packages
- Frontend setup
- Port availability
- Backend API status

### Common Issues

#### 1. "Not Found" Error when clicking recommendations
**Cause**: Backend not running or frontend not accessible
**Fix**:
```bash
REM Start all services
START_AI_SYSTEM.bat

REM Or start backend manually
cd Recommendation\backend
start_backend.bat
```

#### 2. Recommendations not showing
**Possible causes**:
- Backend on port 8000 not running
- Frontend on port 5173 not running
- AI model not loaded (will fall back to rules)

**Check**:
- Open `http://localhost:8000` - should show `{"status":"ok"}`
- Open `http://localhost:5173` - should show recommendation UI
- Check console in backend terminal for errors

#### 3. PyTorch/Transformers installation failed
**Solution**: Install manually in the venv:
```bash
cd Recommendation\backend
.\venv\Scripts\activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers
```

##  📝 Architecture

```
Main Viewer (localhost:8080)
    ↓ Click "Get AI Recommendations"
    ↓
Recommendation Bridge (checks & redirects)
    ↓
Recommendation Backend (localhost:8000) ← AI Model
    ↓
Recommendation Frontend (localhost:5173)
```

## 🎯 Next Steps

1. **Wait for PyTorch/Transformers installation to complete** OR cancel and install manually
2. **Run test script** to verify everything is working:
   ```bash
   test_recommendation_system.bat
   ```
3. **Start the system**:
   ```bash
   START_AI_SYSTEM.bat
   ```
4. **Upload a floor plan** in the main viewer
5. **Click "Get AI Recommendations"** button
6. **View AI-powered design suggestions**

## 📦 Files Created/Modified

### New Files
- `download_recommendation_model.py` - Model downloader
- `test_recommendation_system.bat` - Diagnostic tool
- `Recommendation/backend/start_backend.bat` - Backend launcher
- `RECOMMENDATION_SYSTEM_FIXES.md` - This document

### Modified Files
- `START_AI_SYSTEM.bat` - Added model checking
- `run.bat` - Added recommendation model status
- `viewer/recommendation_bridge.html` - Better error handling

## 💡 Tips

1. **First time setup**: Run `test_recommendation_system.bat` to see what's missing
2. **Slow internet**: Install PyTorch manually from their website
3. **No AI needed**: System works with rule-based mode (skip model download)
4. **Debugging**: Check terminal windows for error messages
5. **Port conflicts**: Make sure 8000, 5173, and 8080 are free

## ✨ Features

### With AI Model (Qwen2.5-0.5B)
- Natural language recommendations
- Context-aware suggestions
- Q&A about floor plan
- Smart design improvements

### Without AI Model (Rule-Based)
- Architectural code compliance checking
- Room size validation
- Window/door count verification
- Orientation analysis
- Deterministic recommendations

Both modes provide valuable insights!
