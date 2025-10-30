/**
 * AI Features Generator
 *
 * Generates compelling product/service features for CMS feature blocks.
 * Creates benefit-focused features with appropriate icons and descriptions.
 */

import { AIFeature, AIFeatureInput, AIFeatureOutput, FeatureOptions } from '../core/types';
import { AIServiceManager } from '../AIServiceManager';

export interface FeaturesGeneratorInput extends AIFeatureInput {
  productOrService: string;
  industry?: string; // e.g., "E-commerce", "SaaS", "Healthcare"
  targetAudience?: string;
  numberOfFeatures: number; // 3-8
  focusArea?: 'benefits' | 'technical' | 'competitive' | 'user-experience' | 'mixed';
  tone?: 'professional' | 'friendly' | 'technical' | 'persuasive';
  includeSpecificFeatures?: string[]; // Specific features to highlight
  language?: string;
}

export interface GeneratedFeature {
  icon: string; // Icon name from available set
  title: string; // Short, punchy title (2-6 words)
  description: string; // Benefit-focused description (10-25 words)
}

export interface FeaturesGeneratorOutput extends AIFeatureOutput {
  features: GeneratedFeature[];
}

export class FeaturesGenerator implements AIFeature<FeaturesGeneratorInput, FeaturesGeneratorOutput> {
  name = 'features_generator';
  description = 'Generate compelling product/service features with icons';

  constructor(private aiService: AIServiceManager) {}

  private getSystemPrompt(input: FeaturesGeneratorInput): string {
    const {
      productOrService,
      industry,
      targetAudience,
      numberOfFeatures,
      focusArea = 'mixed',
      tone = 'professional',
      includeSpecificFeatures,
      language = 'en'
    } = input;

    const specificFeaturesSection = includeSpecificFeatures && includeSpecificFeatures.length > 0
      ? `\n\nRequired features to include:\n${includeSpecificFeatures.map(f => `- ${f}`).join('\n')}`
      : '';

    const focusAreaGuidelines = {
      benefits: 'Focus on customer benefits and value proposition. Emphasize outcomes, not features.',
      technical: 'Focus on technical capabilities and specifications. Be precise and data-driven.',
      competitive: 'Focus on competitive advantages and differentiators. Highlight what sets this apart.',
      'user-experience': 'Focus on ease of use, convenience, and user satisfaction. Emphasize simplicity.',
      mixed: 'Balance between benefits, technical aspects, and user experience.'
    };

    const toneGuidelines = {
      professional: 'Professional, clear, authoritative. Use industry-standard terminology.',
      friendly: 'Warm, approachable, conversational. Use simple language and relatable examples.',
      technical: 'Precise, detailed, data-focused. Use technical terminology where appropriate.',
      persuasive: 'Compelling, action-oriented, benefit-driven. Emphasize value and transformation.'
    };

    return `You are an expert at creating compelling feature descriptions for marketing and CMS content.

Product/Service: ${productOrService}
${industry ? `Industry: ${industry}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
Number of Features: ${numberOfFeatures}
Focus Area: ${focusArea} - ${focusAreaGuidelines[focusArea]}
Tone: ${tone} - ${toneGuidelines[tone]}
Language: ${language === 'ka' ? 'Georgian (ka)' : 'English (en)'}
${specificFeaturesSection}

AVAILABLE ICONS (choose the most appropriate for each feature):
- truck: Shipping, delivery, logistics
- shield: Security, protection, safety, warranty
- sparkles: Quality, premium, excellence, innovation
- heart: Care, wellness, satisfaction, love
- chat: Support, communication, community
- lock: Privacy, security, encryption
- check: Verification, guarantee, certification, approval
- star: Premium, top-rated, excellence
- bolt: Speed, performance, efficiency
- globe: Global, worldwide, universal
- gift: Rewards, bonuses, special offers
- clock: Time-saving, 24/7, fast
- users: Community, team, collaboration
- chart: Growth, analytics, results
- leaf: Eco-friendly, natural, sustainable
- beaker: Innovation, research, science
- wrench: Customization, tools, flexibility
- shield-check: Compliance, certified, verified
- arrows-right-left: Easy exchange, flexibility
- currency: Pricing, value, affordability

IMPORTANT GUIDELINES:

1. **Title Creation** (2-6 words):
   - Clear and specific (not generic)
   - Benefit-focused or capability-focused based on focus area
   - Action-oriented when appropriate
   - Memorable and distinctive
   - Examples:
     ✅ "Free 2-Day Shipping"
     ✅ "Bank-Level Security"
     ✅ "24/7 Expert Support"
     ❌ "Great Features"
     ❌ "Quality Service"

2. **Description Writing** (10-25 words):
   - Explain the specific benefit or capability
   - Include concrete details when possible
   - Answer "What does this mean for the customer?"
   - Use ${tone} tone consistently
   - Avoid marketing fluff and clichés
   - Examples:
     ✅ "Get your order delivered within 48 hours at no extra cost. Available for all domestic orders over $50."
     ✅ "Your payment information is encrypted with industry-standard 256-bit SSL technology, ensuring complete security."
     ❌ "We offer the best shipping in the industry."
     ❌ "Premium quality that exceeds expectations."

3. **Icon Selection**:
   - Choose the icon that best represents the feature
   - Use common associations (shield = security, heart = care, etc.)
   - Be consistent (don't use multiple icons for similar concepts)
   - Prioritize clarity over creativity

4. **Feature Diversity**:
   - Cover different aspects of the product/service
   - Vary between functional, emotional, and practical benefits
   - Don't repeat similar features with different wording
   - Order by importance (most compelling first)

5. **Focus Area Execution**:
   ${focusArea === 'benefits' ? '- Every feature should clearly state customer benefit\n- Use "you" language\n- Focus on outcomes and results' : ''}
   ${focusArea === 'technical' ? '- Include specific technical details\n- Use precise terminology\n- Mention standards, certifications, or metrics where relevant' : ''}
   ${focusArea === 'competitive' ? '- Highlight what competitors lack\n- Emphasize unique selling points\n- Use comparative language when appropriate' : ''}
   ${focusArea === 'user-experience' ? '- Emphasize ease, simplicity, and convenience\n- Focus on time-saving and effort reduction\n- Highlight user satisfaction' : ''}
   ${focusArea === 'mixed' ? '- Balance different types of features\n- Include 2-3 benefit features, 1-2 technical features, 1-2 UX features' : ''}

6. **Avoid**:
   - Generic marketing language ("world-class", "cutting-edge", "revolutionary")
   - Vague promises ("better quality", "great service")
   - Unverifiable claims ("best in class", "#1 rated")
   - Feature lists without benefits
   - Repetitive phrasing

RESPONSE FORMAT (JSON only, no markdown):
{
  "features": [
    {
      "icon": "shield",
      "title": "Feature Title",
      "description": "Specific benefit or capability description with concrete details."
    }
  ]
}

Generate ${numberOfFeatures} compelling, unique features now. Make each one distinctive and valuable.`;
  }

  async execute(
    input: FeaturesGeneratorInput,
    options?: FeatureOptions
  ): Promise<FeaturesGeneratorOutput> {
    const systemPrompt = this.getSystemPrompt(input);
    const userPrompt = `Generate ${input.numberOfFeatures} features for: ${input.productOrService}`;

    const temperature = input.tone === 'technical' ? 0.5 : 0.7;
    const maxTokens = input.numberOfFeatures * 150; // ~100 words per feature

    // Actually call the AI service
    const response = await this.aiService.generateText(
      {
        prompt: userPrompt,
        systemPrompt,
        maxTokens,
        temperature,
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          productOrService: input.productOrService,
          focusArea: input.focusArea || 'mixed',
          tone: input.tone || 'professional',
          language: input.language || 'en',
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
      console.error('Failed to parse features response as JSON:', error);
      console.error('Raw response:', response.content);
      throw new Error('Failed to generate features: Invalid JSON response');
    }

    // Validate and normalize features
    if (!parsedContent.features || !Array.isArray(parsedContent.features)) {
      throw new Error('Invalid response format: missing features array');
    }

    const validFeatures: GeneratedFeature[] = parsedContent.features.map((f: any) => {
      if (!f.icon || !f.title || !f.description) {
        throw new Error('Invalid feature: missing required fields');
      }

      return {
        icon: f.icon.trim().toLowerCase(),
        title: f.title.trim(),
        description: f.description.trim()
      };
    });

    return {
      features: validFeatures,
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }
}
