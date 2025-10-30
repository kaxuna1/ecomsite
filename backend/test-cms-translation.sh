#!/bin/bash

# Test script for CMS Page Translation endpoint
# POST /api/admin/ai/translate-cms-page

# Configuration
API_URL="http://localhost:4000/api/admin/ai"
# Replace with your admin JWT token
JWT_TOKEN="your-admin-jwt-token-here"

echo "=========================================="
echo "Testing CMS Page Translation Endpoint"
echo "=========================================="
echo ""

# Example 1: Simple page with text fields only
echo "Test 1: Translating page fields (title, metaTitle, metaDescription)"
echo "----------------------------------------------------------------------"

curl -X POST "${API_URL}/translate-cms-page" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "fields": {
      "title": "About Our Luxury Hair Care Products",
      "metaTitle": "Luxury Hair Care | Premium Products for Beautiful Hair",
      "metaDescription": "Discover our premium collection of luxury hair care products designed to transform and nourish your hair with natural ingredients."
    },
    "blocks": [],
    "sourceLanguage": "en",
    "targetLanguage": "ka",
    "tone": "luxury"
  }' | jq '.'

echo ""
echo ""

# Example 2: Page with Hero block
echo "Test 2: Translating page with Hero block"
echo "----------------------------------------------------------------------"

curl -X POST "${API_URL}/translate-cms-page" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "fields": {
      "title": "Home Page",
      "metaTitle": "Premium Hair Care Products | Luxia",
      "metaDescription": "Transform your hair with our luxury collection of natural hair care products."
    },
    "blocks": [
      {
        "id": 1,
        "type": "hero",
        "content": {
          "type": "hero",
          "headline": "Transform Your Hair",
          "subheadline": "Luxury Products for Beautiful Results",
          "description": "Discover our premium collection of natural hair care products crafted to nourish, strengthen, and beautify your hair.",
          "ctaText": "Shop Now",
          "ctaLink": "/products",
          "backgroundImage": "/images/hero-bg.jpg",
          "backgroundImageAlt": "Beautiful hair care products",
          "overlayOpacity": 50,
          "textAlignment": "center"
        }
      }
    ],
    "sourceLanguage": "en",
    "targetLanguage": "ka",
    "preserveTerms": ["Luxia"],
    "tone": "luxury"
  }' | jq '.'

echo ""
echo ""

# Example 3: Page with multiple block types
echo "Test 3: Translating page with multiple block types"
echo "----------------------------------------------------------------------"

curl -X POST "${API_URL}/translate-cms-page" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "fields": {
      "title": "Why Choose Us",
      "metaTitle": "Why Choose Luxia Hair Care Products",
      "metaDescription": "Discover what makes our luxury hair care products special - natural ingredients, expert formulation, and proven results."
    },
    "blocks": [
      {
        "id": 1,
        "type": "hero",
        "content": {
          "type": "hero",
          "headline": "The Luxia Difference",
          "subheadline": "Premium Quality, Natural Ingredients",
          "description": "Experience the transformative power of nature combined with scientific innovation.",
          "ctaText": "Learn More",
          "ctaLink": "/about",
          "backgroundImage": "/images/about-hero.jpg",
          "textAlignment": "left"
        }
      },
      {
        "id": 2,
        "type": "features",
        "content": {
          "type": "features",
          "title": "What Makes Us Special",
          "subtitle": "Quality, Innovation, and Results",
          "features": [
            {
              "id": "feat-1",
              "icon": "leaf",
              "title": "Natural Ingredients",
              "description": "We use only the finest natural ingredients sourced from sustainable farms around the world."
            },
            {
              "id": "feat-2",
              "icon": "science",
              "title": "Scientific Formulation",
              "description": "Our products are developed by expert chemists using cutting-edge hair care science."
            },
            {
              "id": "feat-3",
              "icon": "star",
              "title": "Proven Results",
              "description": "Thousands of satisfied customers have experienced visible improvements in hair health and beauty."
            }
          ],
          "columns": 3
        }
      },
      {
        "id": 3,
        "type": "stats",
        "content": {
          "type": "stats",
          "title": "Our Impact",
          "stats": [
            {
              "id": "stat-1",
              "value": "50K+",
              "label": "Happy Customers",
              "icon": "users"
            },
            {
              "id": "stat-2",
              "value": "98%",
              "label": "Satisfaction Rate",
              "icon": "heart"
            },
            {
              "id": "stat-3",
              "value": "100+",
              "label": "Products",
              "icon": "package"
            }
          ],
          "columns": 3
        }
      },
      {
        "id": 4,
        "type": "testimonials",
        "content": {
          "type": "testimonials",
          "title": "What Our Customers Say",
          "subtitle": "Real experiences from real people",
          "testimonials": [
            {
              "id": "test-1",
              "name": "Sarah Johnson",
              "role": "Beauty Blogger",
              "rating": 5,
              "text": "These products have completely transformed my hair. It feels healthier, stronger, and more beautiful than ever before!"
            },
            {
              "id": "test-2",
              "name": "Michael Chen",
              "role": "Professional Stylist",
              "rating": 5,
              "text": "I recommend Luxia to all my clients. The quality is exceptional and the results speak for themselves."
            }
          ],
          "displayStyle": "carousel"
        }
      },
      {
        "id": 5,
        "type": "cta",
        "content": {
          "type": "cta",
          "title": "Ready to Transform Your Hair?",
          "description": "Join thousands of satisfied customers who have discovered the Luxia difference.",
          "primaryButtonText": "Shop Collection",
          "primaryButtonLink": "/products",
          "secondaryButtonText": "Contact Us",
          "secondaryButtonLink": "/contact"
        }
      }
    ],
    "sourceLanguage": "en",
    "targetLanguage": "ka",
    "preserveTerms": ["Luxia"],
    "tone": "luxury"
  }' | jq '.'

echo ""
echo ""
echo "=========================================="
echo "Tests Complete"
echo "=========================================="
echo ""
echo "Note: Replace JWT_TOKEN variable with a valid admin token"
echo "Get token by logging in to /api/auth/login"
