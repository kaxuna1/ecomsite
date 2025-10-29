# Site Settings System Implementation

## Overview

Complete implementation of a Site Settings system for managing navigation logo/text from the admin panel. The system allows administrators to configure whether the navigation displays text or an image logo, and manage the corresponding content.

## Implementation Summary

### Files Created

1. **`/Users/kakha/Code/ecomsite/backend/src/services/settingsService.ts`**
   - Business logic layer for site settings management
   - Handles CRUD operations on the `site_settings` database table
   - Implements snake_case to camelCase conversion for API responses
   - Functions:
     - `getAllSettings()` - Get all settings as key-value object
     - `getSetting(key)` - Get a single setting by key
     - `updateSetting(key, value)` - Update single setting (upsert)
     - `updateSettings(settings)` - Update multiple settings at once
     - `getPublicLogoSettings()` - Get public-facing logo configuration
     - `isValidLogoType(type)` - Validate logo type enum

2. **`/Users/kakha/Code/ecomsite/backend/src/routes/settingsRoutes.ts`**
   - Express router with public and admin endpoints
   - Multer configuration for logo image uploads
   - Routes:
     - `GET /api/settings/public` - Public endpoint for frontend
     - `GET /api/settings` - Admin: Get all settings
     - `PUT /api/settings` - Admin: Update settings
     - `POST /api/settings/logo` - Admin: Upload logo image

3. **`/Users/kakha/Code/ecomsite/backend/src/app.ts`** (Updated)
   - Added settingsRoutes import and registration

4. **`/Users/kakha/Code/ecomsite/backend/uploads/logo/`** (Created)
   - Directory for logo image storage

5. **`/Users/kakha/Code/ecomsite/backend/test-settings-api.sh`**
   - Test script demonstrating API usage

### Files Modified

- `/Users/kakha/Code/ecomsite/backend/src/app.ts`
  - Imported `settingsRoutes`
  - Added route: `app.use('/api/settings', settingsRoutes);`

## Database Schema

The system uses the existing `site_settings` table:

```sql
CREATE TABLE site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Default settings (already inserted):
- `logo_type` = 'text'
- `logo_text` = 'LUXIA'
- `logo_image_url` = NULL

## API Endpoints

### Public Endpoints

#### GET /api/settings/public
Get logo configuration for frontend navigation.

**Request:**
```bash
curl http://localhost:4000/api/settings/public
```

**Response:**
```json
{
  "logoType": "text",
  "logoText": "LUXIA",
  "logoImageUrl": null
}
```

### Admin Endpoints (Require JWT Authentication)

#### GET /api/settings
Get all settings as key-value object.

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
     http://localhost:4000/api/settings
```

**Response:**
```json
{
  "logoType": "text",
  "logoText": "LUXIA",
  "logoImageUrl": null
}
```

#### PUT /api/settings
Update one or more settings.

**Request:**
```bash
curl -X PUT \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"logoType":"image","logoImageUrl":"/uploads/logo/logo-123.png"}' \
     http://localhost:4000/api/settings
```

**Body Parameters:**
- `logoType` (optional): "text" | "image"
- `logoText` (optional): string | null
- `logoImageUrl` (optional): string | null

**Response:**
```json
{
  "logoType": "image",
  "logoText": "LUXIA",
  "logoImageUrl": "/uploads/logo/logo-123.png"
}
```

**Validation:**
- `logoType` must be either "text" or "image"
- At least one parameter must be provided

#### POST /api/settings/logo
Upload a logo image file.

**Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <TOKEN>" \
     -F "logo=@/path/to/logo.png" \
     http://localhost:4000/api/settings/logo
```

**Response:**
```json
{
  "url": "/uploads/logo/logo-1698765432123-456789.png"
}
```

**Constraints:**
- Max file size: 5MB
- Allowed types: image/* (jpg, png, gif, svg, webp, etc.)
- File naming: `logo-{timestamp}-{random}.{ext}`
- Storage location: `backend/uploads/logo/`

## Implementation Details

### Service Layer Pattern

The `settingsService.ts` follows the existing service layer pattern:
- Separates business logic from route handlers
- Uses PostgreSQL pool for database operations
- Implements parameterized queries for SQL injection prevention
- Handles snake_case ↔ camelCase conversion

### Multer Configuration

Logo uploads use disk storage:
```typescript
const logoStorage = multer.diskStorage({
  destination: 'uploads/logo/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});
```

Features:
- Unique filenames prevent collisions
- Preserves original file extension
- Directory created automatically if missing
- Files served via existing static middleware at `/uploads`

### Authentication

Admin endpoints use the existing `authenticate` middleware:
- Requires JWT token in `Authorization: Bearer <token>` header
- Token obtained via `/api/auth/login` endpoint
- Validates token signature and expiration

### Error Handling

Comprehensive error handling:
- 400 Bad Request: Invalid parameters or validation errors
- 401 Unauthorized: Missing or invalid JWT token
- 500 Internal Server Error: Database or server errors
- Custom error messages for invalid logo types

## Testing

### Test Script

Run the provided test script:
```bash
./test-settings-api.sh
```

### Manual Testing

1. **Test public endpoint:**
   ```bash
   curl http://localhost:4000/api/settings/public
   ```

2. **Login as admin:**
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@luxia.com","password":"your-password"}' \
     | jq -r '.token')
   ```

3. **Get all settings:**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
        http://localhost:4000/api/settings
   ```

4. **Update settings:**
   ```bash
   curl -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"logoType":"text","logoText":"MY BRAND"}' \
        http://localhost:4000/api/settings
   ```

5. **Upload logo:**
   ```bash
   curl -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -F "logo=@logo.png" \
        http://localhost:4000/api/settings/logo
   ```

## Integration Notes

### Frontend Integration

To integrate with the frontend:

1. **Fetch logo settings on app initialization:**
   ```typescript
   const response = await fetch('/api/settings/public');
   const { logoType, logoText, logoImageUrl } = await response.json();
   ```

2. **Display logo in navigation:**
   ```typescript
   {logoType === 'text' ? (
     <span>{logoText}</span>
   ) : (
     <img src={logoImageUrl} alt="Logo" />
   )}
   ```

3. **Admin panel - Update settings:**
   ```typescript
   await fetch('/api/settings', {
     method: 'PUT',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({ logoType, logoText, logoImageUrl })
   });
   ```

4. **Admin panel - Upload logo:**
   ```typescript
   const formData = new FormData();
   formData.append('logo', file);

   const response = await fetch('/api/settings/logo', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` },
     body: formData
   });

   const { url } = await response.json();
   ```

### Static File Serving

Logo images are automatically served via the existing static middleware:
```typescript
app.use('/uploads', express.static(uploadsDir));
```

This means uploaded logos are accessible at:
```
http://localhost:4000/uploads/logo/logo-1698765432123-456789.png
```

## Code Quality

### TypeScript Types

Strong typing throughout:
```typescript
export interface SiteSettings {
  logoType: 'text' | 'image';
  logoText: string | null;
  logoImageUrl: string | null;
}
```

### SQL Injection Prevention

All queries use parameterized statements:
```typescript
await pool.query(
  'SELECT setting_value FROM site_settings WHERE setting_key = $1',
  [dbKey]
);
```

### Transaction Support

Multi-setting updates use transactions:
```typescript
await client.query('BEGIN');
// ... multiple updates
await client.query('COMMIT');
```

## Future Enhancements

Possible improvements:
1. Add settings versioning/history
2. Support multiple logo variants (light/dark theme)
3. Add logo dimension validation
4. Implement image optimization/resizing
5. Add settings caching layer
6. Support logo removal endpoint
7. Add settings import/export functionality

## Troubleshooting

### Logo upload fails
- Check `uploads/logo/` directory exists and is writable
- Verify file size is under 5MB
- Ensure file is a valid image format

### Authentication errors
- Verify JWT token is valid and not expired
- Check `Authorization` header format: `Bearer <token>`
- Confirm admin credentials are correct

### Settings not persisting
- Check database connection
- Verify `site_settings` table exists
- Check for SQL errors in server logs

## Summary

The Site Settings system is fully implemented and tested:

✅ Service layer with all required functions
✅ Public endpoint for frontend consumption
✅ Admin endpoints with JWT authentication
✅ Logo image upload with multer
✅ Proper error handling and validation
✅ Snake_case ↔ camelCase conversion
✅ Transaction support for atomic updates
✅ Static file serving for uploaded images
✅ Test script for API verification

The implementation follows existing patterns from `cmsService.ts` and `productRoutes.ts`, ensuring consistency with the codebase architecture.
