"""
disease_predictor.py
────────────────────
Wraps the disease-detection model.

Architecture
────────────
• Tries to load a real PyTorch CNN (ResNet-18 fine-tuned on PlantVillage).
• Falls back to a deterministic mock if the .pth file is not present —
  so the rest of the backend runs fine during development without a GPU.

To train and swap in a real model:
  1. Train ResNet-18 on PlantVillage dataset (see ml_models/train_disease_model.py).
  2. Save weights to ml_models/disease_model.pth.
  3. The loader below will pick it up automatically on next server start.
"""

import os
import random
import logging
from pathlib import Path

from django.conf import settings
from PIL import Image

logger = logging.getLogger(__name__)

# ── Disease catalogue with bilingual remedies ────────────────────────────────
# Key = class name (matches PlantVillage label exactly)
DISEASE_INFO = {
    "Tomato___Bacterial_spot": {
        "en": {
            "name":   "Tomato Bacterial Spot",
            "remedy": (
                "Remove and destroy infected leaves. "
                "Apply copper-based bactericide (e.g., Bordeaux mixture). "
                "Avoid overhead irrigation. Rotate crops annually."
            ),
        },
        "hi": {
            "name":   "टमाटर बैक्टीरियल स्पॉट",
            "remedy": (
                "संक्रमित पत्तियाँ हटाकर नष्ट करें। "
                "तांबे आधारित जीवाणुनाशक (जैसे बोर्डो मिश्रण) लगाएं। "
                "ऊपरी सिंचाई से बचें। फसल चक्र अपनाएं।"
            ),
        },
    },
    "Tomato___Early_blight": {
        "en": {
            "name":   "Tomato Early Blight",
            "remedy": (
                "Apply mancozeb or chlorothalonil fungicide at 7-day intervals. "
                "Remove lower infected leaves. "
                "Ensure adequate spacing for air circulation."
            ),
        },
        "hi": {
            "name":   "टमाटर अर्ली ब्लाइट",
            "remedy": (
                "7 दिन के अंतराल पर मैन्कोज़ेब या क्लोरोथैलोनिल कवकनाशी लगाएं। "
                "निचली संक्रमित पत्तियाँ हटाएं। "
                "वायु संचार के लिए पर्याप्त दूरी बनाए रखें।"
            ),
        },
    },
    "Tomato___Late_blight": {
        "en": {
            "name":   "Tomato Late Blight",
            "remedy": (
                "Apply metalaxyl + mancozeb (Ridomil Gold MZ) immediately. "
                "Destroy all affected plant material. "
                "Do not compost infected tissue."
            ),
        },
        "hi": {
            "name":   "टमाटर लेट ब्लाइट",
            "remedy": (
                "तुरंत मेटालैक्सिल + मैन्कोज़ेब (रिडोमिल गोल्ड MZ) लगाएं। "
                "सभी प्रभावित पौध सामग्री नष्ट करें। "
                "संक्रमित पत्तियाँ खाद में न डालें।"
            ),
        },
    },
    "Potato___Early_blight": {
        "en": {
            "name":   "Potato Early Blight",
            "remedy": (
                "Apply azoxystrobin or difenoconazole fungicide. "
                "Maintain balanced fertilization (avoid excess nitrogen). "
                "Remove crop debris after harvest."
            ),
        },
        "hi": {
            "name":   "आलू अर्ली ब्लाइट",
            "remedy": (
                "एज़ोक्सीस्ट्रोबिन या डिफेनोकोनाज़ोल कवकनाशी लगाएं। "
                "संतुलित उर्वरण बनाए रखें (अधिक नाइट्रोजन से बचें)। "
                "फसल कटाई के बाद अवशेष हटाएं।"
            ),
        },
    },
    "Corn___Common_rust": {
        "en": {
            "name":   "Corn Common Rust",
            "remedy": (
                "Apply propiconazole or tebuconazole at early rust appearance. "
                "Use rust-resistant hybrid seeds for next season. "
                "Scout fields weekly during humid periods."
            ),
        },
        "hi": {
            "name":   "मक्का सामान्य रस्ट",
            "remedy": (
                "रस्ट दिखते ही प्रोपिकोनाज़ोल या टेबुकोनाज़ोल लगाएं। "
                "अगले मौसम के लिए रस्ट-प्रतिरोधी हाइब्रिड बीज चुनें। "
                "आर्द्र मौसम में साप्ताहिक खेत निरीक्षण करें।"
            ),
        },
    },
    "Rice___Brown_spot": {
        "en": {
            "name":   "Rice Brown Spot",
            "remedy": (
                "Treat seeds with thiram or carbendazim before sowing. "
                "Apply edifenphos or tricyclazole at boot-leaf stage. "
                "Ensure balanced potassium and silicon nutrition."
            ),
        },
        "hi": {
            "name":   "धान भूरा धब्बा",
            "remedy": (
                "बुवाई से पहले बीजों को थिरम या कार्बेन्डाजिम से उपचारित करें। "
                "बूट-लीफ अवस्था पर एडिफेनफॉस या ट्राइसाइक्लाज़ोल लगाएं। "
                "पोटेशियम और सिलिकॉन पोषण संतुलित रखें।"
            ),
        },
    },
    "Healthy": {
        "en": {
            "name":   "Healthy Plant",
            "remedy": (
                "No disease detected. Continue regular monitoring, "
                "maintain balanced fertilization, and follow good agronomic practices."
            ),
        },
        "hi": {
            "name":   "स्वस्थ पौधा",
            "remedy": (
                "कोई रोग नहीं पाया गया। नियमित निगरानी जारी रखें, "
                "संतुलित उर्वरण बनाए रखें और अच्छी कृषि पद्धतियों का पालन करें।"
            ),
        },
    },
}

CLASS_NAMES = list(DISEASE_INFO.keys())

# ── Model paths ──────────────────────────────────────────────────────────────
_MODEL_PATH = Path(settings.ML_MODELS_DIR) / 'disease_model.pth'

# ── Module-level cache ───────────────────────────────────────────────────────
_disease_model = None
_model_loaded  = False


def _try_load_pytorch_model():
    """
    Attempt to load a fine-tuned ResNet-18 saved at disease_model.pth.
    Returns (model, True) on success, (None, False) if file missing / error.
    """
    global _disease_model, _model_loaded

    if not _MODEL_PATH.exists():
        logger.info(
            "Disease model not found at %s — using mock predictor.", _MODEL_PATH
        )
        _model_loaded = False
        return

    try:
        import torch
        import torchvision.models as tv_models

        model = tv_models.resnet18(weights=None)
        # Replace final FC layer to match number of disease classes
        import torch.nn as nn
        model.fc = nn.Linear(model.fc.in_features, len(CLASS_NAMES))
        model.load_state_dict(
            torch.load(_MODEL_PATH, map_location=torch.device('cpu'))
        )
        model.eval()

        _disease_model = model
        _model_loaded  = True
        logger.info("Disease CNN model loaded from %s", _MODEL_PATH)

    except Exception as e:
        logger.error("Failed to load disease model: %s", e)
        _model_loaded = False


def _preprocess_image(image_path: str):
    """
    Resize and normalise a PIL Image into a PyTorch tensor.
    Uses the same transform as ImageNet pre-training.
    """
    import torch
    from torchvision import transforms

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std =[0.229, 0.224, 0.225],
        ),
    ])

    img = Image.open(image_path).convert('RGB')
    return transform(img).unsqueeze(0)  # shape: (1, 3, 224, 224)


def predict_disease(image_path: str, language: str = 'en') -> dict:
    """
    Run inference on a plant-leaf image.

    Parameters
    ----------
    image_path : str  — absolute path to the saved upload
    language   : str  — 'en' or 'hi'

    Returns
    -------
    dict with keys: disease (str), confidence (float), remedy (str)
    """
    global _model_loaded

    # Lazy-load on first call
    if not _model_loaded and _disease_model is None:
        _try_load_pytorch_model()

    lang = language if language in ('en', 'hi') else 'en'

    # ── Real CNN inference ───────────────────────────────────────────
    if _disease_model is not None:
        try:
            import torch
            import torch.nn.functional as F

            tensor = _preprocess_image(image_path)
            with torch.no_grad():
                logits = _disease_model(tensor)
                probs  = F.softmax(logits, dim=1)[0]

            idx        = int(torch.argmax(probs).item())
            confidence = float(probs[idx].item())
            class_name = CLASS_NAMES[idx]

        except Exception as e:
            logger.error("CNN inference failed: %s", e)
            class_name = "Healthy"
            confidence = 0.50

    else:
        # ── Mock predictor (development / no GPU) ────────────────────
        # For demo purposes we cycle through diseases deterministically
        # based on the image file size, so repeated calls on the same
        # image are consistent.
        try:
            file_size  = os.path.getsize(image_path)
            idx        = file_size % len(CLASS_NAMES)
            seed       = file_size
        except OSError:
            idx  = 0
            seed = 42

        class_name = CLASS_NAMES[idx]
        # Simulate a realistic confidence band 0.72 – 0.97
        random.seed(seed)
        confidence = round(random.uniform(0.72, 0.97), 4)

    info = DISEASE_INFO.get(class_name, DISEASE_INFO["Healthy"])

    return {
        "disease":    info[lang]["name"],
        "confidence": round(confidence, 4),
        "remedy":     info[lang]["remedy"],
    }
