# Phase 2 AI Features - API Testing Examples

## Authentication

All endpoints require admin JWT authentication. Replace `<JWT_TOKEN>` with your actual admin token.

To get a JWT token:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@luxia.local",
    "password": "your-admin-password"
  }'
```

---

## 1. Product Translator

**Endpoint**: `POST /api/admin/ai/translate-product`

### Basic Translation (English to Georgian)

```bash
curl -X POST http://localhost:4000/api/admin/ai/translate-product \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "fields": {
      "name": "Revitalizing Scalp Serum",
      "shortDescription": "Nourish your scalp with premium natural ingredients",
      "description": "Our luxurious scalp serum combines cutting-edge science with nature'\''s finest ingredients to deliver transformative results. This lightweight formula penetrates deep into the scalp to strengthen hair follicles and promote healthy growth.",
      "highlights": [
        "Clinically proven results in 4-6 weeks",
        "100% natural active ingredients",
        "Suitable for all hair types",
        "Dermatologist tested and approved"
      ],
      "usage": "Apply 2-3 drops directly to scalp twice daily. Gently massage in circular motions for 1-2 minutes. No rinsing required.",
      "metaTitle": "Revitalizing Scalp Serum - Natural Hair Growth Solution",
      "metaDescription": "Premium scalp serum with biotin, caffeine & argan oil. Clinically proven to promote healthy hair growth. Free shipping over $50."
    },
    "sourceLanguage": "en",
    "targetLanguage": "ka",
    "preserveTerms": ["Revitalizing"],
    "tone": "luxury"
  }'
```

### Full Product Translation with Preserved Terms

```bash
curl -X POST http://localhost:4000/api/admin/ai/translate-product \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "productId": 123,
    "fields": {
      "name": "Luxia Premium Nourishing Hair Mask",
      "shortDescription": "Deep conditioning treatment for damaged hair",
      "description": "Transform dry, damaged hair with Luxia'\''s Premium Nourishing Hair Mask. This intensive treatment repairs damage from the inside out.",
      "highlights": [
        "Repairs split ends and breakage",
        "Restores natural shine and softness",
        "Safe for color-treated hair"
      ],
      "usage": "Apply to damp hair after shampooing. Leave for 5-10 minutes. Rinse thoroughly.",
      "metaTitle": "Luxia Premium Hair Mask | Deep Conditioning Treatment",
      "metaDescription": "Repair damaged hair with Luxia'\''s intensive hair mask. Natural ingredients for soft, shiny, healthy hair."
    },
    "sourceLanguage": "en",
    "targetLanguage": "ka",
    "preserveTerms": ["Luxia", "Premium"],
    "tone": "luxury"
  }'
```

---

## 2. Email Campaign Generator

**Endpoint**: `POST /api/admin/ai/generate-email-campaign`

### Promotional Campaign with Discount

```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-email-campaign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "campaignType": "promotional",
    "products": [
      {
        "name": "Revitalizing Scalp Serum",
        "price": 49.99,
        "description": "Premium formula for healthy scalp and hair growth"
      },
      {
        "name": "Nourishing Hair Mask",
        "price": 39.99,
        "description": "Deep conditioning treatment for damaged hair"
      }
    ],
    "discountPercentage": 20,
    "discountCode": "SAVE20",
    "tone": "luxury",
    "length": "medium",
    "language": "en",
    "brandName": "Luxia Products",
    "targetAudience": "Health-conscious consumers seeking premium hair care",
    "customInstructions": "Emphasize natural ingredients and clinical testing. Create urgency for limited-time offer."
  }'
```

### Newsletter Campaign

```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-email-campaign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "campaignType": "newsletter",
    "products": [
      {
        "name": "Scalp Detox Shampoo",
        "price": 29.99,
        "description": "Clarifying shampoo that removes buildup"
      }
    ],
    "tone": "friendly",
    "length": "medium",
    "language": "en",
    "brandName": "Luxia",
    "targetAudience": "Existing customers interested in hair care tips",
    "customInstructions": "Include hair care tips and product education. Focus on building community."
  }'
```

### Abandoned Cart Recovery

```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-email-campaign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "campaignType": "abandoned_cart",
    "products": [
      {
        "name": "Revitalizing Scalp Serum",
        "price": 49.99,
        "imageUrl": "https://example.com/serum.jpg"
      }
    ],
    "discountPercentage": 10,
    "discountCode": "COMEBACK10",
    "tone": "friendly",
    "length": "short",
    "language": "en",
    "brandName": "Luxia",
    "customInstructions": "Gentle reminder with incentive. Address common concerns about product effectiveness."
  }'
```

### New Arrival Announcement

```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-email-campaign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "campaignType": "new_arrival",
    "products": [
      {
        "name": "Advanced Root Strengthening Complex",
        "price": 59.99,
        "description": "Revolutionary new formula with peptide technology"
      }
    ],
    "tone": "luxury",
    "length": "medium",
    "language": "en",
    "brandName": "Luxia",
    "targetAudience": "VIP customers and early adopters",
    "customInstructions": "Build excitement about innovation. Emphasize exclusivity and limited availability."
  }'
```

---

## 3. FAQ Generator

**Endpoint**: `POST /api/admin/ai/generate-faq`

### Basic FAQ Generation

```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-faq \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "productName": "Revitalizing Scalp Serum",
    "productDescription": "A premium serum formulated with biotin, caffeine, and argan oil to promote healthy scalp and hair growth",
    "productCategory": "Scalp Treatment",
    "benefits": [
      "Promotes healthy hair growth",
      "Soothes irritated scalp",
      "Strengthens hair follicles",
      "Improves scalp circulation"
    ],
    "ingredients": [
      "Biotin (Vitamin B7)",
      "Caffeine",
      "Argan Oil",
      "Tea Tree Extract",
      "Rosemary Oil"
    ],
    "price": 49.99,
    "numberOfFAQs": 8
  }'
```

### Comprehensive FAQ with Concerns

```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-faq \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "productName": "Nourishing Hair Mask",
    "productDescription": "Intensive deep conditioning treatment that repairs damaged hair from the inside out",
    "productCategory": "Hair Treatment",
    "benefits": [
      "Repairs split ends and breakage",
      "Restores natural shine",
      "Increases hair strength",
      "Reduces frizz and flyaways"
    ],
    "ingredients": [
      "Keratin Protein",
      "Coconut Oil",
      "Shea Butter",
      "Vitamin E",
      "Panthenol (Pro-Vitamin B5)"
    ],
    "price": 39.99,
    "targetAudience": "Adults with dry, damaged, or color-treated hair",
    "commonConcerns": [
      "color-treated hair safety",
      "sensitive scalp",
      "how often to use",
      "pregnancy safety",
      "will it make hair oily"
    ],
    "language": "en",
    "numberOfFAQs": 10
  }'
```

### Minimal FAQ (Quick Generation)

```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-faq \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "productName": "Daily Scalp Tonic",
    "productCategory": "Scalp Care",
    "price": 24.99,
    "numberOfFAQs": 5
  }'
```

---

## Utility Endpoints

### Get AI Usage Statistics

```bash
curl -X GET "http://localhost:4000/api/admin/ai/usage-stats?startDate=2025-10-01&endDate=2025-10-31" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Available Providers and Features

```bash
curl -X GET http://localhost:4000/api/admin/ai/providers \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Recent AI Logs

```bash
curl -X GET "http://localhost:4000/api/admin/ai/recent-logs?limit=50" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Clear AI Response Cache

```bash
curl -X POST http://localhost:4000/api/admin/ai/clear-cache \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Response Format

All endpoints return JSON in this format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Feature-specific data
    "cost": 0.15,
    "tokensUsed": 850,
    "provider": "openai"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Error Handling

### Common HTTP Status Codes

- **200 OK**: Request successful
- **400 Bad Request**: Invalid input parameters
- **401 Unauthorized**: Missing or invalid JWT token
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server or AI provider error

### Example Error Responses

**Missing Required Field**:
```json
{
  "success": false,
  "error": "productName is required and must be a string"
}
```

**Invalid Campaign Type**:
```json
{
  "success": false,
  "error": "campaignType is required and must be one of: promotional, newsletter, abandoned_cart, new_arrival"
}
```

**Rate Limit Exceeded**:
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later."
}
```

---

## Testing Tips

1. **Get Admin Token First**: Log in to get a valid JWT token
2. **Check API Key**: Ensure OpenAI API key is configured in Admin Panel
3. **Start Small**: Test with minimal required fields first
4. **Monitor Costs**: Check usage stats regularly
5. **Use Cache**: Identical requests return cached results (faster & cheaper)
6. **Test Validation**: Try invalid inputs to verify error handling
7. **Check Logs**: Use recent-logs endpoint to debug issues

---

## Performance Tips

1. **Enable Caching**: Caching is enabled by default - don't disable it
2. **Batch Similar Operations**: Group similar requests together
3. **Use Appropriate Lengths**:
   - Short: Quick, punchy content
   - Medium: Balanced (default, recommended)
   - Long: Comprehensive, detailed
4. **Optimize Prompts**: Provide more context = better results
5. **Monitor Token Usage**: Longer inputs = higher costs

---

## Example: Complete Workflow

### 1. Generate Product Description
```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-description \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "productName": "Revitalizing Scalp Serum",
    "categories": ["Scalp Treatment", "Hair Growth"],
    "tone": "luxury",
    "length": "medium"
  }'
```

### 2. Generate SEO Meta Tags
```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-seo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "productName": "Revitalizing Scalp Serum",
    "description": "A premium serum that promotes healthy hair growth...",
    "categories": ["Scalp Treatment", "Hair Growth"]
  }'
```

### 3. Translate to Georgian
```bash
curl -X POST http://localhost:4000/api/admin/ai/translate-product \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "fields": {
      "name": "Revitalizing Scalp Serum",
      "description": "Generated description from step 1..."
    },
    "sourceLanguage": "en",
    "targetLanguage": "ka"
  }'
```

### 4. Generate FAQs
```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-faq \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "productName": "Revitalizing Scalp Serum",
    "productDescription": "Generated description from step 1...",
    "numberOfFAQs": 8
  }'
```

### 5. Create Launch Email Campaign
```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-email-campaign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "campaignType": "new_arrival",
    "products": [{
      "name": "Revitalizing Scalp Serum",
      "price": 49.99
    }],
    "tone": "luxury"
  }'
```

---

*Last Updated: October 30, 2025*
