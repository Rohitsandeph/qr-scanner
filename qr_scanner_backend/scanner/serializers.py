from rest_framework import serializers
from .models import ScanSession


class FirstScanSerializer(serializers.Serializer):
    qr_data = serializers.CharField()


class MatchScanSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    qr_data = serializers.CharField()


class ScanSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanSession
        fields = '__all__'
