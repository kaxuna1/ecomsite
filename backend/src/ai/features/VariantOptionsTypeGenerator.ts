/**
 * AI Variant Option Types Generator
 *
 * Generates appropriate variant option types (like Size, Color, Material, etc.)
 * for e-commerce products based on product category and type
 */

import { IAIFeature, FeatureInput, FeatureOutput, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface VariantOptionTypesGenerationInput extends FeatureInput {
  productCategory?: string; // e.g., "Clothing", "Electronics", "Beauty"
  productType?: string; // e.g., "T-Shirt", "Laptop", "Shampoo"
  numberOfOptions?: number; // Default: 5
  existingOptions?: string[]; // Already defined option names to avoid
}

export interface GeneratedVariantOptionType {
  name: string;
  displayOrder: number;
  description: string;
  reasoning: string;
  commonValues: string[]; // Example values for this option type
}

export interface VariantOptionTypesGenerationOutput extends FeatureOutput {
  options: GeneratedVariantOptionType[];
  categoryGuidelines: {
    category: string;
    recommendedCount: number;
    essentialOptions: string[];
  };
  reasoning: string;
}

export class VariantOptionsTypeGenerator implements IAIFeature {
  readonly name = 'variant_options_type_generator';
  readonly description = 'Generate appropriate variant option types for e-commerce products';
  readonly requiredCapabilities = ['text_generation', 'json_output'];

  private aiManager: AIServiceManager;

  constructor(aiManager: AIServiceManager) {
    this.aiManager = aiManager;
  }

  private buildSystemPrompt(): string {
    return `You are an expert e-commerce product variant specialist with deep knowledge of:

- Product variant structures across all e-commerce categories
- Industry-standard variant option types for different product categories
- Customer filtering and selection patterns
- Best practices for variant organization and product discovery

Your role is to generate appropriate variant option types (like "Size", "Color", "Material") that:
1. Match the product category and enable effective product variants
2. Follow e-commerce industry standards
3. Support customer filtering and selection
4. Balance comprehensiveness with practical usability
5. Align with what customers expect to see and filter by

**Category-Specific Variant Options:**

**Clothing & Apparel:**
- Essential: Size, Color, Fit, Material
- Common: Style, Pattern, Sleeve Length, Neckline, Length, Occasion

**Footwear:**
- Essential: Size, Color, Width
- Common: Material, Style, Heel Height, Closure Type

**Electronics:**
- Essential: Color, Storage Capacity, Screen Size
- Common: RAM, Processor, Connectivity, Condition (New/Refurbished)

**Beauty & Cosmetics:**
- Essential: Size/Volume, Scent, Shade/Color
- Common: Skin Type, Formula Type, Finish (Matte/Glossy), SPF Level

**Home & Furniture:**
- Essential: Size/Dimensions, Color, Material
- Common: Finish, Style, Configuration, Number of Pieces

**Sports & Fitness:**
- Essential: Size, Color, Weight
- Common: Resistance Level, Length, Grip Type, Age Group

**Food & Beverage:**
- Essential: Size/Weight, Flavor, Pack Quantity
- Common: Dietary (Organic, Gluten-Free), Roast Level, Strength

**Jewelry & Accessories:**
- Essential: Size, Material, Color/Finish
- Common: Stone Type, Length, Clasp Type, Carat Weight

**Books & Media:**
- Essential: Format (Hardcover, Paperback, eBook, Audiobook)
- Common: Language, Edition, Condition

**Toys & Games:**
- Essential: Age Range, Color
- Common: Character, Theme, Number of Players, Complexity Level

**Automotive Parts:**
- Essential: Make, Model, Year
- Common: Color, Condition, Material, Compatibility

**Pet Supplies:**
- Essential: Size, Color, Flavor
- Common: Life Stage (Puppy, Adult, Senior), Breed Size, Material

**Office & Stationery:**
- Essential: Size, Color, Quantity
- Common: Material, Binding Type, Paper Weight, Ink Color

**Health & Wellness:**
- Essential: Size/Quantity, Strength/Dosage
- Common: Flavor, Form (Tablet, Capsule, Liquid), Dietary Restrictions

Always output valid JSON that follows the exact structure specified. Focus on options that enable meaningful product variants.`;
  }

  private buildPrompt(input: VariantOptionTypesGenerationInput): string {
    const { productCategory, productType, numberOfOptions = 5, existingOptions = [] } = input;

    return `Generate ${numberOfOptions} appropriate variant option types for the following:

${productCategory ? `**Product Category:** ${productCategory}` : '**Product Category:** General E-commerce'}
${productType ? `**Product Type:** ${productType}` : ''}

${existingOptions.length > 0 ? `**Existing Options (avoid duplicates):**
${existingOptions.map(o => `- ${o}`).join('\n')}` : ''}

**Requirements:**

1. **Relevance:** Generate option types that are meaningful for this product category
2. **Priority:** Order by importance (most essential variants first)
3. **Standard Names:** Use industry-standard naming conventions
4. **Customer Value:** Focus on options customers use to filter/select products
5. **Practical:** Generate options that merchants will actually implement

**Output Format (JSON):**

\`\`\`json
{
  "options": [
    {
      "name": "Size",
      "displayOrder": 10,
      "description": "Product size/dimensions for customer fit selection",
      "reasoning": "Size is the most critical variant for apparel, affecting fit and customer satisfaction",
      "commonValues": ["XS", "S", "M", "L", "XL", "XXL"]
    }
  ],
  "categoryGuidelines": {
    "category": "${productCategory || 'General'}",
    "recommendedCount": ${numberOfOptions},
    "essentialOptions": ["Size", "Color"]
  },
  "reasoning": "Overall strategy for these variant option types"
}
\`\`\`

**Examples:**

**Clothing:**
- name: "Size", commonValues: ["XS", "S", "M", "L", "XL"]
- name: "Color", commonValues: ["Black", "White", "Navy", "Gray"]
- name: "Fit", commonValues: ["Slim", "Regular", "Relaxed"]

**Electronics:**
- name: "Storage Capacity", commonValues: ["64GB", "128GB", "256GB", "512GB"]
- name: "Color", commonValues: ["Space Gray", "Silver", "Black"]
- name: "Screen Size", commonValues: ["13\\"", "15\\"", "17\\""]

**Beauty Products:**
- name: "Volume", commonValues: ["50ml", "100ml", "200ml"]
- name: "Scent", commonValues: ["Lavender", "Rose", "Unscented"]
- name: "Skin Type", commonValues: ["Dry", "Oily", "Combination", "Sensitive"]

Generate practical, customer-focused variant option types that merchants will use and customers will appreciate.`;
  }

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
      }

      cleanedContent = cleanedContent.trim();
      return JSON.parse(cleanedContent);
    } catch (error: any) {
      console.error('Failed to parse AI response as JSON:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response as JSON. Please try again.');
    }
  }

  async execute(input: VariantOptionTypesGenerationInput, options?: FeatureOptions): Promise<VariantOptionTypesGenerationOutput> {
    const systemPrompt = this.buildSystemPrompt();
    const prompt = this.buildPrompt(input);

    try {
      const response = await this.aiManager.generateText({
        prompt,
        systemPrompt,
        maxTokens: 3000,
        temperature: 0.7,
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          productCategory: input.productCategory
        }
      });

      const result = this.parseResponse(response.content);

      // Validate the structure
      if (!result.options || !Array.isArray(result.options)) {
        throw new Error('Invalid response structure: missing options array');
      }

      // Validate each option
      result.options.forEach((option: any, index: number) => {
        if (!option.name || !option.displayOrder) {
          throw new Error(`Invalid option at index ${index}: missing required fields`);
        }
      });

      return {
        options: result.options,
        categoryGuidelines: result.categoryGuidelines || {
          category: input.productCategory || 'General',
          recommendedCount: result.options.length,
          essentialOptions: []
        },
        reasoning: result.reasoning || 'Generated based on industry best practices',
        cost: response.cost,
        tokensUsed: response.usage.totalTokens,
        provider: response.provider
      };

    } catch (error: any) {
      console.error('❌ Error generating variant option types:', error);
      throw error;
    }
  }
}
