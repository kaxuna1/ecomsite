# Theme Storage & Configuration Analysis

## Executive Summary

The Luxia e-commerce platform implements a comprehensive theme system with **two-tier storage architecture**:
1. **Active Themes** (`themes` table) - User-created and customizable themes
2. **Theme Presets** (`theme_presets` table) - Pre-configured templates available in admin panel

Both store complete design token configurations as JSONB in PostgreSQL, enabling flexible theme management with full customization capabilities.

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL                              │
│  ┌──────────────────┐         ┌──────────────────────┐    │
│  │  My Themes       │         │  Theme Presets       │    │
│  │  (themes table)  │         │  (theme_presets)     │    │
│  └──────────────────┘         └──────────────────────┘    │
│         │                              │                    │
│         │ Create/Edit                  │ Apply Preset       │
│         │                              │                    │
└─────────┼──────────────────────────────┼────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (themeRoutes.ts)                  │
│  ┌──────────────────┐         ┌──────────────────────┐    │
│  │  ThemeService    │         │  ThemeService        │    │
│  │  CRUD Operations │         │  getThemePresets()    │    │
│  └──────────────────┘         └──────────────────────┘    │
└─────────┼──────────────────────────────┼────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE                             │
│  ┌──────────────────┐         ┌──────────────────────┐    │
│  │  themes          │         │  theme_presets        │    │
│  │  - tokens (JSONB)│         │  - tokens (JSONB)     │    │
│  │  - is_active     │         │  - category           │    │
│  │  - version       │         │  - is_featured       │    │
│  └──────────────────┘         └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### 1. `themes` Table (Active Themes)

**Purpose**: Stores user-created, customizable themes that can be activated.

**Schema**:
```sql
CREATE TABLE themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,           -- Internal identifier (e.g., 'luxia-default')
  display_name VARCHAR(255) NOT NULL,          -- User-friendly name (e.g., 'Luxia Default')
  description TEXT,                            -- Optional description
  
  -- Core Configuration
  tokens JSONB NOT NULL,                       -- Complete design token configuration
  
  -- Status & Metadata
  is_active BOOLEAN DEFAULT false,            -- Only one theme can be active
  is_system_theme BOOLEAN DEFAULT false,       -- Protected from deletion/modification
  version INTEGER DEFAULT 1,                    -- Increments on token updates
  parent_theme_id INTEGER REFERENCES themes(id), -- For theme inheritance
  
  -- Preview & Tracking
  thumbnail_url VARCHAR(500),                  -- Preview image URL
  created_by INTEGER REFERENCES admin_users(id),
  updated_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Constraints**:
- **Unique name**: Prevents duplicate theme identifiers
- **Single active theme**: Enforced via application logic (deactivates others on activation)
- **System theme protection**: Cannot modify/delete `is_system_theme = true` themes
- **Version tracking**: Auto-increments when tokens are updated

**Indexes**:
```sql
CREATE INDEX idx_themes_active ON themes(is_active) WHERE is_active = true;
CREATE INDEX idx_themes_tokens ON themes USING GIN(tokens);  -- JSONB GIN index for queries
```

**Default Theme**:
- **Name**: `luxia-default`
- **Display Name**: "Luxia Default"
- **Status**: Active, System Theme
- **Colors**: Jade (#2f6d5f) and Blush (#e8c7c8)
- **Inserted via migration**: `backend/src/scripts/migrate.ts` (lines 1166-1185)

---

### 2. `theme_presets` Table (Pre-configured Templates)

**Purpose**: Stores pre-built theme templates that admins can apply to create new themes.

**Schema**:
```sql
CREATE TABLE theme_presets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,           -- Internal identifier (e.g., 'minimalist-light')
  display_name VARCHAR(255) NOT NULL,           -- Display name (e.g., 'Minimalist Light')
  description TEXT,                             -- Description shown in admin panel
  category VARCHAR(100),                        -- 'light', 'dark', 'seasonal', 'industry'
  
  -- Configuration
  tokens JSONB NOT NULL,                        -- Complete design token configuration (same structure as themes)
  
  -- Preview Assets
  thumbnail_url VARCHAR(500),                   -- Preview image URL
  preview_url VARCHAR(500),                     -- Full preview page URL
  
  -- Metadata
  is_featured BOOLEAN DEFAULT false,            -- Featured badge in admin UI
  display_order INTEGER DEFAULT 0,              -- Sort order in admin panel
  tags TEXT[],                                  -- Searchable tags array
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features**:
- **Read-only templates**: Presets are not directly editable (admins create themes from presets)
- **Category filtering**: Supports filtering by category (light/dark/seasonal)
- **Featured highlighting**: `is_featured = true` shows "Featured" badge
- **Display ordering**: `display_order` controls grid position

**Indexes**:
```sql
CREATE INDEX idx_theme_presets_category ON theme_presets(category);
CREATE INDEX idx_theme_presets_featured ON theme_presets(is_featured) WHERE is_featured = true;
CREATE INDEX idx_theme_presets_display_order ON theme_presets(display_order);
```

**Pre-seeded Presets** (5 templates):
1. **Minimalist Light** (`minimalist-light`)
   - Category: `light`
   - Featured: Yes
   - Colors: Black/white/gray palette
   - Spacing: Compact preset
   - Font: Inter throughout

2. **Bold & Bright** (`bold-bright`)
   - Category: `light`
   - Featured: Yes
   - Colors: Coral (#d63c3c), Teal (#0b7c7c), Yellow (#ffe66d)
   - Spacing: Spacious preset
   - Fonts: Poppins display, Open Sans body

3. **Elegant Dark** (`elegant-dark`)
   - Category: `dark`
   - Featured: Yes
   - Colors: Purple palette (#9d4edd, #7b2cbf, #c77dff)
   - Background: Dark (#0f0e17)
   - Font: Playfair Display display

4. **Ocean Breeze** (`ocean-breeze`)
   - Category: `light`
   - Featured: Yes
   - Colors: Cyan/teal tones (#0e7490, #0f766e)
   - Font: Lora serif headings

5. **Warm Autumn** (`warm-autumn`)
   - Category: `light`
   - Featured: Yes
   - Colors: Orange/brown earth tones (#b45309, #92400e)
   - Background: Warm beige (#fffbeb)
   - Fonts: Playfair Display + Lora

**Insertion**: All presets inserted via migration (`backend/src/scripts/migrate.ts` lines 1188-1253)

---

## Design Token Structure

Both `themes.tokens` and `theme_presets.tokens` store identical JSONB structure:

```typescript
interface DesignTokens {
  version?: string;                    // Token version (e.g., "1.0.0")
  metadata?: {                         // Optional metadata
    displayName?: string;
    description?: string;
    author?: string;
    category?: string;
  };
  color: {                            // Color palette
    brand: {
      primary: string;                 // Main brand color
      secondary: string;               // Secondary brand color
      accent: string;                 // Accent color
    };
    semantic: {
      background: { primary, secondary, elevated };
      text: { primary, secondary, tertiary, inverse, onPrimary, ... };
      border: { default, strong };
      interactive: { default, hover, active, disabled };
      feedback: { success, warning, error, info };
    };
  };
  typography: {                       // Typography system
    fontFamily: { display, body, mono };
    fontSize: { xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl };
    fontWeight: { light, normal, medium, semibold, bold };
    lineHeight: { tight, normal, relaxed };
    letterSpacing: { tight, normal, wide, wider };
  };
  spacing: {                          // Spacing system
    preset: 'compact' | 'normal' | 'spacious';
    xs, sm, md, lg, xl, '2xl', '3xl': string;
  };
  border: {                           // Border styles
    width: { thin, medium, thick };
    radius: { sm, md, lg, xl, '2xl', full };
  };
  shadow: {                           // Shadow system
    sm, md, lg, xl: string;
  };
  gradient?: {                        // Optional gradients
    brand?: { primary?: string };
    preset?: { [key: string]: string };
  };
}
```

**Storage Format**: Stored as JSONB in PostgreSQL, enabling:
- Efficient querying with GIN indexes
- Flexible schema evolution
- Nested structure support
- Partial updates

---

## Backend Implementation

### Service Layer: `themeService.ts`

**Key Methods**:

1. **Theme Management**:
   ```typescript
   async getAllThemes(includeInactive: boolean): Promise<Theme[]>
   async getActiveTheme(): Promise<Theme | null>
   async getThemeById(id: number): Promise<Theme | null>
   async createTheme(input: CreateThemeInput, adminUserId?: number): Promise<Theme>
   async updateTheme(id: number, updates: UpdateThemeInput, adminUserId?: number): Promise<Theme>
   async activateTheme(id: number, adminUserId?: number): Promise<void>
   async deleteTheme(id: number): Promise<void>
   ```

2. **Preset Management**:
   ```typescript
   async getThemePresets(category?: string): Promise<ThemePreset[]>
   ```
   - Fetches all presets (optionally filtered by category)
   - Orders by `display_order ASC, created_at DESC`
   - Returns full preset objects with tokens

3. **CSS Generation**:
   ```typescript
   generateCSS(tokens: DesignTokens): string
   ```
   - Converts design tokens to CSS custom properties (`:root { --variable-name: value; }`)
   - Flattens nested token structure
   - Handles both direct values and token objects with `value` property

4. **Validation**:
   ```typescript
   private validateTokens(tokens: DesignTokens): void
   ```
   - Ensures required categories: `color`, `typography`, `spacing`
   - Validates color structure (brand + semantic)
   - Validates typography structure (fontFamily + fontSize)
   - Validates spacing preset

5. **History Tracking**:
   ```typescript
   async getThemeHistory(themeId: number, limit: number, offset: number): Promise<ThemeHistory[]>
   private async logThemeHistory(...): Promise<void>
   ```
   - Logs all theme changes to `theme_history` table
   - Tracks: created, updated, activated, deactivated actions
   - Stores previous/new tokens for rollback capability

### API Routes: `themeRoutes.ts`

**Public Endpoints** (No authentication):
- `GET /api/themes/active` - Get active theme with generated CSS
- `GET /api/themes/fonts` - Get font library

**Admin Endpoints** (JWT required):
- `GET /api/themes` - List all themes (with `include_inactive` param)
- `GET /api/themes/:id` - Get theme details with CSS
- `POST /api/themes` - Create new theme
- `PUT /api/themes/:id` - Update theme
- `PATCH /api/themes/:id/activate` - Activate theme (deactivates others)
- `PATCH /api/themes/:id/deactivate` - Deactivate theme
- `DELETE /api/themes/:id` - Delete theme
- `GET /api/themes/:id/history` - Get theme change history
- **`GET /api/themes/presets/list`** - **List theme presets** (with optional `category` param)

---

## Frontend Implementation

### Admin Panel: `AdminThemes.tsx`

**Component Structure**:

1. **My Themes Section**:
   - Grid display of all user-created themes
   - Shows active badge, preview colors, actions (Edit, Preview, Duplicate, Export, Delete, Activate)
   - Fetches via: `getAllThemes(true)` (includes inactive)

2. **Theme Presets Section**:
   - Grid display of pre-configured templates
   - Shows color preview (3-column gradient), category badge, featured badge
   - "Use This Theme" button applies preset
   - Fetches via: `getThemePresets()` (React Query, 5-minute cache)

**Preset Application Flow**:
```typescript
const handleApplyPreset = async (preset: ThemePreset) => {
  // 1. Prompt for custom name
  const customName = prompt(`Enter a name for your new theme...`);
  
  // 2. Generate unique internal name
  const newName = `${preset.name}-custom-${Date.now()}`;
  
  // 3. Create theme from preset tokens
  const themeInput: CreateThemeInput = {
    name: newName,
    displayName: customName,
    description: preset.description || `Based on ${preset.displayName} preset`,
    tokens: preset.tokens  // Copy tokens from preset
  };
  
  // 4. Create theme via API
  await createTheme(themeInput);
  
  // 5. Refresh theme list
  await queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
};
```

**Key Features**:
- **Preset Preview**: Extracts primary/secondary/accent colors for visual preview
- **Category Filtering**: Can filter presets by category (not yet implemented in UI)
- **Featured Highlighting**: Shows "Featured" badge for `is_featured = true` presets
- **React Query Caching**: Presets cached for 5 minutes to reduce API calls

### API Client: `frontend/src/api/theme.ts`

**Preset Fetching**:
```typescript
export async function getThemePresets(category?: string): Promise<ThemePreset[]> {
  const response = await api.get('/themes/presets/list', {
    params: category ? { category } : undefined
  });
  return response.data.data.presets;
}
```

**Usage in Admin Panel**:
```typescript
const { data: presets = [], isLoading: isLoadingPresets } = useQuery<ThemePreset[]>({
  queryKey: ['theme-presets'],
  queryFn: () => getThemePresets(),
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

---

## Configuration Workflow

### Creating a Theme from Preset

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin clicks "Use This Theme" on preset card            │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Prompt for custom theme name                            │
│    Input: "My Custom Theme"                                │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend creates CreateThemeInput:                      │
│    {                                                         │
│      name: "minimalist-light-custom-1234567890",            │
│      displayName: "My Custom Theme",                        │
│      tokens: { ...preset.tokens }  // Copy from preset     │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. POST /api/themes                                        │
│    - Validates tokens structure                            │
│    - Checks for duplicate name                              │
│    - Inserts into themes table                             │
│    - Logs to theme_history                                  │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Theme appears in "My Themes" section                    │
│    - Can be edited, activated, duplicated, exported        │
│    - Preset remains unchanged (read-only)                  │
└─────────────────────────────────────────────────────────────┘
```

### Editing a Theme

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin clicks "Edit" on theme card                      │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ThemeEditorModal opens with current tokens              │
│    - Visual editor for colors, typography, spacing        │
│    - Real-time preview                                     │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Admin makes changes and saves                           │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PUT /api/themes/:id                                    │
│    - Validates updated tokens                              │
│    - Updates tokens JSONB column                           │
│    - Increments version                                    │
│    - Logs previous/new tokens to theme_history            │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. If theme is active, frontend refreshes CSS             │
│    - ThemeContext refetches active theme                  │
│    - CSS custom properties updated                         │
│    - Storefront updates immediately                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. **Separation of Presets and Themes**

**Rationale**:
- **Presets are templates**: Read-only, pre-configured starting points
- **Themes are instances**: Editable, activatable, deletable user creations
- **Prevents accidental modification**: Presets remain consistent for all users

**Benefits**:
- Multiple admins can use same preset without conflicts
- Presets can be updated via migration without affecting user themes
- Clear distinction between "templates" and "customizations"

### 2. **JSONB Storage for Tokens**

**Rationale**:
- **Flexibility**: Schema can evolve without migrations
- **Performance**: GIN indexes enable fast queries on token values
- **Nested structure**: Supports complex design token hierarchies
- **PostgreSQL native**: Leverages JSONB operators (`->`, `->>`, `@>`)

**Trade-offs**:
- No strict schema enforcement at database level (validation in application)
- Requires careful migration when token structure changes

### 3. **Single Active Theme Constraint**

**Rationale**:
- **Simplicity**: One theme active at a time simplifies frontend implementation
- **Performance**: No need to merge multiple theme configurations
- **User experience**: Clear "current theme" state

**Implementation**:
- Application-level constraint (not database CHECK)
- `activateTheme()` deactivates all others in transaction
- Frontend queries `/api/themes/active` for current theme

### 4. **Version Tracking**

**Rationale**:
- **Change tracking**: Increments on token updates
- **Future rollback**: Version history enables reverting changes
- **Audit trail**: Combined with `theme_history` table for complete audit

**Implementation**:
- Auto-increments: `version = version + 1` on token update
- Stored in `themes.version` column
- Logged in `theme_history` with previous/new tokens

### 5. **Preset Categories**

**Rationale**:
- **Organization**: Groups presets by style (light/dark/seasonal)
- **Filtering**: Enables category-based filtering in admin UI
- **Future expansion**: Can add more categories without schema changes

**Current Categories**:
- `light`: Light-themed presets (Minimalist Light, Bold & Bright, Ocean Breeze, Warm Autumn)
- `dark`: Dark-themed presets (Elegant Dark)

---

## Current Limitations & Future Enhancements

### Limitations

1. **No Preset Management UI**:
   - Presets can only be added via database migration
   - No admin UI to create/edit presets
   - **Recommendation**: Add admin-only preset management page

2. **No Preset Updates**:
   - Presets are static (updated only via migration)
   - User themes created from presets don't auto-update if preset changes
   - **Recommendation**: Add `preset_version` tracking, show "preset updated" notifications

3. **Limited Preset Metadata**:
   - No preview images (`thumbnail_url` not populated)
   - No full preview pages (`preview_url` not populated)
   - **Recommendation**: Add preset preview generation/upload

4. **No Preset Search**:
   - Can't search presets by tags or description
   - **Recommendation**: Add search/filter UI in admin panel

5. **No Preset Import/Export**:
   - Can't export presets as JSON
   - Can't import custom presets
   - **Recommendation**: Add preset import/export functionality

### Future Enhancements

1. **Preset Marketplace**:
   - Allow admins to share presets
   - Community-contributed presets
   - Preset ratings/reviews

2. **Preset Inheritance**:
   - Link user themes to source preset
   - Show "Based on X preset" badge
   - Option to "update from preset" if preset changes

3. **Preset Variants**:
   - Multiple variants of same preset (e.g., "Minimalist Light - Blue", "Minimalist Light - Green")
   - Variant system with base preset + overrides

4. **Preset Preview Generation**:
   - Auto-generate preview images from tokens
   - Generate full preview pages showing theme applied to sample content

5. **Preset Analytics**:
   - Track which presets are most popular
   - Show usage statistics (how many themes created from each preset)

---

## Migration & Seeding

### Preset Seeding

**Location**: `backend/src/scripts/migrate.ts` (lines 1188-1253)

**Method**: Direct SQL INSERT with `ON CONFLICT DO UPDATE`

**Structure**:
```sql
INSERT INTO theme_presets (
  name, display_name, description, category,
  tokens, is_featured, display_order
) VALUES
  ('minimalist-light', 'Minimalist Light', ...),
  ('bold-bright', 'Bold & Bright', ...),
  ...
ON CONFLICT (name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    tokens = EXCLUDED.tokens,
    ...
```

**Benefits**:
- Idempotent: Can run migration multiple times safely
- Updates existing presets if tokens change
- Preserves existing presets if migration fails

### Adding New Presets

**Process**:
1. Design theme tokens (colors, typography, spacing, etc.)
2. Create JSONB token object
3. Add INSERT statement to migration file
4. Run migration: `npm run migrate`

**Example**:
```sql
INSERT INTO theme_presets (
  name, display_name, description, category,
  tokens, is_featured, display_order
) VALUES (
  'new-preset',
  'New Preset',
  'Description here',
  'light',
  '{"color": {...}, "typography": {...}, ...}'::jsonb,
  true,
  6
) ON CONFLICT (name) DO UPDATE ...
```

---

## Security Considerations

### Access Control

1. **Preset Endpoints**: Protected by `adminAuthMiddleware`
   - Only authenticated admin users can fetch presets
   - Prevents unauthorized access to preset configurations

2. **Theme Management**: All CRUD operations require admin JWT
   - Prevents unauthorized theme creation/modification
   - Ensures only admins can activate themes

3. **System Theme Protection**:
   - `is_system_theme = true` themes cannot be modified/deleted
   - Prevents accidental deletion of default theme

### Data Validation

1. **Token Validation**: `validateTokens()` ensures:
   - Required categories present (color, typography, spacing)
   - Valid color structure (brand + semantic)
   - Valid typography structure (fontFamily + fontSize)

2. **Name Uniqueness**: Database UNIQUE constraint prevents duplicate theme/preset names

3. **SQL Injection Prevention**: All queries use parameterized statements (`$1, $2, ...`)

---

## Performance Considerations

### Database Indexes

1. **GIN Index on Tokens**:
   ```sql
   CREATE INDEX idx_themes_tokens ON themes USING GIN(tokens);
   ```
   - Enables fast JSONB queries (e.g., `WHERE tokens @> '{"color": {...}}'`)
   - Supports partial token matching

2. **Partial Indexes**:
   ```sql
   CREATE INDEX idx_themes_active ON themes(is_active) WHERE is_active = true;
   CREATE INDEX idx_theme_presets_featured ON theme_presets(is_featured) WHERE is_featured = true;
   ```
   - Smaller indexes (only active/featured rows)
   - Faster queries for common filters

3. **Category Index**:
   ```sql
   CREATE INDEX idx_theme_presets_category ON theme_presets(category);
   ```
   - Enables fast category filtering

### Caching Strategy

1. **Frontend (React Query)**:
   - Presets: 5-minute cache (`staleTime: 5 * 60 * 1000`)
   - Themes: 2-minute cache (`staleTime: 2 * 60 * 1000`)
   - Active theme: Refetched on activation

2. **Backend**:
   - No caching currently (direct database queries)
   - **Recommendation**: Add Redis cache for active theme (high read frequency)

### Query Optimization

1. **Preset Fetching**:
   ```sql
   SELECT ... FROM theme_presets
   WHERE category = $1  -- Optional filter
   ORDER BY display_order ASC, created_at DESC
   ```
   - Uses category index if filter provided
   - Sorted by display_order (preset order)

2. **Active Theme**:
   ```sql
   SELECT ... FROM themes
   WHERE is_active = true
   LIMIT 1
   ```
   - Uses partial index on `is_active`
   - Single row result (fast)

---

## Testing Recommendations

### Unit Tests

1. **ThemeService**:
   - Token validation (valid/invalid structures)
   - CSS generation (various token formats)
   - Theme CRUD operations
   - Preset fetching (with/without category filter)

2. **Theme Routes**:
   - Authentication middleware (admin-only)
   - Request validation (required fields)
   - Error handling (404, 409 conflicts)

### Integration Tests

1. **Preset Application Flow**:
   - Create theme from preset
   - Verify tokens copied correctly
   - Verify theme appears in list

2. **Theme Activation**:
   - Activate theme (deactivates others)
   - Verify only one active theme
   - Verify frontend receives updated theme

### E2E Tests (Playwright)

1. **Admin Panel**:
   - Navigate to Themes page
   - View preset grid
   - Apply preset (create theme)
   - Edit theme
   - Activate theme
   - Verify storefront updates

---

## Conclusion

The theme system provides a robust, flexible architecture for managing design tokens:

✅ **Strengths**:
- Clear separation between presets (templates) and themes (instances)
- Flexible JSONB storage enables schema evolution
- Comprehensive validation and error handling
- Full audit trail via `theme_history`
- Efficient database indexing for performance

⚠️ **Areas for Improvement**:
- Preset management UI (currently migration-only)
- Preset preview images/URLs
- Preset search/filtering
- Preset import/export
- Backend caching for active theme

The system is **production-ready** for current use cases, with clear paths for future enhancements.
