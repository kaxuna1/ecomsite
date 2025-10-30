/**
 * SEO Meta Description & Title Generator
 *
 * Generates SEO-optimized meta titles, descriptions, and keywords for products.
 * Follows Google best practices:
 * - Meta titles: 50-60 characters
 * - Meta descriptions: 150-160 characters
 * - Keyword-rich but natural language
 * - Compelling and click-worthy
 */

import { IAIFeature, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface SEOGeneratorInput {
  productName: string;
  shortDescription?: string;
  description?: string;
  categories?: string[];
  existingKeywords?: string[];
  targetKeyword?: string;
  language?: string;
}

export interface SEOGeneratorOutput {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  openGraphTitle?: string;
  openGraphDescription?: string;
  estimatedCTR?: string; // Click-through rate potential
}

export class SEOGenerator implements IAIFeature {
  readonly name = 'seo_meta_generator';
  readonly description = 'Generate SEO-optimized meta titles, descriptions, and keywords for products';
  readonly requiredCapabilities = ['text_generation', 'json_output'];

  constructor(private aiManager: AIServiceManager) {}

  /**
   * Execute SEO meta generation
   */
  async execute(
    input: SEOGeneratorInput,
    options?: FeatureOptions
  ): Promise<SEOGeneratorOutput> {
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.getSystemPrompt(input.language || 'en');

    const response = await this.aiManager.generateText(
      {
        prompt,
        systemPrompt,
        maxTokens: 800,
        temperature: 0.7,
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          productName: input.productName,
          language: input.language || 'en',
        },
      },
      options
    );

    // Parse JSON response
    const result = this.parseResponse(response.content);

    return {
      metaTitle: result.metaTitle,
      metaDescription: result.metaDescription,
      focusKeyword: result.focusKeyword,
      secondaryKeywords: result.secondaryKeywords || [],
      openGraphTitle: result.openGraphTitle,
      openGraphDescription: result.openGraphDescription,
      estimatedCTR: result.estimatedCTR,
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: SEOGeneratorInput): Promise<number> {
    // Estimate ~600 tokens total (400 prompt + 200 completion)
    const estimatedTokens = 600;
    const costPerToken = 0.00001; // GPT-4 Turbo average
    return estimatedTokens * costPerToken;
  }

  /**
   * Build the prompt for SEO generation
   */
  private buildPrompt(input: SEOGeneratorInput): string {
    let prompt = `Generate SEO meta tags for the following product:\n\n`;
    prompt += `Product Name: ${input.productName}\n`;

    if (input.shortDescription) {
      prompt += `Short Description: ${input.shortDescription}\n`;
    }

    if (input.description) {
      // Truncate long descriptions
      const desc = input.description.length > 500
        ? input.description.substring(0, 500) + '...'
        : input.description;
      prompt += `Full Description: ${desc}\n`;
    }

    if (input.categories && input.categories.length > 0) {
      prompt += `Categories: ${input.categories.join(', ')}\n`;
    }

    if (input.targetKeyword) {
      prompt += `Target Keyword: ${input.targetKeyword}\n`;
    }

    if (input.existingKeywords && input.existingKeywords.length > 0) {
      prompt += `Existing Keywords: ${input.existingKeywords.join(', ')}\n`;
    }

    prompt += `\nGenerate SEO-optimized meta tags following these requirements:
1. Meta title: 50-60 characters, include product name and key benefit
2. Meta description: 150-160 characters, compelling and click-worthy
3. Focus keyword: Primary keyword for SEO optimization
4. Secondary keywords: 3-5 related keywords
5. Open Graph title and description for social sharing
6. Estimate CTR potential (High/Medium/Low) with brief explanation

IMPORTANT:
- Use natural, compelling language (not keyword-stuffed)
- Include numbers or power words where appropriate
- Create urgency or highlight unique selling points
- Maintain luxury brand voice for hair care products
- Ensure character limits are strictly followed
`;

    return prompt;
  }

  /**
   * Get system prompt for SEO generation
   */
  private getSystemPrompt(language: string): string {
    const basePrompt = `You are an expert SEO copywriter specializing in luxury beauty and hair care e-commerce.

Your expertise includes:
- Google search ranking factors and best practices
- Click-through rate optimization
- Keyword research and targeting
- User intent analysis
- Compelling copywriting that converts
- E-commerce SEO specifically for beauty products

You understand that effective SEO meta tags must:
1. Follow Google's character limit guidelines strictly
2. Include target keywords naturally (not keyword-stuffed)
3. Match user search intent
4. Create compelling reasons to click
5. Differentiate from competitors
6. Maintain brand voice and positioning

For luxury hair care products, you emphasize:
- Premium quality and ingredients
- Visible results and transformations
- Professional-grade formulations
- Specific benefits (volume, repair, growth, etc.)
- Exclusivity and sophistication

You MUST respond with valid JSON in this exact structure:
{
  "metaTitle": "string (50-60 characters)",
  "metaDescription": "string (150-160 characters)",
  "focusKeyword": "string",
  "secondaryKeywords": ["string", "string", "string"],
  "openGraphTitle": "string (max 70 characters)",
  "openGraphDescription": "string (max 200 characters)",
  "estimatedCTR": "High|Medium|Low - brief explanation"
}`;

    // Add language-specific guidance
    if (language === 'ka') {
      return basePrompt + `\n\nIMPORTANT: Generate all content in Georgian (ქართული) while maintaining luxury brand voice.`;
    }

    return basePrompt;
  }

  /**
   * Parse AI response with fallback extraction
   */
  private parseResponse(content: string): any {
    try {
      // Strip markdown code blocks if present
      let cleanedContent = content.trim();

      // Remove ```json and ``` wrappers
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

      // Try to parse JSON (with fallback for control characters)
      let parsed: any;
      try {
        parsed = JSON.parse(cleanedContent);
      } catch (firstError) {
        // If parsing fails, try escaping control characters in strings
        try {
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
          parsed = JSON.parse(escapedContent);
        } catch (secondError) {
          throw firstError;
        }
      }

      // Validate required fields
      if (!parsed.metaTitle || !parsed.metaDescription || !parsed.focusKeyword) {
        throw new Error('Missing required fields in AI response');
      }

      // Validate character limits
      if (parsed.metaTitle.length > 65) {
        console.warn(`Meta title too long (${parsed.metaTitle.length} chars), truncating`);
        parsed.metaTitle = parsed.metaTitle.substring(0, 60);
      }

      if (parsed.metaDescription.length > 165) {
        console.warn(`Meta description too long (${parsed.metaDescription.length} chars), truncating`);
        parsed.metaDescription = parsed.metaDescription.substring(0, 160);
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse SEO generation response:', error);
      console.error('Raw response:', content);

      // Fallback: Try to extract from text
      return this.extractFromText(content);
    }
  }

  /**
   * Fallback extraction if JSON parsing fails
   */
  private extractFromText(content: string): any {
    const result: any = {
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
      secondaryKeywords: [],
      estimatedCTR: 'Medium - Unable to determine',
    };

    // Try to extract meta title
    const titleMatch = content.match(/(?:meta[\s-]?title|title):\s*["']?([^"'\n]+)["']?/i);
    if (titleMatch) {
      result.metaTitle = titleMatch[1].trim().substring(0, 60);
    }

    // Try to extract meta description
    const descMatch = content.match(/(?:meta[\s-]?description|description):\s*["']?([^"'\n]+)["']?/i);
    if (descMatch) {
      result.metaDescription = descMatch[1].trim().substring(0, 160);
    }

    // Try to extract focus keyword
    const keywordMatch = content.match(/(?:focus[\s-]?keyword|keyword):\s*["']?([^"'\n]+)["']?/i);
    if (keywordMatch) {
      result.focusKeyword = keywordMatch[1].trim();
    }

    return result;
  }
}
