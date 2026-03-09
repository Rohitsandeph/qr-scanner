from django.urls import path
from .views import FirstScanView, MatchScanView, ScanHistoryView

urlpatterns = [
    path('first/', FirstScanView.as_view(), name='first-scan'),
    path('match/', MatchScanView.as_view(), name='match-scan'),
    path('history/', ScanHistoryView.as_view(), name='scan-history'),
]
