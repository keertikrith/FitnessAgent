#!/usr/bin/env bash
# Simple script to trigger the check-in endpoint locally or via deployed URL.
# Usage: ./scripts/send_checkins.sh [BASE_URL]
# If BASE_URL not provided, defaults to http://localhost:3000

BASE_URL=${1:-http://localhost:3000}

echo "Triggering check-ins at ${BASE_URL}/api/whatsapp/checkin"

curl -X POST "${BASE_URL}/api/whatsapp/checkin" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -s -w "\nHTTP_STATUS:%{http_code}\n"
