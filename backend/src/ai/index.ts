/**
 * AI Module Index
 *
 * Centralized AI Service Manager singleton with all features registered
 * This ensures consistent AI service instance across the application
 */

import { AIServiceManager } from './AIServiceManager';
import { aiServiceConfig } from './config';
import { DescriptionGenerator } from './features/DescriptionGenerator';
import { SEOGenerator } from './features/SEOGenerator';
import { ImageAltTextGenerator } from './features/ImageAltTextGenerator';
import { ProductTranslator } from './features/ProductTranslator';
import { EmailCampaignGenerator } from './features/EmailCampaignGenerator';
import { FAQGenerator } from './features/FAQGenerator';
import { HeroGenerator } from './features/HeroGenerator';
import { TestimonialGenerator } from './features/TestimonialGenerator';
import { FeaturesGenerator } from './features/FeaturesGenerator';
import { CMSPageTranslator } from './features/CMSPageTranslator';
import { FooterGenerator } from './features/FooterGenerator';
import { FooterTranslator } from './features/FooterTranslator';
import { AttributeGenerator } from './features/AttributeGenerator';
import { VariantOptionsGenerator } from './features/VariantOptionsGenerator';
import { VariantOptionsTypeGenerator } from './features/VariantOptionsTypeGenerator';
import { AIPageBuilderFeature } from './features/AIPageBuilderFeature';

// Singleton instance
let aiServiceManagerInstance: AIServiceManager | null = null;

/**
 * Get or create AI Service Manager singleton instance
 * Lazy initialization with all features registered
 */
export async function getAIServiceManager(): Promise<AIServiceManager> {
  if (!aiServiceManagerInstance) {
    // Create new instance
    aiServiceManagerInstance = new AIServiceManager(aiServiceConfig);

    // Register all AI features
    aiServiceManagerInstance.registerFeature(new DescriptionGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new SEOGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new ImageAltTextGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new ProductTranslator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new EmailCampaignGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new FAQGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new HeroGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new TestimonialGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new FeaturesGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new CMSPageTranslator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new FooterGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new FooterTranslator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new AttributeGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new VariantOptionsGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new VariantOptionsTypeGenerator(aiServiceManagerInstance));
    aiServiceManagerInstance.registerFeature(new AIPageBuilderFeature(aiServiceManagerInstance));

    console.log('AI Service Manager created with 16 features (including AI Page Builder)');
  }

  // Re-initialize on every call to pick up updated provider/model settings
  await aiServiceManagerInstance.initialize();

  return aiServiceManagerInstance;
}

/**
 * Direct access to AI Service Manager instance for services
 * Note: This may not be initialized yet. Use getAIServiceManager() for guaranteed initialization.
 */
export const aiServiceManager = {
  get instance(): AIServiceManager {
    if (!aiServiceManagerInstance) {
      throw new Error('AI Service Manager not initialized. Call getAIServiceManager() first.');
    }
    return aiServiceManagerInstance;
  }
};

// Export types and classes for external use
export { AIServiceManager } from './AIServiceManager';
export { aiServiceConfig } from './config';
export * from './types';
