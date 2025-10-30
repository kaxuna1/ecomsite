#!/bin/bash
curl -X POST http://localhost:4000/api/admin/ai/generate-description \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBsdXhpYS5sb2NhbCIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MTgxNzMwMywiZXhwIjoxNzYxODQ2MTAzfQ.lHv8cIj6HlcaNCj9quVPoiEg6172WSrFEQ80TZxVT3c" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Luxury Scalp Serum",
    "shortDescription": "Revitalizing serum for healthy scalp",
    "categories": ["Serums", "Hair Care"],
    "tone": "luxury",
    "length": "medium"
  }'
