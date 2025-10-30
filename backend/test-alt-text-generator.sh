#!/bin/bash

# Test Image Alt Text Generator

echo "Testing Image Alt Text Generator..."
echo ""

curl -X POST http://localhost:4000/api/admin/ai/generate-alt-text \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBsdXhpYS5sb2NhbCIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MTgxNzMwMywiZXhwIjoxNzYxODQ2MTAzfQ.lHv8cIj6HlcaNCj9quVPoiEg6172WSrFEQ80TZxVT3c" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/product-images/scalp-serum-gold.jpg",
    "filename": "scalp-serum-gold.jpg",
    "productName": "Luxury Scalp Repair Serum",
    "productCategory": "Scalp Treatment",
    "productDescription": "Revolutionary serum with biotin and keratin for damaged scalp repair. Comes in elegant gold packaging."
  }' | jq '.'

echo ""
echo "Done!"
