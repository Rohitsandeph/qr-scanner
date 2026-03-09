import base64

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsGeneratorOrAdmin
from .models import ScanSession, QRCode
from .serializers import (
    FirstScanSerializer, MatchScanSerializer, ScanSessionSerializer,
    QRCodeGenerateSerializer, BulkQRCodeGenerateSerializer,
    QRCodeSerializer, QRCodeListSerializer,
)
from .qr_generator import generate_qr_base64
from .utils import extract_id, check_match


# ===== Scan Views =====

class FirstScanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FirstScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qr_data = serializer.validated_data['qr_data']
        extracted_id = extract_id(qr_data)

        session = ScanSession.objects.create(
            first_qr_data=qr_data,
            first_qr_id=extracted_id,
            scanned_by=request.user,
        )

        return Response({
            'session_id': str(session.session_id),
            'extracted_id': extracted_id,
        }, status=status.HTTP_201_CREATED)


class MatchScanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MatchScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data['session_id']
        qr_data = serializer.validated_data['qr_data']

        try:
            session = ScanSession.objects.get(session_id=session_id)
        except ScanSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        second_id = extract_id(qr_data)
        is_match = check_match(session.first_qr_id, qr_data)

        session.second_qr_data = qr_data
        session.second_qr_id = second_id
        session.is_match = is_match
        session.completed_at = timezone.now()
        session.save()

        return Response({
            'is_match': is_match,
            'first_id': session.first_qr_id,
            'second_id': second_id,
            'second_data': qr_data,
        })


class ScanHistoryView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ScanSessionSerializer

    def get_queryset(self):
        return ScanSession.objects.filter(
            scanned_by=self.request.user,
        ).order_by('-created_at')


# ===== QR Code Generation Views =====

class QRCodeGenerateView(APIView):
    permission_classes = [IsGeneratorOrAdmin]

    def post(self, request):
        serializer = QRCodeGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        value = serializer.validated_data['value']
        label = serializer.validated_data.get('label', '')
        category = serializer.validated_data.get('category', 'custom')

        qr_image_base64 = generate_qr_base64(value)

        qr_code = QRCode.objects.create(
            value=value,
            label=label,
            category=category,
            qr_image_base64=qr_image_base64,
            created_by=request.user,
        )

        return Response(
            QRCodeSerializer(qr_code).data,
            status=status.HTTP_201_CREATED,
        )


class BulkQRCodeGenerateView(APIView):
    permission_classes = [IsGeneratorOrAdmin]

    def post(self, request):
        serializer = BulkQRCodeGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        prefix = serializer.validated_data['prefix']
        start = serializer.validated_data['start']
        end = serializer.validated_data['end']
        padding = serializer.validated_data.get('padding', 3)
        category = serializer.validated_data.get('category', 'custom')

        created = []
        for i in range(start, end + 1):
            value = f"{prefix}{str(i).zfill(padding)}"
            qr_image_base64 = generate_qr_base64(value)
            qr_code = QRCode.objects.create(
                value=value,
                label=value,
                category=category,
                qr_image_base64=qr_image_base64,
                created_by=request.user,
            )
            created.append(qr_code)

        return Response({
            'count': len(created),
            'qr_codes': QRCodeListSerializer(created, many=True).data,
        }, status=status.HTTP_201_CREATED)


class QRCodeListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = QRCodeListSerializer

    def get_queryset(self):
        qs = QRCode.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(
                models_Q_label_value(search)
            )
        return qs


def models_Q_label_value(search):
    from django.db.models import Q
    return Q(label__icontains=search) | Q(value__icontains=search)


class QRCodeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        try:
            qr_code = QRCode.objects.get(uuid=uuid, is_active=True)
        except QRCode.DoesNotExist:
            return Response({'error': 'QR code not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(QRCodeSerializer(qr_code).data)

    def delete(self, request, uuid):
        try:
            qr_code = QRCode.objects.get(uuid=uuid)
        except QRCode.DoesNotExist:
            return Response({'error': 'QR code not found'}, status=status.HTTP_404_NOT_FOUND)
        qr_code.is_active = False
        qr_code.save()
        return Response({'status': 'deleted'}, status=status.HTTP_200_OK)


class QRCodeDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        try:
            qr_code = QRCode.objects.get(uuid=uuid, is_active=True)
        except QRCode.DoesNotExist:
            return Response({'error': 'QR code not found'}, status=status.HTTP_404_NOT_FOUND)

        image_bytes = base64.b64decode(qr_code.qr_image_base64)
        filename = f"qr_{qr_code.label or qr_code.uuid}.png"

        response = HttpResponse(image_bytes, content_type='image/png')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
