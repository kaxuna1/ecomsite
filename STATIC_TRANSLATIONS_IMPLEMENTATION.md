# Static Translations Implementation - Database-Driven i18n

## Overview

This implementation converts static UI text translations from JSON files to a database-driven system, allowing dynamic management of all translations through an admin interface.

## Architecture

### Best Practices Implemented

1. **Database-First Approach**: All translations stored in PostgreSQL with proper indexing
2. **Namespace Organization**: Translations grouped by namespace (common, products, cart, checkout, account, admin)
3. **Dot Notation Keys**: Hierarchical keys like `nav.home`, `hero.title` for better organization
4. **Language Fallback**: English (en) as source language with dynamic language support
5. **API-Driven Loading**: i18next loads translations from API endpoints instead of static JSON
6. **Admin Interface**: Full CRUD operations for managing translations
7. **AI Translation**: Integration with existing AI service for automatic translations

## Database Schema

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

-- Indexes for fast lookups
CREATE INDEX idx_static_translations_key ON static_translations(translation_key);
CREATE INDEX idx_static_translations_language ON static_translations(language_code);
CREATE INDEX idx_static_translations_namespace ON static_translations(namespace);
CREATE INDEX idx_static_translations_lookup ON static_translations(translation_key, language_code, namespace);
```

## Implementation Status

### ✅ COMPLETED

#### 1. Database Migration
- **File**: `backend/src/scripts/migrate.ts`
- **Status**: Created and run successfully
- **Table**: `static_translations` with proper indexes and constraints

#### 2. Seed Data
- **File**: `backend/src/scripts/seedStaticTranslations.ts`
- **Status**: Complete with 127 translations
- **Coverage**:
  - common (en: 56 keys, ka: 16 keys)
  - products (en: 11 keys)
  - cart (en: 7 keys)
  - checkout (en: 18 keys)
  - account (en: 8 keys)
  - admin (en: 11 keys)

#### 3. Backend Service Layer
- **File**: `backend/src/services/staticTranslationsService.ts`
- **Functions**:
  - `getTranslationsByLanguage()` - Get all translations for a language
  - `getTranslationsByNamespaceAndLanguage()` - Get specific namespace
  - `getTranslationsForKey()` - Get all languages for a key
  - `upsertTranslation()` - Create/update single translation
  - `bulkUpsertTranslations()` - Bulk operations
  - `deleteTranslation()` - Remove translation
  - `getTranslationKeys()` - List all keys
  - `getNamespaces()` - List all namespaces
  - `searchTranslations()` - Search by value
  - `getTranslationStats()` - Coverage statistics
  - `findMissingTranslations()` - Find untranslated keys

#### 4. Backend API Routes
- **File**: `backend/src/routes/staticTranslationsRoutes.ts`
- **Registered**: `app.ts` line 66

**Public Endpoints** (no auth required):
- `GET /api/static-translations/:languageCode` - Get all translations for i18next
- `GET /api/static-translations/:languageCode/:namespace` - Get namespace translations

**Admin Endpoints** (auth required):
- `GET /api/admin/static-translations/keys` - List all translation keys
- `GET /api/admin/static-translations/namespaces` - List namespaces
- `GET /api/admin/static-translations/key/:key` - Get translations for specific key
- `POST /api/admin/static-translations` - Create/update single translation
- `POST /api/admin/static-translations/bulk` - Bulk upsert
- `DELETE /api/admin/static-translations` - Delete translation
- `GET /api/admin/static-translations/search` - Search translations
- `GET /api/admin/static-translations/stats` - Get statistics
- `GET /api/admin/static-translations/missing` - Find missing translations

### 🚧 IN PROGRESS / PENDING

#### 5. Frontend i18next Configuration
- **File**: `frontend/src/i18n/config.ts`
- **Task**: Update to use API backend instead of static JSON
- **Changes Needed**:
  ```typescript
  // Replace i18next-http-backend with custom backend
  import Backend from 'i18next-http-backend';

  backend: {
    loadPath: '/api/static-translations/{{lng}}/{{ns}}',
    // OR for all at once:
    loadPath: '/api/static-translations/{{lng}}'
  }
  ```

#### 6. Admin UI for Translation Management
- **Location**: `frontend/src/pages/admin/AdminStaticTranslations.tsx` (new file)
- **Features Needed**:
  - List all translation keys grouped by namespace
  - Edit translations for each language
  - Add new translation keys
  - Delete translations
  - Search functionality
  - Show missing translations
  - Statistics dashboard
  - Bulk operations

**UI Components**:
- Translation key browser (tree or table view)
- Multi-language editor (tabs or side-by-side)
- Missing translations highlighter
- Statistics cards
- Search and filter

#### 7. AI Translation Integration
- **Service**: Use existing `backend/src/ai/textTranslator.ts`
- **API**: Extend `backend/src/routes/aiRoutes.ts`
- **New Endpoint**: `POST /api/admin/ai/translate-static`
- **Features**:
  - Translate single key to target language
  - Bulk translate all missing keys
  - Translate entire namespace
  - Use OpenAI or Claude based on settings

#### 8. Admin Panel Navigation
- **File**: `frontend/src/components/AdminLayout.tsx`
- **Task**: Add menu item for Static Translations
- **Icon**: LanguageIcon or TranslateIcon
- **Position**: After "CMS Translations"

#### 9. Testing
- Test API endpoints with Postman/curl
- Test i18next loading from API
- Test admin UI CRUD operations
- Test AI translations
- Test missing translation detection
- Verify performance with large datasets

## Usage Examples

### API Usage

```bash
# Get all English translations
curl http://localhost:4000/api/static-translations/en

# Get specific namespace
curl http://localhost:4000/api/static-translations/en/common

# Admin: Create/update translation
curl -X POST http://localhost:4000/api/admin/static-translations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "translationKey": "hero.newFeature",
    "languageCode": "en",
    "translationValue": "New Feature Text",
    "namespace": "common"
  }'

# Admin: Find missing Georgian translations
curl http://localhost:4000/api/admin/static-translations/missing?targetLanguage=ka \
  -H "Authorization: Bearer $TOKEN"

# Admin: Get statistics
curl http://localhost:4000/api/admin/static-translations/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend Usage

```typescript
// i18next automatically loads from API
const { t } = useTranslation();

// Use translations as before
<h1>{t('hero.title')}</h1>
<p>{t('hero.description')}</p>
<button>{t('nav.cart', { count: 3 })}</button>
```

### Admin UI Usage

1. Navigate to `/admin/static-translations`
2. Select namespace (common, products, etc.)
3. View all translation keys
4. Click key to edit translations for all languages
5. Use AI translate button to auto-translate
6. Save changes
7. View statistics and missing translations

## Benefits

1. **Dynamic Updates**: Change translations without redeploying
2. **Centralized Management**: All translations in database
3. **Multi-Language Support**: Easily add new languages
4. **Translation Coverage**: Track which keys are translated
5. **AI-Powered**: Automatic translations using AI
6. **Version Control**: Track changes with created_at/updated_at
7. **Search**: Find translations by key or value
8. **Scalable**: Add unlimited languages and keys

## Migration from JSON to Database

To migrate existing JSON translations:

1. **Already Done**: Seed script extracted all keys from JSON files
2. **Run**: `npx tsx backend/src/scripts/seedStaticTranslations.ts`
3. **Verify**: Check `static_translations` table in database
4. **Keep JSON as Fallback**: Don't delete JSON files yet

## Future Enhancements

1. **Translation Memory**: Remember previous translations
2. **Context**: Add description field for translator context
3. **Categories**: Additional categorization beyond namespace
4. **Review Workflow**: Translation approval process
5. **Export/Import**: Excel/CSV import/export
6. **Version History**: Full audit trail of changes
7. **Pluralization Rules**: Store plural forms per language
8. **Caching**: Redis cache for high-traffic apps
9. **CDN Integration**: Serve translations from CDN
10. **Translation Suggestions**: Suggest similar translations

## Performance Considerations

1. **Database Indexes**: Already optimized for fast lookups
2. **API Caching**: Consider adding HTTP caching headers
3. **Batch Loading**: Load all translations at once vs. per-namespace
4. **CDN**: Serve translations through CDN for production
5. **Redis Cache**: Cache frequently accessed translations
6. **Lazy Loading**: Load namespaces on demand

## Security

1. **Admin Only**: Write operations require authentication
2. **Public Read**: Anyone can read translations (necessary for i18next)
3. **SQL Injection**: Protected by parameterized queries
4. **XSS**: Frontend should sanitize translation values
5. **Rate Limiting**: Add to prevent abuse

## Monitoring

1. **Missing Translations**: Track keys with no translation in some languages
2. **Usage Statistics**: Monitor which keys are most accessed
3. **Performance**: Monitor API response times
4. **Coverage**: Track translation completion percentage
5. **Changes**: Audit log of who changed what

## Commands

```bash
# Run migration
cd backend && npm run migrate

# Seed translations
cd backend && npx tsx src/scripts/seedStaticTranslations.ts

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Test API
curl http://localhost:4000/api/static-translations/en
```

## Next Steps

1. Update i18next configuration to load from API
2. Create admin UI component for translation management
3. Add AI translation endpoint and UI
4. Add menu item to admin layout
5. Test complete flow
6. Document for other developers
7. Consider deprecating JSON files once stable

## Notes

- Keep English as source language (complete translations)
- Other languages can have partial translations (fallback to English)
- Use AI to quickly translate missing keys
- Admin can override AI translations manually
- All changes are immediate (no deployment needed)
