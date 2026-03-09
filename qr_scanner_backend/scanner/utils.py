import json
from urllib.parse import urlparse, parse_qs


def extract_id(qr_data: str) -> str:
    # Try JSON parse
    try:
        data = json.loads(qr_data)
        if isinstance(data, dict):
            for key in ['id', 'ID', 'Id', 'orderId', 'order_id', 'orderID']:
                if key in data:
                    return str(data[key])
    except (json.JSONDecodeError, TypeError):
        pass

    # Try URL parse
    try:
        parsed = urlparse(qr_data)
        if parsed.scheme and parsed.netloc:
            params = parse_qs(parsed.query)
            for key in ['id', 'ID', 'Id', 'orderId', 'order_id']:
                if key in params:
                    return params[key][0]
    except Exception:
        pass

    # Fallback: use entire string as ID
    return qr_data.strip()


def check_match(first_id: str, second_qr_data: str) -> bool:
    # Try JSON parse of second QR data
    try:
        data = json.loads(second_qr_data)
        if isinstance(data, dict):
            for key in ['id', 'ID', 'Id', 'orderId', 'order_id', 'orderID']:
                if key in data and str(data[key]) == first_id:
                    return True
    except (json.JSONDecodeError, TypeError):
        pass

    # Try URL parse
    try:
        parsed = urlparse(second_qr_data)
        if parsed.scheme and parsed.netloc:
            params = parse_qs(parsed.query)
            for key in ['id', 'ID', 'Id', 'orderId', 'order_id']:
                if key in params and params[key][0] == first_id:
                    return True
    except Exception:
        pass

    # Exact match
    if second_qr_data.strip() == first_id:
        return True

    # Substring match
    if first_id in second_qr_data:
        return True

    return False
