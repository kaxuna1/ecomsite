#!/bin/bash

BASE_URL="http://localhost:4000/api"

echo "=========================================="
echo "Testing Site Settings API"
echo "=========================================="
echo ""

echo "1. Testing PUBLIC endpoint (no auth required):"
echo "GET /api/settings/public"
curl -s $BASE_URL/settings/public | jq '.'
echo ""
echo ""

echo "2. Testing ADMIN endpoints (require authentication):"
echo ""

echo "2a. GET /api/settings (without auth - should fail):"
curl -s $BASE_URL/settings | jq '.'
echo ""
echo ""

echo "NOTE: To test authenticated endpoints, you need to:"
echo "  1. Login as admin: POST /api/auth/login"
echo "  2. Get JWT token from response"
echo "  3. Use token in Authorization header: 'Bearer <token>'"
echo ""

echo "Example authenticated request:"
echo "  curl -H 'Authorization: Bearer <TOKEN>' $BASE_URL/settings"
echo ""

echo "Example update settings:"
echo "  curl -X PUT -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \\"
echo "       -d '{\"logoType\":\"image\",\"logoImageUrl\":\"/uploads/logo/logo-123.png\"}' \\"
echo "       $BASE_URL/settings"
echo ""

echo "Example upload logo:"
echo "  curl -X POST -H 'Authorization: Bearer <TOKEN>' \\"
echo "       -F 'logo=@/path/to/logo.png' \\"
echo "       $BASE_URL/settings/logo"
echo ""
