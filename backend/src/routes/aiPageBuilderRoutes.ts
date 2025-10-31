/**
 * AI Page Builder API Routes
 *
 * REST endpoints for AI-powered page generation
 */

import express, { Request, Response } from 'express';
import { adminAuthMiddleware } from '../middleware/authMiddleware';
import {
  generatePageFromPrompt,
  regenerateBlockWithFeedback,
  generatePageVariations,
  estimatePageGenerationCost
} from '../services/aiPageBuilderService';
import { PagePrompt } from '../ai/features/AIPageBuilderFeature';

const router = express.Router();

/**
 * @route   POST /api/ai/pages/generate
 * @desc    Generate a complete CMS page from a prompt
 * @access  Private (Admin)
 */
router.post('/generate', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { prompt, autoPublish } = req.body;

    if (!prompt || !prompt.description) {
      return res.status(400).json({
        success: false,
        error: 'Prompt description is required'
      });
    }

    const result = await generatePageFromPrompt({
      prompt: prompt as PagePrompt,
      autoPublish: autoPublish || false,
      createdBy: req.user?.userId
    });

    res.status(201).json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error: any) {
    console.error('[AI Page Builder] Generate page error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate page',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/ai/pages/variations
 * @desc    Generate multiple variations of a page from a prompt
 * @access  Private (Admin)
 */
router.post('/variations', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { prompt, count } = req.body;

    if (!prompt || !prompt.description) {
      return res.status(400).json({
        success: false,
        error: 'Prompt description is required'
      });
    }

    const variationCount = Math.min(Math.max(count || 3, 1), 5); // Limit to 1-5 variations

    const variations = await generatePageVariations(
      prompt as PagePrompt,
      variationCount
    );

    res.status(200).json({
      success: true,
      data: {
        variations,
        count: variations.length
      }
    });
  } catch (error: any) {
    console.error('[AI Page Builder] Generate variations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate variations',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/ai/pages/estimate
 * @desc    Estimate cost and time for page generation
 * @access  Private (Admin)
 */
router.post('/estimate', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.description) {
      return res.status(400).json({
        success: false,
        error: 'Prompt description is required'
      });
    }

    const estimate = await estimatePageGenerationCost(prompt as PagePrompt);

    res.status(200).json({
      success: true,
      data: estimate
    });
  } catch (error: any) {
    console.error('[AI Page Builder] Estimate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate cost',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/ai/blocks/:blockId/regenerate
 * @desc    Regenerate a specific block with feedback
 * @access  Private (Admin)
 */
router.post('/blocks/:blockId/regenerate', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const blockId = parseInt(req.params.blockId);
    const { feedback, pageContext } = req.body;

    if (!feedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback is required for regeneration'
      });
    }

    if (isNaN(blockId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid block ID'
      });
    }

    const result = await regenerateBlockWithFeedback({
      blockId,
      feedback,
      pageContext,
      updatedBy: req.user?.userId
    });

    res.status(200).json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error: any) {
    console.error('[AI Page Builder] Regenerate block error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate block',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/ai/pages/templates
 * @desc    Get predefined page templates/prompts
 * @access  Private (Admin)
 */
router.get('/templates', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const templates = [
      {
        id: 'landing-product',
        name: 'Product Landing Page',
        description: 'A high-converting landing page for a specific product',
        pageType: 'landing',
        tone: 'professional',
        promptTemplate: 'Create a landing page for {productName} that highlights its benefits and features',
        suggestedBlocks: ['hero', 'features', 'testimonials', 'cta']
      },
      {
        id: 'about-us',
        name: 'About Us Page',
        description: 'Tell your brand story and values',
        pageType: 'about',
        tone: 'friendly',
        promptTemplate: 'Create an about us page for {companyName} that showcases our mission and values',
        suggestedBlocks: ['hero', 'text_image', 'stats', 'testimonials']
      },
      {
        id: 'service-page',
        name: 'Service Page',
        description: 'Showcase a specific service offering',
        pageType: 'service',
        tone: 'professional',
        promptTemplate: 'Create a service page for {serviceName} explaining what we do and how it benefits customers',
        suggestedBlocks: ['hero', 'features', 'text_image', 'cta']
      },
      {
        id: 'contact-page',
        name: 'Contact Page',
        description: 'Make it easy for customers to reach you',
        pageType: 'contact',
        tone: 'friendly',
        promptTemplate: 'Create a contact page that makes it easy for customers to get in touch',
        suggestedBlocks: ['hero', 'text_image', 'cta']
      },
      {
        id: 'promo-page',
        name: 'Promotional Campaign',
        description: 'Limited-time offer or seasonal promotion',
        pageType: 'landing',
        tone: 'playful',
        promptTemplate: 'Create a promotional page for {campaignName} with urgency and clear benefits',
        suggestedBlocks: ['hero', 'products', 'stats', 'cta', 'newsletter']
      },
      {
        id: 'luxury-collection',
        name: 'Luxury Collection Showcase',
        description: 'Elegant page for premium product collections',
        pageType: 'product',
        tone: 'luxury',
        promptTemplate: 'Create an elegant showcase page for our {collectionName} luxury collection',
        suggestedBlocks: ['hero', 'products', 'text_image', 'social_proof']
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        templates,
        count: templates.length
      }
    });
  } catch (error: any) {
    console.error('[AI Page Builder] Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      details: error.message
    });
  }
});

export default router;
