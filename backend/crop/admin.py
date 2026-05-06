from django.contrib import admin
from .models import CropRecommendation


@admin.register(CropRecommendation)
class CropRecommendationAdmin(admin.ModelAdmin):
    list_display  = ('recommended_crop', 'confidence', 'user', 'temperature',
                     'rainfall', 'ph', 'created_at')
    list_filter   = ('recommended_crop',)
    search_fields = ('recommended_crop', 'user__email')
    readonly_fields = ('created_at',)
