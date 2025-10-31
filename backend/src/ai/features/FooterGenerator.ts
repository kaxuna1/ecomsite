/**
 * Footer Content Generator
 *
 * AI-powered generation of footer content including columns, contact info, social links,
 * newsletter sections, and legal links based on brand identity and business context.
 */

import { IAIFeature, FeatureOptions, GenerateTextParams } from '../types';
import { AIServiceManager } from '../AIServiceManager';

export interface FooterGeneratorInput {
  brandName: string;
  brandDescription?: string;
  industry?: string;
  targetAudience?: string;
  businessType?: 'ecommerce' | 'saas' | 'agency' | 'blog' | 'other';
  includeNewsletter?: boolean;
  includeSocial?: boolean;
  availablePages?: Array<{
    label: string;
    url: string;
    type: 'static' | 'cms' | 'legal';
  }>;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  existingFooter?: any; // Existing footer structure for refinement
  columnsCount?: number; // 2-5 columns
  style?: 'minimal' | 'comprehensive' | 'balanced';
  tone?: 'professional' | 'friendly' | 'luxury' | 'casual';
  language?: string;
}

export interface GeneratedFooterColumn {
  title: string;
  links: Array<{
    label: string;
    url: string;
    openInNewTab: boolean;
  }>;
  displayOrder: number;
}

export interface GeneratedContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  businessHours?: string;
}

export interface GeneratedSocialLink {
  platform: string;
  url: string;
  icon: string;
  displayOrder: number;
}

export interface GeneratedNewsletter {
  enabled: boolean;
  title: string;
  description: string;
  placeholder: string;
  buttonText: string;
}

export interface GeneratedBottomLink {
  label: string;
  url: string;
  displayOrder: number;
}

export interface FooterGeneratorOutput {
  brandName: string;
  brandTagline: string;
  footerColumns: GeneratedFooterColumn[];
  contactInfo: GeneratedContactInfo;
  socialLinks: GeneratedSocialLink[];
  newsletter: GeneratedNewsletter;
  copyrightText: string;
  bottomLinks: GeneratedBottomLink[];
  reasoning: string; // Explanation of structure decisions
  cost: number;
  tokensUsed: number;
  provider: string;
}

export class FooterGenerator implements IAIFeature {
  public readonly name = 'footer_content_generator';
  public readonly description = 'Generate AI-powered footer content based on brand and business context';
  public readonly requiredCapabilities = ['text-generation'];

  private aiService: AIServiceManager;

  constructor(aiService: AIServiceManager) {
    this.aiService = aiService;
  }

  /**
   * Execute footer content generation
   */
  async execute(
    input: FooterGeneratorInput,
    options?: FeatureOptions
  ): Promise<FooterGeneratorOutput> {
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
        brandName: input.brandName,
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
      brandName: parsedContent.brandName || input.brandName,
      brandTagline: parsedContent.brandTagline || '',
      footerColumns: parsedContent.footerColumns || [],
      contactInfo: parsedContent.contactInfo || {},
      socialLinks: parsedContent.socialLinks || [],
      newsletter: parsedContent.newsletter || {
        enabled: false,
        title: '',
        description: '',
        placeholder: '',
        buttonText: ''
      },
      copyrightText: parsedContent.copyrightText || '',
      bottomLinks: parsedContent.bottomLinks || [],
      reasoning: parsedContent.reasoning || '',
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(input: FooterGeneratorInput): Promise<number> {
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
  private buildSystemPrompt(input: FooterGeneratorInput): string {
    const style = input.style || 'balanced';
    const tone = input.tone || 'professional';
    const columnsCount = input.columnsCount || 4;

    let systemPrompt = `You are an expert UX designer and brand strategist specializing in website footer design for ${input.businessType || 'ecommerce'} businesses.

Your task is to generate comprehensive, well-structured footer content that enhances user experience and supports business goals.

FOOTER STRUCTURE GUIDELINES:
- Columns: Design for ${columnsCount} columns
- Style: ${this.getStyleDescription(style)}
- Tone: ${this.getToneDescription(tone)}

FOOTER SECTIONS TO INCLUDE:

1. BRAND SECTION:
   - Brand name and tagline (concise, memorable, aligned with brand identity)
   - Brief value proposition or mission statement

2. FOOTER COLUMNS (${columnsCount} columns):
   - Group related pages logically (e.g., "Shop", "Company", "Support", "Resources")
   - Use clear, descriptive column titles
   - Include 3-6 links per column
   - Prioritize important pages and user journeys
   - Examples: Products, About Us, Contact, FAQ, Blog, Careers, Shipping, Returns, Privacy Policy, Terms

3. CONTACT INFORMATION:
   - Email, phone, physical address (if provided)
   - Business hours (if relevant)
   - Format professionally

4. SOCIAL LINKS:
   - Include major platforms relevant to target audience
   - Suggested platforms: Facebook, Instagram, Twitter, LinkedIn, YouTube, Pinterest, TikTok
   - Only include platforms that make sense for the business

5. NEWSLETTER SUBSCRIPTION:
   - Compelling title (e.g., "Stay Updated", "Join Our Community")
   - Brief description (benefits of subscribing)
   - Placeholder text for email input
   - Clear call-to-action button text

6. BOTTOM SECTION:
   - Copyright text with current year
   - Legal/utility links (Privacy Policy, Terms of Service, Cookies, Accessibility)
   - Keep it clean and minimal

DESIGN PRINCIPLES:
1. Clarity: Clear labels and logical organization
2. Hierarchy: Most important information prominent
3. Scannability: Use familiar patterns
4. Completeness: Include all essential touchpoints
5. Trust: Professional presentation builds confidence
6. SEO: Keyword-rich content where natural

IMPORTANT: You MUST respond with valid JSON in the following format:
{
  "brandName": "Brand Name",
  "brandTagline": "Short memorable tagline",
  "footerColumns": [
    {
      "title": "Column Title",
      "links": [
        {
          "label": "Link Label",
          "url": "/url-path",
          "openInNewTab": false
        }
      ],
      "displayOrder": 0
    }
  ],
  "contactInfo": {
    "email": "contact@example.com",
    "phone": "+1 (555) 123-4567",
    "address": "123 Main St, City, State 12345",
    "businessHours": "Mon-Fri: 9am-5pm EST"
  },
  "socialLinks": [
    {
      "platform": "facebook",
      "url": "https://facebook.com/brand",
      "icon": "facebook",
      "displayOrder": 0
    }
  ],
  "newsletter": {
    "enabled": ${input.includeNewsletter !== false},
    "title": "Newsletter Title",
    "description": "Brief compelling description",
    "placeholder": "Enter your email",
    "buttonText": "Subscribe"
  },
  "copyrightText": "© 2025 Brand Name. All rights reserved.",
  "bottomLinks": [
    {
      "label": "Privacy Policy",
      "url": "/privacy",
      "displayOrder": 0
    }
  ],
  "reasoning": "Explanation of structure and content decisions"
}

GUIDELINES:
1. Create logical groupings based on business type and available pages
2. Use user-friendly labels (not technical slugs)
3. Prioritize most important pages
4. Include all essential legal/trust links
5. Make newsletter compelling and benefit-focused
6. Format contact info professionally
7. Include relevant social platforms
8. Provide reasoning for major decisions`;

    return systemPrompt;
  }

  /**
   * Build user prompt with context
   */
  private buildPrompt(input: FooterGeneratorInput): string {
    let prompt = `Generate footer content for ${input.brandName}.\n\n`;

    prompt += `BRAND CONTEXT:\n`;
    prompt += `Name: ${input.brandName}\n`;

    if (input.brandDescription) {
      prompt += `Description: ${input.brandDescription}\n`;
    }

    if (input.industry) {
      prompt += `Industry: ${input.industry}\n`;
    }

    if (input.businessType) {
      prompt += `Business Type: ${input.businessType}\n`;
    }

    if (input.targetAudience) {
      prompt += `Target Audience: ${input.targetAudience}\n`;
    }

    if (input.contactInfo) {
      prompt += `\nCONTACT INFORMATION:\n`;
      if (input.contactInfo.email) prompt += `Email: ${input.contactInfo.email}\n`;
      if (input.contactInfo.phone) prompt += `Phone: ${input.contactInfo.phone}\n`;
      if (input.contactInfo.address) prompt += `Address: ${input.contactInfo.address}\n`;
    }

    if (input.availablePages && input.availablePages.length > 0) {
      prompt += `\nAVAILABLE PAGES (${input.availablePages.length} total):\n`;

      const staticPages = input.availablePages.filter(p => p.type === 'static');
      const cmsPages = input.availablePages.filter(p => p.type === 'cms');
      const legalPages = input.availablePages.filter(p => p.type === 'legal');

      if (staticPages.length > 0) {
        prompt += `\nSTATIC PAGES:\n`;
        staticPages.forEach(page => {
          prompt += `- ${page.label} (${page.url})\n`;
        });
      }

      if (cmsPages.length > 0) {
        prompt += `\nCMS PAGES:\n`;
        cmsPages.forEach(page => {
          prompt += `- ${page.label} (${page.url})\n`;
        });
      }

      if (legalPages.length > 0) {
        prompt += `\nLEGAL PAGES:\n`;
        legalPages.forEach(page => {
          prompt += `- ${page.label} (${page.url})\n`;
        });
      }
    }

    if (input.existingFooter) {
      prompt += `\nEXISTING FOOTER (for reference/refinement):\n`;
      prompt += JSON.stringify(input.existingFooter, null, 2) + `\n`;
      prompt += `Note: You can improve upon this structure\n`;
    }

    prompt += `\nREQUIREMENTS:\n`;
    prompt += `- Columns: ${input.columnsCount || 4}\n`;
    prompt += `- Style: ${input.style || 'balanced'}\n`;
    prompt += `- Tone: ${input.tone || 'professional'}\n`;
    prompt += `- Newsletter: ${input.includeNewsletter !== false ? 'Yes' : 'No'}\n`;
    prompt += `- Social Links: ${input.includeSocial !== false ? 'Yes' : 'No'}\n`;

    prompt += `\nGenerate the footer content in JSON format now:`;

    return prompt;
  }

  /**
   * Get style description
   */
  private getStyleDescription(style: string): string {
    const styleDescriptions: Record<string, string> = {
      minimal: 'Minimalist - essential links only, 2-3 columns, clean and simple',
      comprehensive: 'Comprehensive - detailed site map, 4-5 columns, include many pages',
      balanced: 'Balanced - important pages with logical grouping, 3-4 columns'
    };

    return styleDescriptions[style] || styleDescriptions.balanced;
  }

  /**
   * Get tone description
   */
  private getToneDescription(tone: string): string {
    const toneDescriptions: Record<string, string> = {
      professional: 'Professional and trustworthy language',
      friendly: 'Warm, approachable, conversational language',
      luxury: 'Elegant, premium, sophisticated language',
      casual: 'Relaxed, informal, everyday language'
    };

    return toneDescriptions[tone] || toneDescriptions.professional;
  }

  /**
   * Get max tokens based on style
   */
  private getMaxTokensByStyle(style: string): number {
    const tokenLimits: Record<string, number> = {
      minimal: 2000,
      balanced: 3000,
      comprehensive: 4000
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

      // Try parsing
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      console.error('Raw content:', content.substring(0, 500));

      // Return empty structure
      return {
        brandName: '',
        brandTagline: '',
        footerColumns: [],
        contactInfo: {},
        socialLinks: [],
        newsletter: {
          enabled: false,
          title: '',
          description: '',
          placeholder: '',
          buttonText: ''
        },
        copyrightText: '',
        bottomLinks: [],
        reasoning: 'Failed to parse AI response. Please try again.'
      };
    }
  }
}
