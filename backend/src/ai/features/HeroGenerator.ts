/**
 * Hero Block Content Generator
 *
 * AI-powered hero section content generation
 * Generates compelling headlines, subheadlines, descriptions, and CTA text
 *
 * Features:
 * - Conversion-optimized headlines
 * - Persuasive subheadlines
 * - Benefit-focused descriptions
 * - Action-driven CTAs
 * - Template-specific messaging
 * - A/B testing variants
 */

import { IAIFeature, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface HeroGeneratorInput {
  brandName: string;
  productOrService?: string;
  targetAudience?: string;
  keyBenefits?: string[];
  tone?: 'professional' | 'luxury' | 'friendly' | 'bold' | 'minimal';
  template?: 'split-screen' | 'centered-minimal' | 'full-width-overlay' | 'asymmetric-bold' | 'luxury-minimal' | 'gradient-modern';
  goal?: 'sell' | 'inform' | 'engage' | 'convert' | 'inspire';
  language?: string;
  existingContent?: {
    headline?: string;
    subheadline?: string;
    description?: string;
  };
}

export interface HeroGeneratorOutput {
  headline: string;
  subheadline: string;
  description: string;
  ctaText: string;
  alternativeHeadlines?: string[]; // For A/B testing
  alternativeCTAs?: string[]; // For A/B testing
  cost: number;
  tokensUsed: number;
  provider: string;
}

export class HeroGenerator implements IAIFeature {
  public readonly name = 'hero_block_generator';
  public readonly description = 'Generate conversion-optimized hero block content';
  public readonly requiredCapabilities = ['text-generation'];

  constructor(private aiService: AIServiceManager) {}

  /**
   * Execute hero content generation
   */
  async execute(
    input: HeroGeneratorInput,
    options?: FeatureOptions
  ): Promise<HeroGeneratorOutput> {
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.buildSystemPrompt(input);

    const response = await this.aiService.generateText(
      {
        prompt,
        systemPrompt,
        maxTokens: this.getMaxTokensByTemplate(input.template || 'split-screen'),
        temperature: this.getTemperatureByTone(input.tone || 'professional'),
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          brandName: input.brandName,
          tone: input.tone,
          template: input.template,
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
      console.error('Failed to parse hero generation response as JSON:', error);
      throw new Error('Failed to generate hero content');
    }

    return {
      headline: parsedContent.headline || '',
      subheadline: parsedContent.subheadline || '',
      description: parsedContent.description || '',
      ctaText: parsedContent.ctaText || 'Learn More',
      alternativeHeadlines: parsedContent.alternativeHeadlines || [],
      alternativeCTAs: parsedContent.alternativeCTAs || [],
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: HeroGeneratorInput): Promise<number> {
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
      maxTokens: this.getMaxTokensByTemplate(input.template || 'split-screen'),
      temperature: this.getTemperatureByTone(input.tone || 'professional')
    });
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(input: HeroGeneratorInput): string {
    const tone = input.tone || 'professional';
    const template = input.template || 'split-screen';
    const goal = input.goal || 'convert';

    return `You are an expert conversion copywriter specializing in hero sections for luxury e-commerce brands.

Your expertise includes:
- Writing headlines that stop scrollers and command attention
- Crafting subheadlines that bridge curiosity to action
- Creating benefit-focused descriptions that build desire
- Designing CTAs with psychological triggers for maximum clicks
- Optimizing for ${this.getTemplateDescription(template)} layouts
- A/B testing and conversion rate optimization

BRAND: ${input.brandName}
TONE: ${this.getToneDescription(tone)}
TEMPLATE: ${template} - ${this.getTemplateDescription(template)}
GOAL: ${this.getGoalDescription(goal)}
TARGET AUDIENCE: ${input.targetAudience || 'Affluent consumers seeking premium products'}

You MUST respond with valid JSON in this exact structure:
{
  "headline": "Powerful headline (5-8 words, max 60 characters)",
  "subheadline": "Supporting subheadline that expands on promise (10-15 words)",
  "description": "Benefit-focused description (2-3 sentences, 30-50 words)",
  "ctaText": "Action-driven CTA (2-4 words)",
  "alternativeHeadlines": [
    "Alternative headline 1",
    "Alternative headline 2",
    "Alternative headline 3"
  ],
  "alternativeCTAs": [
    "Alternative CTA 1",
    "Alternative CTA 2",
    "Alternative CTA 3"
  ]
}

HEADLINE GUIDELINES:
- Lead with benefit or transformation, not features
- Create curiosity or use power words
- Keep it scannable: 5-8 words maximum
- Use active voice and strong verbs
- Make it specific and tangible
- Avoid generic phrases ("Best Products", "Welcome")
- Consider template: ${template === 'luxury-minimal' ? 'elegant and understated' : template === 'asymmetric-bold' ? 'punchy and impactful' : 'clear and benefit-driven'}

SUBHEADLINE GUIDELINES:
- Expand on the headline's promise
- Include specifics: who, what, why
- Add credibility or social proof if relevant
- 10-15 words for optimal readability
- Bridge interest to action

DESCRIPTION GUIDELINES:
- Focus on outcomes and benefits, not features
- Use sensory language for luxury products
- Address pain points or desires
- Create emotional connection
- Keep it concise: 2-3 sentences maximum
- End with momentum toward CTA

CTA GUIDELINES:
- Use action verbs: "Shop", "Discover", "Transform", "Get", "Start"
- Create urgency or exclusivity when appropriate
- 2-4 words maximum
- Match brand voice: ${tone === 'luxury' ? 'sophisticated' : tone === 'bold' ? 'commanding' : tone === 'friendly' ? 'inviting' : 'clear'}
- Examples: "Shop Now", "Explore Collection", "Get Started", "Discover More", "Join Now"

ALTERNATIVE VARIANTS:
- Provide 3 alternative headlines for A/B testing
- Each should take a different angle: benefit, curiosity, social proof
- Provide 3 alternative CTAs with varying urgency/tone`;
  }

  /**
   * Build user prompt
   */
  private buildPrompt(input: HeroGeneratorInput): string {
    let prompt = `Generate compelling hero block content for:\\n\\n`;
    prompt += `Brand: ${input.brandName}\\n`;

    if (input.productOrService) {
      prompt += `Product/Service: ${input.productOrService}\\n`;
    }

    if (input.targetAudience) {
      prompt += `Target Audience: ${input.targetAudience}\\n`;
    }

    if (input.keyBenefits && input.keyBenefits.length > 0) {
      prompt += `\\nKey Benefits to Highlight:\\n`;
      input.keyBenefits.forEach((benefit) => {
        prompt += `- ${benefit}\\n`;
      });
    }

    prompt += `\\nDesign Template: ${input.template || 'split-screen'}\\n`;
    prompt += `Conversion Goal: ${input.goal || 'convert'}\\n`;

    if (input.existingContent) {
      prompt += `\\nExisting Content (for reference/improvement):\\n`;
      if (input.existingContent.headline) {
        prompt += `Current Headline: ${input.existingContent.headline}\\n`;
      }
      if (input.existingContent.subheadline) {
        prompt += `Current Subheadline: ${input.existingContent.subheadline}\\n`;
      }
      if (input.existingContent.description) {
        prompt += `Current Description: ${input.existingContent.description}\\n`;
      }
    }

    prompt += `\\nGenerate the JSON response now:`;

    return prompt;
  }

  /**
   * Get template description
   */
  private getTemplateDescription(template: string): string {
    const descriptions: Record<string, string> = {
      'split-screen': 'classic two-column layout with equal visual weight',
      'centered-minimal': 'Apple-style centered text with clean aesthetic',
      'full-width-overlay': 'dramatic full-screen background with text overlay',
      'asymmetric-bold': 'modern magazine-style with bold typography',
      'luxury-minimal': 'sophisticated high-end with subtle elegance',
      'gradient-modern': 'futuristic with animated gradients and tech feel'
    };
    return descriptions[template] || 'standard hero layout';
  }

  /**
   * Get tone description
   */
  private getToneDescription(tone: string): string {
    const toneDescriptions: Record<string, string> = {
      professional: 'Authoritative, trustworthy, and clear. Professional yet approachable.',
      luxury: 'Sophisticated, exclusive, and aspirational. Emphasizes premium quality and refinement.',
      friendly: 'Warm, conversational, and inviting. Creates personal connection.',
      bold: 'Confident, direct, and commanding. Makes strong statements.',
      minimal: 'Clean, understated, and elegant. Less is more philosophy.'
    };
    return toneDescriptions[tone] || toneDescriptions.professional;
  }

  /**
   * Get goal description
   */
  private getGoalDescription(goal: string): string {
    const goalDescriptions: Record<string, string> = {
      sell: 'Drive immediate purchase decisions with urgency and value',
      inform: 'Educate audience about product/service benefits and features',
      engage: 'Create interest and encourage exploration of the site',
      convert: 'Balance information with persuasion to drive signups/purchases',
      inspire: 'Create emotional connection and aspirational messaging'
    };
    return goalDescriptions[goal] || goalDescriptions.convert;
  }

  /**
   * Get max tokens based on template
   */
  private getMaxTokensByTemplate(template: string): number {
    const tokenLimits: Record<string, number> = {
      'centered-minimal': 600,   // Shorter, punchier content
      'luxury-minimal': 600,     // Elegant, concise
      'split-screen': 800,       // Standard balanced content
      'full-width-overlay': 700, // Focus on visual, less text
      'asymmetric-bold': 900,    // More room for bold statements
      'gradient-modern': 800     // Standard
    };
    return tokenLimits[template] || 800;
  }

  /**
   * Get temperature based on tone
   */
  private getTemperatureByTone(tone: string): number {
    const temperatures: Record<string, number> = {
      professional: 0.7,
      luxury: 0.75,
      friendly: 0.8,
      bold: 0.85,
      minimal: 0.65
    };
    return temperatures[tone] || 0.7;
  }
}
