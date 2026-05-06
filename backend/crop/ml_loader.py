"""
ml_loader.py
────────────
Loads the trained crop-recommendation model from disk exactly once,
then caches it in memory so every API call reuses the same object.

Pattern: Module-level singleton (loaded on first import).
"""

import os
import pickle
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

# ── Module-level cache ──────────────────────────────────────────────────────
_crop_model = None
_label_encoder = None


def _load_model():
    """Internal helper — loads model files from ML_MODELS_DIR."""
    global _crop_model, _label_encoder

    model_path = settings.CROP_MODEL_PATH
    encoder_path = settings.LABEL_ENCODER_PATH

    if not os.path.exists(model_path):
        logger.warning(
            "Crop model not found at %s. "
            "Run: python ml_models/train_crop_model.py", model_path
        )
        return False

    try:
        with open(model_path, 'rb') as f:
            _crop_model = pickle.load(f)

        with open(encoder_path, 'rb') as f:
            _label_encoder = pickle.load(f)

        logger.info("Crop ML model loaded successfully from %s", model_path)
        return True

    except Exception as e:
        logger.error("Failed to load crop model: %s", e)
        return False


def get_crop_model():
    """
    Return the cached (model, label_encoder) tuple.
    Loads from disk on the very first call.
    Returns (None, None) if model file is missing.
    """
    global _crop_model, _label_encoder

    if _crop_model is None:
        _load_model()

    return _crop_model, _label_encoder
