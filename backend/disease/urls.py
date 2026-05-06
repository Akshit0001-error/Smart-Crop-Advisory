"""
URL routes for the disease app.
All routes prefixed with /api/ (defined in root urls.py).
"""

from django.urls import path
from . import views

urlpatterns = [
    path('detect-disease/',  views.detect_disease_view,  name='detect-disease'),
    path('disease-history/', views.disease_history_view, name='disease-history'),
]
