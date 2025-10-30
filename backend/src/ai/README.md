# AI Service Integration

Complete AI service architecture for the Luxia Products e-commerce platform. Provides AI-powered features with provider abstraction, caching, cost tracking, and comprehensive monitoring.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Service Manager                        │
│  (Orchestrator - Provider selection, caching, monitoring)        │
└────────┬─────────────────────────────────────────────┬──────────┘
         │                                             │
    ┌────▼─────┐                                  ┌────▼─────┐
    │ Features │                                  │ Providers│
    │          │                                  │          │
    │ ├─ Description Generator                   │ ├─ OpenAI│
    │ ├─ SEO Optimizer (future)                  │ ├─ Anthropic (future)
    │ └─ Image Alt Text (future)                 │ └─ Cohere (future)
    └──────────┘                                  └──────────┘
         │                                             │
    ┌────▼──────────────────────────────────────────▼─────┐
    │              Infrastructure Layer                    │
    │  ├─ CacheManager (in-memory with TTL)                │
    │  ├─ CostTracker (PostgreSQL logging)                 │
    │  └─ AuditLogger (PostgreSQL audit trail)             │
    └──────────────────────────────────────────────────────┘
```

## Directory Structure

```
/backend/src/ai/
├── README.md                         # This file
├── types.ts                          # TypeScript interfaces
├── config.ts                         # Service configuration
├── AIServiceManager.ts               # Main orchestrator
├── providers/
│   ├── BaseProvider.ts              # Abstract base class
│   ├── OpenAIProvider.ts            # OpenAI implementation
│   └── ProviderFactory.ts           # Provider instantiation
├── features/
│   └── DescriptionGenerator.ts      # Product description generation
└── infrastructure/
    ├── CacheManager.ts              # Response caching
    ├── CostTracker.ts               # Usage tracking
    └── AuditLogger.ts               # Audit logging
```

## Core Components

### 1. AIServiceManager

**Purpose**: Main orchestrator for all AI operations

**Responsibilities**:
- Initialize and manage AI providers
- Register and execute features
- Handle provider selection and fallback
- Coordinate caching, cost tracking, and auditing

**Usage**:
```typescript
import { AIServiceManager } from './ai/AIServiceManager';
import { aiServiceConfig } from './ai/config';

const aiService = new AIServiceManager(aiServiceConfig);
await aiService.initialize();

// Execute a feature
const result = await aiService.executeFeature('product_description_generator', input, options);
```

### 2. Providers

#### BaseProvider
Abstract base class providing:
- Retry logic with exponential backoff
- Health check abstraction
- Cost estimation utilities
- Error handling

#### OpenAIProvider
OpenAI GPT-4 integration:
- Uses official `openai` npm package
- Supports GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- JSON mode support
- Automatic cost calculation
- Streaming support (ready for future use)

**Configuration**:
```typescript
{
  name: 'openai',
  enabled: true,
  apiKeyName: 'openai_api_key', // From api_keys table
  defaultModel: 'gpt-4-turbo-preview',
  maxRetries: 3,
  timeout: 60000,
  rateLimit: {
    requestsPerMinute: 50,
    tokensPerMinute: 90000
  },
  costPerPromptToken: 0.01 / 1000,
  costPerCompletionToken: 0.03 / 1000
}
```

### 3. Features

#### DescriptionGenerator
AI-powered product description generation

**Input**:
```typescript
{
  productName: string;
  shortDescription?: string;
  categories?: string[];
  existingDescription?: string;
  tone?: 'professional' | 'luxury' | 'casual' | 'friendly' | 'technical';
  length?: 'short' | 'medium' | 'long';
  keyFeatures?: string[];
}
```

**Output**:
```typescript
{
  description: string;          // 2-4 paragraphs
  highlights: string[];         // 3-7 bullet points
  usage: string;                // Usage instructions
  metaDescription: string;      // SEO-optimized (150-160 chars)
  cost: number;                 // USD cost
  tokensUsed: number;           // Total tokens
  provider: string;             // Provider used
}
```

**Features**:
- Context-rich prompt generation
- Multiple tone options (professional, luxury, casual, friendly, technical)
- Configurable length (short, medium, long)
- JSON response parsing with fallback extraction
- Automatic cost estimation
- Result caching (2 hours TTL)

### 4. Infrastructure

#### CacheManager
In-memory caching with TTL support:
- SHA-256 key generation from prompts
- Automatic expiration (configurable TTL)
- LRU eviction when cache is full
- Periodic cleanup of expired entries

#### CostTracker
PostgreSQL-based usage tracking:
- Detailed token usage logging
- Cost calculation per operation
- Time-series analytics
- Provider and feature breakdowns

**Database Schema** (`ai_usage_log`):
```sql
CREATE TABLE ai_usage_log (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  feature VARCHAR(100),
  admin_user_id INTEGER,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  model_id VARCHAR(100),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### AuditLogger
Comprehensive audit trail:
- All AI operations logged
- Success/failure tracking
- Error message capture
- Queryable by provider, feature, admin user, date range

## API Endpoints

### POST `/api/admin/ai/generate-description`
Generate AI-powered product description

**Authentication**: Admin JWT required

**Request Body**:
```json
{
  "productName": "Luxury Scalp Serum",
  "shortDescription": "Revitalizing serum for healthy scalp",
  "categories": ["Serums", "Hair Care"],
  "tone": "luxury",
  "length": "medium",
  "keyFeatures": ["Organic ingredients", "Fast-absorbing", "Dermatologist tested"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "description": "Indulge your scalp in the ultimate luxury...",
    "highlights": [
      "Nourishes and revitalizes scalp health",
      "Premium organic ingredients",
      "Clinically proven results"
    ],
    "usage": "Apply 2-3 drops to scalp...",
    "metaDescription": "Premium scalp serum with organic ingredients for optimal hair health.",
    "cost": 0.045,
    "tokensUsed": 850,
    "provider": "openai"
  }
}
```

### GET `/api/admin/ai/usage-stats`
Get AI usage statistics

**Query Parameters**:
- `startDate`: ISO date (default: 30 days ago)
- `endDate`: ISO date (default: now)
- `provider`: Optional provider filter
- `feature`: Optional feature filter

**Response**:
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-01-30T23:59:59Z"
    },
    "totalRequests": 150,
    "totalCost": 6.75,
    "totalTokens": 125000,
    "averageLatency": 2500,
    "successRate": 0.98,
    "byProvider": {
      "openai": {
        "requests": 150,
        "cost": 6.75,
        "tokens": 125000
      }
    },
    "byFeature": {
      "product_description_generator": {
        "requests": 150,
        "cost": 6.75,
        "tokens": 125000
      }
    }
  }
}
```

### GET `/api/admin/ai/providers`
Get available providers and features

### POST `/api/admin/ai/clear-cache`
Clear AI response cache

### GET `/api/admin/ai/recent-logs`
Get recent AI operation logs

## Setup Instructions

### 1. Install Dependencies
Already installed: `openai` package

### 2. Set API Key
Navigate to `/admin/settings` → API Keys tab → AI & ML section → Add OpenAI API key

Or via database:
```sql
-- API key will be automatically encrypted
INSERT INTO api_keys (key_name, key_value, category, is_active)
VALUES ('openai_api_key', 'sk-...', 'ai', true);
```

### 3. Run Migration
The `ai_usage_log` table is already created. To verify:
```bash
npm run migrate
```

### 4. Test Integration
```bash
curl -X POST http://localhost:4000/api/admin/ai/generate-description \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Luxury Scalp Serum",
    "shortDescription": "Revitalizing serum",
    "categories": ["Serums"],
    "tone": "luxury",
    "length": "medium"
  }'
```

## Configuration

Edit `/backend/src/ai/config.ts` to customize:

- **Provider Settings**: Models, pricing, rate limits
- **Feature Settings**: Defaults, fallbacks, cache TTL
- **Cache Settings**: Strategy, max size, default TTL
- **Monitoring**: Enable/disable cost tracking, logging

## Cost Management

### Pricing (GPT-4 Turbo)
- Prompt tokens: $0.01 per 1K tokens
- Completion tokens: $0.03 per 1K tokens

### Typical Costs
- Short description (500 tokens): ~$0.02
- Medium description (1000 tokens): ~$0.04
- Long description (1500 tokens): ~$0.06

### Cost Controls
1. **Rate Limiting**: 20 generations per hour per admin user
2. **Max Cost**: $0.50 per generation (configurable)
3. **Caching**: 2-hour TTL reduces redundant API calls
4. **Monitoring**: Real-time cost tracking and alerts

## Error Handling

### Provider Errors
- **401/403**: Invalid API key (check API Keys settings)
- **429**: Rate limit exceeded (wait and retry)
- **500**: Provider error (check provider status)

### Automatic Retry
- 3 retry attempts with exponential backoff
- Max delay: 10 seconds between retries
- Non-retryable errors: 400, 401, 403, 404

### Fallback Strategy
1. Try primary provider (OpenAI)
2. Try fallback providers (when configured)
3. Return error if all providers fail

## Monitoring & Analytics

### Real-Time Metrics
- Total requests
- Success rate
- Average latency
- Total cost
- Token usage

### Analytics Queries
```typescript
// Get last 30 days stats
const stats = await costTracker.getStats(
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  new Date()
);

// Get recent logs
const logs = await costTracker.getRecentLogs(50);
```

### Database Queries
```sql
-- Total cost by provider
SELECT provider, SUM(cost_usd) as total_cost
FROM ai_usage_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider;

-- Daily usage
SELECT DATE(created_at) as date, COUNT(*), SUM(cost_usd)
FROM ai_usage_log
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Failed operations
SELECT * FROM ai_usage_log
WHERE success = false
ORDER BY created_at DESC
LIMIT 20;
```

## Future Enhancements

### Planned Features
1. **SEO Optimizer**: Automated meta descriptions and keywords
2. **Image Alt Text Generator**: AI-powered image descriptions
3. **Translation Service**: Automated product translations
4. **Content Moderator**: Review user-generated content

### Planned Providers
1. **Anthropic Claude**: Alternative to OpenAI
2. **Cohere**: Specialized text generation
3. **Google PaLM**: Google's LLM API

### Infrastructure Improvements
1. **Redis Caching**: Distributed cache for multi-server deployments
2. **Queue System**: BullMQ for background processing
3. **Streaming Responses**: Real-time generation feedback
4. **Cost Alerts**: Email notifications for budget thresholds
5. **Rate Limiting**: Per-user and global rate limits

## Troubleshooting

### Issue: "No AI providers available"
**Solution**: Ensure OpenAI API key is set in API Keys settings

### Issue: "Provider health check failed"
**Solution**: Verify API key is valid and has sufficient credits

### Issue: "Failed to parse AI response as JSON"
**Solution**: Response includes fallback extraction. Check error logs for details.

### Issue: High costs
**Solution**:
1. Reduce token limits in config
2. Enable caching (default: enabled)
3. Adjust rate limits per user
4. Review usage analytics

## Security Considerations

1. **API Key Storage**: Keys encrypted in database (AES-256-GCM)
2. **Admin-Only Access**: All AI endpoints require admin JWT
3. **Audit Trail**: All operations logged with admin user ID
4. **Rate Limiting**: Per-user limits prevent abuse
5. **Input Validation**: All inputs sanitized and validated

## Performance

### Typical Latency
- OpenAI API call: 2-5 seconds
- Cache hit: <10ms
- Database logging: <50ms

### Optimization Tips
1. Enable caching (reduces costs and latency)
2. Use shorter length when possible
3. Batch similar requests
4. Monitor slow queries in PostgreSQL

## Support

For issues or questions:
1. Check logs: `/var/log/supervisor/backend.log` (Docker)
2. Review database: `SELECT * FROM ai_usage_log ORDER BY created_at DESC LIMIT 20`
3. Test API key: Use `/api/admin/ai/providers` endpoint
4. Check configuration: Review `/backend/src/ai/config.ts`

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Status**: Production Ready ✓
