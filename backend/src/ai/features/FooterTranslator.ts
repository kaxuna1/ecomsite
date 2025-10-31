/**
 * Footer Translator
 *
 * Context-aware translation for footer content
 * Preserves formatting, brand voice, and structure
 */

import { IAIFeature, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface FooterTranslationInput {
  fields: {
    brandName?: string;
    brandTagline?: string;
    footerColumns?: Array<{
      title: string;
      links: Array<{
        label: string;
        url: string;
        is_external?: boolean;
      }>;
    }>;
    contactInfo?: {
      address?: {
        label: string;
        street: string;
        city: string;
        country: string;
      };
      email?: string;
      phone?: string;
    };
    newsletterTitle?: string;
    newsletterDescription?: string;
    newsletterPlaceholder?: string;
    newsletterButtonText?: string;
    copyrightText?: string;
    bottomLinks?: Array<{ label: string; url: string }>;
  };
  sourceLanguage: string; // ISO code: 'en', 'ka', etc.
  targetLanguage: string;
  preserveTerms?: string[]; // Brand names, technical terms to not translate
  tone?: 'luxury' | 'professional' | 'casual' | 'friendly';
}

export interface FooterTranslationOutput {
  translatedFields: {
    brandName?: string;
    brandTagline?: string;
    footerColumns?: Array<{
      title: string;
      links: Array<{
        label: string;
        url: string;
        is_external?: boolean;
      }>;
    }>;
    contactInfo?: {
      address?: {
        label: string;
        street: string;
        city: string;
        country: string;
      };
      email?: string;
      phone?: string;
    };
    newsletterTitle?: string;
    newsletterDescription?: string;
    newsletterPlaceholder?: string;
    newsletterButtonText?: string;
    copyrightText?: string;
    bottomLinks?: Array<{ label: string; url: string }>;
  };
  preservedTerms: string[];
  languagePair: string; // e.g., "en-ka"
  cost: number;
  tokensUsed: number;
  provider: string;
}

export class FooterTranslator implements IAIFeature {
  readonly name = 'footer_translator';
  readonly description = 'Translate footer content while maintaining brand voice and consistency';
  readonly requiredCapabilities = ['text_generation', 'json_output'];

  constructor(private aiManager: AIServiceManager) {}

  /**
   * Execute footer translation
   */
  async execute(
    input: FooterTranslationInput,
    options?: FeatureOptions
  ): Promise<FooterTranslationOutput> {
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.getSystemPrompt(input);

    const response = await this.aiManager.generateText(
      {
        prompt,
        systemPrompt,
        maxTokens: this.estimateTokensNeeded(input),
        temperature: 0.3, // Lower temperature for more consistent translations
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          languagePair: `${input.sourceLanguage}-${input.targetLanguage}`,
          ...(options?.metadata || {})
        },
      },
      options
    );

    // Parse JSON response
    const result = this.parseResponse(response.content);

    return {
      translatedFields: result.translatedFields,
      preservedTerms: input.preserveTerms || [],
      languagePair: `${input.sourceLanguage}-${input.targetLanguage}`,
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: FooterTranslationInput): Promise<number> {
    const tokens = this.estimateTokensNeeded(input);
    const costPerToken = 0.00001; // GPT-4 Turbo average
    return tokens * costPerToken;
  }

  /**
   * Build the main translation prompt
   */
  private buildPrompt(input: FooterTranslationInput): string {
    const { fields, sourceLanguage, targetLanguage, preserveTerms, tone } = input;

    // Build context
    const context = [];
    if (tone) context.push(`Tone: ${tone}`);
    if (preserveTerms && preserveTerms.length > 0) {
      context.push(`Preserve these terms (do NOT translate): ${preserveTerms.join(', ')}`);
    }

    const contextStr = context.length > 0 ? `\n\nContext:\n${context.join('\n')}` : '';

    return `Translate the following footer content from ${this.getLanguageName(sourceLanguage)} to ${this.getLanguageName(targetLanguage)}.${contextStr}

IMPORTANT RULES:
1. Maintain the same structure and formatting
2. Keep URLs exactly as they are (do NOT translate or modify URLs)
3. Preserve any HTML tags, special characters, and formatting
4. Keep email addresses and phone numbers unchanged
5. Translate link labels and text content to sound natural for native speakers
6. For copyright text, maintain the legal format while translating text portions
7. Keep the same tone and level of formality
8. ${preserveTerms && preserveTerms.length > 0 ? `DO NOT translate these brand terms: ${preserveTerms.join(', ')}` : ''}

Content to translate:
${JSON.stringify(fields, null, 2)}

Return a JSON object with this exact structure:
{
  "translatedFields": {
    // Same structure as input, with all text translated
    // Keep URLs, emails, phone numbers unchanged
    // Only translate: brandName (if not in preserveTerms), brandTagline, column titles, link labels,
    // contactInfo labels and text (not email/phone), newsletter text, copyright text, bottom link labels
  }
}

IMPORTANT: Return ONLY the JSON object, no explanations or additional text.`;
  }

  /**
   * Get system prompt with translation guidelines
   */
  private getSystemPrompt(input: FooterTranslationInput): string {
    const { sourceLanguage, targetLanguage, tone } = input;

    return `You are an expert translator specializing in website footer content and marketing copy.

Your goal is to translate footer content from ${this.getLanguageName(sourceLanguage)} to ${this.getLanguageName(targetLanguage)} while:
- Maintaining ${tone || 'professional'} tone
- Preserving brand voice and consistency
- Ensuring natural-sounding translations for native speakers
- Keeping all technical elements (URLs, emails, phone numbers) unchanged
- Maintaining proper formatting and structure

Key principles:
1. Accuracy: Translations must be accurate and contextually appropriate
2. Naturalness: Avoid literal translations; make it sound native
3. Consistency: Use consistent terminology throughout
4. Preservation: Never modify URLs, email addresses, or phone numbers
5. Respect: Honor cultural nuances and local conventions

You MUST return valid JSON only, with no additional commentary.`;
  }

  /**
   * Parse and validate AI response
   */
  private parseResponse(content: string): any {
    try {
      // Clean up response if AI added markdown code blocks
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);

      if (!parsed.translatedFields) {
        throw new Error('Response missing translatedFields');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse AI translation response:', error);
      console.error('Response content:', content);
      throw new Error('Failed to parse AI translation response. The AI returned invalid JSON.');
    }
  }

  /**
   * Estimate tokens needed based on input size
   */
  private estimateTokensNeeded(input: FooterTranslationInput): number {
    const jsonSize = JSON.stringify(input.fields).length;
    const promptTokens = Math.ceil((this.buildPrompt(input).length + this.getSystemPrompt(input).length) / 4);
    const responseTokens = Math.ceil(jsonSize / 3); // Response is similar size but in target language

    // Add buffer for JSON structure overhead
    return promptTokens + responseTokens + 500;
  }

  /**
   * Get full language name from ISO code
   */
  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      en: 'English',
      ka: 'Georgian',
      ru: 'Russian',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      it: 'Italian',
      tr: 'Turkish',
      ar: 'Arabic',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
    };
    return languages[code] || code;
  }
}
