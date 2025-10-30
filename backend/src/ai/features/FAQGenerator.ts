/**
 * FAQ Generator
 *
 * AI-powered FAQ generation for products
 * Creates natural, SEO-optimized question-answer pairs
 *
 * Features:
 * - 5-10 common questions per product
 * - Categorized FAQs (usage, benefits, ingredients, etc.)
 * - JSON-LD schema markup for rich snippets
 * - Multilingual support
 * - Natural language questions
 */

import { IAIFeature, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface FAQGeneratorInput {
  productName: string;
  productDescription?: string;
  productCategory?: string;
  benefits?: string[];
  ingredients?: string[];
  price?: number;
  targetAudience?: string;
  commonConcerns?: string[]; // e.g., "sensitive skin", "color-treated hair"
  language?: string;
  numberOfFAQs?: number; // Default: 8
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: 'usage' | 'benefits' | 'ingredients' | 'suitability' | 'results' | 'general';
}

export interface FAQGeneratorOutput {
  faqs: FAQItem[];
  faqSchemaMarkup: string; // JSON-LD schema for SEO
  cost: number;
  tokensUsed: number;
  provider: string;
}

export class FAQGenerator implements IAIFeature {
  public readonly name = 'faq_generator';
  public readonly description = 'Generate comprehensive product FAQs with schema markup';
  public readonly requiredCapabilities = ['text-generation'];

  constructor(private aiService: AIServiceManager) {}

  /**
   * Execute FAQ generation
   */
  async execute(
    input: FAQGeneratorInput,
    options?: FeatureOptions
  ): Promise<FAQGeneratorOutput> {
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.buildSystemPrompt(input);

    const response = await this.aiService.generateText(
      {
        prompt,
        systemPrompt,
        maxTokens: this.estimateTokensNeeded(input),
        temperature: 0.6, // Lower for more factual, consistent answers
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          productName: input.productName,
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
      console.error('Failed to parse FAQ response as JSON:', error);
      throw new Error('Failed to generate FAQs');
    }

    // Generate schema markup
    const schemaMarkup = this.generateSchemaMarkup(
      parsedContent.faqs || [],
      input.productName
    );

    return {
      faqs: parsedContent.faqs || [],
      faqSchemaMarkup: schemaMarkup,
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: FAQGeneratorInput): Promise<number> {
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
      maxTokens: this.estimateTokensNeeded(input),
      temperature: 0.6
    });
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(input: FAQGeneratorInput): string {
    const language = input.language || 'en';
    const languageName = this.getLanguageName(language);

    return `You are an expert FAQ content creator specializing in luxury beauty and hair care products.

Your expertise includes:
- Understanding customer concerns and common questions
- Creating natural, conversational questions (how people actually search)
- Writing clear, helpful, authoritative answers
- SEO optimization for featured snippets
- Maintaining luxury brand voice
- Addressing objections and building trust

LANGUAGE: ${languageName}
TARGET AUDIENCE: ${input.targetAudience || 'Quality-conscious consumers seeking premium hair care'}

You MUST respond with valid JSON in this exact structure:
{
  "faqs": [
    {
      "question": "Natural question as customers would ask it",
      "answer": "Detailed, helpful answer (2-4 sentences)",
      "category": "usage|benefits|ingredients|suitability|results|general"
    }
  ]
}

FAQ QUESTION GUIDELINES:
- Write questions as customers naturally ask them
- Start with "How", "What", "Why", "When", "Can I", "Is it", "Does it", etc.
- Make questions specific and actionable
- Target featured snippet optimization
- Include relevant keywords naturally
- Cover the full customer journey (research → purchase → usage → results)

ANSWER GUIDELINES:
- Start with a direct answer (first sentence)
- Provide supporting details (2nd-3rd sentences)
- Use benefit-focused language
- Be specific and helpful
- Maintain luxury brand voice
- Address concerns proactively
- Keep answers between 40-80 words (optimal for featured snippets)
- End positively when appropriate

CATEGORY DISTRIBUTION:
- usage: How to use the product, application methods, frequency
- benefits: What results to expect, key advantages
- ingredients: Active ingredients, formulation questions
- suitability: Hair types, compatibility, who should use it
- results: Timeline, effectiveness, what to expect
- general: Price, availability, general product info`;
  }

  /**
   * Build user prompt
   */
  private buildPrompt(input: FAQGeneratorInput): string {
    const numberOfFAQs = input.numberOfFAQs || 8;

    let prompt = `Generate ${numberOfFAQs} frequently asked questions and answers for:\n\n`;
    prompt += `Product: ${input.productName}\n`;

    if (input.productCategory) {
      prompt += `Category: ${input.productCategory}\n`;
    }

    if (input.productDescription) {
      prompt += `Description: ${input.productDescription}\n`;
    }

    if (input.benefits && input.benefits.length > 0) {
      prompt += `\nKey Benefits:\n`;
      input.benefits.forEach((benefit, index) => {
        prompt += `- ${benefit}\n`;
      });
    }

    if (input.ingredients && input.ingredients.length > 0) {
      prompt += `\nKey Ingredients:\n`;
      input.ingredients.forEach((ingredient, index) => {
        prompt += `- ${ingredient}\n`;
      });
    }

    if (input.price) {
      prompt += `\nPrice: $${input.price.toFixed(2)}\n`;
    }

    if (input.commonConcerns && input.commonConcerns.length > 0) {
      prompt += `\nAddress these concerns:\n`;
      input.commonConcerns.forEach((concern, index) => {
        prompt += `- ${concern}\n`;
      });
    }

    prompt += `\nREQUIREMENTS:\n`;
    prompt += `- Create ${numberOfFAQs} diverse FAQs covering different categories\n`;
    prompt += `- Balance across categories: usage (${Math.ceil(numberOfFAQs * 0.3)}), benefits (${Math.ceil(numberOfFAQs * 0.3)}), `;
    prompt += `ingredients (${Math.ceil(numberOfFAQs * 0.15)}), suitability (${Math.ceil(numberOfFAQs * 0.15)}), results (${Math.ceil(numberOfFAQs * 0.1)})\n`;
    prompt += `- Write questions as real customers would ask them\n`;
    prompt += `- Provide helpful, accurate, benefit-focused answers\n`;
    prompt += `- Optimize for featured snippets (40-80 words per answer)\n\n`;

    prompt += `Generate the JSON response now:`;

    return prompt;
  }

  /**
   * Estimate tokens needed
   */
  private estimateTokensNeeded(input: FAQGeneratorInput): number {
    const numberOfFAQs = input.numberOfFAQs || 8;

    // Each FAQ: ~30 tokens for question, ~100 tokens for answer
    const tokensPerFAQ = 130;
    const faqTokens = numberOfFAQs * tokensPerFAQ;

    // Prompt tokens (system + user)
    const promptTokens = 600;

    // Add buffer for JSON structure
    const buffer = 200;

    return promptTokens + faqTokens + buffer;
  }

  /**
   * Generate JSON-LD schema markup for FAQs
   */
  private generateSchemaMarkup(faqs: FAQItem[], productName: string): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'about': {
        '@type': 'Product',
        'name': productName
      },
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };

    return JSON.stringify(schema, null, 2);
  }

  /**
   * Get language name from ISO code
   */
  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'en': 'English',
      'ka': 'Georgian',
      'ru': 'Russian',
      'tr': 'Turkish',
      'ar': 'Arabic',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish'
    };
    return languages[code] || 'English';
  }
}
