"""
Disease detection views.

POST /api/detect-disease/
    → Accept multipart image upload
    → Run CNN (or mock) predictor
    → Return disease name, confidence, remedy

GET /api/disease-history/
    → Return the authenticated user's past detections
"""

import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes

from .serializers import DiseaseDetectionInputSerializer, DiseaseDetectionSerializer
from .models import DiseaseDetection
from .disease_predictor import predict_disease

logger = logging.getLogger(__name__)

# ── Bilingual response strings ───────────────────────────────────────────────
RESPONSE_MESSAGES = {
    "success": {
        "en": "Disease detection completed successfully.",
        "hi": "रोग पहचान सफलतापूर्वक पूरी हुई।",
    },
    "error": {
        "en": "An error occurred during disease detection. Please try again.",
        "hi": "रोग पहचान के दौरान त्रुटि हुई। कृपया पुनः प्रयास करें।",
    },
}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def detect_disease_view(request):
    """
    Disease Detection API
    ─────────────────────
    POST /api/detect-disease/
    Content-Type: multipart/form-data

    Form fields:
        image    — plant leaf image file (JPEG / PNG, max 10 MB)
        language — "en" or "hi" (optional, default "en")

    Response (200):
        {
            "message":    string,
            "disease":    string,
            "confidence": float,
            "remedy":     string,
            "record_id":  int
        }
    """
    serializer = DiseaseDetectionInputSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            {"errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data     = serializer.validated_data
    image    = data['image']
    lang     = data.get('language', 'en')

    # ── Save the image via the ORM (uses MEDIA_ROOT) ─────────────────
    detection = DiseaseDetection(user=request.user, image=image)
    detection.save()   # image is now saved to disk

    # ── Run prediction ───────────────────────────────────────────────
    try:
        result = predict_disease(
            image_path=detection.image.path,
            language=lang,
        )
    except Exception as e:
        logger.error("Disease prediction failed: %s", e, exc_info=True)
        # Clean up saved image to avoid orphaned files
        detection.image.delete(save=False)
        detection.delete()
        return Response(
            {"error": RESPONSE_MESSAGES["error"][lang]},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # ── Update record with prediction results ────────────────────────
    detection.disease    = result['disease']
    detection.confidence = result['confidence']
    detection.remedy     = result['remedy']
    detection.save(update_fields=['disease', 'confidence', 'remedy'])

    return Response(
        {
            "message":    RESPONSE_MESSAGES["success"][lang],
            "disease":    result['disease'],
            "confidence": result['confidence'],
            "remedy":     result['remedy'],
            "record_id":  detection.id,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def disease_history_view(request):
    """
    GET /api/disease-history/
    Returns the last 20 disease detections for the authenticated user.
    """
    records    = DiseaseDetection.objects.filter(user=request.user)[:20]
    serializer = DiseaseDetectionSerializer(
        records, many=True, context={'request': request}
    )
    return Response(serializer.data, status=status.HTTP_200_OK)
