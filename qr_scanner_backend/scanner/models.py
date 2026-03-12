import uuid

from django.conf import settings
from django.db import models


class ScanSession(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    first_qr_data = models.TextField()
    first_qr_id = models.CharField(max_length=255)
    match_key = models.TextField(blank=True, default='',
                                help_text='The key(s) used to search in QR #2')
    second_qr_data = models.TextField(blank=True, null=True)
    second_qr_id = models.CharField(max_length=255, blank=True, null=True)
    is_match = models.BooleanField(null=True)
    match_message = models.TextField(blank=True, default='')
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


class QRCode(models.Model):
    class Category(models.TextChoices):
        COIL = 'coil', 'Coil'
        OBJECT = 'object', 'Object'
        PRODUCED_ITEM = 'produced_item', 'Produced Item'
        CUSTOM = 'custom', 'Custom'

    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    value = models.TextField(help_text='Data encoded in the QR code')
    match_key = models.TextField(
        default='',
        help_text='Comma-separated keywords to search for when matching with another QR code',
    )
    label = models.CharField(max_length=255, blank=True, default='')
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.CUSTOM,
    )
    qr_image_base64 = models.TextField(help_text='Base64-encoded PNG image')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='qr_codes',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"QR: {self.label or self.value[:50]} ({self.category})"
