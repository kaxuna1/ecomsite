// Page Template Definitions
// Pre-configured page templates with starter blocks

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  suggestedSlug: string;
  metaDescription: string;
  blocks: Array<{
    blockType: string;
    blockKey: string;
    content: any;
    displayOrder: number;
  }>;
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Page',
    description: 'Start from scratch with an empty page',
    icon: '📄',
    suggestedSlug: '',
    metaDescription: '',
    blocks: []
  },
  {
    id: 'about-us',
    name: 'About Us',
    description: 'Company story, mission, and team',
    icon: '👥',
    suggestedSlug: 'about',
    metaDescription: 'Learn about our story, mission, and the team behind LUXIA luxury scalp care products.',
    blocks: [
      {
        blockType: 'hero',
        blockKey: 'about-hero',
        displayOrder: 1,
        content: {
          type: 'hero',
          headline: 'Our Story',
          subheadline: 'Crafting luxury scalp care with passion and precision',
          description: 'Founded with a mission to revolutionize scalp health through premium, scientifically-backed products.',
          ctaText: 'Shop Our Collection',
          ctaLink: '/products',
          textAlignment: 'center',
          template: 'centered-minimal'
        }
      },
      {
        blockType: 'text_image',
        blockKey: 'our-mission',
        displayOrder: 2,
        content: {
          type: 'text_image',
          title: 'Our Mission',
          content: 'At LUXIA, we believe that healthy hair starts with a healthy scalp. We combine cutting-edge science with luxurious natural ingredients to create products that deliver real results. Our commitment to quality, sustainability, and customer satisfaction drives everything we do.',
          image: '/images/placeholder-mission.jpg',
          imagePosition: 'right',
          imageAlt: 'LUXIA laboratory'
        }
      },
      {
        blockType: 'stats',
        blockKey: 'our-impact',
        displayOrder: 3,
        content: {
          type: 'stats',
          title: 'Our Impact',
          stats: [
            { id: '1', value: '50K+', label: 'Happy Customers', icon: '❤️' },
            { id: '2', value: '98%', label: 'Satisfaction Rate', icon: '⭐' },
            { id: '3', value: '15+', label: 'Premium Products', icon: '🌿' },
            { id: '4', value: '5 Years', label: 'of Excellence', icon: '🏆' }
          ],
          columns: 4
        }
      }
    ]
  },
  {
    id: 'contact',
    name: 'Contact Us',
    description: 'Contact form and business information',
    icon: '📧',
    suggestedSlug: 'contact',
    metaDescription: 'Get in touch with LUXIA. We\'re here to help with any questions about our luxury scalp care products.',
    blocks: [
      {
        blockType: 'hero',
        blockKey: 'contact-hero',
        displayOrder: 1,
        content: {
          type: 'hero',
          headline: 'Get In Touch',
          subheadline: 'We\'d love to hear from you',
          description: 'Have questions about our products? Want to learn more about scalp care? Our team is here to help.',
          ctaText: 'View FAQ',
          ctaLink: '/faq',
          textAlignment: 'center',
          template: 'centered-minimal'
        }
      },
      {
        blockType: 'features',
        blockKey: 'contact-methods',
        displayOrder: 2,
        content: {
          type: 'features',
          title: 'How to Reach Us',
          subtitle: 'Choose the method that works best for you',
          features: [
            {
              id: '1',
              icon: '📧',
              title: 'Email Us',
              description: 'hello@luxiaproducts.com\nWe respond within 24 hours'
            },
            {
              id: '2',
              icon: '📞',
              title: 'Call Us',
              description: '(212) 555-0199\nMon-Fri, 9AM-6PM EST'
            },
            {
              id: '3',
              icon: '📍',
              title: 'Visit Us',
              description: '88 Crown Street\nNew York, NY 10013'
            }
          ],
          columns: 3
        }
      }
    ]
  },
  {
    id: 'services',
    name: 'Services',
    description: 'Showcase your services and offerings',
    icon: '✨',
    suggestedSlug: 'services',
    metaDescription: 'Explore our range of luxury scalp care services and product consultations.',
    blocks: [
      {
        blockType: 'hero',
        blockKey: 'services-hero',
        displayOrder: 1,
        content: {
          type: 'hero',
          headline: 'Our Services',
          subheadline: 'Comprehensive scalp care solutions tailored to you',
          ctaText: 'Book Consultation',
          ctaLink: '/contact',
          textAlignment: 'center',
          template: 'luxury-minimal'
        }
      },
      {
        blockType: 'features',
        blockKey: 'service-list',
        displayOrder: 2,
        content: {
          type: 'features',
          title: 'What We Offer',
          subtitle: 'Professional care for your scalp health journey',
          features: [
            {
              id: '1',
              icon: '🔬',
              title: 'Scalp Analysis',
              description: 'Comprehensive assessment of your scalp health and personalized product recommendations'
            },
            {
              id: '2',
              icon: '💆',
              title: 'Treatment Plans',
              description: 'Custom treatment protocols designed for your specific scalp needs and goals'
            },
            {
              id: '3',
              icon: '📚',
              title: 'Expert Guidance',
              description: 'One-on-one consultations with our scalp care specialists'
            },
            {
              id: '4',
              icon: '🎁',
              title: 'Product Bundles',
              description: 'Curated product sets designed to work together for optimal results'
            }
          ],
          columns: 2
        }
      }
    ]
  },
  {
    id: 'faq',
    name: 'FAQ',
    description: 'Frequently asked questions',
    icon: '❓',
    suggestedSlug: 'faq',
    metaDescription: 'Find answers to common questions about LUXIA products, shipping, and scalp care.',
    blocks: [
      {
        blockType: 'hero',
        blockKey: 'faq-hero',
        displayOrder: 1,
        content: {
          type: 'hero',
          headline: 'Frequently Asked Questions',
          subheadline: 'Everything you need to know about LUXIA',
          description: 'Browse through our most common questions or reach out to our support team.',
          ctaText: 'Contact Support',
          ctaLink: '/contact',
          textAlignment: 'center',
          template: 'centered-minimal'
        }
      },
      {
        blockType: 'text_image',
        blockKey: 'faq-shipping',
        displayOrder: 2,
        content: {
          type: 'text_image',
          title: 'Shipping & Returns',
          content: '**How long does shipping take?**\nStandard shipping takes 3-5 business days. Express shipping is available for 1-2 day delivery.\n\n**What is your return policy?**\nWe offer a 30-day satisfaction guarantee. If you\'re not completely satisfied, return your purchase for a full refund.',
          image: '/images/placeholder-shipping.jpg',
          imagePosition: 'right',
          imageAlt: 'Shipping boxes'
        }
      }
    ]
  },
  {
    id: 'landing-promo',
    name: 'Promotional Landing',
    description: 'High-converting landing page for campaigns',
    icon: '🎯',
    suggestedSlug: 'promo',
    metaDescription: 'Exclusive offer on LUXIA luxury scalp care products. Limited time only.',
    blocks: [
      {
        blockType: 'hero',
        blockKey: 'promo-hero',
        displayOrder: 1,
        content: {
          type: 'hero',
          headline: 'Limited Time Offer',
          subheadline: 'Get 20% off your first order',
          description: 'Discover the luxury of healthy scalp care. Premium products, proven results.',
          ctaText: 'Shop Now',
          ctaLink: '/products',
          textAlignment: 'center',
          template: 'full-width-overlay'
        }
      },
      {
        blockType: 'features',
        blockKey: 'promo-benefits',
        displayOrder: 2,
        content: {
          type: 'features',
          title: 'Why Choose LUXIA',
          features: [
            {
              id: '1',
              icon: '🌿',
              title: 'Natural Ingredients',
              description: 'Premium botanical extracts and essential oils'
            },
            {
              id: '2',
              icon: '🔬',
              title: 'Science-Backed',
              description: 'Clinically tested formulations that deliver results'
            },
            {
              id: '3',
              icon: '🚫',
              title: 'Clean Formula',
              description: 'No sulfates, parabens, or harmful chemicals'
            }
          ],
          columns: 3
        }
      },
      {
        blockType: 'testimonials',
        blockKey: 'promo-testimonials',
        displayOrder: 3,
        content: {
          type: 'testimonials',
          title: 'What Our Customers Say',
          testimonials: [
            {
              id: '1',
              name: 'Sarah Johnson',
              role: 'Verified Customer',
              rating: 5,
              text: 'LUXIA transformed my scalp health in just 2 weeks. The products are luxurious and effective!'
            },
            {
              id: '2',
              name: 'Michael Chen',
              role: 'Verified Customer',
              rating: 5,
              text: 'Best scalp care products I\'ve ever used. The quality is exceptional.'
            }
          ],
          displayStyle: 'grid'
        }
      },
      {
        blockType: 'cta',
        blockKey: 'promo-cta',
        displayOrder: 4,
        content: {
          type: 'cta',
          title: 'Ready to Transform Your Scalp Health?',
          description: 'Join thousands of satisfied customers. Use code FIRST20 at checkout.',
          primaryButtonText: 'Start Shopping',
          primaryButtonLink: '/products',
          secondaryButtonText: 'Learn More',
          secondaryButtonLink: '/about'
        }
      }
    ]
  }
];

export function getTemplateById(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find(template => template.id === id);
}

export function applyTemplateToPage(template: PageTemplate, customTitle?: string, customSlug?: string) {
  return {
    title: customTitle || template.name,
    slug: customSlug || template.suggestedSlug,
    metaDescription: template.metaDescription,
    blocks: template.blocks
  };
}
