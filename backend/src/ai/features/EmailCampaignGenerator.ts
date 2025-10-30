/**
 * Email Campaign Generator
 *
 * AI-powered email campaign content generation
 * Generates subject lines, HTML/plain text content, and CTAs
 *
 * Supports:
 * - Promotional emails
 * - Newsletter content
 * - Abandoned cart recovery
 * - New arrival announcements
 * - A/B testing subject line variants
 */

import { IAIFeature, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface EmailCampaignInput {
  campaignType: 'promotional' | 'newsletter' | 'abandoned_cart' | 'new_arrival';
  products?: Array<{
    name: string;
    price: number;
    imageUrl?: string;
    description?: string;
  }>;
  discountPercentage?: number;
  discountCode?: string;
  tone?: 'professional' | 'luxury' | 'friendly';
  length?: 'short' | 'medium' | 'long';
  language?: string;
  brandName?: string;
  targetAudience?: string;
  customInstructions?: string;
}

export interface EmailCampaignOutput {
  subjectLines: string[]; // 5 variants for A/B testing
  preheader: string;
  htmlContent: string;
  plainTextContent: string;
  callToAction: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export class EmailCampaignGenerator implements IAIFeature {
  public readonly name = 'email_campaign_generator';
  public readonly description = 'Generate email marketing campaigns with A/B test variants';
  public readonly requiredCapabilities = ['text-generation'];

  constructor(private aiService: AIServiceManager) {}

  /**
   * Execute email campaign generation
   */
  async execute(
    input: EmailCampaignInput,
    options?: FeatureOptions
  ): Promise<EmailCampaignOutput> {
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.buildSystemPrompt(input);

    const response = await this.aiService.generateText(
      {
        prompt,
        systemPrompt,
        maxTokens: this.getMaxTokensByLength(input.length || 'medium'),
        temperature: this.getTemperatureByTone(input.tone || 'professional'),
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          campaignType: input.campaignType,
          tone: input.tone,
          ...options?.metadata
        }
      },
      {
        ...options,
        useCache: options?.useCache !== false
      }
    );

    // Parse JSON response
    let parsedContent;
    try {
      // Strip markdown code blocks if present
      let cleanedContent = response.content.trim();

      if (cleanedContent.startsWith('```')) {
        const firstNewline = cleanedContent.indexOf('\n');
        if (firstNewline !== -1) {
          cleanedContent = cleanedContent.substring(firstNewline + 1);
        }
        if (cleanedContent.endsWith('```')) {
          cleanedContent = cleanedContent.substring(0, cleanedContent.lastIndexOf('```'));
        }
        cleanedContent = cleanedContent.trim();
      }

      // Try parsing with control character fallback
      try {
        parsedContent = JSON.parse(cleanedContent);
      } catch (firstError) {
        const escapedContent = cleanedContent.replace(
          /"((?:[^"\\]|\\.)*)"/g,
          (match, stringContent) => {
            const escaped = stringContent
              .replace(/\r\n/g, '\\n')
              .replace(/\r/g, '\\n')
              .replace(/\n/g, '\\n')
              .replace(/\t/g, '\\t');
            return `"${escaped}"`;
          }
        );
        parsedContent = JSON.parse(escapedContent);
      }
    } catch (error) {
      console.error('Failed to parse email campaign response as JSON:', error);
      throw new Error('Failed to generate email campaign content');
    }

    return {
      subjectLines: parsedContent.subjectLines || [],
      preheader: parsedContent.preheader || '',
      htmlContent: parsedContent.htmlContent || '',
      plainTextContent: parsedContent.plainTextContent || '',
      callToAction: parsedContent.callToAction || '',
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: EmailCampaignInput): Promise<number> {
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.buildSystemPrompt(input);

    const providers = this.aiService.getAvailableProviders();
    if (providers.length === 0) {
      return 0;
    }

    const provider = this.aiService.getProvider(providers[0]);
    if (!provider) {
      return 0;
    }

    return provider.estimateCost({
      prompt,
      systemPrompt,
      maxTokens: this.getMaxTokensByLength(input.length || 'medium'),
      temperature: this.getTemperatureByTone(input.tone || 'professional')
    });
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(input: EmailCampaignInput): string {
    const tone = input.tone || 'professional';
    const campaignType = input.campaignType;

    return `You are an expert email marketing copywriter specializing in e-commerce campaigns for luxury beauty and hair care products.

Your expertise includes:
- Crafting compelling subject lines with high open rates
- Writing persuasive email copy that drives conversions
- Creating effective calls-to-action
- A/B testing optimization
- Mobile-friendly email design
- Emotional storytelling and benefit-focused messaging

CAMPAIGN TYPE: ${this.getCampaignTypeDescription(campaignType)}
TONE: ${this.getToneDescription(tone)}
BRAND VOICE: Sophisticated, customer-centric, results-driven

You MUST respond with valid JSON in this exact structure:
{
  "subjectLines": [
    "Subject line variant 1 (max 50 chars)",
    "Subject line variant 2 (max 50 chars)",
    "Subject line variant 3 (max 50 chars)",
    "Subject line variant 4 (max 50 chars)",
    "Subject line variant 5 (max 50 chars)"
  ],
  "preheader": "Compelling preheader text (80-100 chars)",
  "htmlContent": "Full HTML email content with proper structure",
  "plainTextContent": "Plain text version of email",
  "callToAction": "Primary CTA button text (2-4 words)"
}

SUBJECT LINE GUIDELINES:
- Keep under 50 characters for mobile optimization
- Create urgency or curiosity
- Use personalization tokens when appropriate: {{firstName}}, {{productName}}
- Vary approaches: direct benefit, question, scarcity, social proof, curiosity
- Avoid spam trigger words (FREE, BUY NOW, CLICK HERE, !!!)

HTML CONTENT GUIDELINES:
- Start with engaging headline
- Use short paragraphs (2-3 sentences max)
- Include product benefits, not just features
- Use {{firstName}} for personalization
- Include product details if provided
- Add social proof or urgency elements
- End with clear, compelling CTA
- Mobile-responsive structure
- Use inline styles (email-safe CSS)

PLAIN TEXT GUIDELINES:
- Mirror HTML content structure
- Clean, readable formatting
- Include all links in full
- Maintain personalization tokens

CTA GUIDELINES:
- Action-oriented verbs
- Create urgency or exclusivity
- Keep it short: "Shop Now", "Claim Offer", "Discover More", "Get Started"`;
  }

  /**
   * Build user prompt
   */
  private buildPrompt(input: EmailCampaignInput): string {
    let prompt = `Generate an email campaign with the following details:\n\n`;
    prompt += `Campaign Type: ${input.campaignType}\n`;
    prompt += `Brand: ${input.brandName || 'Luxia Products'}\n`;
    prompt += `Language: ${input.language || 'English'}\n`;
    prompt += `Target Audience: ${input.targetAudience || 'Luxury hair care enthusiasts'}\n\n`;

    if (input.discountPercentage) {
      prompt += `Special Offer: ${input.discountPercentage}% discount\n`;
      if (input.discountCode) {
        prompt += `Promo Code: ${input.discountCode}\n`;
      }
      prompt += `\n`;
    }

    if (input.products && input.products.length > 0) {
      prompt += `Featured Products:\n`;
      input.products.forEach((product, index) => {
        prompt += `${index + 1}. ${product.name} - $${product.price.toFixed(2)}\n`;
        if (product.description) {
          prompt += `   ${product.description}\n`;
        }
      });
      prompt += `\n`;
    }

    if (input.customInstructions) {
      prompt += `Additional Instructions:\n${input.customInstructions}\n\n`;
    }

    prompt += `Generate the JSON response now:`;

    return prompt;
  }

  /**
   * Get campaign type description
   */
  private getCampaignTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      promotional: 'Promotional sale or discount campaign. Focus on value, urgency, and savings.',
      newsletter: 'Regular newsletter with tips, stories, and product highlights. Educational and engaging.',
      abandoned_cart: 'Cart recovery email. Gentle reminder with incentive to complete purchase.',
      new_arrival: 'New product launch announcement. Build excitement and showcase innovation.'
    };

    return descriptions[type] || descriptions.promotional;
  }

  /**
   * Get tone description
   */
  private getToneDescription(tone: string): string {
    const toneDescriptions: Record<string, string> = {
      professional: 'Authoritative, trustworthy, and informative. Professional yet approachable.',
      luxury: 'Sophisticated, exclusive, and aspirational. Emphasizes premium quality and elegance.',
      friendly: 'Warm, personal, and conversational. Creates genuine connection with readers.'
    };

    return toneDescriptions[tone] || toneDescriptions.professional;
  }

  /**
   * Get max tokens based on length
   */
  private getMaxTokensByLength(length: string): number {
    const tokenLimits: Record<string, number> = {
      short: 800,   // Brief, punchy emails
      medium: 1500, // Standard campaign length
      long: 2500    // Detailed storytelling campaigns
    };

    return tokenLimits[length] || tokenLimits.medium;
  }

  /**
   * Get temperature based on tone
   */
  private getTemperatureByTone(tone: string): number {
    const temperatures: Record<string, number> = {
      professional: 0.7,
      luxury: 0.8,
      friendly: 0.85
    };

    return temperatures[tone] || 0.7;
  }
}
