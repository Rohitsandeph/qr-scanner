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
    QRCodeGenerateSerializer, QRCodeSerializer,
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

        # Look up QR #1 in database to find its match_key
        match_key = extracted_id  # default fallback
        qr_label = ''
        qr_found_in_db = False

        try:
            qr_code = QRCode.objects.get(value=qr_data.strip(), is_active=True)
            match_key = qr_code.match_key
            qr_label = qr_code.label
            qr_found_in_db = True
        except QRCode.DoesNotExist:
            # Try partial match — maybe the scanned data contains a known value
            try:
                qr_code = QRCode.objects.filter(
                    value__iexact=qr_data.strip(), is_active=True
                ).first()
                if qr_code:
                    match_key = qr_code.match_key
                    qr_label = qr_code.label
                    qr_found_in_db = True
            except Exception:
                pass

        if not qr_found_in_db:
            return Response({
                'error': 'This QR code is not registered in the system. It may be QR #2. Please scan QR #1 first.',
            }, status=status.HTTP_400_BAD_REQUEST)

        if not match_key or not match_key.strip():
            return Response({
                'error': 'This QR code does not have any match keywords. Please scan the correct QR #1 that contains match keywords.',
            }, status=status.HTTP_400_BAD_REQUEST)

        session = ScanSession.objects.create(
            first_qr_data=qr_data,
            first_qr_id=extracted_id,
            match_key=match_key,
            scanned_by=request.user,
        )

        return Response({
            'session_id': str(session.session_id),
            'extracted_id': extracted_id,
            'match_key': match_key,
            'qr_label': qr_label,
            'found_in_system': qr_found_in_db,
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

        # Use the match_key from QR #1 to search in QR #2's raw data
        result = check_match(session.match_key, qr_data)

        session.second_qr_data = qr_data
        session.second_qr_id = second_id
        session.is_match = result['is_match']
        session.match_message = result['message']
        session.completed_at = timezone.now()
        session.save()

        return Response({
            'is_match': result['is_match'],
            'match_key': session.match_key,
            'message': result['message'],
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
        match_key = serializer.validated_data['match_key']
        label = serializer.validated_data.get('label', '')

        qr_image_base64 = generate_qr_base64(value)

        qr_code = QRCode.objects.create(
            value=value,
            match_key=match_key,
            label=label,
            qr_image_base64=qr_image_base64,
            created_by=request.user,
        )

        return Response(
            QRCodeSerializer(qr_code).data,
            status=status.HTTP_201_CREATED,
        )
