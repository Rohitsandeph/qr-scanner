from django.urls import path
from .views import (
    FirstScanView, MatchScanView, ScanHistoryView,
    QRCodeGenerateView, BulkQRCodeGenerateView,
    QRCodeListView, QRCodeDetailView, QRCodeDownloadView,
)

urlpatterns = [
    # Scanning
    path('first/', FirstScanView.as_view(), name='first-scan'),
    path('match/', MatchScanView.as_view(), name='match-scan'),
    path('history/', ScanHistoryView.as_view(), name='scan-history'),
    # QR Code Generation
    path('qrcodes/generate/', QRCodeGenerateView.as_view(), name='qrcode-generate'),
    path('qrcodes/bulk-generate/', BulkQRCodeGenerateView.as_view(), name='qrcode-bulk-generate'),
    path('qrcodes/', QRCodeListView.as_view(), name='qrcode-list'),
    path('qrcodes/<uuid:uuid>/', QRCodeDetailView.as_view(), name='qrcode-detail'),
    path('qrcodes/<uuid:uuid>/download/', QRCodeDownloadView.as_view(), name='qrcode-download'),
]
