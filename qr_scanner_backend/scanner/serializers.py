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
    label = serializers.CharField(required=False, default='')
    category = serializers.ChoiceField(
        choices=QRCode.Category.choices,
        required=False,
        default='custom',
    )


class BulkQRCodeGenerateSerializer(serializers.Serializer):
    prefix = serializers.CharField()
    start = serializers.IntegerField(min_value=0)
    end = serializers.IntegerField(min_value=1)
    padding = serializers.IntegerField(min_value=1, default=3)
    category = serializers.ChoiceField(
        choices=QRCode.Category.choices,
        required=False,
        default='custom',
    )
    match_key_prefix = serializers.CharField(
        required=False,
        default='',
        help_text='Prefix for match keys. If empty, uses same as value.',
    )

    def validate(self, attrs):
        if attrs['end'] <= attrs['start']:
            raise serializers.ValidationError('End must be greater than start.')
        if attrs['end'] - attrs['start'] > 500:
            raise serializers.ValidationError('Cannot generate more than 500 QR codes at once.')
        return attrs


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


class QRCodeListSerializer(serializers.ModelSerializer):
    """Lighter serializer without the full base64 image for list views."""
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True, default=None
    )

    class Meta:
        model = QRCode
        fields = [
            'id', 'uuid', 'value', 'match_key', 'label', 'category',
            'created_by_username', 'created_at', 'is_active',
        ]
