# Editable Navigation Menu System - Technical Design Document

## Executive Summary

This document provides a comprehensive technical design for implementing an editable, multilingual navigation menu system for the Luxia e-commerce platform. The system will support hierarchical menu structures, full internationalization (EN/KA), and dynamic rendering from backend data.

---

## 1. Best Practices & Research Findings

### 1.1 Database Schema Patterns for Hierarchical Menus

**Adjacency List (Recommended for this project)**
- **Pattern**: Each menu item stores a reference to its parent via `parent_id`
- **Pros**:
  - Simple to understand and maintain
  - Easy to insert/update/delete items
  - Native PostgreSQL recursive CTEs handle depth queries efficiently
  - Flexible for dynamic changes
- **Cons**:
  - Recursive queries needed for full tree traversal
  - Slightly slower for deep hierarchies (not an issue for navigation menus)
- **Use Case**: Perfect for navigation menus with 2-3 levels of depth

**Nested Sets** (Not recommended)
- **Pattern**: Each node stores left/right boundary values
- **Pros**: Fast read queries for entire subtrees
- **Cons**: Complex to maintain, difficult to insert/move items, requires recalculation
- **Use Case**: Better for read-heavy taxonomies, not user-editable menus

**Materialized Path** (Overkill for this use case)
- **Pattern**: Store full path as string (e.g., "/products/shoes/sneakers")
- **Pros**: Very fast for path-based queries
- **Cons**: Complex updates, path length limitations
- **Use Case**: File systems, deeply nested categories

**Recommendation**: Use **Adjacency List with PostgreSQL Recursive CTEs** - aligns with existing project patterns, PostgreSQL strengths, and maintenance simplicity.

### 1.2 Translation Strategies

Following the existing project pattern:
- Separate translation tables with `language_code` foreign key
- LEFT JOIN with COALESCE for fallback to default language
- Consistent with `product_translations`, `cms_page_translations`, `cms_block_translations`

### 1.3 Caching Strategies

**Backend Caching**:
- In-memory cache for published menu items (TTL: 5-10 minutes)
- Invalidate cache on any menu update
- Cache key: `menu:location:lang` (e.g., `menu:header:en`)

**Frontend Caching**:
- React Query with `staleTime: 5 * 60 * 1000` (5 minutes)
- Refetch on window focus for admin users
- localStorage backup for offline resilience

### 1.4 Menu Management Patterns

**Menu Locations**:
- Support multiple menu locations (header, footer, mobile)
- Each location can have different menu items
- Allows different navigation structures per context

**URL Validation**:
- Distinguish between internal routes (starts with `/`) and external URLs
- Validate internal routes against known static routes
- Support dynamic CMS page slugs
- Allow custom external URLs with protocol validation

---

## 2. Database Schema Design

### 2.1 Core Tables

#### `menu_locations` Table
```sql
CREATE TABLE IF NOT EXISTS menu_locations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_menu_locations_code ON menu_locations(code);
CREATE INDEX idx_menu_locations_enabled ON menu_locations(is_enabled);

-- Insert default locations
INSERT INTO menu_locations (code, name, description)
VALUES
  ('header', 'Header Navigation', 'Main navigation menu in the header'),
  ('footer', 'Footer Navigation', 'Navigation links in the footer'),
  ('mobile', 'Mobile Menu', 'Mobile-specific navigation menu')
ON CONFLICT (code) DO NOTHING;
```

#### `menu_items` Table (Adjacency List Pattern)
```sql
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES menu_locations(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,

  -- Ordering and visibility
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,

  -- Link configuration
  link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('internal', 'external', 'cms_page', 'none')),
  link_url VARCHAR(500),
  cms_page_id INTEGER REFERENCES cms_pages(id) ON DELETE SET NULL,

  -- Behavior
  open_in_new_tab BOOLEAN DEFAULT false,
  css_class VARCHAR(100),
  icon_name VARCHAR(50),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_link_type_url CHECK (
    (link_type = 'internal' AND link_url IS NOT NULL) OR
    (link_type = 'external' AND link_url IS NOT NULL) OR
    (link_type = 'cms_page' AND cms_page_id IS NOT NULL) OR
    (link_type = 'none')
  )
);

-- Indexes for performance
CREATE INDEX idx_menu_items_location ON menu_items(location_id);
CREATE INDEX idx_menu_items_parent ON menu_items(parent_id);
CREATE INDEX idx_menu_items_display_order ON menu_items(location_id, parent_id, display_order);
CREATE INDEX idx_menu_items_enabled ON menu_items(is_enabled);
CREATE INDEX idx_menu_items_published ON menu_items(is_published);
CREATE INDEX idx_menu_items_cms_page ON menu_items(cms_page_id);

-- Prevent circular references (menu item cannot be its own parent)
CREATE OR REPLACE FUNCTION prevent_menu_item_circular_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'Menu item cannot be its own parent';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menu_items_prevent_circular
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION prevent_menu_item_circular_reference();

-- Auto-update timestamp
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at_column();
```

#### `menu_item_translations` Table
```sql
CREATE TABLE IF NOT EXISTS menu_item_translations (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL REFERENCES languages(code),

  -- Translatable fields
  label VARCHAR(100) NOT NULL,
  title_attribute VARCHAR(200),
  description TEXT,

  -- SEO (for standalone menu pages)
  meta_title VARCHAR(255),
  meta_description TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(menu_item_id, language_code)
);

CREATE INDEX idx_menu_item_translations_item ON menu_item_translations(menu_item_id);
CREATE INDEX idx_menu_item_translations_lang ON menu_item_translations(language_code);

-- Auto-update timestamp
CREATE TRIGGER update_menu_item_translations_updated_at
  BEFORE UPDATE ON menu_item_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at_column();
```

### 2.2 Schema Rationale

**Separation of Concerns**:
- `menu_locations`: Define where menus appear (header, footer, etc.)
- `menu_items`: Store structure, hierarchy, and link configuration
- `menu_item_translations`: Store language-specific labels

**Link Type Design**:
- `internal`: Static routes like `/products`, `/cart` (stored in `link_url`)
- `external`: Full URLs like `https://example.com` (stored in `link_url`)
- `cms_page`: Dynamic CMS pages (uses `cms_page_id` foreign key)
- `none`: Parent items that don't link anywhere (dropdown containers)

**Hierarchical Support**:
- `parent_id` enables unlimited nesting levels
- `display_order` controls sort order within each level
- Circular reference prevention via trigger

**Performance Optimization**:
- Composite index on `(location_id, parent_id, display_order)` for fast tree queries
- Separate indexes for filtering by enabled/published status

---

## 3. API Design

### 3.1 Public Endpoints (No Authentication)

#### GET `/api/navigation/menu/:location`
Fetch published menu items for frontend rendering.

**Query Parameters**:
- `lang` (optional, default: `en`): Language code

**Response Example**:
```json
{
  "location": "header",
  "items": [
    {
      "id": 1,
      "label": "Products",
      "linkType": "internal",
      "linkUrl": "/products",
      "openInNewTab": false,
      "cssClass": "",
      "iconName": null,
      "children": [
        {
          "id": 2,
          "label": "New Arrivals",
          "linkType": "internal",
          "linkUrl": "/new-arrivals",
          "openInNewTab": false,
          "children": []
        },
        {
          "id": 3,
          "label": "Best Sellers",
          "linkType": "internal",
          "linkUrl": "/best-sellers",
          "openInNewTab": false,
          "children": []
        }
      ]
    },
    {
      "id": 4,
      "label": "About Us",
      "linkType": "cms_page",
      "linkUrl": "/about",
      "cmsPageSlug": "about",
      "openInNewTab": false,
      "children": []
    }
  ]
}
```

**SQL Query Strategy** (Recursive CTE):
```sql
WITH RECURSIVE menu_tree AS (
  -- Base case: root level items
  SELECT
    mi.id,
    mi.parent_id,
    mi.display_order,
    mi.link_type,
    mi.link_url,
    mi.cms_page_id,
    mi.open_in_new_tab,
    mi.css_class,
    mi.icon_name,
    COALESCE(mit.label, mit_default.label) as label,
    COALESCE(mit.title_attribute, mit_default.title_attribute) as title_attribute,
    0 as depth,
    ARRAY[mi.display_order] as sort_path
  FROM menu_items mi
  LEFT JOIN menu_item_translations mit
    ON mi.id = mit.menu_item_id AND mit.language_code = $2
  LEFT JOIN menu_item_translations mit_default
    ON mi.id = mit_default.menu_item_id AND mit_default.language_code = 'en'
  WHERE mi.location_id = (SELECT id FROM menu_locations WHERE code = $1)
    AND mi.parent_id IS NULL
    AND mi.is_enabled = true
    AND mi.is_published = true

  UNION ALL

  -- Recursive case: child items
  SELECT
    mi.id,
    mi.parent_id,
    mi.display_order,
    mi.link_type,
    mi.link_url,
    mi.cms_page_id,
    mi.open_in_new_tab,
    mi.css_class,
    mi.icon_name,
    COALESCE(mit.label, mit_default.label) as label,
    COALESCE(mit.title_attribute, mit_default.title_attribute) as title_attribute,
    mt.depth + 1,
    mt.sort_path || mi.display_order
  FROM menu_items mi
  INNER JOIN menu_tree mt ON mi.parent_id = mt.id
  LEFT JOIN menu_item_translations mit
    ON mi.id = mit.menu_item_id AND mit.language_code = $2
  LEFT JOIN menu_item_translations mit_default
    ON mi.id = mit_default.menu_item_id AND mit_default.language_code = 'en'
  WHERE mi.is_enabled = true
    AND mi.is_published = true
)
SELECT * FROM menu_tree
ORDER BY sort_path;
```

### 3.2 Admin Endpoints (Authentication Required)

#### GET `/api/admin/navigation/menu/:location`
Fetch all menu items (including unpublished) for admin editing.

**Query Parameters**:
- `lang` (optional, default: `en`): Language for labels
- `includeDisabled` (optional, default: `false`): Include disabled items

**Response**: Same hierarchical structure as public endpoint, but includes unpublished items.

---

#### GET `/api/admin/navigation/menu-items/:id`
Get a single menu item with all translations.

**Response Example**:
```json
{
  "id": 1,
  "locationId": 1,
  "locationCode": "header",
  "parentId": null,
  "displayOrder": 1,
  "isEnabled": true,
  "isPublished": true,
  "linkType": "internal",
  "linkUrl": "/products",
  "cmsPageId": null,
  "openInNewTab": false,
  "cssClass": "",
  "iconName": null,
  "translations": [
    {
      "languageCode": "en",
      "label": "Products",
      "titleAttribute": "Browse our products",
      "description": null
    },
    {
      "languageCode": "ka",
      "label": "პროდუქტები",
      "titleAttribute": "იხილეთ ჩვენი პროდუქტები",
      "description": null
    }
  ],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

#### POST `/api/admin/navigation/menu-items`
Create a new menu item.

**Request Body**:
```json
{
  "locationCode": "header",
  "parentId": null,
  "displayOrder": 1,
  "linkType": "internal",
  "linkUrl": "/products",
  "cmsPageId": null,
  "openInNewTab": false,
  "cssClass": "",
  "iconName": null,
  "isEnabled": true,
  "isPublished": false,
  "translations": [
    {
      "languageCode": "en",
      "label": "Products",
      "titleAttribute": "Browse our products"
    },
    {
      "languageCode": "ka",
      "label": "პროდუქტები",
      "titleAttribute": "იხილეთ ჩვენი პროდუქტები"
    }
  ]
}
```

**Validation Rules**:
- At least one translation (preferably default language)
- Valid `linkType` enum value
- If `linkType` is `internal`, validate `linkUrl` against known routes
- If `linkType` is `external`, validate URL format
- If `linkType` is `cms_page`, ensure `cmsPageId` exists
- If `parentId` provided, ensure parent exists and belongs to same location
- Prevent excessive nesting (max 3 levels recommended)

---

#### PATCH `/api/admin/navigation/menu-items/:id`
Update an existing menu item.

**Request Body**: Same as POST, all fields optional except those required by link type.

---

#### DELETE `/api/admin/navigation/menu-items/:id`
Delete a menu item (cascades to children).

**Response**: 204 No Content

---

#### POST `/api/admin/navigation/menu-items/reorder`
Reorder menu items (drag-and-drop support).

**Request Body**:
```json
{
  "locationCode": "header",
  "items": [
    { "id": 1, "parentId": null, "displayOrder": 0 },
    { "id": 2, "parentId": null, "displayOrder": 1 },
    { "id": 3, "parentId": 2, "displayOrder": 0 }
  ]
}
```

**Logic**:
- Batch update `parent_id` and `display_order`
- Use database transaction for atomicity
- Validate that all items belong to the specified location

---

#### GET `/api/admin/navigation/suggestions`
Get available page suggestions for link creation.

**Response Example**:
```json
{
  "staticRoutes": [
    { "label": "Home", "path": "/", "category": "main" },
    { "label": "Products", "path": "/products", "category": "main" },
    { "label": "New Arrivals", "path": "/new-arrivals", "category": "products" },
    { "label": "Best Sellers", "path": "/best-sellers", "category": "products" },
    { "label": "Sale", "path": "/sale", "category": "products" },
    { "label": "Cart", "path": "/cart", "category": "commerce" },
    { "label": "Checkout", "path": "/checkout", "category": "commerce" },
    { "label": "Account Profile", "path": "/account/profile", "category": "account" },
    { "label": "Orders", "path": "/account/orders", "category": "account" },
    { "label": "Favorites", "path": "/account/favorites", "category": "account" }
  ],
  "cmsPages": [
    {
      "id": 1,
      "slug": "about",
      "title": "About Us",
      "translations": [
        { "languageCode": "en", "title": "About Us", "slug": "about" },
        { "languageCode": "ka", "title": "ჩვენ შესახებ", "slug": "chven-shesaxeb" }
      ]
    },
    {
      "id": 2,
      "slug": "contact",
      "title": "Contact Us",
      "translations": [
        { "languageCode": "en", "title": "Contact Us", "slug": "contact" },
        { "languageCode": "ka", "title": "დაგვიკავშირდით", "slug": "dagvikavshirdit" }
      ]
    }
  ]
}
```

**Static Routes Configuration** (Backend):
```typescript
// src/config/staticRoutes.ts
export const STATIC_ROUTES = [
  { label: 'Home', path: '/', category: 'main' },
  { label: 'Products', path: '/products', category: 'main' },
  { label: 'New Arrivals', path: '/new-arrivals', category: 'products' },
  { label: 'Best Sellers', path: '/best-sellers', category: 'products' },
  { label: 'Sale', path: '/sale', category: 'products' },
  { label: 'Cart', path: '/cart', category: 'commerce' },
  { label: 'Checkout', path: '/checkout', category: 'commerce' },
  { label: 'Account Profile', path: '/account/profile', category: 'account' },
  { label: 'Orders', path: '/account/orders', category: 'account' },
  { label: 'Favorites', path: '/account/favorites', category: 'account' },
] as const;
```

---

#### POST `/api/admin/navigation/menu-items/:id/translations/:lang`
Create or update translation for a menu item.

**Request Body**:
```json
{
  "label": "პროდუქტები",
  "titleAttribute": "იხილეთ ჩვენი პროდუქტები",
  "description": null
}
```

---

### 3.3 API Error Handling

**Common Error Responses**:
- `400 Bad Request`: Validation errors, invalid link type combinations
- `404 Not Found`: Menu item, location, or CMS page not found
- `409 Conflict`: Duplicate key, circular reference detected
- `422 Unprocessable Entity`: Business logic errors (e.g., max nesting depth exceeded)
- `500 Internal Server Error`: Database errors, unexpected failures

**Error Response Format**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid menu item configuration",
  "details": [
    {
      "field": "linkUrl",
      "message": "Internal link URL must start with /"
    }
  ]
}
```

---

## 4. Implementation Strategy

### 4.1 Backend Implementation Phases

**Phase 1: Database Migration**
- Create migration file: `008_create_navigation_menu_tables.sql`
- Add tables: `menu_locations`, `menu_items`, `menu_item_translations`
- Add triggers and constraints
- Seed default menu locations

**Phase 2: Service Layer**
- `src/services/navigationService.ts`: Business logic for menu management
  - `getPublishedMenu(locationCode, language)`: Fetch published menu tree
  - `getAllMenuItems(locationCode, options)`: Admin fetch with filters
  - `getMenuItemById(id)`: Get single item with translations
  - `createMenuItem(data)`: Create with validation
  - `updateMenuItem(id, data)`: Update with validation
  - `deleteMenuItem(id)`: Delete with cascading
  - `reorderMenuItems(items)`: Batch reorder
  - `getPageSuggestions()`: Get static routes + CMS pages
  - `validateMenuItemUrl(linkType, url)`: URL validation logic

**Phase 3: Routes Layer**
- `src/routes/navigationRoutes.ts`: Express route handlers
  - Public endpoint: `GET /api/navigation/menu/:location`
  - Admin CRUD endpoints (authenticated)
  - Translation management endpoints
  - Suggestions endpoint

**Phase 4: Caching Layer**
- Implement in-memory cache with TTL
- Cache invalidation on menu updates
- Cache warming on server startup

**Phase 5: Testing**
- Unit tests for service layer
- Integration tests for API endpoints
- Test circular reference prevention
- Test recursive query performance

---

### 4.2 Frontend Implementation Phases

**Phase 1: API Client**
- `src/api/navigation.ts`: API functions for menu operations
  ```typescript
  export const getPublicMenu = (location: string, language: string) =>
    client.get(`/navigation/menu/${location}`, { params: { lang: language } });

  export const getAdminMenu = (location: string, language: string) =>
    adminClient.get(`/admin/navigation/menu/${location}`, { params: { lang: language } });

  export const createMenuItem = (data: CreateMenuItemDto) =>
    adminClient.post('/admin/navigation/menu-items', data);

  // ... other CRUD operations
  ```

**Phase 2: React Query Hooks**
- `src/hooks/useNavigationMenu.ts`: Custom hook for fetching menu
  ```typescript
  export const useNavigationMenu = (location: string) => {
    const { i18n } = useTranslation();

    return useQuery({
      queryKey: ['navigation', location, i18n.language],
      queryFn: () => getPublicMenu(location, i18n.language),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    });
  };
  ```

**Phase 3: Navbar Component Refactoring**
- Update `src/components/Navbar.tsx` to use dynamic menu data
  ```typescript
  const Navbar = () => {
    const { data: menuData } = useNavigationMenu('header');
    const navigation = menuData?.items || [];

    // Render navigation from dynamic data
    // Support nested children (dropdowns)
  };
  ```

**Phase 4: Admin UI Components**
- `src/pages/admin/AdminNavigation.tsx`: Menu management page
  - Location selector (header/footer/mobile)
  - Tree view of menu items
  - Drag-and-drop reordering (react-dnd or dnd-kit)
  - Inline editing of labels
  - Add/Edit/Delete actions

- `src/components/admin/MenuItemEditor.tsx`: Modal for editing menu items
  - Link type selector (internal/external/cms_page/none)
  - URL/Page selector based on link type
  - Suggestions autocomplete for internal routes
  - CMS page picker with search
  - Translation tabs for each language
  - Toggle switches for enabled/published
  - CSS class and icon inputs

- `src/components/admin/MenuItemForm.tsx`: Form fields for menu item
  - React Hook Form for validation
  - Link type conditional rendering
  - URL validation (internal vs external)
  - Translation inputs for each language

**Phase 5: Dropdown Menu Support**
- Update Navbar to render nested menus as dropdowns
- Add hover/click behavior for submenu display
- Mobile-friendly accordion for nested items
- Accessibility support (ARIA attributes, keyboard navigation)

---

### 4.3 Data Flow Architecture

**Frontend Menu Loading (Public)**:
```
1. User visits site
2. Navbar component mounts
3. useNavigationMenu('header') hook triggers
4. React Query checks cache (5min staleTime)
5. If stale/missing, fetch from API
6. Backend executes recursive CTE query
7. Response cached in React Query
8. Navbar renders menu items
9. User switches language → refetch with new lang param
```

**Admin Menu Editing**:
```
1. Admin opens Navigation Management page
2. Fetch menu items for selected location (with unpublished)
3. Admin drags item to reorder
4. Frontend optimistically updates UI
5. POST /api/admin/navigation/menu-items/reorder
6. Backend updates display_order in transaction
7. Invalidate cache for that location
8. React Query refetches menu
9. UI reflects updated order
```

**Menu Item Creation**:
```
1. Admin clicks "Add Menu Item"
2. Modal opens with MenuItemForm
3. Admin selects link type = "internal"
4. Suggestions autocomplete shows static routes
5. Admin types "/prod" → sees "/products"
6. Admin adds translations for EN and KA
7. Clicks "Save"
8. Frontend validates form
9. POST /api/admin/navigation/menu-items
10. Backend validates URL, creates item + translations
11. Invalidate cache
12. Close modal, refetch menu list
```

---

### 4.4 URL Validation Strategy

**Internal URL Validation**:
```typescript
const VALID_INTERNAL_ROUTES = [
  '/',
  '/products',
  '/new-arrivals',
  '/best-sellers',
  '/sale',
  '/cart',
  '/checkout',
  '/account/profile',
  '/account/orders',
  '/account/favorites',
  // Dynamic patterns
  /^\/[a-z0-9\-]+$/, // CMS page slugs
];

export const isValidInternalUrl = (url: string): boolean => {
  return VALID_INTERNAL_ROUTES.some(route => {
    if (typeof route === 'string') {
      return url === route;
    }
    return route.test(url);
  });
};
```

**External URL Validation**:
```typescript
export const isValidExternalUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
```

**Backend Validation**:
- Check link type consistency
- For `internal`: validate against static routes or check if CMS page slug exists
- For `external`: validate URL format and protocol
- For `cms_page`: ensure `cms_page_id` references existing published page
- For `none`: ensure item has no URL fields set

---

### 4.5 Language Switching Behavior

**Frontend**:
```typescript
// When user switches language via LanguageSwitcher
const handleLanguageChange = (newLang: string) => {
  i18n.changeLanguage(newLang);

  // React Query automatically refetches with new language due to queryKey change
  // queryKey: ['navigation', location, i18n.language]
};
```

**Backend Fallback**:
- If translation missing for requested language, fall back to default language (EN)
- COALESCE in SQL query ensures graceful degradation
- Never return null labels

**Example**: User switches to Georgian (ka):
- Menu item has EN translation: "Products"
- Menu item missing KA translation
- Query returns: "Products" (EN fallback) instead of null

---

### 4.6 Caching Implementation

**Backend Cache (Node.js)**:
```typescript
// src/utils/cache.ts
import NodeCache from 'node-cache';

const menuCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every 60s
});

export const getCachedMenu = async (
  location: string,
  language: string,
  fetchFn: () => Promise<any>
) => {
  const cacheKey = `menu:${location}:${language}`;

  let data = menuCache.get(cacheKey);
  if (data) {
    return data;
  }

  data = await fetchFn();
  menuCache.set(cacheKey, data);
  return data;
};

export const invalidateMenuCache = (location: string) => {
  const keys = menuCache.keys();
  keys.forEach(key => {
    if (key.startsWith(`menu:${location}:`)) {
      menuCache.del(key);
    }
  });
};
```

**Frontend Cache (React Query)**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false, // Disable for public users
      refetchOnReconnect: true,
    },
  },
});

// Invalidate on mutation
const createMenuItemMutation = useMutation({
  mutationFn: createMenuItem,
  onSuccess: () => {
    queryClient.invalidateQueries(['navigation']);
  },
});
```

---

## 5. Admin UI Recommendations

### 5.1 Menu Management Page Layout

**Header**:
- Location selector dropdown (Header / Footer / Mobile)
- Language toggle for editing translations
- "Add Menu Item" button
- "Preview Menu" button (opens frontend view)

**Main Content**:
- Tree view with drag-and-drop support
- Nested indentation for visual hierarchy
- Each item row shows:
  - Drag handle icon
  - Menu item label (current language)
  - Link type badge (Internal / External / CMS Page / None)
  - Link URL/page preview
  - Enabled/Published toggle switches
  - Edit button
  - Delete button (with confirmation)

**Example Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Navigation Menu Management                                      │
│ ┌──────────────┐  ┌────────────┐  ┌──────────────┐             │
│ │ Header ▼     │  │ English ▼  │  │ + Add Item   │             │
│ └──────────────┘  └────────────┘  └──────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│ ≡ Home           [Internal: /]              [✓ Enabled] [Edit] │
│ ≡ Products       [Internal: /products]      [✓ Enabled] [Edit] │
│   ├─ ≡ New Arrivals [Internal: /new-arrivals] [✓ Enabled] [Edit]│
│   ├─ ≡ Best Sellers [Internal: /best-sellers] [✓ Enabled] [Edit]│
│   └─ ≡ Sale         [Internal: /sale]         [✓ Enabled] [Edit]│
│ ≡ About Us       [CMS Page: about]          [✓ Enabled] [Edit] │
│ ≡ Contact        [External: https://...]    [✗ Disabled] [Edit]│
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Menu Item Editor Modal

**Tabs**:
- General Settings
- Translations (EN / KA)
- Advanced

**General Settings Tab**:
- Link Type selector (radio buttons or dropdown)
- Conditional fields based on link type:
  - **Internal**: Autocomplete with suggestions (static routes)
  - **External**: Text input with URL validation
  - **CMS Page**: Searchable dropdown of published pages
  - **None**: No link fields (for parent items)
- Parent menu item selector (optional, for nesting)
- Open in new tab checkbox
- CSS class input (optional)
- Icon name input (optional)
- Enabled toggle
- Published toggle

**Translations Tab**:
- Language selector (EN / KA)
- Label input (required)
- Title attribute input (optional, for tooltip)
- Description textarea (optional)

**Advanced Tab**:
- Display order input (number)
- Created/Updated timestamps (read-only)
- Item ID (read-only)

### 5.3 Drag-and-Drop Reordering

**Library**: `@dnd-kit/core` + `@dnd-kit/sortable`

**Features**:
- Drag items to reorder within same level
- Drag items to change parent (move between levels)
- Visual drop zones for nesting
- Smooth animations
- Touch support for tablets
- Keyboard accessibility (arrow keys + Enter)

**Implementation**:
```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const handleDragEnd = (event) => {
  const { active, over } = event;
  if (active.id !== over.id) {
    // Calculate new order and parent
    const updates = calculateReorder(menuItems, active.id, over.id);
    reorderMenuItemsMutation.mutate(updates);
  }
};
```

### 5.4 Inline Editing

**Quick Edit Features**:
- Click on label to edit in place (for current language)
- Toggle switches for enabled/published (no modal needed)
- Auto-save on blur
- Visual feedback on save success/failure

### 5.5 URL/Page Suggestions

**Internal Route Autocomplete**:
```typescript
const [suggestions, setSuggestions] = useState([]);

const handleInternalUrlChange = (value: string) => {
  const matches = STATIC_ROUTES.filter(route =>
    route.path.includes(value) || route.label.toLowerCase().includes(value.toLowerCase())
  );
  setSuggestions(matches);
};

// Render autocomplete dropdown
```

**CMS Page Picker**:
- Searchable dropdown with pagination
- Display: `[Slug] Title` (e.g., `[about] About Us`)
- Filter by published status
- Show language-specific slug in preview

---

## 6. Data Structure Examples

### 6.1 Database Records

**menu_locations**:
```sql
| id | code   | name                | is_enabled |
|----|--------|---------------------|------------|
| 1  | header | Header Navigation   | true       |
| 2  | footer | Footer Navigation   | true       |
| 3  | mobile | Mobile Menu         | true       |
```

**menu_items**:
```sql
| id | location_id | parent_id | display_order | link_type | link_url      | cms_page_id | is_enabled | is_published |
|----|-------------|-----------|---------------|-----------|---------------|-------------|------------|--------------|
| 1  | 1           | NULL      | 0             | internal  | /             | NULL        | true       | true         |
| 2  | 1           | NULL      | 1             | internal  | /products     | NULL        | true       | true         |
| 3  | 1           | 2         | 0             | internal  | /new-arrivals | NULL        | true       | true         |
| 4  | 1           | 2         | 1             | internal  | /best-sellers | NULL        | true       | true         |
| 5  | 1           | NULL      | 2             | cms_page  | NULL          | 1           | true       | true         |
| 6  | 1           | NULL      | 3             | external  | https://blog  | NULL        | false      | false        |
```

**menu_item_translations**:
```sql
| id | menu_item_id | language_code | label          | title_attribute              |
|----|--------------|---------------|----------------|------------------------------|
| 1  | 1            | en            | Home           | Go to homepage               |
| 2  | 1            | ka            | მთავარი        | გადადით მთავარ გვერდზე      |
| 3  | 2            | en            | Products       | Browse our products          |
| 4  | 2            | ka            | პროდუქტები    | იხილეთ ჩვენი პროდუქტები      |
| 5  | 3            | en            | New Arrivals   | Latest products              |
| 6  | 3            | ka            | ახალი ჩასვლები | უახლესი პროდუქტები          |
| 7  | 4            | en            | Best Sellers   | Our most popular products    |
| 8  | 4            | ka            | ბესტსელერები  | ჩვენი ყველაზე პოპულარული    |
| 9  | 5            | en            | About Us       | Learn about our company      |
| 10 | 5            | ka            | ჩვენ შესახებ   | გაიგეთ ჩვენი კომპანიის შესახებ|
```

### 6.2 API Response Examples

**Public Menu Response** (Hierarchical):
```json
{
  "location": "header",
  "items": [
    {
      "id": 1,
      "label": "Home",
      "linkType": "internal",
      "linkUrl": "/",
      "titleAttribute": "Go to homepage",
      "openInNewTab": false,
      "cssClass": "",
      "iconName": null,
      "children": []
    },
    {
      "id": 2,
      "label": "Products",
      "linkType": "internal",
      "linkUrl": "/products",
      "titleAttribute": "Browse our products",
      "openInNewTab": false,
      "cssClass": "",
      "iconName": null,
      "children": [
        {
          "id": 3,
          "label": "New Arrivals",
          "linkType": "internal",
          "linkUrl": "/new-arrivals",
          "titleAttribute": "Latest products",
          "openInNewTab": false,
          "cssClass": "",
          "iconName": null,
          "children": []
        },
        {
          "id": 4,
          "label": "Best Sellers",
          "linkType": "internal",
          "linkUrl": "/best-sellers",
          "titleAttribute": "Our most popular products",
          "openInNewTab": false,
          "cssClass": "",
          "iconName": null,
          "children": []
        }
      ]
    },
    {
      "id": 5,
      "label": "About Us",
      "linkType": "cms_page",
      "linkUrl": "/about",
      "cmsPageSlug": "about",
      "titleAttribute": "Learn about our company",
      "openInNewTab": false,
      "cssClass": "",
      "iconName": null,
      "children": []
    }
  ]
}
```

**Admin Menu Item Detail**:
```json
{
  "id": 2,
  "locationId": 1,
  "locationCode": "header",
  "parentId": null,
  "displayOrder": 1,
  "isEnabled": true,
  "isPublished": true,
  "linkType": "internal",
  "linkUrl": "/products",
  "cmsPageId": null,
  "cmsPageSlug": null,
  "openInNewTab": false,
  "cssClass": "font-bold",
  "iconName": "ShoppingBagIcon",
  "translations": [
    {
      "id": 3,
      "languageCode": "en",
      "label": "Products",
      "titleAttribute": "Browse our products",
      "description": "View all available products",
      "metaTitle": null,
      "metaDescription": null
    },
    {
      "id": 4,
      "languageCode": "ka",
      "label": "პროდუქტები",
      "titleAttribute": "იხილეთ ჩვენი პროდუქტები",
      "description": "ნახეთ ყველა ხელმისაწვდომი პროდუქტი",
      "metaTitle": null,
      "metaDescription": null
    }
  ],
  "childrenCount": 2,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-20T14:30:00.000Z"
}
```

---

## 7. Migration and Deployment Strategy

### 7.1 Database Migration Steps

1. **Create migration file**: `backend/db/migrations/008_create_navigation_menu_tables.sql`
2. **Test migration locally**: `npm run migrate`
3. **Verify table structure**: Check indexes, constraints, triggers
4. **Seed default data**: Menu locations, sample menu items
5. **Rollback plan**: Create down migration script

### 7.2 Backward Compatibility

**During Transition Period**:
- Keep hardcoded navigation in Navbar.tsx as fallback
- Check if dynamic menu data exists, otherwise use static array
- Gradual rollout: Enable dynamic menu for header first, then footer

**Fallback Logic**:
```typescript
const { data: dynamicMenu, isLoading, error } = useNavigationMenu('header');

const navigation = useMemo(() => {
  if (isLoading || error || !dynamicMenu?.items?.length) {
    // Fallback to hardcoded menu
    return [
      { name: t('nav.home'), href: localizedPath('/') },
      { name: t('nav.products'), href: localizedPath('/products') },
      // ... rest of hardcoded items
    ];
  }
  return dynamicMenu.items;
}, [dynamicMenu, isLoading, error, t, localizedPath]);
```

### 7.3 Deployment Checklist

**Backend**:
- [ ] Run database migration
- [ ] Verify all tables created
- [ ] Seed menu locations
- [ ] Deploy navigation service
- [ ] Deploy navigation routes
- [ ] Test public endpoint
- [ ] Test admin endpoints
- [ ] Monitor cache performance

**Frontend**:
- [ ] Deploy API client functions
- [ ] Deploy React Query hooks
- [ ] Update Navbar component
- [ ] Test menu rendering
- [ ] Test language switching
- [ ] Deploy admin UI components
- [ ] Test drag-and-drop
- [ ] Test CRUD operations

**Testing**:
- [ ] End-to-end test: Create menu item → See in navbar
- [ ] Test multilanguage switching
- [ ] Test nested menus (dropdowns)
- [ ] Test mobile menu rendering
- [ ] Performance test: Menu load time < 100ms
- [ ] Accessibility test: Keyboard navigation, screen readers

---

## 8. Performance Considerations

### 8.1 Query Optimization

**Recursive CTE Performance**:
- PostgreSQL handles recursive queries efficiently for shallow hierarchies
- For navigation menus (typically 2-3 levels), performance is excellent
- Index on `(location_id, parent_id, display_order)` ensures fast sorting

**Expected Performance**:
- Menu query execution: < 10ms
- With caching: < 1ms (in-memory cache hit)
- API response time: < 50ms

### 8.2 Caching Strategy Impact

**Without Caching**:
- Every page load triggers database query
- 100 concurrent users = 100 queries/sec
- Database load: Moderate

**With Caching (5min TTL)**:
- First request: Cache miss → Database query
- Next 300 seconds: Cache hit → No database query
- 100 concurrent users = ~1 query/5min
- Database load: Minimal

### 8.3 Frontend Bundle Size

**New Dependencies**:
- `@dnd-kit/core`: ~15 KB gzipped
- `@dnd-kit/sortable`: ~5 KB gzipped
- Total increase: ~20 KB (admin UI only, code-split)

**Impact**: Negligible for admin users, no impact on public users.

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

**Public Endpoints**:
- Read-only access to published menu items
- No authentication required
- Rate limiting recommended (100 req/min per IP)

**Admin Endpoints**:
- JWT authentication required
- Admin role verification
- CSRF protection for mutations
- Input sanitization for all fields

### 9.2 Input Validation

**SQL Injection Prevention**:
- Use parameterized queries (pg library)
- Never concatenate user input into SQL

**XSS Prevention**:
- Sanitize all text inputs (labels, URLs)
- Escape HTML in frontend rendering
- Content Security Policy headers

**URL Validation**:
- Whitelist internal routes
- Validate external URLs (protocol, domain)
- Prevent javascript: URLs
- Prevent data: URLs

### 9.3 CSRF Protection

**Express Middleware**:
```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

router.post('/admin/navigation/menu-items',
  adminAuth,
  csrfProtection,
  createMenuItemHandler
);
```

**Frontend**:
- Include CSRF token in request headers
- Store token in cookie or meta tag

---

## 10. Testing Strategy

### 10.1 Backend Tests

**Unit Tests** (`navigationService.test.ts`):
- Test menu tree building logic
- Test translation fallback behavior
- Test URL validation functions
- Test reorder algorithm
- Test circular reference prevention

**Integration Tests** (`navigationRoutes.test.ts`):
- Test GET public menu endpoint
- Test POST create menu item
- Test PATCH update menu item
- Test DELETE cascade behavior
- Test reorder endpoint
- Test translation endpoints

**Database Tests**:
- Test recursive CTE query correctness
- Test circular reference trigger
- Test cascade deletes
- Test unique constraints

### 10.2 Frontend Tests

**Component Tests**:
- Navbar renders dynamic menu
- Dropdown menus work correctly
- Mobile menu renders nested items
- Language switching refetches menu

**Admin UI Tests**:
- Menu item editor form validation
- Drag-and-drop reordering
- Create/Edit/Delete operations
- Translation management

**E2E Tests** (Playwright/Cypress):
- Full workflow: Create menu item → See in navbar
- Admin creates nested menu → Public sees dropdown
- Language switch → Menu labels change
- Mobile responsive behavior

---

## 11. Future Enhancements

### 11.1 Short-term (MVP+1)

- [ ] Menu item analytics (click tracking)
- [ ] Scheduled publishing (publish_at timestamp)
- [ ] Menu item templates (quick creation)
- [ ] Bulk import/export (JSON/CSV)
- [ ] Menu preview mode (see unpublished changes)

### 11.2 Medium-term

- [ ] A/B testing different menu structures
- [ ] Personalized menus based on user role
- [ ] Menu item badges (NEW, SALE, etc.)
- [ ] Conditional visibility rules (logged in/out)
- [ ] Menu item permissions (role-based)

### 11.3 Long-term

- [ ] Visual menu builder (drag-and-drop canvas)
- [ ] Menu item images/icons library
- [ ] Mega menus with rich content blocks
- [ ] Menu item analytics dashboard
- [ ] AI-powered menu optimization suggestions

---

## 12. Appendix

### 12.1 TypeScript Interfaces

**Backend Types**:
```typescript
// src/types/navigation.ts

export interface MenuLocation {
  id: number;
  code: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: number;
  locationId: number;
  parentId: number | null;
  displayOrder: number;
  isEnabled: boolean;
  isPublished: boolean;
  linkType: 'internal' | 'external' | 'cms_page' | 'none';
  linkUrl?: string;
  cmsPageId?: number;
  openInNewTab: boolean;
  cssClass?: string;
  iconName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemTranslation {
  id: number;
  menuItemId: number;
  languageCode: string;
  label: string;
  titleAttribute?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemTree {
  id: number;
  label: string;
  linkType: string;
  linkUrl?: string;
  cmsPageSlug?: string;
  titleAttribute?: string;
  openInNewTab: boolean;
  cssClass?: string;
  iconName?: string;
  children: MenuItemTree[];
}

export interface PublicMenuResponse {
  location: string;
  items: MenuItemTree[];
}

export interface CreateMenuItemDto {
  locationCode: string;
  parentId?: number;
  displayOrder: number;
  linkType: 'internal' | 'external' | 'cms_page' | 'none';
  linkUrl?: string;
  cmsPageId?: number;
  openInNewTab?: boolean;
  cssClass?: string;
  iconName?: string;
  isEnabled?: boolean;
  isPublished?: boolean;
  translations: Array<{
    languageCode: string;
    label: string;
    titleAttribute?: string;
    description?: string;
  }>;
}

export interface UpdateMenuItemDto extends Partial<CreateMenuItemDto> {}

export interface ReorderMenuItemsDto {
  locationCode: string;
  items: Array<{
    id: number;
    parentId: number | null;
    displayOrder: number;
  }>;
}
```

**Frontend Types**:
```typescript
// src/types/navigation.ts

export interface NavigationMenuItem {
  id: number;
  label: string;
  linkType: 'internal' | 'external' | 'cms_page' | 'none';
  linkUrl?: string;
  cmsPageSlug?: string;
  titleAttribute?: string;
  openInNewTab: boolean;
  cssClass?: string;
  iconName?: string;
  children: NavigationMenuItem[];
}

export interface NavigationMenu {
  location: string;
  items: NavigationMenuItem[];
}

export interface StaticRoute {
  label: string;
  path: string;
  category: string;
}

export interface PageSuggestions {
  staticRoutes: StaticRoute[];
  cmsPages: Array<{
    id: number;
    slug: string;
    title: string;
    translations: Array<{
      languageCode: string;
      title: string;
      slug: string;
    }>;
  }>;
}
```

### 12.2 SQL Query Examples

**Fetch Published Menu Tree**:
```sql
WITH RECURSIVE menu_tree AS (
  -- Root level items
  SELECT
    mi.id,
    mi.parent_id,
    mi.display_order,
    mi.link_type,
    mi.link_url,
    mi.cms_page_id,
    COALESCE(cpt.slug, cpt_default.slug) as cms_page_slug,
    mi.open_in_new_tab,
    mi.css_class,
    mi.icon_name,
    COALESCE(mit.label, mit_default.label) as label,
    COALESCE(mit.title_attribute, mit_default.title_attribute) as title_attribute,
    0 as depth,
    ARRAY[mi.display_order] as sort_path
  FROM menu_items mi
  LEFT JOIN menu_item_translations mit
    ON mi.id = mit.menu_item_id AND mit.language_code = $2
  LEFT JOIN menu_item_translations mit_default
    ON mi.id = mit_default.menu_item_id AND mit_default.language_code = 'en'
  LEFT JOIN cms_pages cp ON mi.cms_page_id = cp.id
  LEFT JOIN cms_page_translations cpt
    ON cp.id = cpt.page_id AND cpt.language_code = $2
  LEFT JOIN cms_page_translations cpt_default
    ON cp.id = cpt_default.page_id AND cpt_default.language_code = 'en'
  WHERE mi.location_id = (SELECT id FROM menu_locations WHERE code = $1)
    AND mi.parent_id IS NULL
    AND mi.is_enabled = true
    AND mi.is_published = true

  UNION ALL

  -- Child items
  SELECT
    mi.id,
    mi.parent_id,
    mi.display_order,
    mi.link_type,
    mi.link_url,
    mi.cms_page_id,
    COALESCE(cpt.slug, cpt_default.slug) as cms_page_slug,
    mi.open_in_new_tab,
    mi.css_class,
    mi.icon_name,
    COALESCE(mit.label, mit_default.label) as label,
    COALESCE(mit.title_attribute, mit_default.title_attribute) as title_attribute,
    mt.depth + 1,
    mt.sort_path || mi.display_order
  FROM menu_items mi
  INNER JOIN menu_tree mt ON mi.parent_id = mt.id
  LEFT JOIN menu_item_translations mit
    ON mi.id = mit.menu_item_id AND mit.language_code = $2
  LEFT JOIN menu_item_translations mit_default
    ON mi.id = mit_default.menu_item_id AND mit_default.language_code = 'en'
  LEFT JOIN cms_pages cp ON mi.cms_page_id = cp.id
  LEFT JOIN cms_page_translations cpt
    ON cp.id = cpt.page_id AND cpt.language_code = $2
  LEFT JOIN cms_page_translations cpt_default
    ON cp.id = cpt_default.page_id AND cpt_default.language_code = 'en'
  WHERE mi.is_enabled = true
    AND mi.is_published = true
)
SELECT * FROM menu_tree
ORDER BY sort_path;
```

**Get Menu Item with All Translations**:
```sql
SELECT
  mi.*,
  ml.code as location_code,
  ml.name as location_name,
  json_agg(
    json_build_object(
      'id', mit.id,
      'languageCode', mit.language_code,
      'label', mit.label,
      'titleAttribute', mit.title_attribute,
      'description', mit.description,
      'metaTitle', mit.meta_title,
      'metaDescription', mit.meta_description
    )
  ) as translations,
  (SELECT COUNT(*) FROM menu_items WHERE parent_id = mi.id) as children_count
FROM menu_items mi
INNER JOIN menu_locations ml ON mi.location_id = ml.id
LEFT JOIN menu_item_translations mit ON mi.id = mit.menu_item_id
WHERE mi.id = $1
GROUP BY mi.id, ml.code, ml.name;
```

### 12.3 Migration Script

**Complete Migration File**:
See `backend/db/migrations/008_create_navigation_menu_tables.sql` (to be created).

### 12.4 Configuration Files

**Static Routes Configuration**:
```typescript
// backend/src/config/staticRoutes.ts
export const STATIC_ROUTES = [
  { label: 'Home', path: '/', category: 'main' },
  { label: 'Products', path: '/products', category: 'main' },
  { label: 'New Arrivals', path: '/new-arrivals', category: 'products' },
  { label: 'Best Sellers', path: '/best-sellers', category: 'products' },
  { label: 'Sale', path: '/sale', category: 'products' },
  { label: 'Cart', path: '/cart', category: 'commerce' },
  { label: 'Checkout', path: '/checkout', category: 'commerce' },
  { label: 'Account Profile', path: '/account/profile', category: 'account' },
  { label: 'Orders', path: '/account/orders', category: 'account' },
  { label: 'Favorites', path: '/account/favorites', category: 'account' },
] as const;

export const STATIC_ROUTE_PATHS = STATIC_ROUTES.map(r => r.path);

export const isValidStaticRoute = (path: string): boolean => {
  return STATIC_ROUTE_PATHS.includes(path);
};
```

---

## Summary

This technical design provides a production-ready blueprint for implementing an editable, multilingual navigation menu system. The design follows industry best practices, aligns with the existing codebase architecture, and provides clear implementation guidance for both backend and frontend teams.

**Key Strengths**:
- Adjacency list pattern for simplicity and flexibility
- PostgreSQL recursive CTEs for efficient tree queries
- Consistent multilanguage pattern with existing CMS tables
- Comprehensive caching strategy for performance
- Robust admin UI with drag-and-drop support
- Full validation and security considerations
- Backward compatibility during rollout

**Next Steps**:
1. Review and approve this design document
2. Create database migration script
3. Implement backend service layer and routes
4. Implement frontend API client and hooks
5. Refactor Navbar component for dynamic rendering
6. Build admin UI components
7. Test and deploy incrementally

---

**Document Version**: 1.0
**Last Updated**: 2025-01-29
**Author**: Claude (Enterprise Architecture Agent)
**Project**: Luxia E-commerce Platform
