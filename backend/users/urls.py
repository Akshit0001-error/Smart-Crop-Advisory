"""
URL routes for the users app.
All routes are prefixed with /api/auth/ (defined in root urls.py).
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/',      views.register_view,           name='user-register'),
    path('login/',         views.login_view,              name='user-login'),
    path('token/refresh/', TokenRefreshView.as_view(),    name='token-refresh'),
    path('profile/',       views.profile_view,            name='user-profile'),
]
