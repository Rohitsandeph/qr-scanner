"""
WSGI config for config project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()

# Auto-run migrations and create admin on startup
try:
    from django.core.management import call_command
    print("==> Running migrations...")
    call_command('migrate', '--no-input')
    print("==> Creating admin user...")
    call_command('create_admin')
    print("==> Startup complete.")
except Exception as e:
    print(f"==> Startup warning: {e}")
