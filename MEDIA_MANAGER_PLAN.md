# Media Manager Implementation Plan

## Overview
Implement a comprehensive media management system with centralized media library, usage tracking, image editing, and seamless integration with products and CMS.

## Architecture

### Database Schema

#### 1. Enhanced cms_media Table
```sql
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS category_id INTEGER;
```

#### 2. Product-Media Relationship (Many-to-Many)
```sql
CREATE TABLE product_media (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES cms_media(id) ON DELETE RESTRICT,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, media_id)
);

CREATE INDEX idx_product_media_product ON product_media(product_id);
CREATE INDEX idx_product_media_media ON product_media(media_id);
CREATE INDEX idx_product_media_featured ON product_media(is_featured);
```

#### 3. Media Categories
```sql
CREATE TABLE media_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES media_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_categories_parent ON media_categories(parent_id);
```

#### 4. Media Tags
```sql
CREATE TABLE media_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE media_tag_pivot (
  media_id INTEGER NOT NULL REFERENCES cms_media(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES media_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (media_id, tag_id)
);

CREATE INDEX idx_media_tag_pivot_media ON media_tag_pivot(media_id);
CREATE INDEX idx_media_tag_pivot_tag ON media_tag_pivot(tag_id);
```

## Backend Implementation

### Services

#### MediaService (backend/src/services/mediaService.ts)
- Enhanced with:
  - `getMediaWithUsage(mediaId)` - Returns media with usage count and details
  - `getMediaUsageDetails(mediaId)` - Returns list of products/content using media
  - `softDelete(mediaId)` - Mark as deleted (don't remove if in use)
  - `restoreMedia(mediaId)` - Restore soft-deleted media
  - `updateUsageCount(mediaId)` - Recalculate usage count
  - `attachTags(mediaId, tagIds)` - Add tags to media
  - `detachTags(mediaId, tagIds)` - Remove tags from media

#### ProductMediaService (NEW: backend/src/services/productMediaService.ts)
```typescript
- attachMediaToProduct(productId, mediaId, options: { isFeatured, displayOrder })
- detachMediaFromProduct(productId, mediaId)
- getProductMedia(productId) - Returns all media for product
- setFeaturedImage(productId, mediaId)
- reorderProductMedia(productId, mediaIds[])
- getFeaturedImage(productId)
```

### API Routes

#### Media Management Routes (backend/src/routes/admin/mediaRoutes.ts)
```typescript
// List & Filter
GET    /api/admin/media
  Query params: page, limit, search, mimeType, categoryId, tagIds[], isDeleted, minWidth, minHeight

// Single Media
GET    /api/admin/media/:id
GET    /api/admin/media/:id/usage  // Returns { products: [], cmsContent: [], total: number }

// Upload & Update
POST   /api/admin/media            // Upload with optional categoryId, tags[]
PUT    /api/admin/media/:id        // Update altText, caption, categoryId, tags[]
POST   /api/admin/media/:id/crop   // Upload cropped version, keep original

// Delete & Restore
DELETE /api/admin/media/:id        // Soft delete (only if usage_count = 0)
POST   /api/admin/media/:id/restore

// Categories & Tags
GET    /api/admin/media/categories
POST   /api/admin/media/categories
GET    /api/admin/media/tags
POST   /api/admin/media/tags
```

#### Product-Media Routes (backend/src/routes/admin/productMediaRoutes.ts)
```typescript
GET    /api/admin/products/:id/media              // Get all product images
POST   /api/admin/products/:id/media              // Attach existing media
DELETE /api/admin/products/:id/media/:mediaId     // Detach media
PUT    /api/admin/products/:id/media/reorder      // body: { mediaIds: [1,2,3] }
PUT    /api/admin/products/:id/media/:mediaId/featured  // Set as featured
```

## Frontend Implementation

### Component Structure

```
frontend/src/components/admin/MediaManager/
├── MediaLibrary.tsx              // Main library component (modal or page)
├── MediaGrid.tsx                 // Grid view of media cards
├── MediaCard.tsx                 // Individual media item
├── MediaListView.tsx             // List view alternative
├── MediaUploader.tsx             // Drag & drop upload zone
├── MediaFilters.tsx              // Search, filter, sort controls
├── MediaDetailsPanel.tsx         // Right sidebar showing metadata
├── MediaSelector.tsx             // Modal for selecting media
├── MediaCategoryManager.tsx      // Manage categories
├── MediaTagManager.tsx           // Manage tags
├── ImageCropEditor.tsx           // Enhanced image editor
└── ProductMediaGallery.tsx       // Product image gallery manager
```

### Key Features

#### 1. MediaLibrary Component
- **Modes**:
  - `browse` - Full media library interface
  - `select` - Modal for selecting media (single or multiple)
- **Views**: Grid (default), List
- **Filters**:
  - Search by filename/alt text
  - Filter by type (image, video, document)
  - Filter by category
  - Filter by tags
  - Filter by dimensions
  - Filter by upload date
  - Show deleted
- **Actions**:
  - Upload new
  - Select/Deselect (in select mode)
  - Edit metadata
  - Crop/Edit image
  - View usage
  - Delete
  - Bulk operations

#### 2. MediaSelector Component
```typescript
interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: CMSMedia | CMSMedia[]) => void;
  multiple?: boolean;
  acceptedTypes?: string[];  // ['image/*', 'video/*']
  maxSelection?: number;
  preselected?: number[];    // Pre-selected media IDs
}
```

#### 3. ImageCropEditor Component (Enhanced)
Using **react-easy-crop** library:
- Freeform cropping
- Aspect ratio presets:
  - Freeform
  - 1:1 (Square)
  - 4:3 (Standard)
  - 16:9 (Widescreen)
  - 3:2 (Photo)
- Zoom slider
- Rotation (90° increments)
- Flip horizontal/vertical
- Real-time preview
- Save as new or replace original
- Keep original option

#### 4. ProductMediaGallery Component
```typescript
interface ProductMediaGalleryProps {
  productId?: number;         // If editing existing product
  media: Array<{
    id: number;
    mediaId: number;
    imageUrl: string;
    altText: string;
    isFeatured: boolean;
    displayOrder: number;
  }>;
  onChange: (media: ProductMedia[]) => void;
  maxImages?: number;         // Default: 10
}
```

Features:
- Drag to reorder images
- Set featured image (first image in gallery)
- Remove image from product
- Edit image (crop)
- Add from media library
- Upload new image

### State Management

```typescript
// API calls using React Query
const useMediaLibrary = (filters: MediaFilters) => useQuery(...);
const useMediaDetails = (mediaId: number) => useQuery(...);
const useUploadMedia = () => useMutation(...);
const useUpdateMedia = () => useMutation(...);
const useDeleteMedia = () => useMutation(...);
const useAttachMedia = () => useMutation(...);

// Local state for selection
const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
```

## Integration Plan

### 1. Product Editor Integration
Replace current single image upload with ProductMediaGallery:

**Before:**
```typescript
<input type="file" onChange={handleImageUpload} />
<img src={imagePreview} />
```

**After:**
```typescript
<ProductMediaGallery
  productId={product?.id}
  media={productMedia}
  onChange={setProductMedia}
  maxImages={10}
/>
```

### 2. CMS Integration
Add media selector to CMS content:
```typescript
<MediaSelector
  isOpen={showMediaSelector}
  onClose={() => setShowMediaSelector(false)}
  onSelect={(media) => insertMediaIntoCMS(media)}
  multiple={false}
  acceptedTypes={['image/*']}
/>
```

### 3. Product Display Updates
Update product pages to show image galleries:
- Main featured image
- Thumbnail gallery below
- Lightbox/carousel on click

## Migration Strategy

### Step 1: Database Migration
1. Run migration to create new tables
2. Migrate existing product images to product_media table
3. Update image URLs to reference media IDs

### Step 2: Backend Implementation
1. Create ProductMediaService
2. Add new routes
3. Update existing product routes to use media references
4. Add backwards compatibility layer

### Step 3: Frontend Implementation
1. Build MediaLibrary components (can be used immediately in CMS)
2. Build ProductMediaGallery
3. Update ProductEditor to use new system
4. Add media selector to CMS

### Step 4: Testing & Rollout
1. Test media upload/management
2. Test product media attachment
3. Test image editing/cropping
4. Test usage tracking
5. Performance testing (large media libraries)

## Technical Specifications

### Image Optimization
- Upload: Optimize with Sharp (already implemented)
- Thumbnails: Generate 3 sizes automatically:
  - Thumbnail: 150x150
  - Medium: 800x800
  - Large: 1920x1920 (current optimization)
- Store dimensions in database
- Lazy loading for media grid

### Performance Considerations
- Pagination: 50 items per page
- Lazy loading images
- Virtual scrolling for large libraries
- Debounced search (300ms)
- Image caching (browser + CDN-ready)
- Optimistic updates for quick UX

### Security
- Admin-only access (JWT authentication)
- File type validation (whitelist)
- File size limits (10MB)
- Virus scanning (optional, future)
- Prevent deletion of in-use media
- Audit log for media operations (optional)

### Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management in modals
- Alt text required for images

## Library Dependencies

### Backend
- `sharp` ✓ (already installed)
- `multer` ✓ (already installed)

### Frontend
- `react-easy-crop` - Modern, maintained cropping library
- `react-dropzone` - Drag & drop file uploads (optional, can use native)
- `@dnd-kit/core` - Drag to reorder images
- `@dnd-kit/sortable` - Sortable list utilities
- `@heroicons/react` ✓ (already installed)
- `@tanstack/react-query` ✓ (already installed)

## Timeline Estimate

- **Database & Backend (Phase 1)**: 2-3 hours
  - Schema design & migration
  - Backend services
  - API routes
  - Testing

- **Core Frontend Components (Phase 2)**: 4-5 hours
  - MediaLibrary, MediaGrid, MediaCard
  - MediaUploader, MediaFilters
  - MediaSelector modal
  - API integration

- **Image Editing (Phase 3)**: 2-3 hours
  - Install react-easy-crop
  - Build ImageCropEditor
  - Integration with upload flow

- **Product Integration (Phase 4)**: 2-3 hours
  - ProductMediaGallery component
  - Update ProductEditor
  - Drag & drop reordering
  - Featured image logic

- **Testing & Polish (Phase 5)**: 2-3 hours
  - End-to-end testing
  - Bug fixes
  - Performance optimization
  - Documentation

**Total: 12-17 hours of development**

## Success Criteria

- ✅ Can upload images to centralized media library
- ✅ Can view all media with search/filter
- ✅ Can see usage details for each media item
- ✅ Can attach existing media to products
- ✅ Can manage product image galleries (reorder, featured)
- ✅ Can crop/edit images with freeform tool
- ✅ Can use same system in CMS
- ✅ Prevents deletion of in-use media
- ✅ Image optimization works automatically
- ✅ Fast and responsive UI

## Future Enhancements

- Video upload support
- PDF preview
- Bulk upload (multiple files at once)
- AI-powered alt text generation
- Automatic tag suggestions
- Image variants (different crops for different contexts)
- External storage (S3, Cloudinary) support
- Image CDN integration
- Advanced search (reverse image search)
- Media analytics (most used, unused media cleanup)
