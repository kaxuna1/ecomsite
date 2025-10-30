/**
 * AI Routes
 *
 * Express routes for AI-powered features
 * Admin-only endpoints requiring JWT authentication
 */

import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AIServiceManager } from '../ai/AIServiceManager';
import { DescriptionGenerator } from '../ai/features/DescriptionGenerator';
import { SEOGenerator } from '../ai/features/SEOGenerator';
import { ImageAltTextGenerator } from '../ai/features/ImageAltTextGenerator';
import { ProductTranslator } from '../ai/features/ProductTranslator';
import { EmailCampaignGenerator } from '../ai/features/EmailCampaignGenerator';
import { FAQGenerator } from '../ai/features/FAQGenerator';
import { HeroGenerator } from '../ai/features/HeroGenerator';
import { TestimonialGenerator } from '../ai/features/TestimonialGenerator';
import { FeaturesGenerator } from '../ai/features/FeaturesGenerator';
import { CMSPageTranslator } from '../ai/features/CMSPageTranslator';
import { aiServiceConfig } from '../ai/config';

const router = Router();

// Initialize AI Service Manager (singleton)
let aiServiceManager: AIServiceManager | null = null;

/**
 * Get or create AI Service Manager instance
 * Re-initializes on each call to pick up updated settings (provider/model changes)
 */
async function getAIServiceManager(): Promise<AIServiceManager> {
  if (!aiServiceManager) {
    aiServiceManager = new AIServiceManager(aiServiceConfig);

    // Register features (only once)
    const descriptionGenerator = new DescriptionGenerator(aiServiceManager);
    aiServiceManager.registerFeature(descriptionGenerator);

    const seoGenerator = new SEOGenerator(aiServiceManager);
    aiServiceManager.registerFeature(seoGenerator);

    const altTextGenerator = new ImageAltTextGenerator(aiServiceManager);
    aiServiceManager.registerFeature(altTextGenerator);

    const productTranslator = new ProductTranslator(aiServiceManager);
    aiServiceManager.registerFeature(productTranslator);

    const emailCampaignGenerator = new EmailCampaignGenerator(aiServiceManager);
    aiServiceManager.registerFeature(emailCampaignGenerator);

    const faqGenerator = new FAQGenerator(aiServiceManager);
    aiServiceManager.registerFeature(faqGenerator);

    const heroGenerator = new HeroGenerator(aiServiceManager);
    aiServiceManager.registerFeature(heroGenerator);

    const testimonialGenerator = new TestimonialGenerator(aiServiceManager);
    aiServiceManager.registerFeature(testimonialGenerator);

    const featuresGenerator = new FeaturesGenerator(aiServiceManager);
    aiServiceManager.registerFeature(featuresGenerator);

    const cmsPageTranslator = new CMSPageTranslator(aiServiceManager);
    aiServiceManager.registerFeature(cmsPageTranslator);

    console.log('AI Service Manager created with 10 features');
  }

  // IMPORTANT: Re-initialize on every request to pick up updated provider/model settings
  await aiServiceManager.initialize();

  return aiServiceManager;
}

/**
 * POST /api/admin/ai/generate-description
 *
 * Generate AI-powered product description
 *
 * Body:
 * - productName: string (required)
 * - shortDescription: string (optional)
 * - categories: string[] (optional)
 * - existingDescription: string (optional)
 * - tone: 'professional' | 'luxury' | 'casual' | 'friendly' | 'technical' (optional)
 * - length: 'short' | 'medium' | 'long' (optional)
 * - keyFeatures: string[] (optional)
 *
 * Response:
 * - success: boolean
 * - data: {
 *     description: string
 *     highlights: string[]
 *     usage: string
 *     metaDescription: string
 *     cost: number
 *     tokensUsed: number
 *     provider: string
 *   }
 */
router.post(
  '/generate-description',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        productName,
        shortDescription,
        categories,
        existingDescription,
        tone,
        length,
        keyFeatures
      } = req.body;

      // Validate required fields
      if (!productName || typeof productName !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Product name is required and must be a string'
        });
      }

      // Validate optional fields
      const validTones = ['professional', 'luxury', 'casual', 'friendly', 'technical'];
      if (tone && !validTones.includes(tone)) {
        return res.status(400).json({
          success: false,
          error: `Invalid tone. Must be one of: ${validTones.join(', ')}`
        });
      }

      const validLengths = ['short', 'medium', 'long'];
      if (length && !validLengths.includes(length)) {
        return res.status(400).json({
          success: false,
          error: `Invalid length. Must be one of: ${validLengths.join(', ')}`
        });
      }

      // Get AI Service Manager
      const aiService = await getAIServiceManager();

      // Execute description generation
      const result = await aiService.executeFeature(
        'product_description_generator',
        {
          productName,
          shortDescription,
          categories: Array.isArray(categories) ? categories : [],
          existingDescription,
          tone: tone || 'professional',
          length: length || 'medium',
          keyFeatures: Array.isArray(keyFeatures) ? keyFeatures : []
        },
        {
          metadata: {
            adminUserId: req.adminId,
            feature: 'product_description_generator'
          }
        }
      );

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error generating product description:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate product description'
      });
    }
  }
);

/**
 * GET /api/admin/ai/usage-stats
 *
 * Get AI usage statistics for a time period
 *
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: now)
 * - provider: string (optional filter)
 * - feature: string (optional filter)
 */
router.get('/usage-stats', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      startDate: startDateStr,
      endDate: endDateStr,
      provider,
      feature
    } = req.query;

    // Parse dates
    const endDate = endDateStr ? new Date(endDateStr as string) : new Date();
    const startDate = startDateStr
      ? new Date(startDateStr as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO date strings.'
      });
    }

    // Get AI Service Manager
    const aiService = await getAIServiceManager();
    const costTracker = aiService.getCostTracker();

    // Get statistics
    const stats = await costTracker.getStats(
      startDate,
      endDate,
      provider as string,
      feature as string
    );

    return res.json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        ...stats
      }
    });
  } catch (error: any) {
    console.error('Error fetching AI usage stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch usage statistics'
    });
  }
});

/**
 * GET /api/admin/ai/providers
 *
 * Get list of available AI providers and their status
 */
router.get('/providers', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const aiService = await getAIServiceManager();
    const providers = aiService.getAvailableProviders();
    const features = aiService.getRegisteredFeatures();
    const cacheStats = aiService.getCacheStats();

    return res.json({
      success: true,
      data: {
        providers,
        features,
        cache: cacheStats
      }
    });
  } catch (error: any) {
    console.error('Error fetching AI providers:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch providers'
    });
  }
});

/**
 * POST /api/admin/ai/clear-cache
 *
 * Clear AI response cache
 */
router.post('/clear-cache', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const aiService = await getAIServiceManager();
    aiService.clearCache();

    return res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error: any) {
    console.error('Error clearing AI cache:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear cache'
    });
  }
});

/**
 * GET /api/admin/ai/recent-logs
 *
 * Get recent AI operation logs
 *
 * Query params:
 * - limit: number (default: 50, max: 200)
 */
router.get('/recent-logs', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const aiService = await getAIServiceManager();
    const costTracker = aiService.getCostTracker();

    const logs = await costTracker.getRecentLogs(limit, req.adminId);

    return res.json({
      success: true,
      data: logs
    });
  } catch (error: any) {
    console.error('Error fetching AI logs:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch logs'
    });
  }
});

/**
 * POST /api/admin/ai/generate-seo
 *
 * Generate SEO meta title, description, and keywords for a product
 *
 * Body:
 * - productName: string (required)
 * - shortDescription: string (optional)
 * - description: string (optional)
 * - categories: string[] (optional)
 * - targetKeyword: string (optional)
 * - language: string (default: 'en')
 *
 * Response:
 * - success: boolean
 * - data: {
 *     metaTitle: string
 *     metaDescription: string
 *     focusKeyword: string
 *     secondaryKeywords: string[]
 *     openGraphTitle: string
 *     openGraphDescription: string
 *     estimatedCTR: string
 *   }
 */
router.post('/generate-seo', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      productName,
      shortDescription,
      description,
      categories,
      targetKeyword,
      existingKeywords,
      language
    } = req.body;

    // Validate required fields
    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Product name is required and must be a string'
      });
    }

    // Get AI Service Manager
    const aiService = await getAIServiceManager();

    // Execute SEO generation
    const result = await aiService.executeFeature(
      'seo_meta_generator',
      {
        productName,
        shortDescription,
        description,
        categories: Array.isArray(categories) ? categories : [],
        targetKeyword,
        existingKeywords: Array.isArray(existingKeywords) ? existingKeywords : [],
        language: language || 'en'
      },
      {
        metadata: {
          adminUserId: req.adminId,
          feature: 'seo_meta_generator'
        }
      }
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error generating SEO meta:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate SEO meta tags'
    });
  }
});

/**
 * POST /api/admin/ai/generate-alt-text
 *
 * Generate alt text for product images
 *
 * Body:
 * - imageUrl: string (required)
 * - filename: string (optional)
 * - productName: string (optional)
 * - productCategory: string (optional)
 * - productDescription: string (optional)
 * - language: string (default: 'en')
 *
 * Response:
 * - success: boolean
 * - data: {
 *     altText: string
 *     title: string
 *     caption: string
 *     imageDescription: string
 *     seoKeywords: string[]
 *   }
 */
router.post('/generate-alt-text', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      imageUrl,
      filename,
      productName,
      productCategory,
      productDescription,
      existingAltText,
      language
    } = req.body;

    // Validate required fields
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required and must be a string'
      });
    }

    // Get AI Service Manager
    const aiService = await getAIServiceManager();

    // Execute alt text generation
    const result = await aiService.executeFeature(
      'image_alt_text_generator',
      {
        imageUrl,
        filename,
        productName,
        productCategory,
        productDescription,
        existingAltText,
        useVision: false, // Phase 1: text-based only
        language: language || 'en'
      },
      {
        metadata: {
          adminUserId: req.adminId,
          feature: 'image_alt_text_generator'
        }
      }
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error generating alt text:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate alt text'
    });
  }
});

/**
 * POST /api/admin/ai/bulk-operation
 *
 * Perform bulk AI operations on multiple products
 *
 * Body:
 * - operation: 'seo' | 'alt-text' | 'description'
 * - productIds: number[] (required)
 * - options: object (operation-specific options)
 *
 * Response:
 * - success: boolean
 * - data: {
 *     total: number
 *     successful: number
 *     failed: number
 *     results: Array<{ productId: number, success: boolean, data?: any, error?: string }>
 *   }
 */
router.post('/bulk-operation', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { operation, productIds, options } = req.body;

    // Validate required fields
    if (!operation || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'operation and productIds array are required'
      });
    }

    const validOperations = ['seo', 'alt-text', 'description'];
    if (!validOperations.includes(operation)) {
      return res.status(400).json({
        success: false,
        error: `Invalid operation. Must be one of: ${validOperations.join(', ')}`
      });
    }

    // Limit bulk operations to prevent abuse
    if (productIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 products per bulk operation'
      });
    }

    // Get AI Service Manager
    const aiService = await getAIServiceManager();

    // TODO: Implement actual bulk operation logic
    // For now, return a placeholder response
    // In production, this should:
    // 1. Fetch product data from database
    // 2. Process each product with the specified operation
    // 3. Track successes and failures
    // 4. Consider using a queue system for large batches

    return res.json({
      success: true,
      message: 'Bulk operation endpoint ready for implementation',
      data: {
        operation,
        productIds,
        note: 'This endpoint will be fully implemented with background job processing'
      }
    });
  } catch (error: any) {
    console.error('Error performing bulk operation:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform bulk operation'
    });
  }
});

/**
 * POST /api/admin/ai/translate-product
 *
 * Translate product content to another language
 *
 * Body:
 * - productId: number (optional)
 * - fields: object (required) - Product fields to translate
 *   - name: string (optional)
 *   - shortDescription: string (optional)
 *   - description: string (optional)
 *   - highlights: string[] (optional)
 *   - usage: string (optional)
 *   - metaTitle: string (optional)
 *   - metaDescription: string (optional)
 * - sourceLanguage: string (required) - ISO code (e.g., 'en', 'ka')
 * - targetLanguage: string (required) - ISO code
 * - preserveTerms: string[] (optional) - Brand names/terms to not translate
 * - tone: 'luxury' | 'professional' | 'casual' (optional)
 *
 * Response:
 * - success: boolean
 * - data: {
 *     translatedFields: object
 *     preservedTerms: string[]
 *     languagePair: string
 *     qualityScore: number
 *   }
 */
router.post('/translate-product', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      productId,
      fields,
      sourceLanguage,
      targetLanguage,
      preserveTerms,
      tone
    } = req.body;

    // Validate required fields
    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'fields object is required'
      });
    }

    if (!sourceLanguage || typeof sourceLanguage !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'sourceLanguage is required and must be a string (ISO code)'
      });
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'targetLanguage is required and must be a string (ISO code)'
      });
    }

    // Validate at least one field is provided
    const hasFields = Object.keys(fields).some(key => fields[key]);
    if (!hasFields) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for translation'
      });
    }

    // Get AI Service Manager
    const aiService = await getAIServiceManager();

    // Execute translation
    const result = await aiService.executeFeature(
      'product_translator',
      {
        productId,
        fields,
        sourceLanguage,
        targetLanguage,
        preserveTerms: Array.isArray(preserveTerms) ? preserveTerms : [],
        tone: tone || 'luxury'
      },
      {
        metadata: {
          adminUserId: req.adminId,
          feature: 'product_translator'
        }
      }
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error translating product:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to translate product'
    });
  }
});

/**
 * POST /api/admin/ai/generate-email-campaign
 *
 * Generate email marketing campaign content
 *
 * Body:
 * - campaignType: 'promotional' | 'newsletter' | 'abandoned_cart' | 'new_arrival' (required)
 * - products: Array<{name, price, imageUrl?, description?}> (optional)
 * - discountPercentage: number (optional)
 * - discountCode: string (optional)
 * - tone: 'professional' | 'luxury' | 'friendly' (optional)
 * - length: 'short' | 'medium' | 'long' (optional)
 * - language: string (optional, default: 'en')
 * - brandName: string (optional)
 * - targetAudience: string (optional)
 * - customInstructions: string (optional)
 *
 * Response:
 * - success: boolean
 * - data: {
 *     subjectLines: string[] (5 variants for A/B testing)
 *     preheader: string
 *     htmlContent: string
 *     plainTextContent: string
 *     callToAction: string
 *   }
 */
router.post('/generate-email-campaign', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      campaignType,
      products,
      discountPercentage,
      discountCode,
      tone,
      length,
      language,
      brandName,
      targetAudience,
      customInstructions
    } = req.body;

    // Validate required fields
    const validCampaignTypes = ['promotional', 'newsletter', 'abandoned_cart', 'new_arrival'];
    if (!campaignType || !validCampaignTypes.includes(campaignType)) {
      return res.status(400).json({
        success: false,
        error: `campaignType is required and must be one of: ${validCampaignTypes.join(', ')}`
      });
    }

    // Validate optional fields
    const validTones = ['professional', 'luxury', 'friendly'];
    if (tone && !validTones.includes(tone)) {
      return res.status(400).json({
        success: false,
        error: `Invalid tone. Must be one of: ${validTones.join(', ')}`
      });
    }

    const validLengths = ['short', 'medium', 'long'];
    if (length && !validLengths.includes(length)) {
      return res.status(400).json({
        success: false,
        error: `Invalid length. Must be one of: ${validLengths.join(', ')}`
      });
    }

    // Get AI Service Manager
    const aiService = await getAIServiceManager();

    // Execute email campaign generation
    const result = await aiService.executeFeature(
      'email_campaign_generator',
      {
        campaignType,
        products: Array.isArray(products) ? products : [],
        discountPercentage,
        discountCode,
        tone: tone || 'professional',
        length: length || 'medium',
        language: language || 'en',
        brandName,
        targetAudience,
        customInstructions
      },
      {
        metadata: {
          adminUserId: req.adminId,
          feature: 'email_campaign_generator'
        }
      }
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error generating email campaign:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate email campaign'
    });
  }
});

/**
 * POST /api/admin/ai/generate-faq
 *
 * Generate FAQ content for a product
 *
 * Body:
 * - productName: string (required)
 * - productDescription: string (optional)
 * - productCategory: string (optional)
 * - benefits: string[] (optional)
 * - ingredients: string[] (optional)
 * - price: number (optional)
 * - targetAudience: string (optional)
 * - commonConcerns: string[] (optional) - e.g., ["sensitive skin", "color-treated hair"]
 * - language: string (optional, default: 'en')
 * - numberOfFAQs: number (optional, default: 8)
 *
 * Response:
 * - success: boolean
 * - data: {
 *     faqs: Array<{question, answer, category}>
 *     faqSchemaMarkup: string (JSON-LD for SEO)
 *   }
 */
router.post('/generate-faq', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      productName,
      productDescription,
      productCategory,
      benefits,
      ingredients,
      price,
      targetAudience,
      commonConcerns,
      language,
      numberOfFAQs
    } = req.body;

    // Validate required fields
    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'productName is required and must be a string'
      });
    }

    // Validate numberOfFAQs
    if (numberOfFAQs && (typeof numberOfFAQs !== 'number' || numberOfFAQs < 3 || numberOfFAQs > 20)) {
      return res.status(400).json({
        success: false,
        error: 'numberOfFAQs must be a number between 3 and 20'
      });
    }

    // Get AI Service Manager
    const aiService = await getAIServiceManager();

    // Execute FAQ generation
    const result = await aiService.executeFeature(
      'faq_generator',
      {
        productName,
        productDescription,
        productCategory,
        benefits: Array.isArray(benefits) ? benefits : [],
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        price,
        targetAudience,
        commonConcerns: Array.isArray(commonConcerns) ? commonConcerns : [],
        language: language || 'en',
        numberOfFAQs: numberOfFAQs || 8
      },
      {
        metadata: {
          adminUserId: req.adminId,
          feature: 'faq_generator'
        }
      }
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error generating FAQs:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate FAQs'
    });
  }
});

/**
 * POST /api/admin/ai/generate-hero
 *
 * Generate AI-powered hero block content
 *
 * Body:
 * - brandName: string (required)
 * - productOrService: string (optional)
 * - targetAudience: string (optional)
 * - keyBenefits: string[] (optional)
 * - tone: 'professional' | 'luxury' | 'friendly' | 'bold' | 'minimal' (optional)
 * - template: 'split-screen' | 'centered-minimal' | 'full-width-overlay' | 'asymmetric-bold' | 'luxury-minimal' | 'gradient-modern' (optional)
 * - goal: 'sell' | 'inform' | 'engage' | 'convert' | 'inspire' (optional)
 * - language: string (default: 'en')
 * - existingContent: { headline, subheadline, description } (optional)
 *
 * Response:
 * - success: boolean
 * - data: {
 *     headline: string
 *     subheadline: string
 *     description: string
 *     ctaText: string
 *     alternativeHeadlines: string[]
 *     alternativeCTAs: string[]
 *     cost: number
 *     tokensUsed: number
 *     provider: string
 *   }
 */
router.post('/generate-hero', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      brandName,
      productOrService,
      targetAudience,
      keyBenefits,
      tone,
      template,
      goal,
      language,
      existingContent
    } = req.body;

    // Validate required fields
    if (!brandName || typeof brandName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Brand name is required'
      });
    }

    const aiService = await getAIServiceManager();

    // Execute hero generation
    const result = await aiService.executeFeature(
      'hero_block_generator',
      {
        brandName,
        productOrService,
        targetAudience,
        keyBenefits: Array.isArray(keyBenefits) ? keyBenefits : [],
        tone,
        template,
        goal,
        language: language || 'en',
        existingContent
      },
      {
        metadata: {
          adminUserId: req.adminId,
          feature: 'hero_block_generator'
        }
      }
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error generating hero content:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate hero content'
    });
  }
});

/**
 * POST /api/admin/ai/generate-testimonials
 * Generate authentic customer testimonials with AI
 */
router.post('/generate-testimonials', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      productName,
      productType,
      industry,
      targetAudience,
      numberOfTestimonials = 5,
      tone,
      includeSpecificBenefits,
      diverseProfiles,
      language
    } = req.body;

    // Validation
    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Product name is required'
      });
    }

    if (numberOfTestimonials < 3 || numberOfTestimonials > 10) {
      return res.status(400).json({
        success: false,
        error: 'Number of testimonials must be between 3 and 10'
      });
    }

    const aiService = await getAIServiceManager();

    const result = await aiService.executeFeature(
      'testimonial_generator',
      {
        productName,
        productType,
        industry,
        targetAudience,
        numberOfTestimonials,
        tone: tone || 'professional',
        includeSpecificBenefits: Array.isArray(includeSpecificBenefits) ? includeSpecificBenefits : [],
        diverseProfiles: typeof diverseProfiles === 'boolean' ? diverseProfiles : true,
        language: language || 'en'
      },
      {
        metadata: {
          adminUserId: req.adminId,
          feature: 'testimonial_generator'
        }
      }
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error generating testimonials:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate testimonials'
    });
  }
});

/**
 * POST /api/admin/ai/generate-features
 *
 * Generate AI-powered feature blocks for CMS
 *
 * Body:
 * - productOrService: string (required) - Product or service name
 * - industry?: string - Industry context
 * - targetAudience?: string - Target audience description
 * - numberOfFeatures: number (3-8) - Number of features to generate
 * - focusArea?: 'benefits' | 'technical' | 'competitive' | 'user-experience' | 'mixed'
 * - tone?: 'professional' | 'friendly' | 'technical' | 'persuasive'
 * - includeSpecificFeatures?: string[] - Specific features to include
 * - language?: string - Target language (default: 'en')
 *
 * Returns:
 * - features: Array of generated features with icon, title, description
 * - cost: Generation cost in USD
 * - tokensUsed: Token count
 * - provider: AI provider used
 */
router.post('/generate-features', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      productOrService,
      industry,
      targetAudience,
      numberOfFeatures = 4,
      focusArea,
      tone,
      includeSpecificFeatures,
      language
    } = req.body;

    // Validation
    if (!productOrService || typeof productOrService !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Product or service name is required'
      });
    }

    if (numberOfFeatures < 3 || numberOfFeatures > 8) {
      return res.status(400).json({
        success: false,
        error: 'Number of features must be between 3 and 8'
      });
    }

    const aiService = await getAIServiceManager();

    const result = await aiService.executeFeature(
      'features_generator',
      {
        productOrService,
        industry,
        targetAudience,
        numberOfFeatures,
        focusArea: focusArea || 'mixed',
        tone: tone || 'professional',
        includeSpecificFeatures: Array.isArray(includeSpecificFeatures) ? includeSpecificFeatures : [],
        language: language || 'en'
      },
      {
        metadata: {
          adminUserId: req.adminId,
          feature: 'features_generator'
        }
      }
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error generating features:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate features'
    });
  }
});

/**
 * POST /api/admin/ai/translate-cms-page
 *
 * Translate CMS page content including page fields and all blocks
 *
 * Body:
 * - fields: { title?, metaTitle?, metaDescription? } (required)
 * - blocks: Array<{ id, type, content }> (required)
 * - sourceLanguage: string (optional, default: 'en')
 * - targetLanguage: string (required)
 * - preserveTerms: string[] (optional) - Brand names/terms to not translate
 * - tone: 'luxury' | 'professional' | 'casual' | 'friendly' (optional)
 *
 * Response:
 * - success: boolean
 * - data: {
 *     translatedFields: { title?, metaTitle?, metaDescription? }
 *     translatedBlocks: Array<{ id, content }>
 *     cost: number
 *     tokensUsed: number
 *     provider: string
 *   }
 */
router.post('/translate-cms-page', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      fields,
      blocks,
      sourceLanguage,
      targetLanguage,
      preserveTerms,
      tone
    } = req.body;

    // Validate required fields
    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'fields object is required'
      });
    }

    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({
        success: false,
        error: 'blocks array is required'
      });
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'targetLanguage is required and must be a string (ISO code)'
      });
    }

    // Validate at least one field or block is provided
    const hasFields = Object.keys(fields).some(key => fields[key]);
    if (!hasFields && blocks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one field or block must be provided for translation'
      });
    }

    // Validate blocks structure
    for (const block of blocks) {
      if (!block.id || !block.type || !block.content) {
        return res.status(400).json({
          success: false,
          error: 'Each block must have id, type, and content'
        });
      }
    }

    // Validate tone if provided
    const validTones = ['luxury', 'professional', 'casual', 'friendly'];
    if (tone && !validTones.includes(tone)) {
      return res.status(400).json({
        success: false,
        error: `Invalid tone. Must be one of: ${validTones.join(', ')}`
      });
    }

    // Get AI Service Manager
    const aiService = await getAIServiceManager();

    // Execute CMS page translation
    const result = await aiService.executeFeature(
      'cms_page_translator',
      {
        fields,
        blocks,
        sourceLanguage: sourceLanguage || 'en',
        targetLanguage,
        preserveTerms: Array.isArray(preserveTerms) ? preserveTerms : [],
        tone: tone || 'professional'
      },
      {
        metadata: {
          adminUserId: req.adminId,
          feature: 'cms_page_translator'
        }
      }
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error translating CMS page:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to translate CMS page'
    });
  }
});

/**
 * POST /api/admin/ai/translate-static-text
 *
 * Translate static UI text (single key or bulk)
 *
 * Body:
 * - text: string (required) - Text to translate
 * - key: string (optional) - Translation key for context
 * - namespace: string (optional) - Namespace for context (e.g., 'common', 'products')
 * - sourceLanguage: string (optional, default: 'en')
 * - targetLanguage: string (required)
 * - preserveTerms: string[] (optional) - Brand names/terms to not translate
 * - context: string (optional) - Additional context about usage
 *
 * Response:
 * - success: boolean
 * - data: {
 *     translatedText: string
 *     cost: number
 *     tokensUsed: number
 *     provider: string
 *   }
 */
router.post('/translate-static-text', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      text,
      key,
      namespace,
      sourceLanguage,
      targetLanguage,
      preserveTerms,
      context
    } = req.body;

    // Validate required fields
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'text is required and must be a string'
      });
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'targetLanguage is required and must be a string (ISO code)'
      });
    }

    // Get AI Service Manager
    const aiService = await getAIServiceManager();

    // Build context-aware prompt
    const contextInfo = [
      key ? `Translation key: ${key}` : null,
      namespace ? `Context: ${namespace} UI section` : null,
      context ? `Usage: ${context}` : null
    ].filter(Boolean).join('\n');

    const fullPrompt = `Translate the following UI text from ${sourceLanguage || 'en'} to ${targetLanguage}.

${contextInfo ? contextInfo + '\n\n' : ''}Text to translate:
"${text}"

Requirements:
- Maintain the same tone and formality level
- Keep any placeholders intact (e.g., {{variable}}, \${{amount}})
- Preserve HTML tags if present
- Maintain special characters and punctuation appropriately
${preserveTerms && preserveTerms.length > 0 ? `- DO NOT translate these terms: ${preserveTerms.join(', ')}` : ''}
- Ensure the translation sounds natural for native speakers
- For UI text, keep it concise and clear

Return ONLY the translated text, without quotes or explanations.`;

    // Use the AI service to generate translation
    const result = await aiService.generateText({
      prompt: fullPrompt,
      maxTokens: 500,
      temperature: 0.3, // Lower temperature for more consistent translations
      metadata: {
        adminUserId: req.adminId,
        feature: 'static_text_translator',
        sourceLanguage: sourceLanguage || 'en',
        targetLanguage
      }
    });

    // Validate that we got a valid response
    if (!result || typeof result.content !== 'string' || !result.content.trim()) {
      throw new Error('AI service returned an invalid or empty translation');
    }

    // Extract translated text (remove any quotes if AI added them)
    const translatedText = result.content.trim().replace(/^["']|["']$/g, '');

    return res.json({
      success: true,
      data: {
        translatedText,
        cost: result.cost,
        tokensUsed: result.usage.totalTokens,
        provider: result.provider
      }
    });
  } catch (error: any) {
    console.error('Error translating static text:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to translate static text'
    });
  }
});

export default router;
