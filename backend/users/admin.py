from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Show extra fields in the Django Admin panel."""
    list_display = ('username', 'email', 'phone', 'location', 'is_active', 'created_at')
    list_filter = ('is_active', 'preferred_language')
    search_fields = ('username', 'email', 'phone')

    # Add our custom fields to the admin form
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('phone', 'location', 'preferred_language')}),
    )
