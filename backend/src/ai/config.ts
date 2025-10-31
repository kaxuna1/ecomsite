/**
 * AI Service Configuration
 *
 * Centralized configuration for AI providers and features
 */

import { AIServiceConfig } from './types';

export const aiServiceConfig: AIServiceConfig = {
  // Provider configurations
  providers: [
    {
      name: 'openai',
      enabled: true,
      apiKeyName: 'openai_api_key', // References key in api_keys table
      defaultModel: 'gpt-4o', // Latest GPT-4o (2024)
      availableModels: [
        'gpt-4o', // GPT-4o (2024-11-20) - Latest multimodal
        'gpt-4o-2024-11-20', // Explicit version
        'gpt-4o-mini', // GPT-4o mini - Fast & cheap
        'gpt-4o-mini-2024-07-18', // Explicit version
        'gpt-4-turbo', // GPT-4 Turbo
        'gpt-4-turbo-2024-04-09', // Explicit version
        'gpt-4-turbo-preview',
        'gpt-4-0125-preview',
        'gpt-3.5-turbo', // Being phased out
        'gpt-3.5-turbo-0125'
      ],
      maxRetries: 3,
      timeout: 60000, // 60 seconds
      rateLimit: {
        requestsPerMinute: 50,
        tokensPerMinute: 90000
      },
      // GPT-4o pricing (as of 2025)
      costPerPromptToken: 2.50 / 1000000, // $2.50 per 1M tokens
      costPerCompletionToken: 10.00 / 1000000 // $10.00 per 1M tokens
    },
    {
      name: 'anthropic',
      enabled: true,
      apiKeyName: 'anthropic_api_key', // References key in api_keys table
      defaultModel: 'claude-sonnet-4-5-20250929', // Claude Sonnet 4.5 (Sept 2025)
      availableModels: [
        'claude-sonnet-4-5-20250929', // Claude Sonnet 4.5 - Best coding (Sept 2025)
        'claude-haiku-4-5-20251015', // Claude Haiku 4.5 - Fast & cheap (Oct 2025)
        'claude-3-5-sonnet-20241022', // Claude 3.5 Sonnet (Oct 2024)
        'claude-3-5-sonnet-20240620', // Claude 3.5 Sonnet (June 2024)
        'claude-3-opus-20240229', // Claude 3 Opus - Legacy
        'claude-3-sonnet-20240229', // Claude 3 Sonnet - Legacy
        'claude-3-haiku-20240307' // Claude 3 Haiku - Legacy
      ],
      maxRetries: 3,
      timeout: 60000, // 60 seconds
      rateLimit: {
        requestsPerMinute: 50,
        tokensPerMinute: 100000
      },
      // Claude Sonnet 4.5 pricing (as of 2025)
      costPerPromptToken: 3.00 / 1000000, // $3.00 per 1M tokens
      costPerCompletionToken: 15.00 / 1000000 // $15.00 per 1M tokens
    }
  ],

  // Feature configurations
  features: [
    {
      name: 'product_description_generator',
      enabled: true,
      defaultProvider: 'openai',
      fallbackProviders: ['anthropic'], // Claude as fallback
      cacheEnabled: true,
      cacheTTL: 7200, // 2 hours - descriptions don't change often
      maxCostPerExecution: 0.50, // $0.50 max per generation
      rateLimitPerUser: 20 // 20 generations per hour per admin user
    },
    {
      name: 'seo_meta_generator',
      enabled: true,
      defaultProvider: 'openai',
      fallbackProviders: ['anthropic'],
      cacheEnabled: true,
      cacheTTL: 86400, // 24 hours - SEO meta rarely changes
      maxCostPerExecution: 0.25, // $0.25 max per generation
      rateLimitPerUser: 50 // 50 generations per hour per admin user
    },
    {
      name: 'image_alt_text_generator',
      enabled: true,
      defaultProvider: 'openai',
      fallbackProviders: ['anthropic'],
      cacheEnabled: true,
      cacheTTL: 604800, // 7 days - alt text rarely changes
      maxCostPerExecution: 0.10, // $0.10 max per generation
      rateLimitPerUser: 100 // 100 generations per hour (bulk operations)
    },
    {
      name: 'product_translator',
      enabled: true,
      defaultProvider: 'openai',
      fallbackProviders: ['anthropic'],
      cacheEnabled: true,
      cacheTTL: 604800, // 7 days - translations rarely change
      maxCostPerExecution: 0.50, // $0.50 max per translation
      rateLimitPerUser: 30 // 30 translations per hour per admin user
    },
    {
      name: 'email_campaign_generator',
      enabled: true,
      defaultProvider: 'openai',
      fallbackProviders: ['anthropic'],
      cacheEnabled: true,
      cacheTTL: 3600, // 1 hour - campaigns are often customized
      maxCostPerExecution: 0.30, // $0.30 max per generation
      rateLimitPerUser: 50 // 50 generations per hour per admin user
    },
    {
      name: 'faq_generator',
      enabled: true,
      defaultProvider: 'openai',
      fallbackProviders: ['anthropic'],
      cacheEnabled: true,
      cacheTTL: 86400, // 24 hours - FAQs don't change often
      maxCostPerExecution: 0.25, // $0.25 max per generation
      rateLimitPerUser: 40 // 40 generations per hour per admin user
    },
    {
      name: 'navigation_menu_generator',
      enabled: true,
      defaultProvider: 'openai',
      fallbackProviders: ['anthropic'],
      cacheEnabled: true,
      cacheTTL: 7200, // 2 hours - menus can be regenerated/refined
      maxCostPerExecution: 0.40, // $0.40 max per generation
      rateLimitPerUser: 20 // 20 generations per hour per admin user
    },
    {
      name: 'menu_item_translator',
      enabled: true,
      defaultProvider: 'openai',
      fallbackProviders: ['anthropic'],
      cacheEnabled: true,
      cacheTTL: 86400, // 24 hours - translations rarely change
      maxCostPerExecution: 0.30, // $0.30 max per translation
      rateLimitPerUser: 30 // 30 translations per hour per admin user
    },
    {
      name: 'ai-page-builder',
      enabled: true,
      defaultProvider: 'anthropic', // Claude excels at structured content generation
      fallbackProviders: ['openai'],
      cacheEnabled: false, // Pages should be unique, don't cache
      cacheTTL: 0,
      maxCostPerExecution: 2.00, // $2.00 max per page (structure + multiple blocks)
      rateLimitPerUser: 10 // 10 page generations per hour per admin user
    }
  ],

  // Cache configuration
  cache: {
    enabled: true,
    strategy: 'memory', // 'memory' | 'redis' | 'database'
    maxSize: 1000, // Maximum cached items
    ttl: 3600 // Default TTL: 1 hour
  },

  // Queue configuration (for future use)
  queue: {
    enabled: false, // Disabled for now, can enable with Bull/BullMQ later
    maxConcurrency: 5,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Monitoring configuration
  monitoring: {
    enabled: true,
    trackCosts: true,
    trackLatency: true,
    logAllRequests: true
  }
};

/**
 * Get configuration for a specific provider
 */
export function getProviderConfig(providerName: string) {
  return aiServiceConfig.providers.find(
    p => p.name.toLowerCase() === providerName.toLowerCase()
  );
}

/**
 * Get configuration for a specific feature
 */
export function getFeatureConfig(featureName: string) {
  return aiServiceConfig.features.find(
    f => f.name === featureName
  );
}

/**
 * Check if a provider is enabled
 */
export function isProviderEnabled(providerName: string): boolean {
  const config = getProviderConfig(providerName);
  return config?.enabled || false;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureName: string): boolean {
  const config = getFeatureConfig(featureName);
  return config?.enabled || false;
}

/**
 * Model-specific pricing information (2025)
 */
export interface ModelPricing {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic';
  description: string;
  inputPricePerMillion: number; // USD per 1M tokens
  outputPricePerMillion: number;
  contextWindow: string;
  badge?: 'Recommended' | 'Cheapest' | 'Fastest' | 'Legacy';
  speed: 'Fastest' | 'Fast' | 'Medium';
}

export const MODEL_PRICING: ModelPricing[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Multimodal (text, images, audio)',
    inputPricePerMillion: 2.50,
    outputPricePerMillion: 10.00,
    contextWindow: '128K',
    badge: 'Recommended',
    speed: 'Fast'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai',
    description: 'Fast & cost-effective',
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
    contextWindow: '128K',
    badge: 'Cheapest',
    speed: 'Fastest'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Previous generation, still powerful',
    inputPricePerMillion: 10.00,
    outputPricePerMillion: 30.00,
    contextWindow: '128K',
    speed: 'Fast'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Being phased out',
    inputPricePerMillion: 0.50,
    outputPricePerMillion: 1.50,
    contextWindow: '16K',
    badge: 'Legacy',
    speed: 'Fastest'
  },
  // Anthropic Models
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    description: 'Best coding model (Sept 2025)',
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    contextWindow: '200K',
    badge: 'Recommended',
    speed: 'Fast'
  },
  {
    id: 'claude-haiku-4-5-20251015',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: 'Ultra-fast, cost-effective (Oct 2025)',
    inputPricePerMillion: 1.00,
    outputPricePerMillion: 5.00,
    contextWindow: '200K',
    badge: 'Cheapest',
    speed: 'Fastest'
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Previous generation (Oct 2024)',
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    contextWindow: '200K',
    speed: 'Fast'
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Most powerful legacy model',
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
    contextWindow: '200K',
    badge: 'Legacy',
    speed: 'Medium'
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fast legacy model',
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
    contextWindow: '200K',
    badge: 'Legacy',
    speed: 'Fastest'
  }
];

/**
 * Get pricing information for a specific model
 */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING.find(m => m.id === modelId);
}

/**
 * Get cost per token for a specific model
 */
export function getModelCostPerToken(modelId: string): { input: number; output: number } | null {
  const pricing = getModelPricing(modelId);
  if (!pricing) return null;

  return {
    input: pricing.inputPricePerMillion / 1000000,
    output: pricing.outputPricePerMillion / 1000000
  };
}
