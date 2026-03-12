from django.urls import path
from .views import (
    FirstScanView, MatchScanView, ScanHistoryView,
    QRCodeGenerateView,
)

urlpatterns = [
    # Scanning
    path('first/', FirstScanView.as_view(), name='first-scan'),
    path('match/', MatchScanView.as_view(), name='match-scan'),
    path('history/', ScanHistoryView.as_view(), name='scan-history'),
    # QR Code Generation
    path('qrcodes/generate/', QRCodeGenerateView.as_view(), name='qrcode-generate'),
]
