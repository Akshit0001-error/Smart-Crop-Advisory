"""
Serializers for crop recommendation input validation and output formatting.
"""

from rest_framework import serializers
from .models import CropRecommendation


class CropInputSerializer(serializers.Serializer):
    """
    Validates the JSON body sent to POST /api/predict-crop/.
    All fields are required; ranges are validated to catch obvious data errors.
    """

    nitrogen    = serializers.FloatField(min_value=0,   max_value=200,
                                         help_text="kg/ha, typical range 0–140")
    phosphorus  = serializers.FloatField(min_value=0,   max_value=200,
                                         help_text="kg/ha, typical range 5–145")
    potassium   = serializers.FloatField(min_value=0,   max_value=300,
                                         help_text="kg/ha, typical range 5–205")
    temperature = serializers.FloatField(min_value=-10, max_value=60,
                                         help_text="°C")
    humidity    = serializers.FloatField(min_value=0,   max_value=100,
                                         help_text="%")
    rainfall    = serializers.FloatField(min_value=0,   max_value=500,
                                         help_text="mm")
    ph          = serializers.FloatField(min_value=0,   max_value=14,
                                         help_text="Soil pH 0–14")

    # Optional: language selection for response messages
    language    = serializers.ChoiceField(choices=['en', 'hi'], default='en',
                                          required=False)


class CropRecommendationSerializer(serializers.ModelSerializer):
    """Serializes saved recommendation records for list/detail views."""

    class Meta:
        model = CropRecommendation
        fields = '__all__'
