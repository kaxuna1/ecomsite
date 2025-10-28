// Script to seed initial CMS content for homepage
import { pool } from '../db/client';
import type {
  HeroContent,
  FeaturesContent,
  ProductShowcaseContent,
  TestimonialsContent,
  NewsletterContent
} from '../types/cms';

async function seedCmsContent() {
  try {
    console.log('Seeding CMS content for homepage...');

    // Get the home page ID
    const pageResult = await pool.query('SELECT id FROM cms_pages WHERE slug = $1', ['home']);
    if (pageResult.rows.length === 0) {
      throw new Error('Homepage not found. Run migration first.');
    }

    const pageId = pageResult.rows[0].id;
    console.log(`✓ Found homepage with ID: ${pageId}`);

    // Clear existing blocks
    await pool.query('DELETE FROM cms_blocks WHERE page_id = $1', [pageId]);
    console.log('✓ Cleared existing blocks');

    // 1. Hero Block
    const heroContent: HeroContent = {
      type: 'hero',
      headline: 'Transform Your Scalp Health',
      subheadline: 'Scientifically-Backed Luxury Scalp Care',
      description: 'Experience the perfect blend of nature and science with our premium scalp care products, designed to nourish, strengthen, and revitalize your hair from the roots up.',
      ctaText: 'Shop Now',
      ctaLink: '/products',
      backgroundImage: '/uploads/hero-bg.jpg',
      backgroundImageAlt: 'Luxia Premium Scalp Care Products',
      overlayOpacity: 40,
      textAlignment: 'center'
    };

    await pool.query(
      `INSERT INTO cms_blocks (page_id, block_type, block_key, display_order, content, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pageId, 'hero', 'hero-main', 0, JSON.stringify(heroContent), true]
    );
    console.log('✓ Created hero block');

    // 2. Features Block
    const featuresContent: FeaturesContent = {
      type: 'features',
      title: 'Why Choose Luxia',
      subtitle: 'The science of scalp care, perfected',
      features: [
        {
          id: 'feature-1',
          icon: '🔬',
          title: 'Scientifically Formulated',
          description: 'Developed with dermatologists and backed by clinical research for proven results'
        },
        {
          id: 'feature-2',
          icon: '🌿',
          title: 'Natural Ingredients',
          description: 'Premium botanical extracts and nourishing oils sourced from sustainable farms'
        },
        {
          id: 'feature-3',
          icon: '✨',
          title: 'Visible Results',
          description: 'See healthier, stronger hair and improved scalp condition in just 4 weeks'
        },
        {
          id: 'feature-4',
          icon: '🌍',
          title: 'Eco-Conscious',
          description: 'Committed to sustainability with recyclable packaging and cruelty-free practices'
        }
      ],
      columns: 4
    };

    await pool.query(
      `INSERT INTO cms_blocks (page_id, block_type, block_key, display_order, content, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pageId, 'features', 'features-main', 1, JSON.stringify(featuresContent), true]
    );
    console.log('✓ Created features block');

    // 3. Product Showcase Block
    const productsContent: ProductShowcaseContent = {
      type: 'products',
      title: 'Our Bestsellers',
      subtitle: 'Discover our most-loved scalp care products',
      productIds: [1, 2, 3, 4], // Assuming products with these IDs exist
      displayStyle: 'grid',
      showPrices: true,
      showAddToCart: true,
      ctaText: 'View All Products',
      ctaLink: '/products'
    };

    await pool.query(
      `INSERT INTO cms_blocks (page_id, block_type, block_key, display_order, content, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pageId, 'products', 'products-bestsellers', 2, JSON.stringify(productsContent), true]
    );
    console.log('✓ Created product showcase block');

    // 4. Testimonials Block
    const testimonialsContent: TestimonialsContent = {
      type: 'testimonials',
      title: 'Loved by Thousands',
      subtitle: 'Real results from real customers',
      testimonials: [
        {
          id: 'testimonial-1',
          name: 'Sarah Mitchell',
          role: 'Verified Customer',
          rating: 5,
          text: 'After just 3 weeks of using Luxia products, my scalp feels healthier and my hair has never looked better. The results are truly remarkable!'
        },
        {
          id: 'testimonial-2',
          name: 'Michael Chen',
          role: 'Verified Customer',
          rating: 5,
          text: 'I\'ve tried countless scalp treatments, but nothing compares to Luxia. The quality and effectiveness are unmatched. Highly recommend!'
        },
        {
          id: 'testimonial-3',
          name: 'Emma Rodriguez',
          role: 'Verified Customer',
          rating: 5,
          text: 'Finally found a scalp care brand that delivers on its promises. My hair feels stronger, looks shinier, and my scalp irritation is gone.'
        }
      ],
      displayStyle: 'grid'
    };

    await pool.query(
      `INSERT INTO cms_blocks (page_id, block_type, block_key, display_order, content, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pageId, 'testimonials', 'testimonials-main', 3, JSON.stringify(testimonialsContent), true]
    );
    console.log('✓ Created testimonials block');

    // 5. Newsletter Block
    const newsletterContent: NewsletterContent = {
      type: 'newsletter',
      title: 'Get 15% Off Your First Order',
      description: 'Join our community and receive exclusive tips, early access to new products, and special offers.',
      buttonText: 'Subscribe Now',
      placeholderText: 'Enter your email address',
      successMessage: 'Thank you for subscribing! Check your inbox for your discount code.'
    };

    await pool.query(
      `INSERT INTO cms_blocks (page_id, block_type, block_key, display_order, content, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pageId, 'newsletter', 'newsletter-main', 4, JSON.stringify(newsletterContent), true]
    );
    console.log('✓ Created newsletter block');

    console.log('\n✅ CMS content seeding completed successfully!');
    console.log('📄 Created 5 content blocks for the homepage:');
    console.log('   1. Hero - Main hero banner with CTA');
    console.log('   2. Features - 4 key benefits');
    console.log('   3. Products - Bestselling products showcase');
    console.log('   4. Testimonials - Customer reviews');
    console.log('   5. Newsletter - Email signup with offer');
    console.log('\n🔗 You can now view the homepage at: GET /api/cms/pages/home/public');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding CMS content:', error);
    process.exit(1);
  }
}

seedCmsContent();
