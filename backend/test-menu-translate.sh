#!/bin/bash

# Test menu translation API

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBsdXhpYS5sb2NhbCIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MTkwMDg1NSwiZXhwIjoxNzYxOTI5NjU1fQ.Ffh_ZJyhTowqalg2J291VmcXZTa77wVjBp3pe3_m8HE"

curl -s -X POST http://localhost:4000/api/navigation/items/translate-batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
  "menuItems": [
    {"id": 1, "label": "Home", "linkType": "internal", "context": "Main homepage link"},
    {"id": 2, "label": "Shop", "linkType": "none", "context": "Parent menu for shopping categories"},
    {"id": 3, "label": "All Products", "linkType": "internal", "context": "Browse all products page"},
    {"id": 4, "label": "New Arrivals", "linkType": "internal", "context": "Latest products"},
    {"id": 5, "label": "Best Sellers", "linkType": "internal", "context": "Most popular products"},
    {"id": 6, "label": "Sale", "linkType": "internal", "context": "Discounted items"},
    {"id": 7, "label": "About", "linkType": "internal", "context": "About us page"},
    {"id": 8, "label": "Cart", "linkType": "internal", "context": "Shopping cart"}
  ],
  "targetLanguage": "ka",
  "targetLanguageNative": "ქართული",
  "sourceLanguage": "en",
  "brandName": "Luxia Products",
  "style": "professional"
}' | jq .
