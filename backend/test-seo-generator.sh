#!/bin/bash

# Test SEO Meta Generator

echo "Testing SEO Meta Generator..."
echo ""

curl -X POST http://localhost:4000/api/admin/ai/generate-seo \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBsdXhpYS5sb2NhbCIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MTgxNzMwMywiZXhwIjoxNzYxODQ2MTAzfQ.lHv8cIj6HlcaNCj9quVPoiEg6172WSrFEQ80TZxVT3c" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Luxury Scalp Repair Serum",
    "shortDescription": "Revolutionary serum for damaged scalp repair",
    "categories": ["Serums", "Scalp Treatment"],
    "targetKeyword": "scalp repair serum"
  }' | jq '.'

echo ""
echo "Done!"
