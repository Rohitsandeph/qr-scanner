import base64
import io

import qrcode
from qrcode.constants import ERROR_CORRECT_H


def generate_qr_base64(data: str, box_size: int = 10, border: int = 4) -> str:
    """Generate a QR code PNG and return as base64 string."""
    qr = qrcode.QRCode(
        version=None,  # auto-size
        error_correction=ERROR_CORRECT_H,  # 30% error correction — survives damage
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color='black', back_color='white')

    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def generate_qr_bytes(data: str, box_size: int = 10, border: int = 4) -> bytes:
    """Generate a QR code PNG and return as raw bytes."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color='black', back_color='white')

    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    return buffer.getvalue()
