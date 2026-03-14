from __future__ import annotations

import json
from urllib.parse import urlparse, parse_qs


def parse_qr1_data(qr_data: str) -> dict | None:
    """
    Parse QR1 JSON format: {"data": "...", "match": "keyword1, keyword2"}
    Returns dict with 'data' and 'match' keys, or None if not valid QR1 format.
    """
    try:
        parsed = json.loads(qr_data)
        if isinstance(parsed, dict) and parsed.get('match', '').strip():
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass
    return None


def extract_id(qr_data: str) -> str:
    """Extract the most meaningful ID from QR data (used as fallback)."""
    # Try JSON parse
    try:
        data = json.loads(qr_data)
        if isinstance(data, dict):
            for key in ['id', 'ID', 'Id', 'orderId', 'order_id', 'orderID',
                        'coilId', 'coil_id', 'itemId', 'item_id', 'code',
                        'serial', 'serialNumber', 'serial_number']:
                if key in data:
                    return str(data[key])
    except (json.JSONDecodeError, TypeError):
        pass

    # Try URL parse
    try:
        parsed = urlparse(qr_data)
        if parsed.scheme and parsed.netloc:
            params = parse_qs(parsed.query)
            for key in ['id', 'ID', 'Id', 'orderId', 'order_id',
                        'coilId', 'coil_id', 'itemId', 'item_id', 'code']:
                if key in params:
                    return params[key][0]
    except Exception:
        pass

    # Fallback: entire string
    return qr_data.strip()


def check_match(match_key: str, qr2_raw_data: str) -> dict:
    """
    Check if QR #1's comma-separated match keywords are all found
    in QR #2's plain string (case-insensitive substring search).
    """
    keywords = [k.strip() for k in match_key.split(',') if k.strip()]

    if not keywords:
        return {
            'is_match': False,
            'message': 'No match key provided',
        }

    qr2_lower = qr2_raw_data.strip().lower()
    missing = [k for k in keywords if k.lower() not in qr2_lower]

    if not missing:
        kw_display = '", "'.join(keywords)
        return {
            'is_match': True,
            'message': f'All keywords ("{kw_display}") found in QR #2',
        }

    missing_display = '", "'.join(missing)
    return {
        'is_match': False,
        'message': f'Keywords not found in QR #2: "{missing_display}"',
    }
