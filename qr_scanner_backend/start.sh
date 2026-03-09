#!/usr/bin/env bash
set -o errexit

echo "==> Running migrations..."
python manage.py migrate 2>&1
echo "==> Creating admin user..."
python manage.py create_admin 2>&1
echo "==> Starting gunicorn..."
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-10000}"
