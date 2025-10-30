/**
 * Description Generator Feature
 *
 * AI-powered product description generation
 * Generates professional product descriptions with highlights, usage instructions, and SEO metadata
 */

import { IAIFeature, FeatureOptions, GenerateTextParams } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface DescriptionGeneratorInput {
  productName: string;
  shortDescription?: string;
  categories?: string[];
  existingDescription?: string;
  tone?: 'professional' | 'luxury' | 'casual' | 'friendly' | 'technical';
  length?: 'short' | 'medium' | 'long';
  language?: string;
  targetAudience?: string;
  keyFeatures?: string[];
}

export interface DescriptionGeneratorOutput {
  description: string;
  highlights: string[];
  usage: string;
  metaDescription: string;
  cost: number;
  tokensUsed: number;
  provider: string;
}

export class DescriptionGenerator implements IAIFeature {
  public readonly name = 'product_description_generator';
  public readonly description = 'Generate AI-powered product descriptions';
  public readonly requiredCapabilities = ['text-generation'];

  private aiService: AIServiceManager;

  constructor(aiService: AIServiceManager) {
    this.aiService = aiService;
  }

  /**
   * Execute description generation
   */
  async execute(
    input: DescriptionGeneratorInput,
    options?: FeatureOptions
  ): Promise<DescriptionGeneratorOutput> {
    // Build context-rich prompt
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.buildSystemPrompt(input);

    // Prepare generation parameters
    const params: GenerateTextParams = {
      prompt,
      systemPrompt,
      maxTokens: this.getMaxTokensByLength(input.length || 'medium'),
      temperature: this.getTemperatureByTone(input.tone || 'professional'),
      responseFormat: 'json',
      metadata: {
        feature: this.name,
        productName: input.productName,
        tone: input.tone,
        length: input.length,
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
      // If JSON parsing fails, try to extract structured data
      console.error('Failed to parse AI response as JSON:', error);
      parsedContent = this.extractStructuredData(response.content);
    }

    return {
      description: parsedContent.description || '',
      highlights: parsedContent.highlights || [],
      usage: parsedContent.usage || '',
      metaDescription: parsedContent.metaDescription || '',
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: DescriptionGeneratorInput): Promise<number> {
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
      maxTokens: this.getMaxTokensByLength(input.length || 'medium'),
      temperature: this.getTemperatureByTone(input.tone || 'professional')
    });
  }

  /**
   * Build system prompt with instructions
   */
  private buildSystemPrompt(input: DescriptionGeneratorInput): string {
    const tone = input.tone || 'professional';
    const length = input.length || 'medium';

    let systemPrompt = `You are an expert product copywriter specializing in ${tone} e-commerce content for luxury scalp and hair-care products.

Your task is to generate compelling product descriptions that convert browsers into buyers.

TONE: ${this.getToneDescription(tone)}
LENGTH: ${this.getLengthDescription(length)}
TARGET AUDIENCE: ${input.targetAudience || 'Health-conscious consumers seeking premium hair care solutions'}

IMPORTANT: You MUST respond with valid JSON in the following format:
{
  "description": "Full product description (2-4 paragraphs)",
  "highlights": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4", "Benefit 5"],
  "usage": "Clear usage instructions (1-2 paragraphs)",
  "metaDescription": "SEO-optimized meta description (150-160 characters)"
}

Guidelines:
1. Description should tell a story and evoke emotions
2. Highlights should be concise benefits (not features)
3. Usage instructions should be clear and actionable
4. Meta description must be under 160 characters and include key selling points
5. Use sensory language and specific details
6. Avoid generic claims and clichés
7. Focus on transformation and results
8. Make it scannable with good flow`;

    return systemPrompt;
  }

  /**
   * Build user prompt with product context
   */
  private buildPrompt(input: DescriptionGeneratorInput): string {
    let prompt = `Generate a compelling product description for:\n\n`;
    prompt += `Product Name: ${input.productName}\n`;

    if (input.shortDescription) {
      prompt += `Short Description: ${input.shortDescription}\n`;
    }

    if (input.categories && input.categories.length > 0) {
      prompt += `Categories: ${input.categories.join(', ')}\n`;
    }

    if (input.keyFeatures && input.keyFeatures.length > 0) {
      prompt += `Key Features: ${input.keyFeatures.join(', ')}\n`;
    }

    if (input.existingDescription) {
      prompt += `\nExisting Description (for reference/improvement):\n${input.existingDescription}\n`;
    }

    prompt += `\nGenerate the JSON response now:`;

    return prompt;
  }

  /**
   * Get tone description
   */
  private getToneDescription(tone: string): string {
    const toneDescriptions: Record<string, string> = {
      professional: 'Authoritative, trustworthy, and informative. Uses industry terminology appropriately.',
      luxury: 'Sophisticated, exclusive, and aspirational. Emphasizes premium quality and indulgence.',
      casual: 'Friendly, approachable, and conversational. Uses everyday language and contractions.',
      friendly: 'Warm, personal, and encouraging. Creates connection with the reader.',
      technical: 'Detailed, precise, and scientific. Focuses on ingredients and formulation.'
    };

    return toneDescriptions[tone] || toneDescriptions.professional;
  }

  /**
   * Get length description
   */
  private getLengthDescription(length: string): string {
    const lengthDescriptions: Record<string, string> = {
      short: 'Concise and impactful. 1-2 paragraphs for description, 3 highlights.',
      medium: 'Balanced detail. 2-3 paragraphs for description, 5 highlights.',
      long: 'Comprehensive and detailed. 3-4 paragraphs for description, 7 highlights.'
    };

    return lengthDescriptions[length] || lengthDescriptions.medium;
  }

  /**
   * Get max tokens based on desired length
   */
  private getMaxTokensByLength(length: string): number {
    const tokenLimits: Record<string, number> = {
      short: 500,
      medium: 1000,
      long: 1500
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
      casual: 0.9,
      friendly: 0.85,
      technical: 0.5
    };

    return temperatures[tone] || 0.7;
  }

  /**
   * Extract structured data from non-JSON response (fallback)
   */
  private extractStructuredData(content: string): any {
    // Try to extract sections even if not proper JSON
    const result: any = {
      description: '',
      highlights: [],
      usage: '',
      metaDescription: ''
    };

    // Strip markdown wrappers first
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

    // Try to find JSON-like structure
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        // Try to fix truncated JSON by adding missing closing quotes/braces
        let jsonStr = jsonMatch[0];

        // Count opening and closing braces
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;

        // If truncated, try to close it properly
        if (openBraces > closeBraces) {
          // Check if last field is incomplete (unterminated string)
          if (!jsonStr.trim().endsWith('}') && !jsonStr.trim().endsWith('"')) {
            jsonStr += '"';
          }
          // Add missing closing braces
          for (let i = 0; i < (openBraces - closeBraces); i++) {
            jsonStr += '}';
          }
        }

        return JSON.parse(jsonStr);
      } catch (e) {
        // Continue with fallback extraction
        console.warn('JSON extraction failed, using fallback:', e);
      }
    }

    // Fallback: extract sections manually
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes('description') || trimmed.includes('Description')) {
        currentSection = 'description';
      } else if (trimmed.includes('highlights') || trimmed.includes('Highlights')) {
        currentSection = 'highlights';
      } else if (trimmed.includes('usage') || trimmed.includes('Usage')) {
        currentSection = 'usage';
      } else if (trimmed.includes('meta') || trimmed.includes('Meta')) {
        currentSection = 'metaDescription';
      } else if (trimmed && currentSection) {
        // Add content to current section
        if (currentSection === 'highlights' && (trimmed.startsWith('-') || trimmed.startsWith('•'))) {
          result.highlights.push(trimmed.replace(/^[-•]\s*/, ''));
        } else if (currentSection === 'description' || currentSection === 'usage' || currentSection === 'metaDescription') {
          result[currentSection] += (result[currentSection] ? ' ' : '') + trimmed;
        }
      }
    }

    // If extraction failed, use the whole content as description
    if (!result.description) {
      result.description = content;
    }

    return result;
  }
}
