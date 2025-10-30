/**
 * Image Alt Text Generator
 *
 * Generates SEO-optimized and accessibility-compliant alt text for product images.
 * Follows WCAG 2.1 Level AA guidelines and SEO best practices.
 *
 * Phase 1: Text-based generation using product data
 * Phase 2 (Future): Vision-based analysis using GPT-4 Vision
 */

import { IAIFeature, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface ImageAltTextInput {
  imageUrl: string;
  filename?: string;
  productName?: string;
  productCategory?: string;
  productDescription?: string;
  existingAltText?: string;
  useVision?: boolean; // Future: analyze actual image with GPT-4 Vision
  language?: string;
}

export interface ImageAltTextOutput {
  altText: string;
  title: string;
  caption?: string;
  imageDescription?: string; // Longer description for image page
  seoKeywords?: string[];
}

export class ImageAltTextGenerator implements IAIFeature {
  readonly name = 'image_alt_text_generator';
  readonly description = 'Generate accessibility-compliant and SEO-optimized alt text for product images';
  readonly requiredCapabilities = ['text_generation', 'json_output'];

  constructor(private aiManager: AIServiceManager) {}

  /**
   * Execute alt text generation
   */
  async execute(
    input: ImageAltTextInput,
    options?: FeatureOptions
  ): Promise<ImageAltTextOutput> {
    if (input.useVision) {
      // Future: Use GPT-4 Vision API
      throw new Error('Vision-based alt text generation not yet implemented. Use text-based generation.');
    }

    const prompt = this.buildPrompt(input);
    const systemPrompt = this.getSystemPrompt(input.language || 'en');

    const response = await this.aiManager.generateText(
      {
        prompt,
        systemPrompt,
        maxTokens: 500,
        temperature: 0.6,
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          imageUrl: input.imageUrl,
          productName: input.productName || 'unknown',
          language: input.language || 'en',
        },
      },
      options
    );

    // Parse JSON response
    const result = this.parseResponse(response.content);

    return {
      altText: result.altText,
      title: result.title,
      caption: result.caption,
      imageDescription: result.imageDescription,
      seoKeywords: result.seoKeywords || [],
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: ImageAltTextInput): Promise<number> {
    if (input.useVision) {
      // GPT-4 Vision pricing (future)
      return 0.05;
    }

    // Text-based: ~400 tokens total (250 prompt + 150 completion)
    const estimatedTokens = 400;
    const costPerToken = 0.00001; // GPT-4 Turbo average
    return estimatedTokens * costPerToken;
  }

  /**
   * Build the prompt for alt text generation
   */
  private buildPrompt(input: ImageAltTextInput): string {
    let prompt = `Generate accessibility-compliant and SEO-optimized alt text for a product image.\n\n`;

    if (input.productName) {
      prompt += `Product Name: ${input.productName}\n`;
    }

    if (input.productCategory) {
      prompt += `Category: ${input.productCategory}\n`;
    }

    if (input.productDescription) {
      const desc = input.productDescription.length > 300
        ? input.productDescription.substring(0, 300) + '...'
        : input.productDescription;
      prompt += `Product Description: ${desc}\n`;
    }

    if (input.filename) {
      prompt += `Image Filename: ${input.filename}\n`;
    }

    if (input.existingAltText) {
      prompt += `Existing Alt Text (may need improvement): ${input.existingAltText}\n`;
    }

    prompt += `\nGenerate the following:

1. **Alt Text** (100-125 characters optimal):
   - Describe what's IN the image (not "image of" or "picture of")
   - Include product name and key visual elements
   - Include relevant keywords naturally
   - Focus on what matters for accessibility
   - Example: "Luxury Scalp Serum bottle with gold cap on marble surface"

2. **Title Attribute** (optional, max 70 characters):
   - Additional context shown on hover
   - Can be slightly more descriptive than alt text

3. **Caption** (optional, 150-200 characters):
   - Longer description for image galleries
   - Include product benefits or features
   - More marketing-focused

4. **Image Description** (250-300 characters):
   - Detailed description for image pages or vision-impaired users
   - Include colors, textures, packaging details
   - Product presentation and styling

5. **SEO Keywords**:
   - 3-5 keywords that describe the image
   - Include product type, brand, features

GUIDELINES:
- Alt text should be concise but descriptive
- Avoid redundant phrases like "image of" or "photo showing"
- Include specific details: colors, packaging, size if visible
- Use natural language, not keyword stuffing
- For luxury products, mention premium details (gold accents, elegant packaging, etc.)
- Maintain brand voice: sophisticated, professional
`;

    return prompt;
  }

  /**
   * Get system prompt for alt text generation
   */
  private getSystemPrompt(language: string): string {
    const basePrompt = `You are an accessibility and SEO expert specializing in luxury beauty e-commerce.

Your expertise includes:
- WCAG 2.1 Level AA accessibility guidelines
- Image SEO best practices
- Writing for screen readers
- E-commerce product image optimization
- Luxury brand voice and positioning

You understand that effective alt text must:
1. Describe the image accurately for vision-impaired users
2. Be concise (100-125 characters is optimal for screen readers)
3. Include relevant keywords naturally (not keyword-stuffed)
4. Avoid redundant phrases ("image of", "picture of", "photo showing")
5. Describe visual elements that matter (product, packaging, presentation)
6. Maintain brand voice and quality standards

For luxury hair care product images, you emphasize:
- Packaging details (bottle shape, cap design, materials)
- Premium visual elements (gold accents, elegant fonts, marble backgrounds)
- Product texture and appearance (serum consistency, cream color)
- Presentation style (minimalist, sophisticated, professional)
- Brand positioning cues (luxury, premium, professional-grade)

You MUST respond with valid JSON in this exact structure:
{
  "altText": "string (100-125 characters)",
  "title": "string (max 70 characters)",
  "caption": "string (150-200 characters, optional)",
  "imageDescription": "string (250-300 characters)",
  "seoKeywords": ["string", "string", "string"]
}`;

    // Add language-specific guidance
    if (language === 'ka') {
      return basePrompt + `\n\nIMPORTANT: Generate all content in Georgian (ქართული) while maintaining accessibility and SEO standards.`;
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
      let parsed: any;
      try {
        parsed = JSON.parse(cleanedContent);
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
        parsed = JSON.parse(escapedContent);
      }

      // Validate required fields
      if (!parsed.altText) {
        throw new Error('Missing required field: altText');
      }

      // Enforce character limits
      if (parsed.altText.length > 125) {
        console.warn(`Alt text too long (${parsed.altText.length} chars), truncating to 125`);
        parsed.altText = parsed.altText.substring(0, 125);
      }

      if (parsed.title && parsed.title.length > 70) {
        parsed.title = parsed.title.substring(0, 70);
      }

      if (parsed.caption && parsed.caption.length > 200) {
        parsed.caption = parsed.caption.substring(0, 200);
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse alt text generation response:', error);
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
      altText: '',
      title: '',
      seoKeywords: [],
    };

    // Try to extract alt text
    const altMatch = content.match(/(?:alt[\s-]?text|altText):\s*["']?([^"'\n]+)["']?/i);
    if (altMatch) {
      result.altText = altMatch[1].trim().substring(0, 125);
    }

    // Try to extract title
    const titleMatch = content.match(/(?:title|title attribute):\s*["']?([^"'\n]+)["']?/i);
    if (titleMatch) {
      result.title = titleMatch[1].trim().substring(0, 70);
    }

    return result;
  }

  /**
   * Future: Generate alt text using GPT-4 Vision
   * This will analyze the actual image content
   */
  private async generateWithVision(input: ImageAltTextInput, options?: FeatureOptions): Promise<ImageAltTextOutput> {
    // TODO: Implement GPT-4 Vision integration
    // This requires:
    // 1. OpenAI client with vision model support
    // 2. Image URL must be publicly accessible or base64 encoded
    // 3. Different pricing model ($0.03-$0.05 per image)

    throw new Error('Vision-based alt text generation not yet implemented');

    /* Example implementation:
    const response = await this.aiManager.generateWithVision({
      imageUrl: input.imageUrl,
      prompt: "Describe this product image for alt text generation",
      maxTokens: 300,
    });
    */
  }
}
