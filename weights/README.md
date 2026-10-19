# Model Weights Directory

This directory stores deep learning checkpoints and model weights for Floorplan to 3D.
Because model weights exceed GitHub's file size limits (some > 250 MB to 1 GB), they are excluded from version control and must be downloaded or placed here.

---

## Required Files

Place your trained model files in this directory:

### 1. Wall & Floorplan Segmentation Weights
- **`best.safetensors`** (~97 MB): ResNet-UNet wall/door/window segmentation checkpoint.
  - Download from: [HuggingFace Yytsi/floorplan-to-3d-walls](https://huggingface.co/Yytsi/floorplan-to-3d-walls/resolve/main/best.safetensors)
- **`config.yaml`**: Configuration file for the UNet model.
  - Download from: [HuggingFace config.yaml](https://huggingface.co/Yytsi/floorplan-to-3d-walls/resolve/main/config.yaml)
- **`maskrcnn_15_epochs.h5`** (~255 MB): Mask R-CNN high-resolution architectural segmentation checkpoint.
  - Required for: `models/mask_rcnn_model.py`

### 2. AI Recommendation Model
Store under `weights/recommendation_model/Qwen2.5-0.5B-Instruct/`:
- **`model.safetensors`** (~942 MB)
- Tokenizer files (`tokenizer.json`, `tokenizer_config.json`, `vocab.json`, etc.)

---

## Automatic Download Scripts

From the repository root, you can download required weights automatically:

```bash
# Download AI recommendation model (Qwen2.5-0.5B-Instruct)
python download_recommendation_model.py

# Download base models
python download_model.py
```
