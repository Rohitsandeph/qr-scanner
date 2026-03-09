import uuid

from django.conf import settings
from django.db import models


class ScanSession(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    first_qr_data = models.TextField()
    first_qr_id = models.CharField(max_length=255)
    second_qr_data = models.TextField(blank=True, null=True)
    second_qr_id = models.CharField(max_length=255, blank=True, null=True)
    is_match = models.BooleanField(null=True)
    scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='scan_sessions',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"ScanSession {self.session_id} - Match: {self.is_match}"
