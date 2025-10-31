/**
 * Menu Item Translator
 *
 * AI-powered translation of navigation menu items to different languages.
 * Maintains navigation context and ensures labels are natural and culturally appropriate.
 */

import { IAIFeature, FeatureOptions, GenerateTextParams } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface MenuItemToTranslate {
  id: number;
  label: string;
  linkType: string;
  context?: string; // Optional context about what the menu item links to
}

export interface MenuItemTranslatorInput {
  menuItems: MenuItemToTranslate[];
  targetLanguage: string;
  targetLanguageNative?: string; // Native name (e.g., "ქართული" for Georgian)
  sourceLanguage?: string;
  brandName?: string;
  style?: 'formal' | 'casual' | 'professional';
}

export interface TranslatedMenuItem {
  id: number;
  label: string;
  originalLabel: string;
}

export interface MenuItemTranslatorOutput {
  translatedItems: TranslatedMenuItem[];
  notes?: string; // Any translation notes or suggestions
  cost: number;
  tokensUsed: number;
  provider: string;
}

export class MenuItemTranslator implements IAIFeature {
  public readonly name = 'menu_item_translator';
  public readonly description = 'Translate navigation menu items to different languages';
  public readonly requiredCapabilities = ['text-generation'];

  private aiService: AIServiceManager;

  constructor(aiService: AIServiceManager) {
    this.aiService = aiService;
  }

  /**
   * Execute menu item translation
   */
  async execute(
    input: MenuItemTranslatorInput,
    options?: FeatureOptions
  ): Promise<MenuItemTranslatorOutput> {
    // Build context-rich prompt
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.buildSystemPrompt(input);

    // Prepare generation parameters
    const params: GenerateTextParams = {
      prompt,
      systemPrompt,
      maxTokens: Math.min(1500, 100 * input.menuItems.length + 300), // Scale with number of items
      temperature: 0.5, // Lower temperature for more consistent translations
      responseFormat: 'json',
      metadata: {
        feature: this.name,
        targetLanguage: input.targetLanguage,
        itemCount: input.menuItems.length,
        ...options?.metadata
      }
    };

    // Generate with AI service
    const response = await this.aiService.generateText(params, {
      ...options,
      useCache: options?.useCache !== false,
      metadata: {
        feature: this.name,
        ...options?.metadata
      }
    });

    // Parse JSON response
    const parsedContent = this.parseResponse(response.content);

    return {
      translatedItems: parsedContent.translatedItems || [],
      notes: parsedContent.notes,
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: MenuItemTranslatorInput): Promise<number> {
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.buildSystemPrompt(input);

    // Get first available provider for estimation
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
      maxTokens: Math.min(1500, 100 * input.menuItems.length + 300),
      temperature: 0.5
    });
  }

  /**
   * Build system prompt with instructions
   */
  private buildSystemPrompt(input: MenuItemTranslatorInput): string {
    const targetLang = input.targetLanguageNative || input.targetLanguage;
    const sourceLang = input.sourceLanguage || 'English';
    const style = input.style || 'professional';

    let systemPrompt = `You are an expert translator specializing in website navigation and UI localization.

Your task is to translate navigation menu labels from ${sourceLang} to ${targetLang}.

TRANSLATION PRINCIPLES:
1. Natural Language: Translations should sound natural to native speakers
2. Conciseness: Navigation labels must be short and scannable
3. Clarity: Avoid ambiguity - users should immediately understand where they'll go
4. Cultural Appropriateness: Adapt to cultural norms and expectations
5. Consistency: Use consistent terminology across all menu items
6. SEO Awareness: Use commonly searched terms when appropriate

STYLE: ${this.getStyleDescription(style)}

NAVIGATION CONTEXT:
- These are navigation menu items for an e-commerce website
- Labels will appear in header, footer, or mobile navigation
- Maximum length: 2-3 words preferred, 4 words maximum
- Avoid literal translations if a more natural phrase exists
- Consider how native speakers would describe these sections

IMPORTANT: You MUST respond with valid JSON in the following format:
{
  "translatedItems": [
    {
      "id": 1,
      "label": "Translated Label",
      "originalLabel": "Original English Label"
    }
  ],
  "notes": "Optional: Any translation notes, cultural considerations, or alternative suggestions"
}

GUIDELINES:
1. Preserve the intent and meaning of each menu item
2. Use title case or sentence case as appropriate for the target language
3. If a term has multiple valid translations, choose the most commonly used in e-commerce
4. For technical terms (e.g., "Cart", "Checkout"), use the standard localized terms
5. Maintain parallel structure across related items
6. Consider the hierarchy - parent items should set context for children`;

    return systemPrompt;
  }

  /**
   * Build user prompt with menu items
   */
  private buildPrompt(input: MenuItemTranslatorInput): string {
    let prompt = `Translate the following navigation menu items to ${input.targetLanguageNative || input.targetLanguage}.\n\n`;

    if (input.brandName) {
      prompt += `Brand Name: ${input.brandName} (keep brand name unchanged)\n\n`;
    }

    prompt += `MENU ITEMS TO TRANSLATE:\n\n`;

    input.menuItems.forEach((item, index) => {
      prompt += `${index + 1}. "${item.label}"`;
      if (item.context) {
        prompt += ` - Context: ${item.context}`;
      }
      if (item.linkType) {
        prompt += ` [Type: ${item.linkType}]`;
      }
      prompt += `\n`;
    });

    prompt += `\nProvide translations in JSON format with the structure specified above.`;

    return prompt;
  }

  /**
   * Get style description
   */
  private getStyleDescription(style: string): string {
    const styleDescriptions: Record<string, string> = {
      formal: 'Formal, respectful tone. Use polite forms and traditional terminology.',
      casual: 'Friendly, conversational tone. Use everyday language and modern terms.',
      professional: 'Professional business tone. Clear, direct, and trustworthy.'
    };

    return styleDescriptions[style] || styleDescriptions.professional;
  }

  /**
   * Parse JSON response
   */
  private parseResponse(content: string): any {
    try {
      // Strip markdown code blocks if present
      let cleanedContent = content.trim();

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

      // Remove "json" or "JSON" prefix if present
      if (cleanedContent.startsWith('json') || cleanedContent.startsWith('JSON')) {
        cleanedContent = cleanedContent.substring(4).trim();
      }

      // Try parsing with control character fallback
      try {
        return JSON.parse(cleanedContent);
      } catch (firstError) {
        // Try to fix common JSON formatting issues
        const escapedContent = cleanedContent
          .replace(/\r\n/g, '\\n')
          .replace(/\r/g, '\\n')
          .replace(/\n/g, '\\n')
          .replace(/\t/g, '\\t')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters

        return JSON.parse(escapedContent);
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      console.error('Raw content:', content.substring(0, 500));

      // Return empty structure
      return {
        translatedItems: [],
        notes: 'Failed to parse AI response. Please try again.'
      };
    }
  }
}
