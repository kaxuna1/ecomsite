/**
 * AI Testimonial Generator
 *
 * Generates authentic, diverse customer testimonials for products.
 * Creates varied personas with realistic details and benefit-focused reviews.
 */

import { AIFeature, AIFeatureInput, AIFeatureOutput, FeatureOptions } from '../core/types';
import { AIServiceManager } from '../AIServiceManager';

export interface TestimonialGeneratorInput extends AIFeatureInput {
  productName: string;
  productType?: string; // e.g., "Scalp Serum", "Hair Oil"
  industry?: string; // e.g., "Beauty & Personal Care", "Health & Wellness"
  targetAudience?: string; // e.g., "Health-conscious professionals aged 25-45"
  numberOfTestimonials: number; // 3-10
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'technical';
  includeSpecificBenefits?: string[]; // e.g., ["hair growth", "scalp health", "shine"]
  diverseProfiles?: boolean; // Generate diverse customer personas
  language?: string;
}

export interface GeneratedTestimonial {
  name: string;
  jobTitle?: string;
  company?: string;
  text: string;
  rating: number;
  verified: boolean;
  location?: string;
}

export interface TestimonialGeneratorOutput extends AIFeatureOutput {
  testimonials: GeneratedTestimonial[];
}

export class TestimonialGenerator implements AIFeature<TestimonialGeneratorInput, TestimonialGeneratorOutput> {
  name = 'testimonial_generator';
  description = 'Generate authentic customer testimonials with diverse personas';

  constructor(private aiService: AIServiceManager) {}

  private getSystemPrompt(input: TestimonialGeneratorInput): string {
    const {
      productName,
      productType,
      industry,
      targetAudience,
      numberOfTestimonials,
      tone = 'professional',
      includeSpecificBenefits,
      diverseProfiles = true,
      language = 'en'
    } = input;

    const benefitsSection = includeSpecificBenefits && includeSpecificBenefits.length > 0
      ? `\n\nKey benefits to mention (vary across testimonials):\n${includeSpecificBenefits.map(b => `- ${b}`).join('\n')}`
      : '';

    const toneGuidelines = {
      professional: 'Professional, articulate, detail-oriented. Use proper grammar and structured sentences.',
      casual: 'Friendly, conversational, relatable. Use everyday language and personal anecdotes.',
      enthusiastic: 'Excited, emotional, passionate. Use exclamation points and emphatic language.',
      technical: 'Analytical, specific, data-focused. Mention technical details and measurable results.'
    };

    return `You are an expert at generating authentic, believable customer testimonials for e-commerce products.

Product: ${productName}
${productType ? `Product Type: ${productType}` : ''}
${industry ? `Industry: ${industry}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
Number of Testimonials: ${numberOfTestimonials}
Tone: ${tone} - ${toneGuidelines[tone]}
Language: ${language === 'ka' ? 'Georgian (ka)' : 'English (en)'}
${benefitsSection}

IMPORTANT GUIDELINES:
1. **Authenticity**: Write like real customers, not marketing copy
   - Include specific details and personal experiences
   - Mention both the problem they had and the solution
   - Use natural, varied language (avoid repetition)
   - Mix sentence structures and lengths

2. **Diversity** (${diverseProfiles ? 'ENABLED' : 'DISABLED'}):
   ${diverseProfiles ? `- Generate diverse customer personas: different ages, professions, locations
   - Include both male and female names
   - Vary job titles across industries (tech, healthcare, education, creative, etc.)
   - Use locations from different regions/countries
   - Represent different usage contexts and life situations` : '- Keep personas simple and generic'}

3. **Review Quality**:
   - Length: 50-150 words (vary)
   - Focus on specific benefits and results
   - Include timeframe when relevant ("after 2 weeks", "within a month")
   - Mention how they use the product
   - Natural imperfections are okay (not overly polished)

4. **Rating Distribution**:
   - Most should be 5 stars (70%)
   - Some 4 stars (25%)
   - Occasional 3-4 stars for variety (5%)
   - Even 4-star reviews should be positive overall

5. **Verified Status**:
   - 80% should be verified buyers
   - 20% unverified (still authentic, just didn't buy directly)

6. **Avoid**:
   - Generic praise ("Great product!", "Highly recommend!")
   - Unrealistic claims ("Miracle cure", "Changed my life completely")
   - Marketing language ("Revolutionary", "Game-changer")
   - Perfect grammar (occasional casual writing is authentic)
   - Repetitive phrasing across testimonials

RESPONSE FORMAT (JSON only, no markdown):
{
  "testimonials": [
    {
      "name": "Full Name",
      "jobTitle": "Job Title",
      "company": "Company Name (optional)",
      "location": "City, State/Country",
      "text": "The actual review text...",
      "rating": 5,
      "verified": true
    }
  ]
}

Generate ${numberOfTestimonials} unique, authentic testimonials now.`;
  }

  async execute(
    input: TestimonialGeneratorInput,
    options?: FeatureOptions
  ): Promise<TestimonialGeneratorOutput> {
    const systemPrompt = this.getSystemPrompt(input);
    const userPrompt = `Generate ${input.numberOfTestimonials} testimonials for: ${input.productName}`;

    const temperature = input.tone === 'technical' ? 0.6 : 0.8;
    const maxTokens = input.numberOfTestimonials * 200; // ~150 words per testimonial

    // Actually call the AI service
    const response = await this.aiService.generateText(
      {
        prompt: userPrompt,
        systemPrompt,
        maxTokens,
        temperature,
        responseFormat: 'json',
        metadata: {
          feature: this.name,
          productName: input.productName,
          tone: input.tone || 'professional',
          language: input.language || 'en',
          ...options?.metadata
        }
      },
      {
        ...options,
        useCache: options?.useCache !== false
      }
    );

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
      console.error('Failed to parse testimonial response as JSON:', error);
      console.error('Raw response:', response.content);
      throw new Error('Failed to generate testimonials: Invalid JSON response');
    }

    // Validate and normalize testimonials
    if (!parsedContent.testimonials || !Array.isArray(parsedContent.testimonials)) {
      throw new Error('Invalid response format: missing testimonials array');
    }

    const validTestimonials: GeneratedTestimonial[] = parsedContent.testimonials.map((t: any) => {
      if (!t.name || !t.text || typeof t.rating !== 'number') {
        throw new Error('Invalid testimonial: missing required fields');
      }

      return {
        name: t.name.trim(),
        jobTitle: t.jobTitle?.trim(),
        company: t.company?.trim(),
        location: t.location?.trim(),
        text: t.text.trim(),
        rating: Math.min(5, Math.max(1, Math.round(t.rating))),
        verified: typeof t.verified === 'boolean' ? t.verified : true
      };
    });

    return {
      testimonials: validTestimonials,
      cost: response.cost,
      tokensUsed: response.usage.totalTokens,
      provider: response.provider
    };
  }
}
