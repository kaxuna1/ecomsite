// Default content templates for each CMS block type
// These provide sensible defaults when creating new blocks

export const BLOCK_TEMPLATES: Record<string, any> = {
  hero: {
    headline: 'Your Compelling Headline Here',
    subheadline: 'A captivating subheadline that explains your value proposition',
    description: 'Optional additional details about your offering',
    ctaText: 'Shop Now',
    ctaLink: '/products',
    textAlignment: 'center',
    template: 'split-screen',
    backgroundImage: '',
    backgroundImageAlt: '',
    overlayOpacity: 50,
    style: {
      backgroundColor: '#1a1d24',
      secondaryColor: '#e8c7c8',
      accentColor: '#8bba9c',
      textColor: '#ffffff',
      headlineSize: 'lg',
      paddingTop: 'md',
      paddingBottom: 'md',
      minHeight: 'auto',
      enableAnimations: true
    }
  },

  features: {
    title: 'Why Choose Us',
    subtitle: 'Everything you need to succeed',
    columns: 3,
    features: [
      {
        id: 'feature-1',
        icon: 'sparkles',
        title: 'Premium Quality',
        description: 'High-quality products that exceed expectations'
      },
      {
        id: 'feature-2',
        icon: 'bolt',
        title: 'Fast Shipping',
        description: 'Get your order delivered quickly and safely'
      },
      {
        id: 'feature-3',
        icon: 'shield-check',
        title: 'Secure Payment',
        description: 'Your payment information is always protected'
      }
    ]
  },

  products: {
    title: 'Featured Products',
    subtitle: 'Discover our best-selling items',
    ctaText: 'View All Products',
    ctaLink: '/products'
  },

  testimonials: {
    title: 'What Our Customers Say',
    subtitle: 'Real reviews from real customers',
    testimonials: [
      {
        id: 'testimonial-1',
        name: 'Sarah Johnson',
        text: 'Absolutely love this product! It exceeded all my expectations and the quality is outstanding.',
        rating: 5,
        verified: true
      },
      {
        id: 'testimonial-2',
        name: 'Michael Chen',
        text: 'Great service and amazing results. Highly recommend to anyone looking for quality.',
        rating: 5,
        verified: true
      }
    ]
  },

  newsletter: {
    title: 'Join Our Community',
    description: 'Subscribe to our newsletter for exclusive offers, new products, and beauty tips.',
    buttonText: 'Subscribe',
    placeholderText: 'Enter your email'
  },

  text_image: {
    title: 'Our Story',
    content: 'Share your compelling story here. You can use **bold text** for emphasis and create engaging content that resonates with your audience.',
    image: '',
    imagePosition: 'right',
    imageAlt: 'Descriptive alt text for image'
  },

  stats: {
    title: 'Our Impact in Numbers',
    subtitle: 'Trusted by customers worldwide',
    columns: 4,
    stats: [
      {
        id: 'stat-1',
        value: '10,000+',
        label: 'Happy Customers',
        icon: '👥'
      },
      {
        id: 'stat-2',
        value: '50,000+',
        label: 'Products Sold',
        icon: '📦'
      },
      {
        id: 'stat-3',
        value: '4.9/5',
        label: 'Average Rating',
        icon: '⭐'
      },
      {
        id: 'stat-4',
        value: '30+',
        label: 'Countries Served',
        icon: '🌍'
      }
    ]
  },

  cta: {
    title: 'Ready to Get Started?',
    description: 'Join thousands of satisfied customers and transform your experience today.',
    primaryButtonText: 'Shop Now',
    primaryButtonLink: '/products',
    secondaryButtonText: 'Learn More',
    secondaryButtonLink: '/about',
    backgroundImage: '',
    backgroundImageAlt: ''
  },

  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know',
    enableSearch: true,
    enableCategories: true,
    categories: ['General', 'Shipping', 'Returns', 'Payment'],
    faqs: [
      {
        id: 'faq-1',
        question: 'How long does shipping take?',
        answer: 'Standard shipping typically takes 3-5 business days. Express shipping options are available for faster delivery.',
        category: 'Shipping'
      },
      {
        id: 'faq-2',
        question: 'What is your return policy?',
        answer: 'We offer a 30-day money-back guarantee on all products. Items must be unused and in original packaging.',
        category: 'Returns'
      },
      {
        id: 'faq-3',
        question: 'Do you ship internationally?',
        answer: 'Yes! We ship to over 30 countries worldwide. Shipping costs and delivery times vary by location.',
        category: 'Shipping'
      },
      {
        id: 'faq-4',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, PayPal, and Apple Pay for your convenience.',
        category: 'Payment'
      }
    ]
  }
};

/**
 * Get the default template for a specific block type
 * @param blockType - The type of block to get template for
 * @returns The default content template for the block type
 */
export function getBlockTemplate(blockType: string): any {
  return BLOCK_TEMPLATES[blockType] || {};
}

/**
 * Get a formatted JSON string of the template for a block type
 * @param blockType - The type of block to get template for
 * @returns Formatted JSON string
 */
export function getBlockTemplateJSON(blockType: string): string {
  const template = getBlockTemplate(blockType);
  return JSON.stringify(template, null, 2);
}
