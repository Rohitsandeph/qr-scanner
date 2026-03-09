import json
from urllib.parse import urlparse, parse_qs


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
    Search match_key in QR #2's entire raw string (case-insensitive).
    Returns dict with is_match, message, and matched_portion.
    """
    key = match_key.strip()
    data = qr2_raw_data.strip()

    if not key:
        return {
            'is_match': False,
            'message': 'No match key provided',
            'matched_portion': None,
        }

    # Case-insensitive search
    pos = data.lower().find(key.lower())

    if pos != -1:
        matched = data[pos:pos + len(key)]
        return {
            'is_match': True,
            'message': f'Match key "{key}" found in QR #2',
            'matched_portion': matched,
        }

    return {
        'is_match': False,
        'message': f'Match key "{key}" not found in QR #2',
        'matched_portion': None,
    }
