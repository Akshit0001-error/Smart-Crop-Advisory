from django.contrib import admin
from .models import DiseaseDetection


@admin.register(DiseaseDetection)
class DiseaseDetectionAdmin(admin.ModelAdmin):
    list_display  = ('disease', 'confidence', 'user', 'created_at')
    list_filter   = ('disease',)
    search_fields = ('disease', 'user__email')
    readonly_fields = ('created_at',)
