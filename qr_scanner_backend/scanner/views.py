import json

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
from .utils import extract_id, check_match, parse_qr1_data


def _extract_data_field(qr_raw: str) -> str:
    """Extract the 'data' field from a JSON QR code, or return the raw string."""
    try:
        parsed = json.loads(qr_raw)
        if isinstance(parsed, dict) and 'data' in parsed:
            return str(parsed['data'])
    except (json.JSONDecodeError, TypeError):
        pass
    return qr_raw.strip()


# ===== Scan Views =====

class FirstScanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FirstScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qr_data = serializer.validated_data['qr_data']

        # Accept any QR code — JSON (generated) or plain (external)
        parsed = parse_qr1_data(qr_data)
        if parsed and parsed.get('match', '').strip():
            # Generated QR code with match keywords
            match_key = parsed['match'].strip()
            extracted_data = parsed.get('data', '')
            extracted_id = extract_id(extracted_data) if extracted_data else ''
        else:
            # Plain QR code — keywords will come from the second scan
            match_key = ''
            extracted_id = extract_id(qr_data)

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

        # Reject if the same QR is scanned again
        if qr_data.strip() == session.first_qr_data.strip():
            return Response({
                'error': 'You scanned the same QR code twice. Please scan a different QR code.',
            }, status=status.HTTP_400_BAD_REQUEST)

        second_parsed = parse_qr1_data(qr_data)
        first_has_keywords = bool(session.match_key)
        second_has_keywords = second_parsed is not None and bool(second_parsed.get('match', '').strip())

        # Both are generated QR codes
        if first_has_keywords and second_has_keywords:
            return Response({
                'error': 'Both QR codes are generated codes. One must be a plain QR code.',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Neither has match keywords
        if not first_has_keywords and not second_has_keywords:
            return Response({
                'error': 'Neither QR code contains match keywords. One must be a generated QR code.',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Determine which has keywords and which is the plain text
        if first_has_keywords:
            # First scan was generated QR with keywords, second is the plain one
            match_key = session.match_key
            plain_text = _extract_data_field(qr_data)
        else:
            # First scan was plain, second is the generated QR with keywords
            match_key = second_parsed['match'].strip()
            plain_text = _extract_data_field(session.first_qr_data)
            # Update session with the discovered match_key
            session.match_key = match_key

        second_id = extract_id(qr_data)

        result = check_match(match_key, plain_text)

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

        qr_payload = json.dumps({"data": value, "match": match_key})
        qr_image_base64 = generate_qr_base64(qr_payload)

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
