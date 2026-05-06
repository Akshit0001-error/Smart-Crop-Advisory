"""
Database model that logs every disease detection request.
"""

from django.db import models
from django.conf import settings


class DiseaseDetection(models.Model):
    """
    Stores the uploaded image path and the model's prediction.
    One record per call to POST /api/detect-disease/.

    Two-phase save pattern:
        1. Save with only `user` + `image` so the file is written to disk.
        2. Run prediction against the saved path.
        3. update_fields=['disease','confidence','remedy'] to complete the record.
    Fields are therefore nullable to allow phase-1 save.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='disease_detections',
    )

    # Uploaded image (stored under MEDIA_ROOT/uploads/diseases/)
    image = models.ImageField(upload_to='uploads/diseases/')

    # Prediction output — nullable until prediction completes (phase 2)
    disease    = models.CharField(max_length=200, null=True, blank=True)
    confidence = models.FloatField(null=True, blank=True,
                                   help_text="Confidence score 0.0–1.0")
    remedy     = models.TextField(null=True, blank=True,
                                  help_text="Recommended treatment / remedy")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Disease Detection'

    def __str__(self):
        conf = f"{self.confidence:.0%}" if self.confidence is not None else "pending"
        return f"{self.disease or 'Pending'} ({conf}) — {self.created_at.date()}"
