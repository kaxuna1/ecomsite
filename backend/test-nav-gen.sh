#!/bin/bash

# Test navigation generation API

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBsdXhpYS5sb2NhbCIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MTkwMDg1NSwiZXhwIjoxNzYxOTI5NjU1fQ.Ffh_ZJyhTowqalg2J291VmcXZTa77wVjBp3pe3_m8HE"

curl -s -X POST http://localhost:4000/api/navigation/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
  "locationCode": "header",
  "style": "minimal",
  "brandName": "Luxia Products",
  "brandDescription": "Luxury scalp and hair-care products",
  "targetAudience": "Health-conscious consumers seeking premium hair care solutions",
  "availablePages": [
    {"type": "static", "label": "Home", "url": "/", "priority": "high", "description": "Homepage"},
    {"type": "static", "label": "Products", "url": "/products", "priority": "high", "description": "Browse all products"},
    {"type": "static", "label": "New Arrivals", "url": "/new-arrivals", "priority": "medium", "description": "Latest products"},
    {"type": "static", "label": "Best Sellers", "url": "/best-sellers", "priority": "medium", "description": "Most popular products"},
    {"type": "static", "label": "Sale", "url": "/sale", "priority": "high", "description": "Discounted items"},
    {"type": "static", "label": "Cart", "url": "/cart", "priority": "low", "description": "Shopping cart"},
    {"type": "static", "label": "About Us", "url": "/about", "priority": "medium", "description": "Company information"}
  ]
}' | jq .
