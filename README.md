# 🏠 Floorplan to 3D — Complete Architectural AI & 3D Visualization Suite

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks--Vision-orange.svg)](https://developers.google.com/mediapipe)
[![FastAPI](https://img.shields.io/badge/FastAPI-Modern--API-teal.svg)](https://fastapi.tiangolo.com/)
[![React + Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb.svg)](https://vitejs.dev/)

An end-to-end AI-powered architectural platform that transforms 2D floor plans into interactive, fully textured 3D environments with **VR Box locomotion**, **AI interior recommendations**, and **real-time webcam hand gesture control**.

![preview](docs/preview.gif)

---

## 🌟 Key Features

### 1. 🔍 Floor Plan Analysis & Segmentation Pipeline
- **Multi-Model Detection**: Combines ResNet-UNet and Mask R-CNN architectures trained on architectural datasets (including [CubiCasa5K](https://github.com/CubiCasa/CubiCasa5k)) to segment rooms, walls, doors, windows, and floors.
- **Symbol & OCR Recognition**: Integrated text and architectural symbol detection (`ocr_detector.py`, `symbol_detector.py`) for room labels, dimensions, and structural markings.
- **Vector Polygon Extraction**: Morphological contour processing (`cv2.findContours`) and Douglas–Peucker polygon simplification to generate clean vector geometries with doorway and window apertures.

### 2. 🎮 Interactive 3D WebGL Viewer & VR Box Mode
- **Procedural 3D Extrusion**: Real-time extrusion of segmented 2D boundaries into 3D walls, sills, lintels, and glass window slabs.
- **Materials & Textures**: Realistic PBR textures for wooden doors, glass windows, drywall, ceilings, and multi-pattern floor tiles.
- **Lighting & Environment**: Cove lighting, directional sunlight, procedural skybox, and exterior vegetation environments.
- **First-Person Walkthrough**: Collision detection hitboxes, smooth camera controls, and keyboard/mouse navigation.
- **Mobile VR Box Mode**: Full WebXR support with automatic cardboard/VR-box polyfill, stereo split-screen rendering, head tracking, and touch-to-walk locomotion.

### 3. 🤖 AI Room Recommendation System
- **LLM + RAG Intelligence**: Qwen-based local LLM service (`Recommendation/backend`) paired with a vector RAG engine and architectural rule engine.
- **Automated Floorplan Analysis**: Generates comprehensive interior design proposals, room utilization tips, furniture layouts, and spatial optimization reports.
- **Modern Web Dashboard**: React + Vite user interface (`Recommendation/frontend`) for visual report inspection and furniture customization.

### 4. 🖐️ Dual-Hand Gesture Control System
- **Hardware-Accelerated Tracking**: Powered by `@mediapipe/tasks-vision` HandLandmarker running 60 FPS synced to camera refresh rates.
- **Adaptive 1€ Filter**: Dynamic velocity-based jitter elimination with zero cursor latency.
- **Natural Interaction Set**:
  - 🖐️ **Open Palm**: Smooth pointer / crosshair positioning.
  - 🤏 **Single-Hand Pinch**: Object selection, drag-and-drop, and corner pulling with dual-threshold hysteresis.
  - 🤏🤏 **Two-Hand Pinch**: Simultaneous distance-based scaling and angular rotation.
  - ✊ **Closed Fist**: Action cancel / placement cooldown guard.

---

## 📁 Repository Layout

```text
floor-plan-to-3d/
├── 3d Assets System and  justure system/ # MediaPipe gesture controller & 3D asset scene
│   ├── assets/                          # 3D furniture models (.glb, .gltf)
│   ├── gestureController.js             # 60 FPS MediaPipe dual-hand gesture engine
│   ├── app.js                           # 3D scene asset placement controller
│   └── index.html                       # Standalone gesture viewer
├── Recommendation/                      # AI Interior Recommendation Subsystem
│   ├── backend/                         # FastAPI + Qwen LLM + RAG rule engine
│   └── frontend/                        # React + Vite interior design dashboard
├── server/                              # FastAPI / Python backend server
│   ├── main.py                          # Main inference & polygon API endpoints
│   ├── mask_to_polygon_converter.py     # Contour to polygon vectorizer
│   └── structured_document_generator.py # Architectural floorplan schema export
├── viewer/                              # Interactive Three.js 3D WebGL Viewer
│   ├── index.html                       # Main viewer with Walkthrough & VR mode
│   ├── Assets/                          # Procedural meshes (doors, walls, ceilings)
│   └── environment/                     # 3D environment models and skybox
├── models/                              # Neural network architectures (Mask R-CNN, UNet)
├── image_processing/                    # OpenCV filters, thresholding, and loaders
├── analysis/                            # Wall, junction, door, and window geometry analysis
├── mrcnn/                               # Mask R-CNN core framework
├── weights/                             # Model checkpoints (downloaded separately)
├── run.bat                              # One-click Windows launch script
└── start_https_server.py                # HTTPS server for secure mobile VR/camera access
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** (for Recommendation frontend & asset server)
- **Cairo Library** (for SVG rasterization):
  - **macOS**: `brew install cairo`
  - **Ubuntu/Debian**: `sudo apt install libcairo2`
  - **Windows**: Included or installable via Conda/wheel.

### 2. Environment Setup

```bash
# Clone the repository
git clone https://github.com/OmkarPatil246/floor-plan-to-3d.git
cd floor-plan-to-3d

# Create and activate Python virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install main server dependencies
pip install -r requirements.txt
pip install -e ".[serve]"
```

### 3. Model Weights Setup

Download the pre-trained weights for wall segmentation and AI recommendation:

```bash
# Automatic download via helper script
python download_model.py
python download_recommendation_model.py
```

*Or manually download wall segmentation weights:*
- `weights/best.safetensors`: [HuggingFace Yytsi/floorplan-to-3d-walls](https://huggingface.co/Yytsi/floorplan-to-3d-walls/resolve/main/best.safetensors)
- `weights/config.yaml`: [HuggingFace config.yaml](https://huggingface.co/Yytsi/floorplan-to-3d-walls/resolve/main/config.yaml)

---

## 💻 Running the Application

### Option A: One-Click Windows Launcher
Run the interactive launcher:
```cmd
run.bat
```
This script validates your environment, starts the backend server, launches the frontend viewer, and displays local and network LAN addresses.

### Option B: Manual Service Launch

#### 1. Start 3D Extrusion Server & Viewer
```bash
python -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```
Navigate to `http://localhost:8000` to open the 3D viewer.

#### 2. Start AI Recommendation Backend
```bash
cd Recommendation/backend
pip install -r requirements.txt
python app.py
```

#### 3. Start AI Recommendation Frontend
```bash
cd Recommendation/frontend
npm install
npm run dev
```

#### 4. Start Hand Gesture Controller Scene
```bash
cd "3d Assets System and  justure system"
# Python static server:
python server.py
# Or Node.js server:
node server.js
```
Open `http://localhost:3000` or `http://localhost:8080` in Chrome/Edge, grant webcam permissions, and interact with 3D furniture using hand gestures.

#### 5. Mobile VR & Network Access (HTTPS)
WebXR and webcam tracking require secure contexts (`https://` or `localhost`). To access from mobile headsets or phones on your local Wi-Fi:
```bash
python start_https_server.py
```
Scan the generated terminal QR code or visit the displayed LAN IP address.

---

## 🥽 VR Box & Mobile Controls

| Control | Action |
| :--- | :--- |
| **Touch Screen (Hold)** | Walk forward in gaze direction |
| **Release Touch** | Stop walking |
| **Head Rotation (Gyro)** | 360° Omnidirectional look |
| **W / A / S / D** | Keyboard locomotion (Desktop mode) |
| **Mouse Drag** | Orbit / Look around (Desktop mode) |

---

## 🤝 Contributing

Contributions, bug reports, and feature proposals are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
