#!/usr/bin/env bash
set -o errexit

python manage.py migrate
python manage.py create_admin
exec gunicorn config.wsgi:application
