"""
Custom User model for Smart Crop Advisory System.
Extends AbstractUser to add extra fields like phone and location.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    Extended user model.
    - email is made unique so users can log in with email.
    - phone and location are optional profile fields.
    """

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True,
                                help_text="Village / District / State")
    preferred_language = models.CharField(
        max_length=5,
        choices=[('en', 'English'), ('hi', 'Hindi')],
        default='en'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Use email as the login field instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.username} ({self.email})"
