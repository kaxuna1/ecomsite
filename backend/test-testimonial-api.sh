#!/bin/bash

# First login to get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST 'http://localhost:4000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@luxia.local","password":"LuxiaAdmin2024!"}')

echo "Login response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Token: $TOKEN"
echo ""
echo "Testing testimonial generation..."
echo ""

# Test testimonial generation
curl -X POST "http://localhost:4000/api/admin/ai/generate-testimonials?lang=en" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "productName": "Eliokap",
    "productType": "Hair Care",
    "industry": "Beauty",
    "targetAudience": "Luxury",
    "numberOfTestimonials": 3,
    "tone": "enthusiastic",
    "includeSpecificBenefits": [],
    "diverseProfiles": true,
    "language": "en"
  }' | jq .
