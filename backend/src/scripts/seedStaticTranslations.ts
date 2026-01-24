import { pool } from '../db/client';
import * as fs from 'fs';
import * as path from 'path';

// All translations extracted from JSON files
const translations = {
  common: {
    en: {
      "brand": "Luxia",
      "brandTagline": "Luxia Products — Elevated scalp care",
      "language": "Language",
      "loading": "Loading content…",
      "common.cancel": "Cancel",
      "nav.home": "Home",
      "nav.products": "Products",
      "nav.newArrivals": "New Arrivals",
      "nav.bestSellers": "Best Sellers",
      "nav.sale": "Sale",
      "nav.cart": "Cart",
      "nav.cartWithCount": "Cart ({{count}})",
      "nav.admin": "Admin",
      "nav.account": "Account",
      "nav.login": "Login",
      "nav.signup": "Sign up",
      "nav.logout": "Logout",
      "hero.label": "Scalp Products",
      "hero.title": "Illuminate your hair from the root",
      "hero.description": "Our clinically proven serums, masks, and massage tools restore balance to the scalp biome, delivering shine and resilience worthy of a crown.",
      "hero.promise": "Clinical-grade scalp rituals, delivered with concierge care.",
      "hero.ctaPrimary": "Explore collections",
      "hero.ctaSecondary": "Reserve consultation",
      "hero.highlights.clinicalTitle": "Clinically vetted actives",
      "hero.highlights.clinicalDescription": "Dermatologist-reviewed ingredients calm irritation and rebalance the scalp microbiome without silicones or sulfates.",
      "hero.highlights.ritualTitle": "Modern ritual essentials",
      "hero.highlights.ritualDescription": "Layerable textures and precision tools turn nightly care into a restorative ceremony.",
      "hero.metrics.consultations": "Personal consultations completed",
      "hero.metrics.satisfaction": "Client satisfaction rating",
      "hero.metrics.turnaround": "Average concierge response time",
      "home.precisionTitle": "Precision-formulated for sensitive scalps",
      "home.precisionBody": "Luxia's bioactive concentrates feature marine stem cells, cold-pressed adaptogens, and dermatologically vetted peptides. Each formula is fragrance-free, color-safe, and tested on all hair textures.",
      "home.designedTitle": "Products designed by trichologists",
      "home.designedBody": "Our experts blend holistic massage therapy with targeted actives to calm inflammation, reduce shedding, and accelerate healthy growth cycles.",
      "home.featuredHeading": "Signature Products",
      "home.featuredIntro": "From detoxifying scalp masks to overnight serums, our products are meticulously packaged for elevated vanities and travel essentials alike.",
      "home.featuredProducts.celestialName": "Celestial Detox Mask",
      "home.featuredProducts.celestialDescription": "Volcanic enzymes and willow bark gently exfoliate buildup while micro algae replenish essential minerals.",
      "home.featuredProducts.nocturneName": "Nocturne Renewal Serum",
      "home.featuredProducts.nocturneDescription": "Peptide-rich serum that floods the follicles with antioxidants and soothing ceramides overnight.",
      "home.featuredProducts.luminousName": "Luminous Scalp Tonic",
      "home.featuredProducts.luminousDescription": "Cooling tonic balancing sebum and pH while infusing shine with sustainably sourced sea kelp.",
      "home.researchHeading": "Backed by mindful research",
      "home.researchIntro": "Our formulations are reviewed with dermatologists and mindfulness coaches to harmonize results with product care. Each release reflects a six-month testing cadence with real clients.",
      "home.researchPoints.phBalance": "98% reported calmer, balanced scalps after 4 weeks",
      "home.researchPoints.shedding": "87% saw visibly reduced shedding by week 6",
      "home.researchPoints.product": "Consistent product care improved overall hair confidence in 9 of 10 clients",
      "home.testimonialsHeading": "Voices from the collection",
      "home.testimonials.avaQuote": "\"Luxia transformed my nightly routine into a ceremony. The serum soothed my scalp within days and the glow is unreal.\"",
      "home.testimonials.avaName": "Ava D., creative director",
      "home.testimonials.lailaQuote": "\"The consultation experience felt so personal. Their team listened to my scalp struggles and paired me with a product lineup that actually works.\"",
      "home.testimonials.lailaName": "Laila K., textile artist",
      "home.testimonials.theoQuote": "\"Every product feels purposeful. I love the botanical notes and the instant relief from tightness after workouts.\"",
      "home.testimonials.theoName": "Theo M., movement coach",
      "cart.title": "Your Cart",
      "cart.continueShopping": "Continue shopping",
      "cart.item": "item",
      "cart.items": "items",
      "cart.itemsInCart": "in your cart",
      "cart.empty": "Your cart is currently empty.",
      "cart.emptyMessage": "Add some items to your cart to get started on your beauty journey",
      "cart.browse": "Browse products",
      "cart.removedFromCart": "Removed {{productName}} from cart",
      "cart.promoCodeAppliedSuccess": "Promo code applied: ${{discount}} off",
      "cart.invalidPromoCode": "Invalid promo code",
      "cart.promoCodeRemoved": "Promo code removed",
      "cart.onlyLeftInStock": "Only {{count}} left in stock",
      "cart.sku": "SKU",
      "cart.price": "Price",
      "cart.itemTotal": "Item total",
      "cart.orderSummary": "Order summary",
      "cart.havePromoCode": "Have a promo code?",
      "cart.enterPromoCode": "Enter promo code",
      "cart.cancel": "Cancel",
      "cart.promoApplied": "Promo applied",
      "cart.discount": "Discount",
      "cart.shipping": "Shipping",
      "cart.free": "Free",
      "cart.freeShippingProgress": "Add ${{amount}} more for free shipping",
      "cart.estimatedTax": "Estimated tax",
      "cart.subtotal": "Subtotal",
      "cart.total": "Total",
      "cart.proceedToCheckout": "Proceed to checkout",
      "cart.freeShippingOver50": "Free shipping on orders over $50",
      "cart.bestPriceGuarantee": "Best price guarantee",
      "cart.qty": "Qty",
      "cart.moreItems": "more items",
      "cart.viewCart": "View cart",
      "cart.yourCart": "Your cart",
      "reviews.allStatuses": "All",
      "reviews.anonymous": "Anonymous",
      "reviews.basedOn": "Based on {{count}} reviews",
      "reviews.clearFilter": "Clear filter",
      "reviews.confirmDelete": "Are you sure you want to delete this review?",
      "reviews.errorLoading": "Failed to load reviews",
      "reviews.filterByStatus": "Filter by status:",
      "reviews.form.editTitle": "Edit Your Review",
      "reviews.form.errors.ratingRequired": "Please select a rating",
      "reviews.form.errors.submitFailed": "Failed to submit review. Please try again.",
      "reviews.form.maxPhotos": "Up to 5 photos (max 5MB each)",
      "reviews.form.photos": "Add Photos",
      "reviews.form.rating": "Rating",
      "reviews.form.review": "Your Review",
      "reviews.form.reviewPlaceholder": "Share your experience with this product...",
      "reviews.form.reviewingProduct": "Reviewing: ",
      "reviews.form.submit": "Submit Review",
      "reviews.form.title": "Review Title",
      "reviews.form.titlePlaceholder": "Summarize your experience",
      "reviews.form.update": "Update Review",
      "reviews.form.uploadPhotos": "Click to upload photos",
      "reviews.form.uploading": "Uploading...",
      "reviews.form.writeTitle": "Write a Review",
      "reviews.loadError": "Failed to load reviews",
      "reviews.myReviews": "My Reviews",
      "reviews.myReviewsDescription": "Manage your product reviews",
      "reviews.noMatchingReviews": "No reviews match your filters",
      "reviews.noReviews": "No reviews yet. Be the first to review!",
      "reviews.pendingModeration": "Pending Moderation",
      "reviews.rejectionReason": "Rejection Reason",
      "reviews.responseFrom": "Response from {{name}}",
      "reviews.responseFromStore": "Response from Store",
      "reviews.showingResults": "Showing {{start}}-{{end}} of {{total}} reviews",
      "reviews.sort.helpful": "Most Helpful",
      "reviews.sort.ratingHigh": "Highest Rating",
      "reviews.sort.ratingLow": "Lowest Rating",
      "reviews.sort.recent": "Most Recent",
      "reviews.sortBy": "Sort by:",
      "reviews.startShopping": "Start Shopping",
      "reviews.status.approved": "Approved",
      "reviews.status.pending": "Pending",
      "reviews.status.rejected": "Rejected",
      "reviews.verifiedOnly": "Verified purchases only",
      "reviews.verifiedPurchase": "Verified Purchase",
      "reviews.verifiedPurchases": "{{count}} verified purchases",
      "reviews.wasThisHelpful": "Was this helpful?",
      "footer.visit": "Visit",
      "footer.stay": "Stay in touch",
      "footer.crafted": "© {{year}} Luxia Products. Crafted with reverence for healthy scalps."
    },
    ka: {
      // Georgian translations - keeping the same keys with Georgian values
      "brand": "ლუქსია",
      "brandTagline": "ლუქსია პროდუქტები — თავის კანის მაღალი დონის მოვლა",
      "language": "ენა",
      "loading": "იტვირთება კონტენტი…",
      "common.cancel": "Cancel",
      "nav.home": "მთავარი",
      "nav.products": "პროდუქტები",
      "nav.newArrivals": "ახალი შემოსვლები",
      "nav.bestSellers": "ბესტსელერები",
      "nav.sale": "ფასდაკლება",
      "nav.cart": "კალათა",
      "nav.cartWithCount": "კალათა ({{count}})",
      "nav.admin": "ადმინი",
      "nav.account": "ანგარიში",
      "nav.login": "შესვლა",
      "nav.signup": "რეგისტრაცია",
      "nav.logout": "გასვლა",
      "cart.title": "Your Cart",
      "cart.continueShopping": "Continue shopping",
      "cart.item": "item",
      "cart.items": "items",
      "cart.itemsInCart": "in your cart",
      "cart.empty": "Your cart is currently empty.",
      "cart.emptyMessage": "Add some items to your cart to get started on your beauty journey",
      "cart.browse": "Browse products",
      "cart.removedFromCart": "Removed {{productName}} from cart",
      "cart.promoCodeAppliedSuccess": "Promo code applied: ${{discount}} off",
      "cart.invalidPromoCode": "Invalid promo code",
      "cart.promoCodeRemoved": "Promo code removed",
      "cart.onlyLeftInStock": "Only {{count}} left in stock",
      "cart.sku": "SKU",
      "cart.price": "Price",
      "cart.itemTotal": "Item total",
      "cart.orderSummary": "Order summary",
      "cart.havePromoCode": "Have a promo code?",
      "cart.enterPromoCode": "Enter promo code",
      "cart.cancel": "Cancel",
      "cart.promoApplied": "Promo applied",
      "cart.discount": "Discount",
      "cart.shipping": "Shipping",
      "cart.free": "Free",
      "cart.freeShippingProgress": "Add ${{amount}} more for free shipping",
      "cart.estimatedTax": "Estimated tax",
      "cart.subtotal": "Subtotal",
      "cart.total": "Total",
      "cart.proceedToCheckout": "Proceed to checkout",
      "cart.freeShippingOver50": "Free shipping on orders over $50",
      "cart.bestPriceGuarantee": "Best price guarantee",
      "cart.qty": "Qty",
      "cart.moreItems": "more items",
      "cart.viewCart": "View cart",
      "cart.yourCart": "Your cart",
      "reviews.allStatuses": "All",
      "reviews.anonymous": "Anonymous",
      "reviews.basedOn": "Based on {{count}} reviews",
      "reviews.clearFilter": "Clear filter",
      "reviews.confirmDelete": "Are you sure you want to delete this review?",
      "reviews.errorLoading": "Failed to load reviews",
      "reviews.filterByStatus": "Filter by status:",
      "reviews.form.editTitle": "Edit Your Review",
      "reviews.form.errors.ratingRequired": "Please select a rating",
      "reviews.form.errors.submitFailed": "Failed to submit review. Please try again.",
      "reviews.form.maxPhotos": "Up to 5 photos (max 5MB each)",
      "reviews.form.photos": "Add Photos",
      "reviews.form.rating": "Rating",
      "reviews.form.review": "Your Review",
      "reviews.form.reviewPlaceholder": "Share your experience with this product...",
      "reviews.form.reviewingProduct": "Reviewing: ",
      "reviews.form.submit": "Submit Review",
      "reviews.form.title": "Review Title",
      "reviews.form.titlePlaceholder": "Summarize your experience",
      "reviews.form.update": "Update Review",
      "reviews.form.uploadPhotos": "Click to upload photos",
      "reviews.form.uploading": "Uploading...",
      "reviews.form.writeTitle": "Write a Review",
      "reviews.loadError": "Failed to load reviews",
      "reviews.myReviews": "My Reviews",
      "reviews.myReviewsDescription": "Manage your product reviews",
      "reviews.noMatchingReviews": "No reviews match your filters",
      "reviews.noReviews": "No reviews yet. Be the first to review!",
      "reviews.pendingModeration": "Pending Moderation",
      "reviews.rejectionReason": "Rejection Reason",
      "reviews.responseFrom": "Response from {{name}}",
      "reviews.responseFromStore": "Response from Store",
      "reviews.showingResults": "Showing {{start}}-{{end}} of {{total}} reviews",
      "reviews.sort.helpful": "Most Helpful",
      "reviews.sort.ratingHigh": "Highest Rating",
      "reviews.sort.ratingLow": "Lowest Rating",
      "reviews.sort.recent": "Most Recent",
      "reviews.sortBy": "Sort by:",
      "reviews.startShopping": "Start Shopping",
      "reviews.status.approved": "Approved",
      "reviews.status.pending": "Pending",
      "reviews.status.rejected": "Rejected",
      "reviews.verifiedOnly": "Verified purchases only",
      "reviews.verifiedPurchase": "Verified Purchase",
      "reviews.verifiedPurchases": "{{count}} verified purchases",
      "reviews.wasThisHelpful": "Was this helpful?",
      // Add more Georgian translations as needed
    }
  },
  products: {
    en: {
      "title": "Shop Luxia Products",
      "description": "Discover targeted treatments for detox, nourishment, and renewal. Each product is ethically sourced and tested for sensitive scalps.",
      "loading": "Loading products…",
      "notFound": "Product not found.",
      "loadingDetail": "Loading product details…",
      "highlights": "Highlights",
      "usage": "Usage",
      "addToCart": "Add to cart",
      "newArrivals": "New Arrivals",
      "bestSellers": "Best Sellers",
      "onSale": "On Sale"
    },
    ka: {}
  },
  cart: {
    en: {
      "title": "Your Products",
      "empty": "Your cart is currently empty.",
      "browse": "Browse products",
      "quantity": "Quantity",
      "remove": "Remove",
      "subtotal": "Subtotal: ${{amount}}",
      "checkout": "Proceed to checkout"
    },
    ka: {}
  },
  checkout: {
    en: {
      "title": "Secure Checkout",
      "intro": "After confirming your order, you will receive an email and SMS with manual payment instructions. Orders ship once payment is verified by our concierge team.",
      "contactLegend": "Contact Information",
      "nameLabel": "Full name",
      "nameError": "Please enter your name",
      "emailLabel": "Email address",
      "emailError": "Email is required",
      "phoneLabel": "Phone (optional for SMS updates)",
      "shippingLegend": "Shipping",
      "addressLabel": "Address",
      "addressError": "Address is required",
      "notesLabel": "Order notes (optional)",
      "orderTotal": "Order Total",
      "manualProcessing": "Payment is processed manually for bespoke verification. Expect a confirmation within 24 hours.",
      "submitting": "Submitting…",
      "placeOrder": "Place order",
      "error": "An error occurred. Please try again or contact our concierge.",
      "success": "Thank you. We have emailed manual payment instructions and will ship once confirmed."
    },
    ka: {}
  },
  account: {
    en: {
      "profile": "Profile",
      "orders": "Orders",
      "favorites": "Favorites",
      "addresses": "Addresses",
      "logout": "Logout",
      "login": "Login",
      "signup": "Sign Up",
      "welcome": "Welcome back"
    },
    ka: {}
  },
  admin: {
    en: {
      "dashboard": "Dashboard",
      "products": "Products",
      "orders": "Orders",
      "users": "Users",
      "cms": "CMS",
      "translations": "Translations",
      "settings": "Settings",
      "addProduct": "Add Product",
      "editProduct": "Edit Product",
      "deleteProduct": "Delete Product",
      "manageTranslations": "Manage Translations"
    },
    ka: {}
  }
};

// Flatten nested objects into dot notation keys
function flattenObject(obj: any, prefix: string = ''): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = String(value);
    }
  }

  return flattened;
}

async function seedStaticTranslations() {
  const client = await pool.connect();

  try {
    console.log('Seeding static translations...');

    let totalInserted = 0;

    for (const [namespace, languages] of Object.entries(translations)) {
      for (const [languageCode, translationObj] of Object.entries(languages)) {
        const flatTranslations = flattenObject(translationObj);

        for (const [key, value] of Object.entries(flatTranslations)) {
          // Skip empty values
          if (!value || value.trim() === '') {
            continue;
          }

          try {
            await client.query(`
              INSERT INTO static_translations (translation_key, language_code, translation_value, namespace)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (translation_key, language_code, namespace)
              DO UPDATE SET
                translation_value = EXCLUDED.translation_value,
                updated_at = CURRENT_TIMESTAMP
            `, [key, languageCode, value, namespace]);

            totalInserted++;
          } catch (error) {
            console.error(`Failed to insert ${namespace}.${key} (${languageCode}):`, error);
          }
        }
      }
    }

    console.log(`✓ Successfully seeded ${totalInserted} translation entries`);

    // Show statistics
    const stats = await client.query(`
      SELECT
        namespace,
        language_code,
        COUNT(*) as count
      FROM static_translations
      GROUP BY namespace, language_code
      ORDER BY namespace, language_code
    `);

    console.log('\nTranslation statistics:');
    console.table(stats.rows);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedStaticTranslations();
