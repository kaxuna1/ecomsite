/**
 * AI Product Attribute Generator
 *
 * Generates industry-standard product attributes for e-commerce catalogs
 * based on product category, type, and industry best practices.
 */

import { IAIFeature, FeatureInput, FeatureOutput, FeatureOptions } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface AttributeGenerationInput extends FeatureInput {
  productCategory: string; // e.g., "Hair Care", "Skin Care", "Makeup"
  productType?: string; // e.g., "Serum", "Shampoo", "Moisturizer"
  brandFocus?: string; // e.g., "Natural", "Luxury", "Professional"
  numberOfAttributes?: number; // Default: 8-12
  existingAttributes?: string[]; // Already defined attributes to avoid
}

export interface GeneratedAttribute {
  attributeKey: string;
  attributeLabel: string;
  dataType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';
  isSearchable: boolean;
  isFilterable: boolean;
  isRequired: boolean;
  options?: Array<{ value: string; label: string }>;
  description: string;
  reasoning: string;
}

export interface AttributeGenerationOutput extends FeatureOutput {
  attributes: GeneratedAttribute[];
  industryStandards: {
    category: string;
    recommendedCount: number;
    essentialAttributes: string[];
  };
  reasoning: string;
}

export class AttributeGenerator implements IAIFeature {
  readonly name = 'attribute_generator';
  readonly description = 'Generate industry-standard product attributes for e-commerce product categorization';
  readonly requiredCapabilities = ['text_generation', 'json_output'];

  private aiManager: AIServiceManager;

  constructor(aiManager: AIServiceManager) {
    this.aiManager = aiManager;
  }

  private buildSystemPrompt(): string {
    return `You are an expert e-commerce product information management (PIM) specialist with deep knowledge of:

- Industry-standard product attributes across ALL e-commerce categories
- Attribute taxonomy and data modeling best practices
- SEO and search optimization through proper attribute structuring
- Customer filtering and discovery patterns
- Product data quality standards

Your role is to generate comprehensive, industry-standard product attributes that:
1. Enable effective product filtering and search
2. Follow industry taxonomy standards (like GS1, schema.org, Google Product Taxonomy)
3. Support SEO and AI shopping assistant optimization
4. Provide meaningful customer value in product discovery
5. Balance comprehensiveness with practical usability

**Category-Specific Knowledge:**

**Beauty & Cosmetics:**
- Skin/hair type compatibility, key ingredients, application methods
- Certifications (organic, vegan, cruelty-free, paraben-free)
- Texture, scent, volume/size options
- Special features (SPF, waterproof, long-lasting)

**Fashion & Apparel:**
- Size (XS-5XL, numeric), fit type (slim, regular, relaxed)
- Material/fabric, care instructions, season
- Style, occasion, neckline, sleeve length
- Color, pattern, brand, collection

**Electronics & Technology:**
- Brand, model, processor, RAM, storage
- Screen size, resolution, battery life
- Connectivity (WiFi, Bluetooth, ports)
- Operating system, warranty, condition (new/refurbished)

**Home & Furniture:**
- Dimensions (length, width, height), weight capacity
- Material, color, finish, style (modern, traditional)
- Assembly required, room type, care instructions
- Brand, collection, warranty

**Sports & Outdoors:**
- Activity type, skill level, age group
- Size, weight, material, color
- Weather resistance, season, brand
- Safety certifications, warranty

**Food & Beverage:**
- Dietary attributes (vegan, gluten-free, organic, kosher, halal)
- Allergens, ingredients, nutrition info
- Size/weight, pack quantity, expiry/shelf life
- Origin country, brand, certifications

**Toys & Games:**
- Age range, educational value, skill development
- Material, safety certifications, brand
- Number of players, playtime, complexity
- Battery required, assembly required

**Books & Media:**
- Author, publisher, publication date, language
- Genre, format (hardcover, paperback, ebook)
- Page count, dimensions, ISBN
- Target audience, awards

**Automotive:**
- Make, model, year, mileage
- Fuel type, transmission, drive type
- Engine size, horsepower, features
- Condition, color, VIN, warranty

**Jewelry & Accessories:**
- Metal type (gold, silver, platinum), purity (14K, 18K)
- Gemstone type, carat weight, clarity
- Size, length, adjustability, style
- Brand, certification, care instructions

Always output valid JSON that follows the exact structure specified. Adapt attributes to the specific category requested.`;
  }

  private buildPrompt(input: AttributeGenerationInput): string {
    const { productCategory, productType, brandFocus, numberOfAttributes = 10, existingAttributes = [] } = input;

    return `Generate ${numberOfAttributes} high-quality product attributes for the following e-commerce catalog:

**Category:** ${productCategory}
${productType ? `**Product Type:** ${productType}` : ''}
${brandFocus ? `**Brand Focus:** ${brandFocus}` : ''}

${existingAttributes.length > 0 ? `**Existing Attributes (avoid duplicates):**
${existingAttributes.map(attr => `- ${attr}`).join('\n')}` : ''}

**Requirements:**

1. **Industry Standards:** Use established taxonomy and naming conventions for this category
2. **Data Types:** Select appropriate data types (text, number, select, multiselect, boolean, date)
3. **Options:** For select/multiselect types, provide comprehensive, industry-standard options (6-12 options per attribute)
4. **Searchable:** Mark attributes that customers commonly search for
5. **Filterable:** Mark attributes useful for product filtering
6. **Priority:** Focus on attributes that provide maximum value for product discovery and customer decision-making

**Output Format (JSON):**

\`\`\`json
{
  "attributes": [
    {
      "attributeKey": "snake_case_key",
      "attributeLabel": "Display Name",
      "dataType": "select|multiselect|text|number|boolean|date",
      "isSearchable": true|false,
      "isFilterable": true|false,
      "isRequired": false,
      "options": [
        { "value": "value1", "label": "Display Label 1" },
        { "value": "value2", "label": "Display Label 2" }
      ],
      "description": "Brief description of what this attribute represents",
      "reasoning": "Why this attribute is important for this category"
    }
  ],
  "industryStandards": {
    "category": "${productCategory}",
    "recommendedCount": 10,
    "essentialAttributes": ["skin_type", "key_ingredient", "volume"]
  },
  "reasoning": "Overall strategy and approach for these attributes"
}
\`\`\`

**Examples of Strong Attributes by Category:**

**Beauty/Skincare:**
- skin_type (multiselect), key_ingredient (multiselect), concern (multiselect), volume (select), certifications (multiselect)

**Fashion/Apparel:**
- size (select), fit_type (select), material (multiselect), color (select), season (multiselect), style (select)

**Electronics:**
- brand (select), processor (select), ram (select), storage (select), screen_size (select), connectivity (multiselect)

**Home/Furniture:**
- dimensions (text), material (multiselect), color (select), style (select), room_type (multiselect), assembly_required (boolean)

**Sports/Outdoors:**
- activity_type (multiselect), skill_level (select), size (select), material (multiselect), weather_resistance (select)

Generate comprehensive, practical attributes that merchants will actually use and customers will find valuable for filtering and search.`;
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

  async execute(input: AttributeGenerationInput, options?: FeatureOptions): Promise<AttributeGenerationOutput> {
    const systemPrompt = this.buildSystemPrompt();
    const prompt = this.buildPrompt(input);

    try {
      const response = await this.aiManager.generateText({
        prompt,
        systemPrompt,
        maxTokens: 6000,
        temperature: 0.7, // Balance creativity with consistency
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          category: input.productCategory,
          productType: input.productType
        }
      });

      const result = this.parseResponse(response.content);

      // Validate the structure
      if (!result.attributes || !Array.isArray(result.attributes)) {
        throw new Error('Invalid response structure: missing attributes array');
      }

      // Validate each attribute
      result.attributes.forEach((attr: any, index: number) => {
        if (!attr.attributeKey || !attr.attributeLabel || !attr.dataType) {
          throw new Error(`Invalid attribute at index ${index}: missing required fields`);
        }

        // Validate data types
        const validDataTypes = ['text', 'number', 'boolean', 'select', 'multiselect', 'date'];
        if (!validDataTypes.includes(attr.dataType)) {
          throw new Error(`Invalid data type "${attr.dataType}" for attribute "${attr.attributeKey}"`);
        }

        // Validate options for select/multiselect
        if (['select', 'multiselect'].includes(attr.dataType)) {
          if (!attr.options || !Array.isArray(attr.options) || attr.options.length === 0) {
            throw new Error(`Missing options for select/multiselect attribute "${attr.attributeKey}"`);
          }
        }
      });

      return {
        attributes: result.attributes,
        industryStandards: result.industryStandards || {
          category: input.productCategory,
          recommendedCount: result.attributes.length,
          essentialAttributes: []
        },
        reasoning: result.reasoning || 'Generated based on industry best practices',
        cost: response.cost,
        tokensUsed: response.usage.totalTokens,
        provider: response.provider
      };

    } catch (error: any) {
      console.error('❌ Error generating attributes:', error);
      throw error;
    }
  }
}
