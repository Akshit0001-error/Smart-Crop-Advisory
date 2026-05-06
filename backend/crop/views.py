"""
Crop recommendation views.

POST /api/predict-crop/
    → Accepts soil + climate parameters
    → Runs Random Forest model
    → Returns recommended crop + confidence + weather advisory

GET /api/history/
    → Returns the authenticated user's past recommendations
"""

import numpy as np
import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import CropInputSerializer, CropRecommendationSerializer
from .models import CropRecommendation
from .ml_loader import get_crop_model
from .weather_advisory import get_weather_advisory

logger = logging.getLogger(__name__)

# ── Multi-language UI strings ────────────────────────────────────────────────
RESPONSE_MESSAGES = {
    "success": {
        "en": "Crop recommendation generated successfully.",
        "hi": "फसल की सिफारिश सफलतापूर्वक तैयार की गई।",
    },
    "model_unavailable": {
        "en": "ML model is not available. Please contact the administrator.",
        "hi": "ML मॉडल उपलब्ध नहीं है। कृपया व्यवस्थापक से संपर्क करें।",
    },
    "prediction_error": {
        "en": "An error occurred during prediction. Please try again.",
        "hi": "भविष्यवाणी के दौरान त्रुटि हुई। कृपया पुनः प्रयास करें।",
    },
}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_crop_view(request):
    """
    Crop Recommendation API
    ───────────────────────
    POST /api/predict-crop/

    Request Body (JSON):
        {
            "nitrogen":    float,   // kg/ha
            "phosphorus":  float,   // kg/ha
            "potassium":   float,   // kg/ha
            "temperature": float,   // °C
            "humidity":    float,   // %
            "rainfall":    float,   // mm
            "ph":          float,   // 0-14
            "language":    "en"|"hi"  // optional, default "en"
        }

    Response (200):
        {
            "message":          string,
            "recommended_crop": string,
            "confidence":       float,   // 0.0 – 1.0
            "weather_advisory": [string, ...]
        }
    """
    serializer = CropInputSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            {"errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    lang = data.get('language', 'en')

    # ── Load the ML model ────────────────────────────────────────────
    model, label_encoder = get_crop_model()

    if model is None:
        return Response(
            {"error": RESPONSE_MESSAGES["model_unavailable"][lang]},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # ── Build feature array in the exact order the model was trained on ──
    features = np.array([[
        data['nitrogen'],
        data['phosphorus'],
        data['potassium'],
        data['temperature'],
        data['humidity'],
        data['ph'],
        data['rainfall'],
    ]])

    try:
        # predict_proba returns shape (1, n_classes)
        probabilities = model.predict_proba(features)[0]
        predicted_index = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_index])

        # Decode numeric label → crop name string
        recommended_crop = label_encoder.inverse_transform([predicted_index])[0]

    except Exception as e:
        logger.error("Crop prediction failed: %s", e, exc_info=True)
        return Response(
            {"error": RESPONSE_MESSAGES["prediction_error"][lang]},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # ── Generate weather advisory ────────────────────────────────────
    advisories = get_weather_advisory(
        temperature=data['temperature'],
        rainfall=data['rainfall'],
        humidity=data['humidity'],
        ph=data['ph'],
        language=lang,
    )

    # ── Persist to database ──────────────────────────────────────────
    recommendation = CropRecommendation.objects.create(
        user=request.user,
        nitrogen=data['nitrogen'],
        phosphorus=data['phosphorus'],
        potassium=data['potassium'],
        temperature=data['temperature'],
        humidity=data['humidity'],
        rainfall=data['rainfall'],
        ph=data['ph'],
        recommended_crop=recommended_crop,
        confidence=round(confidence, 4),
        weather_advisory="\n".join(advisories),
    )

    return Response(
        {
            "message":          RESPONSE_MESSAGES["success"][lang],
            "recommended_crop": recommended_crop,
            "confidence":       round(confidence, 4),
            "weather_advisory": advisories,
            "record_id":        recommendation.id,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommendation_history_view(request):
    """
    GET /api/history/
    Returns the last 20 recommendations for the logged-in user.
    """
    records = CropRecommendation.objects.filter(user=request.user)[:20]
    serializer = CropRecommendationSerializer(records, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
