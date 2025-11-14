#!/bin/bash

# Test script to verify check-in endpoints locally
# Usage: ./test-checkins.sh [base_url]

BASE_URL="${1:-http://localhost:3000}"

echo "🧪 Testing Check-In Endpoints"
echo "Base URL: $BASE_URL"
echo ""

# Test check-in endpoint
echo "📤 Testing Check-In Endpoint (POST /api/whatsapp/checkin)"
curl -X POST "$BASE_URL/api/whatsapp/checkin" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -s | jq '.'

echo ""
echo "---"
echo ""

# Test report endpoint
echo "📊 Testing Report Endpoint (POST /api/whatsapp/checkin/report)"
curl -X POST "$BASE_URL/api/whatsapp/checkin/report" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -s | jq '.'

echo ""
echo "---"
echo ""

# Test with specific user
echo "👤 Testing Check-In with Specific User"
curl -X POST "$BASE_URL/api/whatsapp/checkin" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}' \
  -s | jq '.'

echo ""
echo "✅ Tests complete!"
echo ""
echo "📋 Notes:"
echo "- If outside scheduled hours (9, 12, 15, 18, 21, 22), endpoint returns 'not a check-in time'"
echo "- Check Supabase 'ai_checkins' table to see records created"
echo "- Check WhatsApp for actual messages (requires Twilio setup)"
