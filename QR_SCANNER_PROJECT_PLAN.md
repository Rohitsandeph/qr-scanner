# QR Code Scanner — Two-Step Matching App

## Project Plan for Claude CLI

---

## Overview

Build a web-based QR code scanner that scans two QR codes sequentially, extracts an ID from the first, then checks if the same ID exists in the second QR code. Displays match/no-match result on screen.

**Tech Stack:** Django REST Framework (backend) + React with TypeScript (frontend)

---

## Architecture

```
┌─────────────────────────┐       ┌──────────────────────────────┐
│     React + TypeScript   │       │   Django REST Framework       │
│     (Frontend - Vite)    │◄─────►│   (Backend API)               │
│                          │       │                                │
│  - Camera access         │       │  - POST /api/scan/first/       │
│  - QR decoding (jsQR)   │       │  - POST /api/scan/match/       │
│  - UI state machine      │       │  - GET  /api/scan/history/     │
│  - Result display        │       │  - Scan session management     │
└─────────────────────────┘       │  - SQLite DB (dev)             │
                                   └──────────────────────────────┘
```

---

## Backend — Django REST Framework

### 1. Project Setup

```
qr_scanner_backend/
├── manage.py
├── requirements.txt          # django, djangorestframework, django-cors-headers
├── config/
│   ├── __init__.py
│   ├── settings.py           # REST_FRAMEWORK config, CORS config
│   ├── urls.py
│   └── wsgi.py
└── scanner/
    ├── __init__.py
    ├── models.py
    ├── serializers.py
    ├── views.py
    ├── urls.py
    └── admin.py
```

### 2. Model — `ScanSession`

```python
# scanner/models.py
class ScanSession(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    first_qr_data = models.TextField()              # raw content of QR #1
    first_qr_id = models.CharField(max_length=255)   # extracted ID from QR #1
    second_qr_data = models.TextField(blank=True, null=True)  # raw content of QR #2
    second_qr_id = models.CharField(max_length=255, blank=True, null=True)
    is_match = models.BooleanField(null=True)         # True/False/None(pending)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
```

### 3. API Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|-------------|----------|
| POST | `/api/scan/first/` | Register first QR scan | `{ "qr_data": "..." }` | `{ "session_id": "uuid", "extracted_id": "..." }` |
| POST | `/api/scan/match/` | Submit second QR and check match | `{ "session_id": "uuid", "qr_data": "..." }` | `{ "is_match": true/false, "first_id": "...", "second_data": "..." }` |
| GET | `/api/scan/history/` | List past scan sessions | — | `[{ session_id, first_qr_id, is_match, created_at }, ...]` |

### 4. ID Extraction Logic (Backend Utility)

Create a utility function that tries multiple strategies to extract an ID:

```python
# scanner/utils.py
def extract_id(qr_data: str) -> str:
    """
    Try to extract an ID from QR data using multiple strategies:
    1. Try JSON parse → look for 'id', 'orderId', 'ID', etc.
    2. Try URL parse → look for 'id' query parameter
    3. Fallback → use the entire string as the ID (plain text)
    """
```

### 5. Match Logic (Backend)

```python
# scanner/utils.py
def check_match(first_id: str, second_qr_data: str) -> bool:
    """
    Check if first_id exists in second QR data:
    1. Try JSON parse of second_qr_data → check if first_id matches any value
    2. Try URL parse → check if first_id is in query params
    3. Fallback → check if first_id is a substring of second_qr_data
    4. Exact match as final check
    """
```

### 6. Serializers

```python
# scanner/serializers.py
class FirstScanSerializer(serializers.Serializer):
    qr_data = serializers.CharField()

class MatchScanSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    qr_data = serializers.CharField()

class ScanSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanSession
        fields = '__all__'
```

### 7. Views

- `FirstScanView(APIView)` — accepts QR #1 data, extracts ID, creates ScanSession, returns session_id + extracted_id
- `MatchScanView(APIView)` — accepts session_id + QR #2 data, runs match logic, updates ScanSession, returns result
- `ScanHistoryView(ListAPIView)` — returns past sessions ordered by created_at descending

### 8. Settings to Configure

- `django-cors-headers` — allow frontend origin (e.g., `http://localhost:5173`)
- `REST_FRAMEWORK` — default permission classes (AllowAny for dev)
- `DATABASES` — SQLite for dev

---

## Frontend — React + TypeScript (Vite)

### 1. Project Setup

```
qr_scanner_frontend/
├── package.json              # react, typescript, jsqr, axios
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/
    │   └── scannerApi.ts     # axios calls to Django API
    ├── components/
    │   ├── QRScanner.tsx      # camera + QR decode component
    │   ├── ScanResult.tsx     # match/no-match display
    │   ├── StepIndicator.tsx  # visual step tracker (Step 1/2/Result)
    │   └── ScanHistory.tsx    # optional: list of past scans
    ├── hooks/
    │   └── useQRScanner.ts   # custom hook: camera stream + jsQR decode loop
    ├── types/
    │   └── index.ts          # TypeScript interfaces
    └── styles/
        └── index.css         # Tailwind or plain CSS
```

### 2. TypeScript Types

```typescript
// src/types/index.ts

type ScanPhase = 'SCAN_FIRST' | 'SCAN_SECOND' | 'RESULT';

interface ScanSession {
  sessionId: string;
  extractedId: string;
}

interface MatchResult {
  isMatch: boolean;
  firstId: string;
  secondData: string;
}

interface ScanHistoryItem {
  sessionId: string;
  firstQrId: string;
  isMatch: boolean | null;
  createdAt: string;
}
```

### 3. Custom Hook — `useQRScanner`

```
Purpose: Manage camera stream and QR code detection loop.

Responsibilities:
- Request camera permission via navigator.mediaDevices.getUserMedia
- Attach stream to a <video> element ref
- Run a requestAnimationFrame loop that:
  - Draws video frame to an offscreen <canvas>
  - Passes pixel data to jsQR() for decoding
  - On successful decode, call a callback with the QR data string
  - Debounce/throttle to avoid duplicate scans (e.g., ignore same QR for 2 seconds)
- Cleanup: stop camera tracks on unmount

Returns: { videoRef, canvasRef, isScanning, error, startScanning, stopScanning }
```

### 4. Component Flow — `App.tsx`

```
State:
  - phase: ScanPhase (SCAN_FIRST → SCAN_SECOND → RESULT)
  - session: ScanSession | null
  - result: MatchResult | null
  - error: string | null

Flow:
  1. phase === 'SCAN_FIRST':
     - Render QRScanner component
     - Header: "Step 1: Scan the first QR code"
     - On QR detected → call POST /api/scan/first/ with qr_data
     - On success → store session, move to SCAN_SECOND

  2. phase === 'SCAN_SECOND':
     - Render QRScanner component
     - Header: "Step 2: Scan the second QR code"
     - Show extracted ID from step 1 on screen
     - On QR detected → call POST /api/scan/match/ with session_id + qr_data
     - On success → store result, move to RESULT

  3. phase === 'RESULT':
     - Stop camera
     - Render ScanResult component
     - If match: green checkmark + "IDs Match!" + both IDs shown
     - If no match: red X + "IDs Do NOT Match" + both values shown
     - "Scan Again" button → reset to SCAN_FIRST
```

### 5. API Layer — `scannerApi.ts`

```typescript
// Axios instance with baseURL = http://localhost:8000/api

export const submitFirstScan = async (qrData: string): Promise<ScanSession> => { ... }
export const submitMatchScan = async (sessionId: string, qrData: string): Promise<MatchResult> => { ... }
export const fetchHistory = async (): Promise<ScanHistoryItem[]> => { ... }
```

### 6. QRScanner Component

```
Props: { onScan: (data: string) => void, isActive: boolean }

Renders:
  - Full-width video element with camera feed
  - Scanning overlay with animated border/crosshair
  - Hidden canvas for frame processing
  - "Initializing camera..." loading state
  - Error state if camera access denied

Uses: useQRScanner hook
```

### 7. UI/UX Design Notes

- Fullscreen camera view with a semi-transparent overlay
- Scanning area box in the center (visual guide for where to point)
- Step indicator at top (Step 1 → Step 2 → Result) with progress bar
- Extracted ID shown as a badge/chip after Step 1
- Result screen with large icon (checkmark/cross), IDs compared side by side
- Mobile-first responsive design (this is primarily a phone use case)
- Add haptic feedback / vibration on successful scan (`navigator.vibrate(200)`)

---

## Step-by-Step Build Order (for Claude CLI)

### Phase 1: Backend Setup
1. Create Django project: `django-admin startproject config .` inside `qr_scanner_backend/`
2. Create scanner app: `python manage.py startapp scanner`
3. Install dependencies: `pip install django djangorestframework django-cors-headers`
4. Configure `settings.py` — add apps, CORS, REST_FRAMEWORK
5. Create `ScanSession` model + migrate
6. Create `utils.py` with `extract_id()` and `check_match()` functions
7. Create serializers
8. Create views (FirstScanView, MatchScanView, ScanHistoryView)
9. Wire up URLs
10. Test with `curl` or Postman

### Phase 2: Frontend Setup
1. Create Vite + React + TypeScript project: `npm create vite@latest qr_scanner_frontend -- --template react-ts`
2. Install dependencies: `npm install jsqr axios`
3. Define TypeScript types
4. Build `useQRScanner` custom hook
5. Build `QRScanner` component (camera + decode)
6. Build `scannerApi.ts` (API calls)
7. Build `App.tsx` with state machine (SCAN_FIRST → SCAN_SECOND → RESULT)
8. Build `ScanResult` component
9. Build `StepIndicator` component
10. Style everything (Tailwind or CSS)
11. Test end-to-end with real QR codes

### Phase 3: Polish
1. Add scan history page/component
2. Add error handling (camera denied, API down, invalid QR)
3. Add loading spinners during API calls
4. Add sound/vibration feedback on scan
5. Add duplicate scan prevention (debounce)
6. Mobile responsiveness testing

---

## QR Code Test Data

For testing, generate QR codes with these values:

**Matching pair:**
- QR #1: `ORDER-12345`
- QR #2: `ORDER-12345`

**Matching pair (JSON):**
- QR #1: `{"id": "PKG-9876", "type": "sender"}`
- QR #2: `{"id": "PKG-9876", "type": "receiver", "name": "John"}`

**Non-matching pair:**
- QR #1: `ABC-111`
- QR #2: `XYZ-999`

Use any free QR generator (e.g., qr-code-generator.com) to create test codes.

---

## Commands Summary

```bash
# Backend
cd qr_scanner_backend
python -m venv venv
source venv/bin/activate
pip install django djangorestframework django-cors-headers
django-admin startproject config .
python manage.py startapp scanner
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

# Frontend
cd qr_scanner_frontend
npm create vite@latest . -- --template react-ts
npm install jsqr axios
npm run dev
```

---

## Key Dependencies

**Backend (requirements.txt):**
```
django>=4.2
djangorestframework>=3.14
django-cors-headers>=4.3
```

**Frontend (package.json):**
```
react, react-dom, typescript
jsqr (QR decoding from camera frames)
axios (HTTP client)
```

---

## Notes for Claude CLI

- Use `jsQR` library for QR decoding — it works purely from pixel data (no native dependencies)
- Camera access requires HTTPS in production (localhost is exempt during dev)
- The backend stores scan sessions so you can track history, but the core matching logic is simple
- The `extract_id` utility should be flexible — handle plain text, JSON, and URL formats
- Keep the frontend mobile-first since QR scanning is primarily a phone activity
- Use environment variables for the API base URL (don't hardcode localhost)
