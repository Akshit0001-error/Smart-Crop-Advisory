"""
URL routes for the crop app.
All routes prefixed with /api/ (defined in root urls.py).
"""

from django.urls import path
from . import views

urlpatterns = [
    path('predict-crop/',           views.predict_crop_view,           name='predict-crop'),
    path('recommendation-history/', views.recommendation_history_view, name='recommendation-history'),
]
