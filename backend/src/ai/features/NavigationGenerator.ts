/**
 * Navigation Menu Generator
 *
 * AI-powered generation of navigation menus based on available pages and site structure.
 * Analyzes static routes, CMS pages, and product categories to create logical menu hierarchies.
 */

import { IAIFeature, FeatureOptions, GenerateTextParams } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface PageInfo {
  type: 'static' | 'cms' | 'category';
  label: string;
  url: string;
  cmsPageId?: number;
  description?: string;
  priority?: 'high' | 'medium' | 'low'; // Suggested importance
}

export interface NavigationGeneratorInput {
  locationCode: 'header' | 'footer' | 'mobile';
  availablePages: PageInfo[];
  maxTopLevelItems?: number;
  maxNestingDepth?: number;
  brandName?: string;
  brandDescription?: string;
  targetAudience?: string;
  style?: 'minimal' | 'comprehensive' | 'balanced';
  language?: string;
}

export interface GeneratedMenuItem {
  label: string;
  linkType: 'internal' | 'external' | 'cms_page' | 'none';
  linkUrl: string | null;
  cmsPageId: number | null;
  openInNewTab: boolean;
  displayOrder: number;
  children?: GeneratedMenuItem[];
  reasoning?: string; // Why this item was included
}

export interface NavigationGeneratorOutput {
  locationCode: string;
  menuItems: GeneratedMenuItem[];
  reasoning: string; // Overall reasoning for menu structure
  cost: number;
  tokensUsed: number;
  provider: string;
}

export class NavigationGenerator implements IAIFeature {
  public readonly name = 'navigation_menu_generator';
  public readonly description = 'Generate AI-powered navigation menus based on site structure';
  public readonly requiredCapabilities = ['text-generation'];

  private aiService: AIServiceManager;

  constructor(aiService: AIServiceManager) {
    this.aiService = aiService;
  }

  /**
   * Execute navigation menu generation
   */
  async execute(
    input: NavigationGeneratorInput,
    options?: FeatureOptions
  ): Promise<NavigationGeneratorOutput> {
    // Build context-rich prompt
    const prompt = this.buildPrompt(input);
    const systemPrompt = this.buildSystemPrompt(input);

    // Prepare generation parameters
    const params: GenerateTextParams = {
      prompt,
      systemPrompt,
      maxTokens: this.getMaxTokensByStyle(input.style || 'balanced'),
      temperature: 0.7, // Balanced creativity and consistency
      responseFormat: 'json',
      metadata: {
        feature: this.name,
        locationCode: input.locationCode,
        style: input.style,
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
      locationCode: input.locationCode,
      menuItems: parsedContent.menuItems || [],
      reasoning: parsedContent.reasoning || '',
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: NavigationGeneratorInput): Promise<number> {
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
      maxTokens: this.getMaxTokensByStyle(input.style || 'balanced'),
      temperature: 0.7
    });
  }

  /**
   * Build system prompt with instructions
   */
  private buildSystemPrompt(input: NavigationGeneratorInput): string {
    const location = input.locationCode;
    const style = input.style || 'balanced';

    let systemPrompt = `You are an expert UX designer and information architect specializing in website navigation design for e-commerce platforms.

Your task is to generate a well-structured navigation menu for the **${location}** location.

LOCATION GUIDELINES:
`;

    if (location === 'header') {
      systemPrompt += `- Header navigation: Primary site navigation, 5-7 top-level items max
- Focus on most important pages and clear user journeys
- Group related pages under logical parent items
- Maximum nesting: 2 levels (top-level → dropdown)
- Order by importance: Home, Shop, Key Pages, About/Contact
`;
    } else if (location === 'footer') {
      systemPrompt += `- Footer navigation: Comprehensive site map, can be more detailed
- Organize into logical sections/columns (e.g., "Shop", "Company", "Support", "Legal")
- Can include 8-12 top-level items
- Maximum nesting: 1 level (use sections as parents)
- Include utility pages: Privacy Policy, Terms, Contact, FAQ
`;
    } else if (location === 'mobile') {
      systemPrompt += `- Mobile navigation: Streamlined for touch/small screens
- Keep it simple: 5-6 top-level items max
- Flat structure preferred, minimal nesting
- Large touch targets, clear labels
- Essential pages only
`;
    }

    systemPrompt += `
STYLE: ${this.getStyleDescription(style)}

NAVIGATION PRINCIPLES:
1. Clarity: Labels should be clear, concise, and descriptive
2. Hierarchy: Group related pages logically
3. Scannability: Use familiar patterns and predictable ordering
4. Priority: Most important pages first
5. Consistency: Maintain naming conventions
6. SEO: Use keyword-rich labels when natural

IMPORTANT: You MUST respond with valid JSON in the following format:
{
  "menuItems": [
    {
      "label": "Menu Item Label",
      "linkType": "internal" | "cms_page" | "none",
      "linkUrl": "/path" or null,
      "cmsPageId": number or null,
      "openInNewTab": false,
      "displayOrder": 0,
      "children": [], // Optional nested items
      "reasoning": "Why this item is included"
    }
  ],
  "reasoning": "Overall explanation of menu structure and organization"
}

LINK TYPE RULES:
- Use "internal" for static routes (e.g., /products, /cart)
- Use "cms_page" for CMS pages (set cmsPageId and linkUrl to the slug)
- Use "none" for parent items that are just labels (no link, only children)
- Never use "external" unless specifically requested

GUIDELINES:
1. Create a logical hierarchy based on available pages
2. Group related pages under parent items when appropriate
3. Don't include every single page - be selective based on importance
4. Use clear, user-friendly labels (not technical slugs)
5. Order items by importance and logical flow
6. For ${location}, follow the specific guidelines above
7. Include reasoning for each major structural decision`;

    return systemPrompt;
  }

  /**
   * Build user prompt with context
   */
  private buildPrompt(input: NavigationGeneratorInput): string {
    let prompt = `Generate a navigation menu for the ${input.locationCode} location.\n\n`;

    if (input.brandName) {
      prompt += `BRAND: ${input.brandName}\n`;
    }

    if (input.brandDescription) {
      prompt += `DESCRIPTION: ${input.brandDescription}\n`;
    }

    if (input.targetAudience) {
      prompt += `TARGET AUDIENCE: ${input.targetAudience}\n`;
    }

    prompt += `\nAVAILABLE PAGES (${input.availablePages.length} total):\n\n`;

    // Group pages by type for better context
    const staticPages = input.availablePages.filter(p => p.type === 'static');
    const cmsPages = input.availablePages.filter(p => p.type === 'cms');
    const categories = input.availablePages.filter(p => p.type === 'category');

    if (staticPages.length > 0) {
      prompt += `STATIC ROUTES:\n`;
      staticPages.forEach(page => {
        prompt += `- ${page.label} (${page.url})`;
        if (page.priority) prompt += ` [Priority: ${page.priority}]`;
        if (page.description) prompt += ` - ${page.description}`;
        prompt += `\n`;
      });
      prompt += `\n`;
    }

    if (cmsPages.length > 0) {
      prompt += `CMS PAGES:\n`;
      cmsPages.forEach(page => {
        prompt += `- ${page.label} (${page.url})`;
        if (page.cmsPageId) prompt += ` [CMS Page ID: ${page.cmsPageId}]`;
        if (page.priority) prompt += ` [Priority: ${page.priority}]`;
        if (page.description) prompt += ` - ${page.description}`;
        prompt += `\n`;
      });
      prompt += `\n`;
    }

    if (categories.length > 0) {
      prompt += `PRODUCT CATEGORIES:\n`;
      categories.forEach(page => {
        prompt += `- ${page.label} (${page.url})`;
        if (page.priority) prompt += ` [Priority: ${page.priority}]`;
        prompt += `\n`;
      });
      prompt += `\n`;
    }

    if (input.maxTopLevelItems) {
      prompt += `CONSTRAINT: Maximum ${input.maxTopLevelItems} top-level items\n`;
    }

    if (input.maxNestingDepth) {
      prompt += `CONSTRAINT: Maximum nesting depth ${input.maxNestingDepth}\n`;
    }

    prompt += `\nGenerate the navigation menu in JSON format now:`;

    return prompt;
  }

  /**
   * Get style description
   */
  private getStyleDescription(style: string): string {
    const styleDescriptions: Record<string, string> = {
      minimal: 'Minimalist approach - only essential pages, flat structure, 5-6 items max',
      comprehensive: 'Comprehensive approach - include most available pages, use nesting, 8-12 items',
      balanced: 'Balanced approach - important pages with logical grouping, 6-8 items'
    };

    return styleDescriptions[style] || styleDescriptions.balanced;
  }

  /**
   * Get max tokens based on style
   */
  private getMaxTokensByStyle(style: string): number {
    const tokenLimits: Record<string, number> = {
      minimal: 2000,    // Increased from 800 to prevent truncation
      balanced: 3000,   // Increased from 1200
      comprehensive: 4000  // Increased from 1600
    };

    return tokenLimits[style] || tokenLimits.balanced;
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

        try {
          return JSON.parse(escapedContent);
        } catch (secondError) {
          // Try to repair truncated JSON by completing incomplete structures
          // Check if it looks like JSON (starts with { or [)
          if (escapedContent.trim().startsWith('{') || escapedContent.trim().startsWith('[')) {
            let repaired = escapedContent;

            // Count braces and brackets
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;

            // If truncated, try to close properly
            if (openBraces > closeBraces || openBrackets > closeBrackets) {
              // Check if last character suggests incomplete string or property
              const lastChar = repaired.trim().slice(-1);
              if (lastChar === ',' || lastChar === ':' || lastChar === '"' || /[a-zA-Z0-9]/.test(lastChar)) {
                // Might be mid-property or mid-string, try to complete it
                if (lastChar === '"') {
                  // Already has closing quote
                } else if (lastChar === ',') {
                  // Remove trailing comma
                  repaired = repaired.trim().slice(0, -1);
                } else if (lastChar === ':' || /[a-zA-Z0-9]/.test(lastChar)) {
                  // Add closing quote for unfinished value
                  repaired += '"';
                }
              }

              // Add missing closing brackets
              for (let i = 0; i < (openBrackets - closeBrackets); i++) {
                repaired += ']';
              }

              // Add missing closing braces
              for (let i = 0; i < (openBraces - closeBraces); i++) {
                repaired += '}';
              }
            }

            try {
              return JSON.parse(repaired);
            } catch (thirdError) {
              // Last resort: return empty structure
              console.error('JSON repair failed:', thirdError);
              throw thirdError;
            }
          }
          throw secondError;
        }
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      console.error('Raw content:', content.substring(0, 500));

      // Return empty structure
      return {
        menuItems: [],
        reasoning: 'Failed to parse AI response. The response may have been truncated. Please try again with a simpler style (minimal).'
      };
    }
  }
}
