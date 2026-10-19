"""
Download and setup the Qwen2.5-0.5B-Instruct model for recommendations.
This script downloads the smallest Qwen model (~500MB) for the recommendation system.
"""

import os
import sys
from pathlib import Path

def download_model():
    """Download the Qwen model to the weights directory."""
    print("=" * 60)
    print("Qwen2.5-0.5B-Instruct Model Downloader")
    print("=" * 60)
    print()
    
    # Setup paths
    project_root = Path(__file__).resolve().parent
    model_cache_dir = project_root / "weights" / "recommendation_model"
    local_model_dir = model_cache_dir / "Qwen2.5-0.5B-Instruct"
    model_name = "Qwen/Qwen2.5-0.5B-Instruct"
    
    print(f"Project root: {project_root}")
    print(f"Model cache directory: {model_cache_dir}")
    print(f"Local model directory: {local_model_dir}")
    print()
    
    # Check if model already exists
    if local_model_dir.exists() and (local_model_dir / "model.safetensors").exists():
        print("✅ Model already exists at:")
        print(f"   {local_model_dir}")
        print()
        print("Model files found:")
        for file in local_model_dir.iterdir():
            if file.is_file():
                size_mb = file.stat().st_size / (1024 * 1024)
                print(f"   - {file.name} ({size_mb:.2f} MB)")
        print()
        
        response = input("Model already exists. Re-download? (y/n): ").strip().lower()
        if response != 'y':
            print("Skipping download.")
            return True
        print()
    
    # Check dependencies
    print("Checking dependencies...")
    try:
        import torch
        print(f"✅ PyTorch version: {torch.__version__}")
    except ImportError:
        print("❌ PyTorch not installed!")
        print("   Install with: pip install torch")
        return False
    
    try:
        import transformers
        print(f"✅ Transformers version: {transformers.__version__}")
    except ImportError:
        print("❌ Transformers not installed!")
        print("   Install with: pip install transformers")
        return False
    
    print()
    
    # Create cache directory
    model_cache_dir.mkdir(parents=True, exist_ok=True)
    print(f"✅ Created cache directory: {model_cache_dir}")
    print()
    
    # Download model
    print("=" * 60)
    print("Starting download...")
    print("=" * 60)
    print()
    print(f"Model: {model_name}")
    print(f"Size: ~500 MB (0.5 billion parameters)")
    print()
    print("This may take several minutes depending on your internet speed.")
    print("Please be patient...")
    print()
    
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        
        # Download tokenizer
        print("[1/2] Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            cache_dir=str(model_cache_dir),
            trust_remote_code=True,
        )
        print("✅ Tokenizer downloaded successfully")
        print()
        
        # Download model
        print("[2/2] Downloading model (this will take a while)...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            cache_dir=str(model_cache_dir),
            trust_remote_code=True,
            low_cpu_mem_usage=True,
        )
        print("✅ Model downloaded successfully")
        print()
        
        # Save to local directory for offline use
        print("Saving model to local directory for offline use...")
        local_model_dir.mkdir(parents=True, exist_ok=True)
        model.save_pretrained(str(local_model_dir))
        tokenizer.save_pretrained(str(local_model_dir))
        print(f"✅ Model saved to: {local_model_dir}")
        print()
        
        # Verify files
        print("Verifying downloaded files...")
        required_files = [
            "config.json",
            "generation_config.json",
            "model.safetensors",
            "tokenizer.json",
            "tokenizer_config.json",
            "vocab.json",
            "merges.txt"
        ]
        
        all_good = True
        total_size = 0
        for filename in required_files:
            file_path = local_model_dir / filename
            if file_path.exists():
                size_mb = file_path.stat().st_size / (1024 * 1024)
                total_size += size_mb
                print(f"   ✅ {filename} ({size_mb:.2f} MB)")
            else:
                print(f"   ❌ {filename} - MISSING")
                all_good = False
        
        print()
        print(f"Total model size: {total_size:.2f} MB")
        print()
        
        if all_good:
            print("=" * 60)
            print("✅ SUCCESS! Model downloaded and verified.")
            print("=" * 60)
            print()
            print("The recommendation system is now ready to use.")
            print("You can now run START_AI_SYSTEM.bat to start the full system.")
            return True
        else:
            print("=" * 60)
            print("⚠️ WARNING: Some files are missing!")
            print("=" * 60)
            print()
            print("The model may not work correctly.")
            return False
            
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ ERROR: Failed to download model")
        print("=" * 60)
        print()
        print(f"Error: {e}")
        print()
        print("Possible solutions:")
        print("1. Check your internet connection")
        print("2. Make sure you have enough disk space (~1 GB free)")
        print("3. Try running the script again")
        print("4. Check firewall/antivirus settings")
        return False


if __name__ == "__main__":
    print()
    success = download_model()
    print()
    
    if success:
        sys.exit(0)
    else:
        print("Download failed. Please fix the issues and try again.")
        sys.exit(1)
