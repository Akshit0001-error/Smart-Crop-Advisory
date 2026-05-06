"""
Serializers for disease detection input / output.
"""

from rest_framework import serializers
from .models import DiseaseDetection


class DiseaseDetectionInputSerializer(serializers.Serializer):
    """
    Validates multipart/form-data sent to POST /api/detect-disease/.
    """

    image = serializers.ImageField(
        help_text="Plant leaf image (JPG / PNG, max 10 MB)"
    )
    language = serializers.ChoiceField(
        choices=['en', 'hi'],
        default='en',
        required=False,
        help_text="Response language: 'en' (English) or 'hi' (Hindi)"
    )


class DiseaseDetectionSerializer(serializers.ModelSerializer):
    """Serializes saved detection records for list/detail views."""

    class Meta:
        model = DiseaseDetection
        fields = '__all__'
