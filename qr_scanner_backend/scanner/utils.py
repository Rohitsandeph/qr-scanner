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
    Split match_key by comma into keywords. ALL keywords must be found
    in QR #2's raw string (case-insensitive) for a match.
    Returns dict with is_match and message.
    """
    keywords = [k.strip() for k in match_key.split(',') if k.strip()]
    data = qr2_raw_data.strip()

    if not keywords:
        return {
            'is_match': False,
            'message': 'No match key provided',
        }

    data_lower = data.lower()
    missing = [k for k in keywords if k.lower() not in data_lower]

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
