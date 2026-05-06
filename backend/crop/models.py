"""
Database model that logs every crop recommendation made.
Useful for history, analytics, and admin review.
"""

from django.db import models
from django.conf import settings


class CropRecommendation(models.Model):
    """
    Stores the input soil/climate parameters and the predicted crop.
    One record is created per API call to /api/predict-crop/.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='recommendations',
        help_text="Null if called without authentication (future public endpoint)"
    )

    # ── Input parameters ────────────────────────────────────────────
    nitrogen    = models.FloatField(help_text="Nitrogen content in soil (kg/ha)")
    phosphorus  = models.FloatField(help_text="Phosphorus content in soil (kg/ha)")
    potassium   = models.FloatField(help_text="Potassium content in soil (kg/ha)")
    temperature = models.FloatField(help_text="Temperature in °C")
    humidity    = models.FloatField(help_text="Relative humidity (%)")
    rainfall    = models.FloatField(help_text="Rainfall in mm")
    ph          = models.FloatField(help_text="Soil pH value (0–14)")

    # ── Prediction output ───────────────────────────────────────────
    recommended_crop = models.CharField(max_length=100)
    confidence       = models.FloatField(help_text="Model confidence (0.0–1.0)")

    # ── Weather advisory ────────────────────────────────────────────
    weather_advisory = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Crop Recommendation'

    def __str__(self):
        return f"{self.recommended_crop} ({self.confidence:.0%}) — {self.created_at.date()}"
