/**
 * Static Text Translator
 *
 * Translates UI strings with context awareness while preserving placeholders.
 */

import { IAIFeature, FeatureOptions, GenerateTextParams } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface StaticTextTranslationInput {
  text: string;
  key?: string;
  namespace?: string;
  sourceLanguage?: string;
  targetLanguage: string;
  preserveTerms?: string[];
  context?: string;
  tone?: 'luxury' | 'professional' | 'casual' | 'friendly';
}

export interface StaticTextTranslationOutput {
  translatedText: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export class StaticTextTranslator implements IAIFeature {
  readonly name = 'static_text_translator';
  readonly description = 'Translate static UI text while preserving placeholders and context';
  readonly requiredCapabilities = ['text-generation'];

  constructor(private aiManager: AIServiceManager) {}

  async execute(
    input: StaticTextTranslationInput,
    options?: FeatureOptions
  ): Promise<StaticTextTranslationOutput> {
    // Validation
    if (!input.text || input.text.trim().length === 0) {
      throw new Error('Text to translate cannot be empty');
    }
    if (input.text.length > 10000) {
      throw new Error('Text exceeds maximum length of 10000 characters');
    }
    if (!this.isValidLanguageCode(input.targetLanguage)) {
      throw new Error(`Invalid target language code: ${input.targetLanguage}`);
    }

    const prompt = this.buildPrompt(input);
    const systemPrompt = this.getSystemPrompt(input);

    const params: GenerateTextParams = {
      prompt,
      systemPrompt,
      maxTokens: 500,
      temperature: 0.3,
      responseFormat: 'json',
      metadata: {
        feature: this.name,
        targetLanguage: input.targetLanguage,
        ...options?.metadata
      }
    };

    const response = await this.aiManager.generateText(params, {
      ...options,
      useCache: options?.useCache !== false,
      metadata: {
        feature: this.name,
        ...options?.metadata
      }
    });

    const translatedText = this.parseResponse(response.content);

    return {
      translatedText,
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }

  async estimateCost(input: StaticTextTranslationInput): Promise<number> {
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.getSystemPrompt(input);

    const providers = this.aiManager.getAvailableProviders();
    if (providers.length === 0) {
      return 0;
    }

    const provider = this.aiManager.getProvider(providers[0]);
    if (!provider) {
      return 0;
    }

    return provider.estimateCost({
      prompt,
      systemPrompt,
      maxTokens: 500,
      temperature: 0.3
    });
  }

  private buildPrompt(input: StaticTextTranslationInput): string {
    const contextInfo = [
      input.key ? `Translation key: ${input.key}` : null,
      input.namespace ? `Namespace: ${input.namespace}` : null,
      input.context ? `Usage: ${input.context}` : null
    ].filter(Boolean).join('\n');

    return `Translate the following UI text from ${input.sourceLanguage || 'en'} to ${input.targetLanguage}.

${contextInfo ? contextInfo + '\n\n' : ''}Text to translate:
"${input.text}"

Requirements:
- Maintain the same tone and formality level
- Keep any placeholders intact (e.g., {{variable}}, \${{amount}})
- Preserve HTML tags if present
- Maintain special characters and punctuation appropriately
${input.preserveTerms?.length ? `- DO NOT translate these terms: ${input.preserveTerms.join(', ')}` : ''}
- Ensure the translation sounds natural for native speakers
- For UI text, keep it concise and clear

Return JSON in this format:
{
  "translatedText": "..."
}`;
  }

  private getSystemPrompt(input: StaticTextTranslationInput): string {
    return `You are an expert UI/UX translator.

Your priorities:
- Accurate meaning preservation
- Natural phrasing for native speakers
- Consistent tone (${input.tone || 'professional'})
- Preservation of placeholders, HTML tags, and special characters

Return ONLY valid JSON.`;
  }

  private parseResponse(content: string): string {
    try {
      let cleaned = content.trim();

      if (cleaned.startsWith('```')) {
        const firstNewline = cleaned.indexOf('\n');
        if (firstNewline !== -1) {
          cleaned = cleaned.substring(firstNewline + 1);
        }
        if (cleaned.endsWith('```')) {
          cleaned = cleaned.substring(0, cleaned.lastIndexOf('```'));
        }
        cleaned = cleaned.trim();
      }

      const parsed = JSON.parse(cleaned);
      if (typeof parsed.translatedText !== 'string') {
        throw new Error('Invalid response structure');
      }

      return parsed.translatedText.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Failed to parse static text translation response:', error);
      return content.trim().replace(/^["']|["']$/g, '');
    }
  }

  /**
   * Validates if the provided string is a valid language code.
   * Supports ISO 639-1 (2-letter), ISO 639-2 (3-letter), and locale codes (e.g., en-US).
   */
  private isValidLanguageCode(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false;
    }

    // ISO 639-1 (2-letter) codes: en, ka, fr, de, etc.
    const iso639_1 = /^[a-z]{2}$/i;

    // ISO 639-2 (3-letter) codes: eng, kat, fra, deu, etc.
    const iso639_2 = /^[a-z]{3}$/i;

    // Locale codes: en-US, ka-GE, fr-FR, zh-CN, etc.
    const locale = /^[a-z]{2}-[A-Z]{2}$/;

    // Extended locale codes: zh-Hans-CN, sr-Latn-RS, etc.
    const extendedLocale = /^[a-z]{2,3}-[A-Z][a-z]{3}(-[A-Z]{2})?$/;

    return iso639_1.test(code) ||
           iso639_2.test(code) ||
           locale.test(code) ||
           extendedLocale.test(code);
  }
}
