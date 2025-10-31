/**
 * AI Variant Option Values Generator
 *
 * Generates comprehensive variant option values for e-commerce products
 * based on the option type (Size, Color, Material, etc.) and product category
 */

import { IAIFeature, FeatureInput, FeatureOutput, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface VariantOptionsGenerationInput extends FeatureInput {
  optionName: string; // e.g., "Size", "Color", "Material", "Scent"
  productCategory?: string; // e.g., "Hair Care", "Clothing", "Electronics"
  productType?: string; // e.g., "Shampoo", "T-Shirt", "Laptop"
  numberOfValues?: number; // Default: 8
  existingValues?: string[]; // Already defined values to avoid
}

export interface GeneratedVariantValue {
  value: string;
  displayName: string;
  sortOrder: number;
  description?: string;
  reasoning: string;
}

export interface VariantOptionsGenerationOutput extends FeatureOutput {
  values: GeneratedVariantValue[];
  optionGuidelines: {
    optionName: string;
    recommendedCount: number;
    bestPractices: string[];
  };
  reasoning: string;
}

export class VariantOptionsGenerator implements IAIFeature {
  readonly name = 'variant_options_generator';
  readonly description = 'Generate comprehensive variant option values for e-commerce products';
  readonly requiredCapabilities = ['text_generation', 'json_output'];

  private aiManager: AIServiceManager;

  constructor(aiManager: AIServiceManager) {
    this.aiManager = aiManager;
  }

  private buildSystemPrompt(): string {
    return `You are an expert e-commerce product variant specialist with deep knowledge of:

- Product variant options and values across all e-commerce categories
- Industry-standard variant naming conventions and best practices
- Customer search and filtering patterns for product variants
- Variant standardization for consistent product catalogs
- Regional and international variant naming standards

Your role is to generate comprehensive, industry-standard variant option values that:
1. Follow established naming conventions for the option type
2. Cover the full spectrum of common values customers expect
3. Use clear, searchable naming that customers understand
4. Support proper sorting and filtering
5. Match industry standards for the product category

**Option Type Guidelines:**

**Size (Apparel & Footwear):**
- Standard sizes: XS, S, M, L, XL, XXL, XXXL, 4XL, 5XL
- Numeric sizes: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24
- Shoe sizes: US, UK, EU standards
- Plus sizes: 1X, 2X, 3X, 4X, 5X
- Petite/Tall variations
- Children's sizes: 2T, 3T, 4T, 5T, 6, 7, 8, 10, 12, 14, 16

**Size (Other Products):**
- Volume: 50ml, 100ml, 200ml, 250ml, 500ml, 1L
- Weight: 100g, 250g, 500g, 1kg
- Dimensions: Small, Medium, Large, Extra Large
- Travel/Sample/Full Size

**Color:**
- Standard colors: Black, White, Gray, Navy, Blue, Red, Green, Yellow, Orange, Purple, Pink, Brown, Beige, Cream, Tan, Khaki, Olive, Burgundy, Teal, Turquoise, Coral, Gold, Silver, Rose Gold
- Material-specific: Natural, Walnut, Oak, Cherry (for wood), Matte Black, Glossy White (for finishes)

**Material:**
- Textiles: Cotton, Polyester, Linen, Silk, Wool, Cashmere, Leather, Suede, Denim, Canvas, Nylon, Spandex
- Metals: Stainless Steel, Aluminum, Titanium, Gold, Silver, Copper, Brass
- Plastics: ABS, Polycarbonate, Acrylic, Silicone
- Natural: Wood, Bamboo, Stone, Marble, Granite, Glass

**Scent/Fragrance:**
- Floral: Lavender, Rose, Jasmine, Lily, Gardenia, Peony
- Fresh: Citrus, Mint, Ocean, Clean Cotton, Fresh Linen
- Woody: Sandalwood, Cedar, Pine, Eucalyptus
- Sweet: Vanilla, Honey, Coconut, Almond
- Fruity: Berry, Citrus, Apple, Peach, Mango
- Unscented/Fragrance-Free

**Finish (Surfaces):**
- Matte, Glossy, Satin, Brushed, Polished, Textured, Smooth

**Bundle/Pack:**
- Single, 2-Pack, 3-Pack, 4-Pack, 6-Pack, 12-Pack, 24-Pack
- Trial Set, Starter Kit, Full Set, Deluxe Set

**Flavor:**
- Classic, Mint, Berry, Citrus, Tropical, Vanilla, Chocolate, Strawberry, Grape, Watermelon, Unflavored

**Pattern:**
- Solid, Striped, Checkered, Floral, Geometric, Paisley, Polka Dot, Animal Print, Camo, Plaid

**Capacity (Storage/Electronics):**
- 8GB, 16GB, 32GB, 64GB, 128GB, 256GB, 512GB, 1TB, 2TB, 4TB

**Screen Size (Electronics):**
- 11", 13", 14", 15", 16", 17", 24", 27", 32", 43", 50", 55", 65", 75"

**Power/Strength:**
- Low, Medium, High, Extra Strong
- 10W, 20W, 30W, 50W, 100W

Always output valid JSON that follows the exact structure specified. Adapt values to the specific option type and category.`;
  }

  private buildPrompt(input: VariantOptionsGenerationInput): string {
    const { optionName, productCategory, productType, numberOfValues = 8, existingValues = [] } = input;

    return `Generate ${numberOfValues} simple variant option values for: ${optionName}
${productCategory ? `Category: ${productCategory}` : ''}
${productType ? `Product: ${productType}` : ''}

${existingValues.length > 0 ? `Existing values to avoid: ${existingValues.join(', ')}` : ''}

Requirements:
- Use industry-standard naming conventions
- Keep it simple and clear
- Proper sort ordering (10, 20, 30, etc.)

Output JSON format:

\`\`\`json
{
  "values": [
    {
      "value": "snake_case_value",
      "displayName": "Display Name",
      "sortOrder": 10
    }
  ]
}
\`\`\`

Examples:

Size: {"value": "small", "displayName": "S", "sortOrder": 10}
Color: {"value": "black", "displayName": "Black", "sortOrder": 10}
RAM: {"value": "8gb", "displayName": "8GB", "sortOrder": 10}

Generate ONLY the values array in simple JSON format. No extra fields, no descriptions, no guidelines.`;
  }

  private parseResponse(content: string): any {
    try {
      // Strip markdown code blocks if present
      let cleanedContent = content.trim();

      // Remove ```json and ``` wrappers
      if (cleanedContent.startsWith('```')) {
        // Find the first newline after ```
        const firstNewline = cleanedContent.indexOf('\n');
        if (firstNewline !== -1) {
          cleanedContent = cleanedContent.substring(firstNewline + 1);
        }
        // Remove trailing ```
        if (cleanedContent.endsWith('```')) {
          cleanedContent = cleanedContent.substring(0, cleanedContent.lastIndexOf('```'));
        }
      }

      cleanedContent = cleanedContent.trim();
      return JSON.parse(cleanedContent);
    } catch (error: any) {
      console.error('Failed to parse AI response as JSON:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response as JSON. Please try again.');
    }
  }

  async execute(input: VariantOptionsGenerationInput, options?: FeatureOptions): Promise<VariantOptionsGenerationOutput> {
    const systemPrompt = this.buildSystemPrompt();
    const prompt = this.buildPrompt(input);

    try {
      const response = await this.aiManager.generateText({
        prompt,
        systemPrompt,
        maxTokens: 4000,
        temperature: 0.7,
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          optionName: input.optionName,
          productCategory: input.productCategory
        }
      });

      const result = this.parseResponse(response.content);

      // Validate the structure
      if (!result.values || !Array.isArray(result.values)) {
        throw new Error('Invalid response structure: missing values array');
      }

      // Validate each value
      result.values.forEach((value: any, index: number) => {
        if (!value.value || !value.displayName || value.sortOrder === undefined) {
          throw new Error(`Invalid value at index ${index}: missing required fields (value, displayName, sortOrder)`);
        }
      });

      // Return simplified structure matching frontend expectations
      return {
        values: result.values.map((v: any) => ({
          value: v.value,
          displayName: v.displayName,
          sortOrder: v.sortOrder,
          description: '', // Empty to keep it simple
          reasoning: '' // Empty to keep it simple
        })),
        optionGuidelines: {
          optionName: input.optionName,
          recommendedCount: result.values.length,
          bestPractices: []
        },
        reasoning: 'Generated based on industry standards',
        cost: response.cost,
        tokensUsed: response.usage.totalTokens,
        provider: response.provider
      };

    } catch (error: any) {
      console.error('❌ Error generating variant option values:', error);
      throw error;
    }
  }
}
