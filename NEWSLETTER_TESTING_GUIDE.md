# Newsletter Feature Testing Guide

## Prerequisites
- Backend running on port 4000
- Frontend running on port 5173
- Database migrated (newsletter_subscriptions table exists)
- Admin credentials available

## Testing Checklist

### 1. Public Newsletter Subscription ✅

#### Test 1: Subscribe from API
```bash
curl -X POST http://localhost:4000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test1@example.com", "name": "Test User", "source": "test"}'

# Expected: {"success":true,"message":"Successfully subscribed...","data":{...}}
```

#### Test 2: Duplicate Detection
```bash
curl -X POST http://localhost:4000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test1@example.com", "name": "Test User", "source": "test"}'

# Expected: {"success":false,"error":"This email is already subscribed"}
```

#### Test 3: Email Validation
```bash
curl -X POST http://localhost:4000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "name": "Test"}'

# Expected: {"success":false,"error":"Invalid email format"}
```

#### Test 4: Missing Email
```bash
curl -X POST http://localhost:4000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User"}'

# Expected: {"success":false,"error":"Email is required"}
```

### 2. Newsletter Block on Website

#### Test 5: Create Newsletter Block in CMS
1. Open browser: `http://localhost:5173/admin/login`
2. Login with admin credentials
3. Navigate to Admin → CMS
4. Select an existing page or create new
5. Click "Add Block" → "Newsletter"
6. Fill in:
   - Title: "Join Our Community"
   - Description: "Get exclusive offers and updates"
   - Button Text: "Subscribe Now"
   - Placeholder: "Enter your email"
7. Select template: Gradient
8. Save page

#### Test 6: View Newsletter Block on Frontend
1. Navigate to the CMS page you edited
2. Scroll to newsletter section
3. Verify:
   - ✅ Title displays correctly
   - ✅ Description displays correctly
   - ✅ Email input shows placeholder
   - ✅ Button shows correct text
   - ✅ Icon displays (if enabled)
   - ✅ Styling matches template

#### Test 7: Submit Newsletter Form
1. Enter valid email: `user@example.com`
2. Click "Subscribe Now"
3. Verify:
   - ✅ Button shows "Subscribing..."
   - ✅ Input is disabled during submission
   - ✅ Success message appears
   - ✅ Form resets after success

#### Test 8: Submit Duplicate Email
1. Enter same email again
2. Click "Subscribe Now"
3. Verify:
   - ✅ Error message appears
   - ✅ Message says "already subscribed"

#### Test 9: Test All Templates
1. Go back to Admin → CMS → Edit Page
2. Edit newsletter block
3. Switch template to "Minimal"
4. Save and view on frontend
5. Repeat for "Split" and "Card" templates
6. Verify each template renders correctly

#### Test 10: Test Customization
1. Edit newsletter block
2. Change background color to #1e3a8a
3. Change text color to #ffffff
4. Change button color to #f59e0b
5. Save and view
6. Verify custom colors applied

### 3. Admin Newsletter Management

#### Test 11: Access Newsletter Admin Page
1. Navigate to: `http://localhost:5173/admin/newsletter`
2. Verify:
   - ✅ Page loads without errors
   - ✅ Statistics cards display
   - ✅ Filter panel visible
   - ✅ Table shows subscriptions

#### Test 12: View Statistics
1. Check statistics cards
2. Verify:
   - ✅ Total Subscribers count
   - ✅ Active Subscribers count
   - ✅ This Week count
   - ✅ This Month count

#### Test 13: Filter by Status
1. Click Status dropdown
2. Select "Active"
3. Verify:
   - ✅ Table updates
   - ✅ Only active subscriptions shown

#### Test 14: Search by Email
1. Enter email in search box: "test1"
2. Wait for results
3. Verify:
   - ✅ Table filters to matching emails
   - ✅ Other emails hidden

#### Test 15: Filter by Source
1. Click Source dropdown
2. Select "website"
3. Verify:
   - ✅ Table shows only website subscriptions

#### Test 16: Date Range Filter
1. Select Start Date: one week ago
2. Select End Date: today
3. Verify:
   - ✅ Table shows subscriptions in range
   - ✅ Older subscriptions hidden

#### Test 17: Clear Filters
1. Click "Clear Filters" button
2. Verify:
   - ✅ All filters reset
   - ✅ All subscriptions shown

#### Test 18: Edit Subscription
1. Click edit icon (pencil) on any row
2. Modal opens
3. Change name to "Updated Name"
4. Click "Save Changes"
5. Verify:
   - ✅ Modal closes
   - ✅ Table updates with new name

#### Test 19: Change Subscription Status
1. Click edit icon
2. Change status to "Unsubscribed"
3. Save
4. Verify:
   - ✅ Status badge updates to gray
   - ✅ Status shows "unsubscribed"

#### Test 20: Delete Subscription
1. Click delete icon (trash) on any row
2. Confirm deletion
3. Verify:
   - ✅ Confirmation dialog appears
   - ✅ Row removed from table
   - ✅ Total count decreases

#### Test 21: Pagination
1. If fewer than 50 subscriptions, add more:
```bash
for i in {1..60}; do
  curl -s -X POST http://localhost:4000/api/newsletter/subscribe \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"user${i}@example.com\", \"name\": \"User ${i}\"}"
done
```
2. Verify:
   - ✅ Page 1 shows first 50
   - ✅ "Next" button enabled
   - ✅ Click "Next" shows page 2
   - ✅ "Previous" button works
   - ✅ Page indicator shows correct page

#### Test 22: CSV Export
1. Click "Export CSV" button
2. Verify:
   - ✅ File downloads
   - ✅ Filename includes timestamp
   - ✅ CSV contains all subscriptions
   - ✅ Headers correct (Email, Name, Status, etc.)

#### Test 23: CSV Export with Filters
1. Apply filters (status: active, source: website)
2. Click "Export CSV"
3. Open CSV file
4. Verify:
   - ✅ Only filtered subscriptions included
   - ✅ Matches table results

### 4. API Endpoint Testing (Admin)

#### Test 24: Get Subscriptions List
```bash
# First login to get token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@luxia.local","password":"LuxiaAdmin2024!"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Get subscriptions
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/newsletter/admin/subscriptions?page=1&limit=10"

# Expected: {"success":true,"data":{"subscriptions":[...],"total":N,"page":1,...}}
```

#### Test 25: Get Single Subscription
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/newsletter/admin/subscriptions/1"

# Expected: {"success":true,"data":{...}}
```

#### Test 26: Update Subscription
```bash
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated via API","status":"active"}' \
  "http://localhost:4000/api/newsletter/admin/subscriptions/1"

# Expected: {"success":true,"data":{...},"message":"Subscription updated successfully"}
```

#### Test 27: Get Statistics
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/newsletter/admin/stats"

# Expected: {"success":true,"data":{"total":N,"active":N,"unsubscribed":N,...}}
```

#### Test 28: Export CSV via API
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/newsletter/admin/export" \
  -o newsletter_export.csv

# Check file
cat newsletter_export.csv
```

#### Test 29: Delete Subscription
```bash
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/newsletter/admin/subscriptions/1"

# Expected: {"success":true,"message":"Subscription deleted successfully"}
```

#### Test 30: Public Unsubscribe
```bash
curl -X POST http://localhost:4000/api/newsletter/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com"}'

# Expected: {"success":true,"message":"Successfully unsubscribed from newsletter"}
```

### 5. Edge Cases & Error Handling

#### Test 31: Invalid JWT Token
```bash
curl -H "Authorization: Bearer invalid_token" \
  "http://localhost:4000/api/newsletter/admin/stats"

# Expected: {"message":"Invalid token"} or 401 error
```

#### Test 32: Missing JWT Token
```bash
curl "http://localhost:4000/api/newsletter/admin/stats"

# Expected: 401 Unauthorized
```

#### Test 33: Unsubscribe Non-Existent Email
```bash
curl -X POST http://localhost:4000/api/newsletter/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com"}'

# Expected: {"success":false,"error":"No active subscription found..."}
```

#### Test 34: Large Dataset Performance
```bash
# Add 1000 subscriptions
for i in {1..1000}; do
  curl -s -X POST http://localhost:4000/api/newsletter/subscribe \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"bulk${i}@example.com\", \"name\": \"Bulk ${i}\"}" &
done
wait

# Test pagination speed
time curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/newsletter/admin/subscriptions?page=1&limit=50"

# Test CSV export speed
time curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/newsletter/admin/export" -o bulk_export.csv

# Test search performance
time curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/newsletter/admin/subscriptions?search=bulk500"
```

### 6. Browser Compatibility

#### Test 35: Cross-Browser Testing
Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

Verify:
- Newsletter block renders correctly
- Forms submit successfully
- Admin page displays properly
- CSV downloads work

### 7. Responsive Design

#### Test 36: Mobile View
1. Open browser DevTools
2. Switch to mobile view (iPhone 12)
3. Navigate to CMS page with newsletter
4. Verify:
   - ✅ Form is responsive
   - ✅ Button wraps on small screens
   - ✅ Text is readable
   - ✅ Spacing appropriate

#### Test 37: Admin on Mobile
1. Navigate to `/admin/newsletter` on mobile
2. Verify:
   - ✅ Table scrolls horizontally
   - ✅ Filters stack vertically
   - ✅ Buttons accessible
   - ✅ Modal displays correctly

### 8. Accessibility

#### Test 38: Keyboard Navigation
1. Tab through newsletter form
2. Verify:
   - ✅ Email input focusable
   - ✅ Button focusable
   - ✅ Focus indicators visible
   - ✅ Enter key submits form

#### Test 39: Screen Reader
1. Use screen reader (VoiceOver/NVDA)
2. Navigate newsletter form
3. Verify:
   - ✅ Form labels announced
   - ✅ Button text announced
   - ✅ Error messages announced
   - ✅ Success messages announced

### 9. Performance

#### Test 40: Page Load Time
1. Open DevTools Network tab
2. Load CMS page with newsletter
3. Verify:
   - ✅ Page loads under 2 seconds
   - ✅ No blocking resources
   - ✅ Images optimized

#### Test 41: API Response Time
```bash
# Test subscription endpoint speed
time curl -X POST http://localhost:4000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"speed@test.com","name":"Speed Test"}'

# Expected: Under 500ms
```

## Known Issues

1. **JWT Token Expiry**: Users need to re-login when token expires
   - **Workaround**: Logout and login again

2. **Large CSV Exports**: May be slow with 10,000+ subscriptions
   - **Workaround**: Apply filters before exporting

3. **No Email Confirmation**: Subscriptions are immediately active
   - **Future**: Implement double opt-in

## Success Criteria

✅ All 41 tests pass
✅ No console errors in browser
✅ No server errors in backend logs
✅ Database contains expected data
✅ CSV exports are valid
✅ UI is responsive and accessible

## Reporting Issues

If any test fails:
1. Note the test number
2. Capture error message
3. Check browser console
4. Check backend logs
5. Verify database state
6. Document steps to reproduce

## Clean Up Test Data

After testing:
```sql
-- Connect to database
psql -U postgres -d luxia

-- Delete test subscriptions
DELETE FROM newsletter_subscriptions WHERE email LIKE 'test%@example.com';
DELETE FROM newsletter_subscriptions WHERE email LIKE 'user%@example.com';
DELETE FROM newsletter_subscriptions WHERE email LIKE 'bulk%@example.com';

-- Verify
SELECT COUNT(*) FROM newsletter_subscriptions;
```

---

**Last Updated:** October 30, 2025
**Status:** Ready for Testing
