#!/bin/bash

# Test Automatic Translation Synchronization on Block Update

echo "=== Testing Automatic Translation Sync ==="
echo ""

# Get fresh token
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@luxia.local", "password": "LuxiaAdmin2024!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "Login failed!"
  exit 1
fi

echo "   ✓ Login successful"
echo ""

# First, let's deliberately create a mismatch by changing Georgian template back to split-screen
echo "2. Creating intentional mismatch (setting Georgian template to 'split-screen')..."
curl -s -X POST "http://localhost:4000/api/cms/blocks/1/translations/ka" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "type": "hero",
      "template": "split-screen",
      "headline": "გარდაქმენით თქვენი თავის კანის ჯანმრთელობა",
      "subheadline": "Test Georgian text"
    }
  }' > /dev/null

echo "   ✓ Georgian template set to 'split-screen'"
echo ""

# Check mismatch
echo "3. Verifying mismatch exists..."
EN_TEMPLATE=$(curl -s "http://localhost:4000/api/cms/pages/home/public?lang=en" | jq -r '.blocks[0].content.template')
KA_TEMPLATE=$(curl -s "http://localhost:4000/api/cms/pages/home/public?lang=ka" | jq -r '.blocks[0].content.template')

echo "   English template: ${EN_TEMPLATE}"
echo "   Georgian template: ${KA_TEMPLATE}"

if [ "$EN_TEMPLATE" != "$KA_TEMPLATE" ]; then
  echo "   ✓ Mismatch confirmed"
else
  echo "   ✗ No mismatch - test cannot proceed"
  exit 1
fi
echo ""

# Now update the English block template - this should AUTO-SYNC Georgian
echo "4. Updating English block template to 'full-width' (should auto-sync)..."
curl -s -X PATCH "http://localhost:4000/api/cms/blocks/1" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "type": "hero",
      "template": "full-width",
      "headline": "Luxury Hair Care Redefined",
      "subheadline": "Experience premium scalp science",
      "description": "Transform your hair care ritual",
      "ctaText": "Explore Collection",
      "ctaLink": "/en/products",
      "backgroundImage": "http://localhost:4000/api/uploads/cms/1761774055641-j88em9-photo-1535585209827-a15fcdbc4c2d.webp",
      "backgroundImageAlt": "",
      "style": {
        "textColor": "#ffffff",
        "accentColor": "#fbbf24",
        "secondaryColor": "#4ade80",
        "backgroundColor": "#1a3a1a",
        "enableAnimations": true
      },
      "textAlignment": "center",
      "overlayOpacity": 33
    }
  }' > /dev/null

echo "   ✓ English block updated"
echo ""

# Give it a moment to process
sleep 1

# Check if auto-sync worked
echo "5. Verifying automatic sync worked..."
EN_TEMPLATE_NEW=$(curl -s "http://localhost:4000/api/cms/pages/home/public?lang=en" | jq -r '.blocks[0].content.template')
KA_TEMPLATE_NEW=$(curl -s "http://localhost:4000/api/cms/pages/home/public?lang=ka" | jq -r '.blocks[0].content.template')
KA_HEADLINE=$(curl -s "http://localhost:4000/api/cms/pages/home/public?lang=ka" | jq -r '.blocks[0].content.headline')

echo "   English template: ${EN_TEMPLATE_NEW}"
echo "   Georgian template: ${KA_TEMPLATE_NEW}"
echo "   Georgian headline: ${KA_HEADLINE}"
echo ""

# Verify sync
if [ "$EN_TEMPLATE_NEW" = "$KA_TEMPLATE_NEW" ] && [ "$EN_TEMPLATE_NEW" = "full-width" ]; then
  echo "   ✅ AUTO-SYNC SUCCESS!"
  echo "   Templates are now synchronized: ${EN_TEMPLATE_NEW}"

  # Verify text is still different
  EN_HEADLINE=$(curl -s "http://localhost:4000/api/cms/pages/home/public?lang=en" | jq -r '.blocks[0].content.headline')
  if [ "$EN_HEADLINE" != "$KA_HEADLINE" ]; then
    echo "   ✅ Translated text preserved!"
    echo "      English: ${EN_HEADLINE}"
    echo "      Georgian: ${KA_HEADLINE}"
  else
    echo "   ⚠️  Warning: Headlines are the same"
  fi
else
  echo "   ✗ AUTO-SYNC FAILED"
  echo "   Templates don't match or didn't update correctly"
  exit 1
fi

echo ""
echo "=== Test Complete ==="
