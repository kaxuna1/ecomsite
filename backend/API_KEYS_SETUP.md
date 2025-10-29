# API Keys Management - Setup Guide

This guide explains how to set up and use the secure API keys storage system.

## Overview

The API keys management system provides secure storage for all third-party service credentials your e-commerce platform needs, including:

- Payment gateways (Stripe, PayPal)
- Communication services (Twilio, SendGrid, Mailgun)
- AI services (OpenAI, Anthropic)
- Analytics (Google Analytics, Facebook Pixel, TikTok, Mixpanel)
- Shipping providers (Shippo, EasyPost, ShipStation)
- Cloud storage (AWS S3, Cloudflare)
- Search engines (Algolia)
- Marketing automation (Klaviyo, Mailchimp, HubSpot)
- And more...

## Security Features

✅ **AES-256-GCM Encryption** - Military-grade encryption for all stored keys
✅ **PBKDF2 Key Derivation** - Secure key generation with 100,000 iterations
✅ **Unique Salts & IVs** - Each encrypted value has unique cryptographic parameters
✅ **Masked Display** - Keys are masked in the UI for security
✅ **Audit Trail** - Track who created/updated each key
✅ **Admin-Only Access** - Only authenticated admins can manage keys

## Setup Instructions

### 1. Generate Encryption Key

**IMPORTANT**: You must set a strong encryption key before storing any API keys.

Generate a secure encryption key using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or using OpenSSL:

```bash
openssl rand -hex 32
```

This will output a 64-character hexadecimal string like:
```
a1b2c3d4e5f6789012345678901234567890123456789012345678901234567
```

### 2. Add to Environment Variables

Add the encryption key to your `.env` file:

```env
ENCRYPTION_KEY=your-generated-key-here
```

**⚠️ SECURITY WARNING**:
- **NEVER** commit the `ENCRYPTION_KEY` to version control
- **NEVER** share this key publicly
- **NEVER** use the same key in development and production
- Store production keys in a secure secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

### 3. Run Database Migration

Run the migration to create the `api_keys` table:

```bash
npm run migrate
```

Or manually execute the SQL migration:

```bash
psql -d luxia -f src/migrations/015_create_api_keys_table.sql
```

## Using the API Keys Management

### Via Admin UI

1. Navigate to **Settings** → **API Keys** tab in the admin panel
2. Find the service you want to configure
3. Enter the API key/secret
4. Click "Save API Keys"

The system will:
- Automatically encrypt all keys before storage
- Categorize keys based on the service
- Track when the key was created/updated
- Allow you to view, copy, or delete keys

### Via API (Programmatic Access)

#### Get All Keys (Masked)
```typescript
GET /api/admin/api-keys
Authorization: Bearer <admin-jwt-token>

Response:
{
  "stripe_secret_key": "sk_l••••••••••1234",
  "openai_api_key": "sk-•••••••••abcd",
  ...
}
```

#### Get Single Key (Decrypted)
```typescript
GET /api/admin/api-keys/stripe_secret_key?decrypt=true
Authorization: Bearer <admin-jwt-token>

Response:
{
  "value": "sk_live_actual_key_value"
}
```

#### Save Multiple Keys
```typescript
PUT /api/admin/api-keys
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "keys": {
    "stripe_secret_key": "sk_live_...",
    "stripe_public_key": "pk_live_...",
    "openai_api_key": "sk-..."
  }
}

Response:
{
  "message": "Successfully updated 3 API key(s)",
  "count": 3
}
```

#### Validate Keys for Feature
```typescript
POST /api/admin/api-keys/validate/stripe
Authorization: Bearer <admin-jwt-token>

Response:
{
  "valid": true,
  "missing": []
}

// Or if keys are missing:
{
  "valid": false,
  "missing": ["stripe_secret_key"]
}
```

## Using Keys in Your Application

### Service Layer Example

```typescript
import { getAPIKey } from '../services/apiKeysService';

// In your Stripe service
async function createPaymentIntent(amount: number) {
  const stripeSecretKey = await getAPIKey('stripe_secret_key', true);
  
  if (!stripeSecretKey) {
    throw new Error('Stripe API key not configured');
  }
  
  const stripe = new Stripe(stripeSecretKey);
  // ... rest of your code
}
```

### Validation Example

```typescript
import { validateAPIKeysForFeature } from '../services/apiKeysService';

// Before using Stripe features
const validation = await validateAPIKeysForFeature('stripe');

if (!validation.valid) {
  return res.status(503).json({
    message: 'Stripe is not configured',
    missing: validation.missing
  });
}
```

## Supported Services

The system comes pre-configured with support for 50+ common e-commerce integrations across 9 categories:

### Payment Gateways
- Stripe (3 keys)
- PayPal (2 keys)

### Communication
- Twilio (3 keys)
- SendGrid (1 key)
- Mailgun (2 keys)

### AI & ML
- OpenAI (2 keys)
- Anthropic Claude (1 key)

### Analytics
- Google Analytics (2 keys)
- Facebook Pixel (1 key)
- TikTok Pixel (1 key)
- Mixpanel (1 key)

### Shipping
- Shippo (1 key)
- EasyPost (1 key)
- ShipStation (2 keys)

### Storage & CDN
- AWS S3 (4 keys)
- Cloudflare (2 keys)

### Search
- Algolia (3 keys)

### Marketing
- Klaviyo (1 key)
- Mailchimp (1 key)
- HubSpot (1 key)

### Other
- Google Maps (1 key)
- reCAPTCHA (2 keys)
- Exchange Rate API (1 key)

## Best Practices

### Development vs Production

**Development:**
```env
ENCRYPTION_KEY=dev-key-for-testing-only
```

**Production:**
- Use AWS Secrets Manager, Google Secret Manager, or HashiCorp Vault
- Rotate encryption keys periodically
- Use different keys for staging and production

### Key Rotation

When rotating the encryption key:

1. **Export existing keys** (decrypted)
2. **Update ENCRYPTION_KEY** in environment
3. **Re-encrypt all keys** using the new encryption key
4. **Restart application**

### Backup Strategy

- Backup the encrypted `api_keys` table regularly
- Store the `ENCRYPTION_KEY` separately from database backups
- Test restore procedures regularly

### Access Control

- Only give admin panel access to trusted team members
- Use role-based access control (RBAC) to limit who can view/edit keys
- Log all access to sensitive keys
- Review access logs regularly

## Troubleshooting

### "Failed to decrypt data" Error

**Causes:**
- `ENCRYPTION_KEY` changed
- Database corrupted
- Key was encrypted with a different encryption key

**Solutions:**
1. Verify `ENCRYPTION_KEY` matches the one used to encrypt
2. Check database integrity
3. Re-save the key through the admin UI

### Keys Not Saving

**Causes:**
- Database connection issues
- Missing `api_keys` table
- Permission issues

**Solutions:**
1. Run migrations: `npm run migrate`
2. Check database connection
3. Verify admin user permissions

### "ENCRYPTION_KEY not set" Warning

**Cause:**
- Missing `ENCRYPTION_KEY` in `.env` file

**Solution:**
1. Generate a new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Add to `.env`: `ENCRYPTION_KEY=your-key-here`
3. Restart the server

## Security Considerations

🔒 **Encryption at Rest**: All keys are encrypted in the database
🔒 **Encryption in Transit**: Use HTTPS for all admin panel access
🔒 **No Logs**: Keys are never logged to console or files
🔒 **Masked Display**: Keys are masked in the UI by default
🔒 **Admin-Only**: Only authenticated admins can access
🔒 **Audit Trail**: Track who created/modified each key

## Environment Variables Reference

Add these to your `.env` file:

```env
# Required - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-character-hex-key-here

# Database (existing)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=luxia
DB_USER=postgres
DB_PASSWORD=your-password

# JWT (existing)
JWT_SECRET=your-jwt-secret
```

## Migration Details

The `api_keys` table schema:

```sql
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL UNIQUE,
  key_value TEXT NOT NULL,              -- Encrypted
  category VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES admin_users(id),
  updated_by INTEGER REFERENCES admin_users(id)
);
```

## Support

For issues or questions:
1. Check this documentation
2. Review the code in `backend/src/services/apiKeysService.ts`
3. Check the encryption utility in `backend/src/utils/encryption.ts`
4. Consult the API routes in `backend/src/routes/apiKeysRoutes.ts`

