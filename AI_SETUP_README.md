# AI Recommendation System - Setup Guide

## 🚀 Quick Start

### Step 1: Install Backend & Download AI Model
```batch
SETUP_AI_MODEL.bat
```
This will:
- Install Python dependencies (FastAPI, PyTorch, Transformers)
- Download Qwen2.5-0.5B-Instruct model (~500MB) to `weights/recommendation_model/`
- Takes ~5-10 minutes depending on internet speed

### Step 2: Install Frontend Dependencies
```batch
SETUP_FRONTEND.bat
```
This will:
- Install Node.js dependencies for the recommendation UI
- Takes ~2-3 minutes

### Step 3: Start All Services
```batch
START_AI_SYSTEM.bat
```
This will start:
- Main Floorplan Server (Port 8080)
- Recommendation Backend (Port 8000)
- Recommendation Frontend (Port 5173)

## 📋 What Changed from Ollama

### Before (Ollama):
- Required Ollama installation
- Model served by separate Ollama service
- External dependency

### After (Hugging Face):
- ✅ Direct PyTorch/Transformers integration
- ✅ Model stored locally in `weights/` folder
- ✅ No external services required
- ✅ Works offline after initial download

## 📁 Model Location

```
floorplan-to-3d/
├── weights/
│   ├── recommendation_model/    ← AI Model stored here
│   │   ├── models--Qwen--Qwen2.5-0.5B-Instruct/
│   │   │   ├── snapshots/
│   │   │   │   └── [model files]
│   └── mask_rcnn_*.h5          ← Detection model (existing)
```

## 🎯 Model Details

- **Model**: Qwen/Qwen2.5-0.5B-Instruct
- **Size**: ~500MB
- **Type**: Causal Language Model (Instruction-tuned)
- **Purpose**: Generate architectural recommendations
- **Device**: Automatically uses GPU if available, otherwise CPU
- **Format**: PyTorch (float16 on GPU, float32 on CPU)

## 🔧 Manual Setup (Alternative)

If batch files don't work, run these commands manually:

### Backend Setup:
```bash
cd Recommendation/backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn pydantic transformers torch accelerate sentencepiece --extra-index-url https://download.pytorch.org/whl/cpu
```

### Download Model Manually:
```python
from transformers import AutoTokenizer, AutoModelForCausalLM
from pathlib import Path

cache_dir = Path("weights/recommendation_model")
cache_dir.mkdir(parents=True, exist_ok=True)

tokenizer = AutoTokenizer.from_pretrained(
    "Qwen/Qwen2.5-0.5B-Instruct",
    cache_dir=str(cache_dir),
    trust_remote_code=True
)

model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-0.5B-Instruct",
    cache_dir=str(cache_dir),
    trust_remote_code=True
)
```

### Frontend Setup:
```bash
cd Recommendation/frontend
npm install
```

## ⚙️ System Requirements

### Minimum:
- Python 3.8+
- Node.js 16+
- 4GB RAM
- 2GB free disk space

### Recommended:
- Python 3.10+
- Node.js 18+
- 8GB RAM
- NVIDIA GPU (optional, for faster inference)
- 5GB free disk space

## 🐛 Troubleshooting

### Problem: "torch not found" or "CUDA error"
**Solution**: Install CPU-only PyTorch:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

### Problem: Model download fails
**Solution**: Check internet connection, try again. The download is ~500MB.

### Problem: Out of memory error
**Solution**: Close other applications. The model needs ~2GB RAM.

### Problem: Port already in use
**Solution**: Check if services are already running:
```bash
netstat -ano | findstr "8080 8000 5173"
```

### Problem: Frontend won't start
**Solution**: Delete node_modules and reinstall:
```bash
cd Recommendation/frontend
rmdir /s /q node_modules
npm install
```

## 📊 Performance

| Device | First Load | Subsequent Loads | Response Time |
|--------|-----------|------------------|---------------|
| CPU    | 5-10s     | 1-2s             | 2-5s          |
| GPU    | 2-3s      | <1s              | <1s           |

## ✅ Verification

After setup, verify everything works:

1. **Check model files exist**:
   ```
   dir weights\recommendation_model\models--Qwen--Qwen2.5-0.5B-Instruct
   ```

2. **Test backend**:
   ```
   cd Recommendation/backend
   venv\Scripts\activate
   python app.py
   ```
   Should show: "Uvicorn running on http://0.0.0.0:8000"

3. **Test frontend**:
   ```
   cd Recommendation/frontend
   npm run dev
   ```
   Should show: "Local: http://localhost:5173/"

4. **Test main server**:
   ```
   python server/main.py
   ```
   Should show: "Starting Flask server..."

## 🔄 Update Model (If Needed)

To update to a newer model version:

1. Delete old model:
   ```
   rmdir /s /q weights\recommendation_model
   ```

2. Run setup again:
   ```
   SETUP_AI_MODEL.bat
   ```

## 📚 Additional Resources

- Qwen Model: https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct
- Transformers Docs: https://huggingface.co/docs/transformers
- PyTorch: https://pytorch.org/get-started/locally/

## 🎉 Success Checklist

- [ ] Backend dependencies installed
- [ ] AI model downloaded to weights/ folder
- [ ] Frontend dependencies installed
- [ ] All three services start without errors
- [ ] Main viewer opens at http://localhost:8080
- [ ] Can upload floor plan and see detection
- [ ] "Get AI Recommendations" button visible
- [ ] Clicking button opens recommendation system
- [ ] Recommendations display correctly

---

**All set!** Run `START_AI_SYSTEM.bat` to begin using the AI-powered floor plan recommendations! 🏠✨
