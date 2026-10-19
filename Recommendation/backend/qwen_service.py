"""Optional LLM-backed text generation for the recommendation module.

The language model is entirely optional. If ``torch`` / ``transformers`` are
not installed, or if the model weights are not present in the local cache,
everything in this module degrades gracefully by returning ``None``. The
callers then fall back to the deterministic rule/RAG engine in
``rag_service``, so the API keeps working on any machine.
"""

import os
from pathlib import Path

# Model cache path - use weights folder in main project
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
MODEL_CACHE_DIR = PROJECT_ROOT / "weights" / "recommendation_model"
MODEL_NAME = os.getenv("RECOMMENDATION_MODEL_NAME", "Qwen/Qwen2.5-0.5B-Instruct")

# A plain-folder copy of the model (e.g. downloaded manually into this folder)
# takes priority over the Hub id, so the app works fully offline.
LOCAL_MODEL_DIR = MODEL_CACHE_DIR / "Qwen2.5-0.5B-Instruct"

# Downloading the model pulls several hundred MB from the Hugging Face Hub.
# It is disabled by default so that an offline / restricted network can never
# block a request. Set RECOMMENDATION_ALLOW_DOWNLOAD=1 to enable it.
ALLOW_DOWNLOAD = os.getenv("RECOMMENDATION_ALLOW_DOWNLOAD", "0") == "1"

# Global variables for model and tokenizer
_model = None
_tokenizer = None
_device = "cpu"
_load_attempted = False


def _load_model():
    """Load the model and tokenizer once (lazy loading).

    Returns ``(None, None)`` when the model cannot be used, never raises.
    """
    global _model, _tokenizer, _device, _load_attempted

    if _model is not None and _tokenizer is not None:
        return _model, _tokenizer
    if _load_attempted:
        return None, None
    _load_attempted = True

    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM
    except Exception as exc:
        print(f"[recommendation] torch/transformers unavailable ({exc}); using rule engine only.")
        return None, None

    _device = "cuda" if torch.cuda.is_available() else "cpu"
    local_only = not ALLOW_DOWNLOAD

    # Prefer a local folder copy of the model when it exists.
    model_source = str(LOCAL_MODEL_DIR) if LOCAL_MODEL_DIR.is_dir() else MODEL_NAME

    print(f"Loading AI model '{model_source}' on device: {_device} "
          f"(local_files_only={local_only})")
    print(f"Model cache directory: {MODEL_CACHE_DIR}")

    try:
        # Create cache directory if it doesn't exist
        MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)

        # Load tokenizer
        _tokenizer = AutoTokenizer.from_pretrained(
            model_source,
            cache_dir=str(MODEL_CACHE_DIR),
            trust_remote_code=True,
            local_files_only=local_only,
        )

        # Load model
        _model = AutoModelForCausalLM.from_pretrained(
            model_source,
            cache_dir=str(MODEL_CACHE_DIR),
            trust_remote_code=True,
            low_cpu_mem_usage=True,
            local_files_only=local_only,
        ).to(_device)

        print(f"Model loaded successfully on {_device}")
        return _model, _tokenizer

    except Exception as exc:
        print(f"[recommendation] Model unavailable ({exc}); using rule engine only.")
        _model = None
        _tokenizer = None
        return None, None


def generate_recommendations(prompt: str) -> str:
    """Generate recommendations using the local model, or ``None`` if unavailable."""
    try:
        model, tokenizer = _load_model()

        if model is None or tokenizer is None:
            print("Model not loaded, returning None")
            return None

        import torch

        # Format the prompt as a chat
        system_message = "You are a helpful residential floor-plan advisor. Answer only using the provided floor-plan context. Do not invent information. Do not repeat the entire analysis. Answer the user's exact question directly. Use simple language that a normal homeowner can understand. Keep the answer short, clear, and practical. Use plain text only. Do not use Markdown, *, **, -, #, headings, or unnecessary formatting. Usually answer in 1–3 sentences."

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]

        # Apply chat template
        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        # Tokenize
        model_inputs = tokenizer([text], return_tensors="pt").to(_device)

        # Generate response
        with torch.no_grad():
            generated_ids = model.generate(
                model_inputs.input_ids,
                max_new_tokens=150,
                temperature=0.7,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id
            )

        # Decode only the new tokens (excluding the prompt)
        generated_ids = [
            output_ids[len(input_ids):]
            for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]

        response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]

        # Clean up response
        response = response.strip()

        return response

    except Exception as e:
        print(f"Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
        return None
