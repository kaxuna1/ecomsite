#!/bin/bash

# Test Features Generation API

# First login to get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST 'http://localhost:4000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@luxia.local","password":"LuxiaAdmin2024!"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Token obtained successfully"
echo ""
echo "Testing features generation..."
echo ""

# Test features generation
curl -X POST "http://localhost:4000/api/admin/ai/generate-features?lang=en" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "productOrService": "Luxia Scalp Care Products",
    "industry": "E-commerce Beauty",
    "targetAudience": "Health-conscious women aged 25-45",
    "numberOfFeatures": 4,
    "focusArea": "benefits",
    "tone": "friendly",
    "language": "en"
  }' | jq .
