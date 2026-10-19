"""Download Qwen2.5-0.5B-Instruct model from Hugging Face"""
import os
from pathlib import Path

print("=" * 60)
print("AI Model Downloader")
print("=" * 60)
print()

# Set up paths
project_root = Path(__file__).parent
model_cache = project_root / "weights" / "recommendation_model"
model_cache.mkdir(parents=True, exist_ok=True)

print(f"Project root: {project_root}")
print(f"Model cache: {model_cache}")
print()

# Check if transformers is installed
try:
    from transformers import AutoTokenizer, AutoModelForCausalLM
    print("✅ Transformers library found")
except ImportError:
    print("❌ Transformers not found. Installing...")
    import subprocess
    subprocess.check_call([
        "pip", "install", 
        "transformers", "torch", "accelerate", "sentencepiece",
        "--extra-index-url", "https://download.pytorch.org/whl/cpu"
    ])
    from transformers import AutoTokenizer, AutoModelForCausalLM
    print("✅ Transformers installed")

print()
print("=" * 60)
print("Downloading Model: Qwen/Qwen2.5-0.5B-Instruct")
print("Size: ~500 MB")
print("This may take 5-10 minutes depending on your internet speed...")
print("=" * 60)
print()

try:
    # Download tokenizer
    print("Step 1/2: Downloading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        "Qwen/Qwen2.5-0.5B-Instruct",
        cache_dir=str(model_cache),
        trust_remote_code=True
    )
    print("✅ Tokenizer downloaded")
    print()
    
    # Download model
    print("Step 2/2: Downloading model...")
    model = AutoModelForCausalLM.from_pretrained(
        "Qwen/Qwen2.5-0.5B-Instruct",
        cache_dir=str(model_cache),
        trust_remote_code=True,
        low_cpu_mem_usage=True
    )
    print("✅ Model downloaded")
    print()
    
    # Verify files
    print("Verifying downloaded files...")
    model_files = list(model_cache.rglob("*"))
    print(f"✅ Found {len(model_files)} files in cache")
    
    print()
    print("=" * 60)
    print("SUCCESS! Model downloaded successfully")
    print("=" * 60)
    print()
    print(f"Model location: {model_cache}")
    print()
    print("You can now run the project!")
    
except Exception as e:
    print()
    print("=" * 60)
    print("ERROR: Failed to download model")
    print("=" * 60)
    print(f"Error: {e}")
    print()
    print("Possible solutions:")
    print("1. Check your internet connection")
    print("2. Try again (the download will resume)")
    print("3. Use a VPN if Hugging Face is blocked")
    import traceback
    traceback.print_exc()
