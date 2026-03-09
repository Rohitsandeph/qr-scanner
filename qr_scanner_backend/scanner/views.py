from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ScanSession
from .serializers import FirstScanSerializer, MatchScanSerializer, ScanSessionSerializer
from .utils import extract_id, check_match


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
