#!/usr/bin/env bash
set -o errexit

# Build React frontend
cd ../qr_scanner_frontend
npm install
npm run build

# Copy build output into Django
rm -rf ../qr_scanner_backend/frontend_dist
cp -r dist ../qr_scanner_backend/frontend_dist

# Back to backend
cd ../qr_scanner_backend
pip install -r requirements.txt
python manage.py collectstatic --no-input
