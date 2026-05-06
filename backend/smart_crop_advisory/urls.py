"""
Root URL configuration for Smart Crop Advisory System
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # API routes — each app owns its own URL file
    path('api/auth/',   include('users.urls')),
    path('api/',        include('crop.urls')),
    path('api/',        include('disease.urls')),
]

# Serve uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
