# 🏗️ FloorPlan-to-3D - Getting Started

## What Happened?

Your installation started successfully but timed out while downloading the large PyTorch package (~200MB). This is common with slower internet connections.

**Good news:** Most packages were already installed successfully! We just need to complete the installation.

## ⚡ Quick Solutions (Choose One)

### Option 1: Complete the Installation (RECOMMENDED)
Run this to finish installing the remaining packages:
```
COMPLETE_INSTALL.bat
```
This will retry with longer timeouts and should complete successfully.

### Option 2: Fresh Install with Better Timeout Handling
```
SETUP_ROBUST.bat
```
This installs everything from scratch with better retry logic.

### Option 3: Manual Installation (If scripts keep failing)
```
# Activate the virtual environment
.venv\Scripts\activate

# Install with very long timeout
pip install --default-timeout=300 --retries 10 -r requirements.txt

# Deactivate when done
deactivate
```

## 📋 What You Need

### Already Have ✅
- Python 3.10.8 ✅
- Virtual environment created ✅
- Most packages partially installed ✅

### Need to Complete
- TensorFlow and remaining ML packages
- Backend setup (FastAPI, transformers)
- Frontend setup (npm packages)

## 🎯 After Installation Complete

Once installation finishes, run the project:
```
run.bat
```

Or use the quick start:
```
QUICK_START.bat
```

## 🌐 What Will Run

The system starts 3 services:

1. **Main Server** (Port 8080) - Floor plan viewer and 3D conversion
2. **Backend API** (Port 8000) - AI recommendations
3. **Frontend UI** (Port 5173) - Recommendation interface

Access at: **http://localhost:8080**

## 📦 About the Qwen Model

The system works WITHOUT the Qwen AI model using rule-based recommendations.

If you have the Qwen model, place it here:
```
weights/recommendation_model/Qwen2.5-0.5B-Instruct/
```

See `QWEN_MODEL_SETUP.md` for details.

## 🔧 Troubleshooting

### Installation Keeps Timing Out?

**Solution 1:** Use wired connection instead of WiFi

**Solution 2:** Install in smaller batches:
```
.venv\Scripts\activate
pip install tensorflow==2.13.0 keras==2.13.1 --default-timeout=300
pip install opencv-python scikit-image --default-timeout=300
pip install flask flask-cors --default-timeout=300
```

**Solution 3:** Download offline and install:
- Download the wheel files manually from https://pypi.org
- Install using: `pip install path\to\downloaded\file.whl`

### No Virtual Environment Found?

Run:
```
python -m venv .venv
```

### Port Already in Use?

Check what's running on the port:
```
netstat -ano | findstr :8080
```

Kill the process or change the port in `server\main.py`

## 📚 Available Scripts

- **COMPLETE_INSTALL.bat** - Finish interrupted installation
- **SETUP_ROBUST.bat** - Fresh install with retry logic
- **QUICK_START.bat** - Run without reinstalling
- **run.bat** - Original run script
- **CHECK_SYSTEM.bat** - Verify your setup

## ❓ Need Help?

1. Check if Python is in PATH: `python --version`
2. Check if Node.js installed: `node --version`
3. Verify weights exist: `dir weights\maskrcnn_15_epochs.h5`
4. Check virtual env: `dir .venv\Scripts\python.exe`

## 🚀 Once Running

1. Open http://localhost:8080
2. Upload a floor plan image
3. Click "Process" to generate 3D model
4. Click "Get AI Recommendations" for suggestions
5. View results in the recommendation interface

Enjoy! 🎉
