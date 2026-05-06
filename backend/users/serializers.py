"""
Serializers for user registration and profile.
Serializers convert Python objects ↔ JSON.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles new user registration.
    - Validates password strength using Django's built-in validators.
    - Ensures password and confirm_password match.
    """

    password = serializers.CharField(
        write_only=True, required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True, required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password', 'confirm_password',
                  'phone', 'location', 'preferred_language')

    def validate(self, attrs):
        """Check that the two password fields match."""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        """Remove confirm_password before saving; hash the password properly."""
        validated_data.pop('confirm_password')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for reading and updating the authenticated user profile.
    id, email, created_at are always read-only.
    username, phone, location, preferred_language can be updated via PUT.
    """

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'phone', 'location',
                  'preferred_language', 'created_at')
        read_only_fields = ('id', 'email', 'created_at')
