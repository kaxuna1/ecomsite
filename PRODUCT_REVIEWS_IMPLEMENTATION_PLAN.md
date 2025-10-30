# Product Reviews & Rating System - Implementation Plan

## Research Summary

Based on analysis of world-class e-commerce platforms (Amazon, Shopify) and database design best practices, this document outlines a comprehensive product review and rating system.

### Key Research Findings

**Industry Best Practices (2025):**
1. **Verified Purchases Priority** - Reviews from verified buyers are weighted more heavily
2. **Recent Reviews Emphasis** - Newer reviews have more influence on aggregate ratings
3. **Multi-Format Reviews** - Support for text, photos, and videos
4. **Review Helpfulness Voting** - Users can mark reviews as helpful/not helpful
5. **Moderation System** - Pending, approved, rejected statuses
6. **Response Management** - Store owners can respond to reviews
7. **Anonymous & Authenticated** - Support both logged-in users and guests

**Database Design Principles:**
1. Separate tables for reviews and rating aggregates
2. Store individual ratings to allow updates
3. Use triggers for automatic aggregate calculation
4. Index on product_id, user_id, created_at
5. Support for review helpfulness tracking
6. Status column for moderation workflow

---

## System Architecture

### Database Schema

#### 1. `product_reviews` Table
Stores individual product reviews with ratings.

```sql
CREATE TABLE product_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,

  -- Review Data
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  review_text TEXT,

  -- Verification
  is_verified_purchase BOOLEAN DEFAULT FALSE,

  -- Media Attachments
  images JSONB DEFAULT '[]',  -- Array of image URLs
  videos JSONB DEFAULT '[]',  -- Array of video URLs

  -- Moderation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderated_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP,
  rejection_reason TEXT,

  -- Metadata
  reviewer_name VARCHAR(255),  -- For anonymous reviews
  reviewer_email VARCHAR(255), -- For anonymous reviews

  -- Helpfulness
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_user_product_review UNIQUE(user_id, product_id)
);

CREATE INDEX idx_product_reviews_product ON product_reviews(product_id, status);
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_created ON product_reviews(created_at DESC);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);
```

#### 2. `review_responses` Table
Store owner/admin responses to reviews.

```sql
CREATE TABLE review_responses (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  admin_user_id BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_review_response UNIQUE(review_id)
);

CREATE INDEX idx_review_responses_review ON review_responses(review_id);
```

#### 3. `review_helpfulness` Table
Track which users found reviews helpful.

```sql
CREATE TABLE review_helpfulness (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- For anonymous users
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_review_helpfulness UNIQUE(review_id, user_id, session_id)
);

CREATE INDEX idx_review_helpfulness_review ON review_helpfulness(review_id);
```

#### 4. `product_rating_aggregates` Table
Cached aggregate rating data for performance.

```sql
CREATE TABLE product_rating_aggregates (
  product_id BIGINT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,

  -- Aggregate Data
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,

  -- Rating Distribution
  rating_1_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_5_count INTEGER DEFAULT 0,

  -- Verified Purchase Stats
  verified_average_rating NUMERIC(3,2) DEFAULT 0.00,
  verified_review_count INTEGER DEFAULT 0,

  -- Timestamps
  last_review_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. Update `products` Table
Add rating fields to products table.

```sql
ALTER TABLE products
  ADD COLUMN average_rating NUMERIC(3,2) DEFAULT 0.00,
  ADD COLUMN review_count INTEGER DEFAULT 0;

CREATE INDEX idx_products_rating ON products(average_rating DESC);
```

---

## Database Functions & Triggers

### 1. Aggregate Calculation Function

```sql
CREATE OR REPLACE FUNCTION update_product_rating_aggregate()
RETURNS TRIGGER AS $$
BEGIN
  -- Update aggregate table
  INSERT INTO product_rating_aggregates (
    product_id,
    average_rating,
    total_reviews,
    total_ratings,
    rating_1_count,
    rating_2_count,
    rating_3_count,
    rating_4_count,
    rating_5_count,
    verified_average_rating,
    verified_review_count,
    last_review_at,
    updated_at
  )
  SELECT
    product_id,
    ROUND(AVG(rating)::numeric, 2) as average_rating,
    COUNT(*) as total_reviews,
    COUNT(*) as total_ratings,
    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1_count,
    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2_count,
    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3_count,
    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4_count,
    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5_count,
    ROUND(AVG(CASE WHEN is_verified_purchase THEN rating ELSE NULL END)::numeric, 2) as verified_average_rating,
    SUM(CASE WHEN is_verified_purchase THEN 1 ELSE 0 END) as verified_review_count,
    MAX(created_at) as last_review_at,
    NOW() as updated_at
  FROM product_reviews
  WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND status = 'approved'
  GROUP BY product_id
  ON CONFLICT (product_id)
  DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    total_ratings = EXCLUDED.total_ratings,
    rating_1_count = EXCLUDED.rating_1_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_5_count = EXCLUDED.rating_5_count,
    verified_average_rating = EXCLUDED.verified_average_rating,
    verified_review_count = EXCLUDED.verified_review_count,
    last_review_at = EXCLUDED.last_review_at,
    updated_at = EXCLUDED.updated_at;

  -- Update products table for quick access
  UPDATE products
  SET
    average_rating = (SELECT average_rating FROM product_rating_aggregates WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)),
    review_count = (SELECT total_reviews FROM product_rating_aggregates WHERE product_id = COALESCE(NEW.product_id, OLD.product_id))
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER product_review_aggregate_insert
AFTER INSERT ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating_aggregate();

CREATE TRIGGER product_review_aggregate_update
AFTER UPDATE ON product_reviews
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.rating IS DISTINCT FROM NEW.rating)
EXECUTE FUNCTION update_product_rating_aggregate();

CREATE TRIGGER product_review_aggregate_delete
AFTER DELETE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating_aggregate();
```

### 2. Helpfulness Counter Update

```sql
CREATE OR REPLACE FUNCTION update_review_helpfulness_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_reviews
  SET
    helpful_count = (SELECT COUNT(*) FROM review_helpfulness WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) AND is_helpful = TRUE),
    not_helpful_count = (SELECT COUNT(*) FROM review_helpfulness WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) AND is_helpful = FALSE)
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_helpfulness_counter
AFTER INSERT OR UPDATE OR DELETE ON review_helpfulness
FOR EACH ROW
EXECUTE FUNCTION update_review_helpfulness_count();
```

---

## Backend Implementation

### API Endpoints

#### Public Endpoints

```typescript
// Get reviews for a product
GET /api/products/:productId/reviews
  Query params:
    - page: number
    - limit: number (default 10)
    - sort: 'recent' | 'helpful' | 'rating_high' | 'rating_low'
    - rating: 1-5 (filter by rating)
    - verified: boolean (only verified purchases)

// Get single review
GET /api/reviews/:id

// Submit review (authenticated or anonymous)
POST /api/products/:productId/reviews
  Body: {
    rating: number (1-5),
    title: string,
    reviewText: string,
    reviewerName?: string, // For anonymous
    reviewerEmail?: string, // For anonymous
    images?: string[], // URLs from uploaded images
    orderId?: number // Auto-marked as verified if valid
  }

// Update own review
PUT /api/reviews/:id

// Delete own review
DELETE /api/reviews/:id

// Mark review as helpful/not helpful
POST /api/reviews/:id/helpfulness
  Body: { isHelpful: boolean }

// Get product rating summary
GET /api/products/:productId/rating-summary
  Response: {
    averageRating: number,
    totalReviews: number,
    ratingDistribution: { 1: number, 2: number, 3: number, 4: number, 5: number },
    verifiedAverageRating: number,
    verifiedReviewCount: number
  }
```

#### Admin Endpoints

```typescript
// Get all reviews (with filters)
GET /api/admin/reviews
  Query: status, productId, userId, page, limit

// Approve review
PATCH /api/admin/reviews/:id/approve

// Reject review
PATCH /api/admin/reviews/:id/reject
  Body: { reason: string }

// Flag review
PATCH /api/admin/reviews/:id/flag

// Delete review
DELETE /api/admin/reviews/:id

// Respond to review
POST /api/admin/reviews/:id/response
  Body: { responseText: string }

// Update response
PUT /api/admin/reviews/:id/response
  Body: { responseText: string }

// Delete response
DELETE /api/admin/reviews/:id/response

// Get review statistics
GET /api/admin/reviews/statistics
```

---

## Frontend Implementation

### Components to Create

#### 1. Review Display Components

**`ProductRatingStars.tsx`**
- Displays star rating (filled/half-filled/empty stars)
- Props: rating (number), size (sm/md/lg), showCount (boolean)
- Usage: Product cards, detail pages, review items

**`ProductRatingSummary.tsx`**
- Overall rating with large stars
- Review count
- Rating distribution bar chart (5★ to 1★)
- Filter buttons for each star rating
- "Write a Review" CTA button

**`ReviewItem.tsx`**
- Individual review card
- Star rating, title, review text
- Reviewer name/avatar
- Verified purchase badge
- Review date
- Helpful/Not helpful buttons with counts
- Images/videos gallery
- Admin response display
- Report button

**`ReviewList.tsx`**
- List of ReviewItem components
- Pagination
- Sort dropdown (Most Recent, Most Helpful, Highest Rating, Lowest Rating)
- Filter by star rating
- Empty state

#### 2. Review Submission Components

**`ReviewForm.tsx`**
- Star rating selector (interactive)
- Title input
- Review text textarea (with character count)
- Image upload (multiple)
- Video upload (optional)
- Anonymous/authenticated mode toggle
- Name/email fields for anonymous
- Guidelines/tips sidebar
- Submit button with loading state

**`ReviewFormModal.tsx`**
- Modal wrapper for ReviewForm
- Triggered from "Write a Review" button
- Success/error toast notifications

#### 3. Admin Components

**`AdminReviewsList.tsx`**
- Table/card view of all reviews
- Status filters (Pending, Approved, Rejected, Flagged)
- Product filter dropdown
- Search by reviewer name/email
- Bulk actions (approve, reject)
- Quick approve/reject buttons

**`AdminReviewDetail.tsx`**
- Full review details
- Product info
- Reviewer info
- Order info (if verified)
- Moderation actions
- Response editor
- Activity log

### Integration Points

1. **Product Detail Page** - Add rating summary and review list below product info
2. **Product Cards** - Display average rating and review count
3. **Product Widgets** - Show ratings in grid/carousel/list layouts
4. **Quick View Modal** - Include rating summary
5. **User Account** - "My Reviews" section
6. **Admin Dashboard** - Reviews management section
7. **Order Confirmation** - "Leave a Review" link/button

---

## Features

### Phase 1 - Core Functionality (MVP)
- ✅ Database schema with tables and triggers
- ✅ Backend API for CRUD operations
- ✅ Review submission (authenticated users only)
- ✅ Review display with star ratings
- ✅ Basic moderation (approve/reject)
- ✅ Product rating aggregation
- ✅ Integration into product pages

### Phase 2 - Enhanced Features
- ✅ Anonymous reviews
- ✅ Review helpfulness voting
- ✅ Image uploads for reviews
- ✅ Admin responses to reviews
- ✅ Verified purchase badges
- ✅ Sort and filter options
- ✅ Rating distribution charts

### Phase 3 - Advanced Features
- Video review uploads
- Review reminders (email after purchase)
- Review incentives system
- Review syndication/import
- Multi-language review support
- AI-powered review analysis
- Fake review detection
- Review widgets for external sites

---

## SEO Considerations

### Schema.org Structured Data

Add AggregateRating and Review schema markup:

```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Product Name",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "245"
  },
  "review": [{
    "@type": "Review",
    "author": { "@type": "Person", "name": "John Doe" },
    "datePublished": "2025-01-15",
    "reviewBody": "Great product!",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "5",
      "bestRating": "5"
    }
  }]
}
```

---

## Security & Validation

1. **Rate Limiting** - Prevent spam reviews (1 review per product per user)
2. **Content Moderation** - Filter profanity, spam, personal info
3. **Image Validation** - File size, type, dimensions
4. **SQL Injection Prevention** - Parameterized queries
5. **XSS Protection** - Sanitize review text before display
6. **Auth Checks** - Verify user owns review before edit/delete
7. **Verified Purchase** - Check order_id exists and matches user

---

## Performance Optimization

1. **Caching** - Redis cache for product rating summaries
2. **Pagination** - Limit reviews per page (10-20)
3. **Lazy Loading** - Load images on scroll
4. **Database Indexes** - On product_id, user_id, created_at, rating
5. **Denormalization** - Store aggregates in separate table
6. **CDN** - Serve review images from CDN

---

## Testing Strategy

### Unit Tests
- Rating aggregate calculation
- Helpfulness counter updates
- Review validation logic

### Integration Tests
- Review submission flow
- Moderation workflow
- Rating updates on approval/rejection

### E2E Tests
- Complete review submission and display
- Admin moderation actions
- Helpfulness voting

---

## Rollout Plan

**Week 1: Database & Backend**
- Create migration scripts
- Implement backend services
- Create API routes
- Write unit tests

**Week 2: Frontend Components**
- Build review display components
- Create review submission form
- Integrate into product pages

**Week 3: Admin Panel**
- Review management interface
- Moderation tools
- Statistics dashboard

**Week 4: Testing & Polish**
- E2E testing
- Performance optimization
- Bug fixes
- Documentation

---

## Success Metrics

1. **Adoption Rate** - % of orders with reviews
2. **Review Volume** - Total reviews per week/month
3. **Average Rating** - Overall product ratings
4. **Moderation Efficiency** - Time to approve/reject
5. **User Engagement** - Helpfulness votes, clicks
6. **Conversion Impact** - Products with reviews vs. without

---

## Future Enhancements

- AI-generated review summaries
- Sentiment analysis
- Review badges (Top Reviewer, Verified Expert)
- Q&A section (separate from reviews)
- Product comparison based on reviews
- Review translation
- Mobile app integration
- Social media sharing
