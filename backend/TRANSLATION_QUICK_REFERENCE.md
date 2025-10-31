# Translation System - Quick Reference

## Common Commands

### Export translations from database to seed files
```bash
npm run export:translations
```
Creates `translationsSeed.sql` and `translationsSeed.json`

### Seed translations into database
```bash
npm run seed:translations
```
Imports from `translationsSeed.sql`

### Run migration (automatically seeds translations)
```bash
npm run migrate
```
Creates schema + seeds translations automatically

## File Locations

- **Seed SQL:** `backend/src/scripts/translationsSeed.sql` (185KB, 609 entries)
- **Seed JSON:** `backend/src/scripts/translationsSeed.json` (for reference)
- **Migration:** `backend/src/scripts/migrate.ts`
- **Docs:** `backend/TRANSLATION_SYSTEM.md`

## API Endpoints

### Get translations (Public)
```bash
curl "http://localhost:4000/api/static-translations?lang=en&namespace=common"
```

### Add/Update translations (Admin only)
```bash
curl -X POST http://localhost:4000/api/static-translations/admin/bulk \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "translations": [
      {
        "translationKey": "key.name",
        "languageCode": "en",
        "translationValue": "Value",
        "namespace": "common"
      }
    ]
  }'
```

## Docker

### Check translations in container
```bash
docker exec luxia-app psql -U luxia luxia -c "SELECT COUNT(*) FROM static_translations;"
```

### View by namespace
```bash
docker exec luxia-app psql -U luxia luxia -c "SELECT namespace, COUNT(*) FROM static_translations GROUP BY namespace;"
```

### Re-seed in container
```bash
docker exec luxia-app bash -c "cd /app/backend && npx tsx src/scripts/seedTranslations.ts"
```

## Development Workflow

1. **Add translation keys to code:**
   ```tsx
   <button>{t('newFeature.button')}</button>
   ```

2. **Add to database:**
   ```sql
   INSERT INTO static_translations VALUES
     ('newFeature.button', 'en', 'Submit', 'common'),
     ('newFeature.button', 'ka', 'გაგზავნა', 'common');
   ```

3. **Export to seed file:**
   ```bash
   npm run export:translations
   ```

4. **Commit changes:**
   ```bash
   git add src/scripts/translationsSeed.sql
   git commit -m "Add translations for new feature"
   ```

## Quick Stats

- **Total entries:** 609
- **Languages:** English (en), Georgian (ka)
- **Namespaces:** common (510), checkout (36), account (16), cart (14), products (22), admin (11)

## Troubleshooting

### Missing translations after migration
```bash
npm run seed:translations
```

### Export not working
```bash
# Check database connection
psql -U postgres -d luxia -c "SELECT COUNT(*) FROM static_translations;"
```

### Test translation API
```bash
curl http://localhost:4000/api/static-translations?lang=en&namespace=common | jq .
```

---

For full documentation, see `TRANSLATION_SYSTEM.md`
