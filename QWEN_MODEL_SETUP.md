# Qwen Model Setup Guide

## Overview
The Qwen2.5-0.5B-Instruct model provides enhanced AI-powered recommendations for your floor plans. While the system works without it (using rule-based recommendations), adding the model significantly improves suggestion quality.

## Required Model Files
You need the **Qwen2.5-0.5B-Instruct** model files from Hugging Face.

## Where to Place the Model

Place all model files in this directory:
```
weights/recommendation_model/Qwen2.5-0.5B-Instruct/
```

## Required Files

The following files should be in the `Qwen2.5-0.5B-Instruct` folder:

1. **model.safetensors** - Main model weights (~500 MB)
2. **config.json** - Model configuration
3. **tokenizer.json** - Tokenizer data
4. **tokenizer_config.json** - Tokenizer configuration
5. **generation_config.json** (optional) - Generation settings
6. **special_tokens_map.json** (optional) - Special tokens
7. **merges.txt** (optional) - BPE merges
8. **vocab.json** (optional) - Vocabulary

## How to Get the Model

### Option 1: Download from Hugging Face (Recommended)

1. Go to: https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct
2. Click "Files and versions"
3. Download all the files listed above
4. Place them in: `weights/recommendation_model/Qwen2.5-0.5B-Instruct/`

### Option 2: Use Hugging Face CLI

```bash
# Install Hugging Face CLI
pip install huggingface-hub

# Login (optional, for faster downloads)
huggingface-cli login

# Download the model
huggingface-cli download Qwen/Qwen2.5-0.5B-Instruct --local-dir weights/recommendation_model/Qwen2.5-0.5B-Instruct
```

### Option 3: If You Already Have the Model

If you already downloaded the Qwen model to a different location, simply:

1. Copy the entire `Qwen2.5-0.5B-Instruct` folder
2. Paste it into: `weights/recommendation_model/`

## Verifying the Setup

After placing the files, your directory structure should look like:

```
floor-plan-to-3d/
├── weights/
│   ├── recommendation_model/
│   │   ├── Qwen2.5-0.5B-Instruct/
│   │   │   ├── model.safetensors          ← Most important!
│   │   │   ├── config.json
│   │   │   ├── tokenizer.json
│   │   │   ├── tokenizer_config.json
│   │   │   └── ... (other files)
│   ├── maskrcnn_15_epochs.h5              ← Main model weights
│   └── ...
```

## Running Without the Model

The system will still work without the Qwen model! It will use:
- Rule-based recommendation engine
- Deterministic layout analysis
- Standard architectural guidelines

The AI model adds:
- Natural language explanations
- Context-aware suggestions
- More nuanced recommendations

## Checking Model Status

The `SETUP_AND_RUN.bat` script will automatically check if the model is present and inform you if it's missing. You can run the system either way!

## Troubleshooting

### Model Not Loading
- Ensure `model.safetensors` exists and is not corrupted
- Check that all JSON config files are present
- Verify you have at least 2GB free RAM

### Download Failed
- Check your internet connection
- Try downloading files individually from Hugging Face
- Use a download manager for large files

### Wrong Model Version
- Make sure you download **Qwen2.5-0.5B-Instruct** specifically
- Other Qwen models may not work correctly
- The folder name must be exactly: `Qwen2.5-0.5B-Instruct`

## Questions?

If the model setup is unclear, you can:
1. Run without the model (rule-based system works fine)
2. Check the console output during startup
3. Review the `qwen_service.py` file in `Recommendation/backend/`
