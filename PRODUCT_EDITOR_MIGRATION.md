# Product Editor Migration Guide

## Overview
This guide documents the migration from modal-based product editing to a unified full-page editor with integrated variants management.

## Architecture

### Current State (Modal-Based)
- Product edit in modal (`AdminProducts.tsx`)
- Separate variant modal (`VariantManager.tsx`)
- Limited screen space
- Context switching between product and variants

### New State (Full-Page Editor)
- Dedicated route: `/admin/products/:id/edit` and `/admin/products/new`
- Tab-based navigation: Details | Variants | SEO | Attributes
- Full screen real estate
- Integrated workflow
- Unsaved changes protection

## Implementation Steps

### 1. File Structure

```
/frontend/src/pages/admin/
  └── ProductEditor.tsx                 ← New full-page editor

/frontend/src/components/admin/ProductEditor/
  ├── EditorLayout.tsx                  ← Tab navigation wrapper
  ├── tabs/
  │   ├── DetailsTab.tsx               ← Product details (migrated from modal)
  │   ├── VariantsTab.tsx              ← Integrated variant management
  │   ├── SEOTab.tsx                   ← SEO and metadata
  │   └── AttributesTab.tsx            ← Custom attributes
  └── components/
      ├── StickyHeader.tsx             ← Save/Cancel buttons
      └── SaveIndicator.tsx            ← Auto-save status

/frontend/src/hooks/
  └── useUnsavedChanges.ts             ← Already created ✓

/frontend/src/components/admin/
  └── UnsavedChangesModal.tsx          ← Already created ✓
```

### 2. Routing Updates

Update `App.tsx`:

```typescript
// Add these routes BEFORE the general /admin/products route
<Route path="/admin/products/new" element={<ProductEditor />} />
<Route path="/admin/products/:id/edit" element={<ProductEditor />} />
<Route path="/admin/products" element={<AdminProducts />} />
```

### 3. Navigation Updates

Update `AdminProducts.tsx`:

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Change openEditModal to navigate
const openEditModal = (product: Product) => {
  navigate(`/admin/products/${product.id}/edit`);
};

// Change openCreateModal to navigate
const openCreateModal = () => {
  navigate('/admin/products/new');
};
```

### 4. Component Implementation Order

**Phase 1: Core Structure (Day 1)**
1. ProductEditor.tsx - Main page component
2. EditorLayout.tsx - Tab wrapper
3. StickyHeader.tsx - Header with save buttons

**Phase 2: Details Tab (Day 1-2)**
4. DetailsTab.tsx - Migrate form from modal
5. Form sections organization

**Phase 3: Variants Integration (Day 2-3)**
6. VariantsTab.tsx - Integrate VariantManager
7. Inline variant editing improvements

**Phase 4: Additional Tabs (Day 3)**
8. SEOTab.tsx - SEO metadata
9. AttributesTab.tsx - Custom attributes

**Phase 5: Polish (Day 4)**
10. Unsaved changes integration
11. Testing and bug fixes
12. Responsive design verification

## Key Features

### Unsaved Changes Protection
- Browser beforeunload event handling
- React Router navigation blocking
- Modal with "Save & Leave" / "Discard" / "Cancel" options

### Tab Navigation
- Horizontal tabs on desktop
- Persistent across sessions (localStorage)
- Scroll-into-view on error in other tabs

### Auto-Save (Future Enhancement)
- Draft auto-save every 30 seconds
- Visual indicator of save status
- Explicit "Publish" for final save

## Migration Strategy

### Parallel Running (Recommended)
1. Keep modal-based editor functional
2. Add full-page editor alongside
3. Use feature flag or separate navigation
4. Gradually migrate users
5. Remove modal after validation

### Big Bang (Alternative)
1. Implement full-page editor
2. Test thoroughly
3. Switch all users at once
4. Remove modal code

## Testing Checklist

### Functional Testing
- [ ] Create new product
- [ ] Edit existing product
- [ ] Add/edit/delete variants
- [ ] Upload images
- [ ] Set SEO metadata
- [ ] Add custom attributes
- [ ] Save changes
- [ ] Cancel without saving
- [ ] Unsaved changes warning works
- [ ] Browser refresh warning works

### UX Testing
- [ ] Tab switching is smooth
- [ ] Form validation visible
- [ ] Error states clear
- [ ] Loading states present
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader accessible

### Performance Testing
- [ ] Initial load < 2 seconds
- [ ] Tab switching instant
- [ ] Large forms don't lag
- [ ] Image upload responsive

## Rollback Plan

If issues arise:
1. Revert routing changes in App.tsx
2. Restore modal-based editing in AdminProducts.tsx
3. New editor code can remain (inactive)
4. Fix issues and re-deploy

## Success Metrics

- Time to create product: Reduce by 40%
- Context switches: Eliminate (from 3+ to 0)
- User satisfaction: Increase
- Support tickets: Decrease by 30%

## Next Steps After Migration

1. Add image gallery with drag-drop reordering
2. Implement draft auto-save
3. Add bulk variant operations
4. Create product duplication workflow
5. Add keyboard shortcuts (Cmd+S to save)
6. Implement command palette for quick actions
