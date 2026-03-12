from rest_framework import serializers
from .models import ScanSession, QRCode


class FirstScanSerializer(serializers.Serializer):
    qr_data = serializers.CharField()


class MatchScanSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    qr_data = serializers.CharField()


class ScanSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanSession
        fields = '__all__'


class QRCodeGenerateSerializer(serializers.Serializer):
    value = serializers.CharField()
    match_key = serializers.CharField(help_text='String to search for when matching')
    label = serializers.CharField(required=False, default='', allow_blank=True)
    category = serializers.ChoiceField(
        choices=QRCode.Category.choices,
        required=False,
        default='custom',
    )


class QRCodeSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True, default=None
    )

    class Meta:
        model = QRCode
        fields = [
            'id', 'uuid', 'value', 'match_key', 'label', 'category',
            'qr_image_base64', 'created_by', 'created_by_username',
            'created_at', 'is_active',
        ]
        read_only_fields = ['id', 'uuid', 'qr_image_base64', 'created_by', 'created_at']
