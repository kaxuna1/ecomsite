# Translation System

This document explains the multilingual translation system for the Luxia e-commerce platform.

## Overview

The application uses a **database-driven translation system** where all UI text translations are stored in the `static_translations` PostgreSQL table. This allows for:

- **Dynamic translations** without rebuilding the application
- **Easy management** via admin panel or API
- **Version control** of translations through export/import
- **Automatic seeding** of translations during database migrations

## Database Schema

### `static_translations` Table

```sql
CREATE TABLE static_translations (
  id SERIAL PRIMARY KEY,
  translation_key VARCHAR(255) NOT NULL,
  language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  translation_value TEXT NOT NULL,
  namespace VARCHAR(50) NOT NULL DEFAULT 'common',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(translation_key, language_code, namespace)
);
```

### Indexes

- `idx_static_translations_key` - For key lookups
- `idx_static_translations_language` - For language filtering
- `idx_static_translations_namespace` - For namespace filtering
- `idx_static_translations_lookup` - Composite index for (key, language, namespace)

## Translation Structure

### Namespaces

Translations are organized into namespaces:

- **common** (510 entries) - Shared UI text, buttons, labels, messages
- **account** (16 entries) - User account pages (profile, favorites, orders)
- **cart** (14 entries) - Shopping cart page
- **checkout** (36 entries) - Checkout flow
- **admin** (11 entries) - Admin panel
- **products** (22 entries) - Product pages

### Translation Keys

Translation keys follow a hierarchical dot notation:

```
namespace.section.element
```

Examples:
- `account.profile` → "Profile" / "პროფილი"
- `cart.checkout` → "Proceed to checkout" / "checkout-ისკენ გადასვლა"
- `address.addNew` → "Add New" / "ახლის დამატება"

## Scripts

### 1. Export Translations from Database

Export current translations from database to SQL and JSON files:

```bash
cd backend
npm run export:translations
```

**Generates:**
- `src/scripts/translationsSeed.sql` - SQL INSERT statements with ON CONFLICT handling
- `src/scripts/translationsSeed.json` - JSON format grouped by namespace

**Output:**
```
Exporting translations from database...
Found 609 translation entries
Translations exported to: /path/to/translationsSeed.json

Summary by namespace:
  account: 16 entries
  admin: 11 entries
  cart: 14 entries
  checkout: 36 entries
  common: 510 entries
  products: 22 entries
SQL seed file created: /path/to/translationsSeed.sql
```

### 2. Seed Translations into Database

Import translations from `translationsSeed.sql` file:

```bash
cd backend
npm run seed:translations
```

**Features:**
- Uses `ON CONFLICT ... DO UPDATE` to insert or update existing translations
- Validates and counts entries per namespace
- Reports success/error statistics

**Output:**
```
Seeding static translations...
Found 609 INSERT statements to execute

Seeding complete!
  Inserted/Updated: 609 translations
  Errors: 0

Translation counts by namespace:
  account: 16 entries (8 keys × 2 languages)
  admin: 11 entries (11 keys × 1 languages)
  cart: 14 entries (7 keys × 2 languages)
  checkout: 36 entries (18 keys × 2 languages)
  common: 510 entries (255 keys × 2 languages)
  products: 22 entries (11 keys × 2 languages)

Total translations in database: 609
```

### 3. Database Migration (Automatic Seeding)

When running database migrations, translations are **automatically seeded**:

```bash
cd backend
npm run migrate
```

**Process:**
1. Creates all database tables and indexes
2. Checks for `translationsSeed.sql` file
3. If found, seeds all translations automatically
4. If not found, logs a warning and continues

**Output:**
```
🔄 Running database migrations...
✅ Database schema migrated successfully
Seeding static translations...
  Processing 609 translation entries...
✅ Translations seeded successfully: 609 entries

🎉 Migration and seeding complete!
```

## Docker Deployment

### Initial Setup

When building a Docker image, ensure the translation seed file is included:

```dockerfile
# Backend source already copied in Dockerfile
COPY --from=backend-builder /app/backend/src ./backend/src
```

### First-Time Container Startup

1. PostgreSQL starts
2. Database `luxia` is created
3. Migration script runs automatically (via `run-migrations.sh`)
4. Translation seed file is detected and loaded
5. All 609 translations are seeded into the database

### Updating Translations in Production

**Option 1: Via Admin API** (Recommended)

```bash
curl -X POST http://your-domain.com/api/static-translations/admin/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "translations": [
      {
        "translationKey": "newFeature.title",
        "languageCode": "en",
        "translationValue": "New Feature",
        "namespace": "common"
      },
      {
        "translationKey": "newFeature.title",
        "languageCode": "ka",
        "translationValue": "ახალი ფუნქცია",
        "namespace": "common"
      }
    ]
  }'
```

**Option 2: Re-seed from File**

```bash
# In container
docker exec -it luxia-app bash
cd /app/backend
npx tsx src/scripts/seedTranslations.ts
```

**Option 3: Database Import**

```bash
# Copy seed file to container
docker cp translationsSeed.sql luxia-app:/tmp/

# Import via PostgreSQL
docker exec luxia-app psql -U luxia luxia -f /tmp/translationsSeed.sql
```

## API Endpoints

### Get Translations

```http
GET /api/static-translations?lang=en&namespace=common
```

**Response:**
```json
{
  "account.profile": "Profile",
  "account.orders": "Orders",
  "account.favorites": "Favorites"
}
```

### Bulk Update Translations (Admin Only)

```http
POST /api/static-translations/admin/bulk
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "translations": [
    {
      "translationKey": "greeting.hello",
      "languageCode": "en",
      "translationValue": "Hello",
      "namespace": "common"
    }
  ]
}
```

## Frontend Integration

Translations are loaded via i18next backend plugin:

```typescript
// src/i18n/index.ts
i18next
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/api/static-translations?lang={{lng}}&namespace={{ns}}'
    },
    // ...
  });
```

Usage in components:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('account.profile')}</h1>
      <button>{t('address.addNew')}</button>
    </div>
  );
}
```

## Workflow for Adding New Translations

### Development Workflow

1. **Add translation keys to your code:**
   ```tsx
   <button>{t('newFeature.submitButton')}</button>
   ```

2. **Add translations via API or database:**
   ```sql
   INSERT INTO static_translations (translation_key, language_code, translation_value, namespace)
   VALUES
     ('newFeature.submitButton', 'en', 'Submit', 'common'),
     ('newFeature.submitButton', 'ka', 'გაგზავნა', 'common');
   ```

3. **Export translations for version control:**
   ```bash
   npm run export:translations
   ```

4. **Commit the seed file:**
   ```bash
   git add src/scripts/translationsSeed.sql
   git commit -m "Add translations for new feature"
   ```

### Production Deployment

**When translations are in seed file:**
- Translations are automatically loaded during container startup
- No manual intervention needed

**When adding ad-hoc translations:**
- Use bulk API endpoint to add translations
- Export to seed file for next deployment

## Best Practices

1. **Always export after manual changes**
   - Run `npm run export:translations` after adding translations via API or database
   - Commit the `translationsSeed.sql` file to version control

2. **Use consistent naming conventions**
   - Format: `namespace.section.element`
   - Example: `product.details.addToCart`

3. **Organize by namespace**
   - Keep related translations in the same namespace
   - Use `common` for shared UI elements

4. **Maintain both languages**
   - Always add translations for both `en` and `ka` (or all supported languages)
   - Use the bulk API for atomic updates

5. **Test translations locally**
   - Verify translations appear correctly in both languages
   - Check for missing keys in browser console

## Troubleshooting

### Missing Translations

**Symptom:** Text appears as translation key (e.g., "account.profile" instead of "Profile")

**Solution:**
1. Check if key exists in database:
   ```sql
   SELECT * FROM static_translations WHERE translation_key = 'account.profile';
   ```

2. Verify language code matches:
   ```sql
   SELECT * FROM static_translations WHERE language_code = 'en';
   ```

3. Check i18next console logs for loading errors

### Translation Not Updating

**Symptom:** Changed translation doesn't appear in UI

**Solution:**
1. Clear i18next cache (reload page)
2. Verify database was updated:
   ```sql
   SELECT translation_value FROM static_translations
   WHERE translation_key = 'your.key' AND language_code = 'en';
   ```
3. Check API response:
   ```bash
   curl http://localhost:4000/api/static-translations?lang=en&namespace=common
   ```

### Seed File Not Found During Migration

**Symptom:** Warning: "Translation seed file not found. Skipping translation seeding."

**Solution:**
1. Ensure `translationsSeed.sql` exists in `backend/src/scripts/`
2. Run export script:
   ```bash
   npm run export:translations
   ```
3. Re-run migrations:
   ```bash
   npm run migrate
   ```

## Statistics

### Current Translation Coverage (as of January 2025)

- **Total entries:** 609
- **Unique keys:** ~305
- **Languages:** 2 (English, Georgian)
- **Namespaces:** 6
- **Pages covered:** 15+ (Login, Signup, Profile, Orders, Favorites, Cart, Checkout, Products, etc.)

### Breakdown by Namespace

| Namespace | Entries | Unique Keys | Languages |
|-----------|---------|-------------|-----------|
| common    | 510     | 255         | 2         |
| checkout  | 36      | 18          | 2         |
| account   | 16      | 8           | 2         |
| cart      | 14      | 7           | 2         |
| products  | 22      | 11          | 2         |
| admin     | 11      | 11          | 1         |

## Future Enhancements

1. **Admin UI for translation management**
   - Visual editor for translations
   - Bulk import/export via UI
   - Translation status tracking (missing, outdated)

2. **Translation validation**
   - Check for missing translations before deployment
   - Automated testing for translation keys

3. **Version history**
   - Track changes to translations over time
   - Rollback capability

4. **Translation cache**
   - Redis caching for frequently accessed translations
   - Invalidation on update

5. **Professional translations**
   - Integration with translation services (e.g., Lokalise, Phrase)
   - Context and screenshots for translators

---

**Last Updated:** January 2025
