#!/bin/bash

# Test CMS Translation Synchronization

# Get fresh token
echo "Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@luxia.local", "password": "LuxiaAdmin2024!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "Login failed!"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "Login successful, token received"
echo ""

# Test 1: Sync all translations for home page (page_id = 1)
echo "=== Test 1: Syncing all block translations for home page ==="
curl -s -X POST "http://localhost:4000/api/cms/admin/pages/1/sync-translations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" | jq .

echo ""
echo "=== Verifying sync worked ==="
echo "Checking Georgian hero block template..."
curl -s "http://localhost:4000/api/cms/pages/home/public?lang=ka" | jq '.blocks[0].content.template'

echo "Checking English hero block template..."
curl -s "http://localhost:4000/api/cms/pages/home/public?lang=en" | jq '.blocks[0].content.template'

echo ""
echo "Both should now match: asymmetric-bold"
