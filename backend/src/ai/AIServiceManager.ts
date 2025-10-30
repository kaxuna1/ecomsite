/**
 * AI Service Manager
 *
 * Main orchestrator for AI operations
 * Manages providers, features, caching, cost tracking, and audit logging
 */

import { getAPIKey } from '../services/apiKeysService';
import { getSetting } from '../services/settingsService';
import {
  IAIProvider,
  IAIFeature,
  AIServiceConfig,
  FeatureOptions,
  GenerateTextParams,
  GenerateTextResponse
} from './types';
import { ProviderFactory } from './providers/ProviderFactory';
import { CacheManager } from './infrastructure/CacheManager';
import { CostTracker } from './infrastructure/CostTracker';
import { AuditLogger } from './infrastructure/AuditLogger';

export class AIServiceManager {
  private config: AIServiceConfig;
  private providers: Map<string, IAIProvider>;
  private features: Map<string, IAIFeature>;
  private cacheManager: CacheManager;
  private costTracker: CostTracker;
  private auditLogger: AuditLogger;
  private initialized: boolean = false;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.providers = new Map();
    this.features = new Map();
    this.cacheManager = new CacheManager(
      config.cache.maxSize,
      config.cache.ttl
    );
    this.costTracker = new CostTracker();
    this.auditLogger = new AuditLogger();
  }

  /**
   * Initialize AI service - load API keys and create providers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('Initializing AI Service Manager...');

    // Fetch user-selected models from settings
    let selectedModels: { openai?: string; anthropic?: string } = {};
    try {
      const openaiModel = await getSetting('openaiModel');
      const anthropicModel = await getSetting('anthropicModel');
      if (openaiModel) selectedModels.openai = openaiModel;
      if (anthropicModel) selectedModels.anthropic = anthropicModel;
    } catch (error) {
      console.warn('Failed to load model preferences from settings:', error);
    }

    // Initialize enabled providers
    for (const providerConfig of this.config.providers) {
      if (!providerConfig.enabled) {
        continue;
      }

      try {
        // Fetch API key from database
        const apiKey = await getAPIKey(providerConfig.apiKeyName);

        if (!apiKey) {
          console.warn(
            `API key not found for provider ${providerConfig.name}: ${providerConfig.apiKeyName}`
          );
          continue;
        }

        // Override default model with user-selected model if available
        const configWithSelectedModel = { ...providerConfig };
        if (providerConfig.name === 'openai' && selectedModels.openai) {
          configWithSelectedModel.defaultModel = selectedModels.openai;
          console.log(`Using user-selected OpenAI model: ${selectedModels.openai}`);
        } else if (providerConfig.name === 'anthropic' && selectedModels.anthropic) {
          configWithSelectedModel.defaultModel = selectedModels.anthropic;
          console.log(`Using user-selected Anthropic model: ${selectedModels.anthropic}`);
        }

        // Create provider instance with potentially overridden model
        const provider = ProviderFactory.createProvider(configWithSelectedModel, apiKey);

        // Test provider availability
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.warn(`Provider ${providerConfig.name} is not available`);
          continue;
        }

        this.providers.set(providerConfig.name, provider);
        console.log(`Initialized provider: ${providerConfig.name} with model: ${provider.modelId}`);
      } catch (error) {
        console.error(`Failed to initialize provider ${providerConfig.name}:`, error);
      }
    }

    this.initialized = true;
    console.log(`AI Service Manager initialized with ${this.providers.size} providers`);
  }

  /**
   * Register an AI feature
   */
  registerFeature(feature: IAIFeature): void {
    this.features.set(feature.name, feature);
    console.log(`Registered AI feature: ${feature.name}`);
  }

  /**
   * Execute an AI feature
   */
  async executeFeature(
    featureName: string,
    input: any,
    options?: FeatureOptions
  ): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    const feature = this.features.get(featureName);
    if (!feature) {
      throw new Error(`Feature not found: ${featureName}`);
    }

    return await feature.execute(input, options);
  }

  /**
   * Generate text using AI provider with caching and tracking
   */
  async generateText(
    params: GenerateTextParams,
    options?: FeatureOptions
  ): Promise<GenerateTextResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Determine which provider to use
    const providerName = await this.selectProvider(options);
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`No available provider found`);
    }

    // Check cache if enabled
    if (options?.useCache !== false && this.config.cache.enabled) {
      const cacheKey = this.cacheManager.generateCacheKey(params, providerName);
      const cached = this.cacheManager.get(cacheKey);

      if (cached) {
        console.log(`Cache hit for provider ${providerName}`);
        return cached;
      }
    }

    // Generate text
    const response = await provider.generateText(params);

    // Track cost and audit
    if (this.config.monitoring.enabled) {
      if (this.config.monitoring.trackCosts) {
        await this.costTracker.trackDetailed(
          response.provider,
          options?.metadata?.feature || 'unknown',
          response.usage.promptTokens,
          response.usage.completionTokens,
          response.usage.totalTokens,
          response.cost,
          response.latency,
          response.modelId,
          response.finishReason !== 'error',
          options?.metadata?.adminUserId,
          response.finishReason === 'error' ? 'Generation failed' : undefined,
          params.metadata
        );
      }

      if (this.config.monitoring.logAllRequests) {
        await this.auditLogger.logDetailed(
          response.provider,
          options?.metadata?.feature || 'unknown',
          response.usage.promptTokens,
          response.usage.completionTokens,
          response.usage.totalTokens,
          response.cost,
          response.latency,
          response.modelId,
          response.finishReason !== 'error',
          options?.metadata?.adminUserId,
          response.finishReason === 'error' ? 'Generation failed' : undefined,
          params.metadata
        );
      }
    }

    // Cache response if successful
    if (
      options?.useCache !== false &&
      this.config.cache.enabled &&
      response.finishReason === 'stop'
    ) {
      const cacheKey = this.cacheManager.generateCacheKey(params, providerName);
      const featureConfig = this.config.features.find(f => f.name === options?.metadata?.feature);
      const ttl = featureConfig?.cacheTTL || this.config.cache.ttl;
      this.cacheManager.set(cacheKey, response, ttl);
    }

    return response;
  }

  /**
   * Select the best provider based on options and availability
   */
  private async selectProvider(options?: FeatureOptions): Promise<string> {
    // If specific provider requested, use it
    if (options?.provider) {
      if (this.providers.has(options.provider)) {
        return options.provider;
      }
      throw new Error(`Requested provider not available: ${options.provider}`);
    }

    // If preferred providers specified, try them in order
    if (options?.preferredProviders && options.preferredProviders.length > 0) {
      for (const providerName of options.preferredProviders) {
        if (this.providers.has(providerName)) {
          return providerName;
        }
      }
    }

    // Check site settings for preferred AI provider (HIGHEST PRIORITY after explicit preferences)
    try {
      const preferredProvider = await getSetting('aiProvider');
      if (preferredProvider && this.providers.has(preferredProvider)) {
        console.log(`Using preferred AI provider from settings: ${preferredProvider}`);
        return preferredProvider;
      }
    } catch (error) {
      console.warn('Failed to get AI provider preference from settings:', error);
    }

    // Use default provider from feature config (FALLBACK)
    if (options?.metadata?.feature) {
      const featureConfig = this.config.features.find(
        f => f.name === options.metadata?.feature
      );
      if (featureConfig) {
        // Try default provider
        if (this.providers.has(featureConfig.defaultProvider)) {
          return featureConfig.defaultProvider;
        }
        // Try fallback providers
        for (const fallback of featureConfig.fallbackProviders) {
          if (this.providers.has(fallback)) {
            return fallback;
          }
        }
      }
    }

    // Use first available provider
    const firstProvider = Array.from(this.providers.keys())[0];
    if (!firstProvider) {
      throw new Error('No AI providers available');
    }

    return firstProvider;
  }

  /**
   * Get provider instance by name
   */
  getProvider(name: string): IAIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get registered feature
   */
  getFeature(name: string): IAIFeature | undefined {
    return this.features.get(name);
  }

  /**
   * Get all registered features
   */
  getRegisteredFeatures(): string[] {
    return Array.from(this.features.keys());
  }

  /**
   * Get cost tracker instance
   */
  getCostTracker(): CostTracker {
    return this.costTracker;
  }

  /**
   * Get audit logger instance
   */
  getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * Get selected model for a provider
   */
  getSelectedModel(providerName: string): string | undefined {
    const provider = this.providers.get(providerName);
    return provider?.modelId;
  }

  /**
   * Reinitialize providers with new model selections
   * Call this after model settings are updated
   */
  async reinitialize(): Promise<void> {
    this.initialized = false;
    this.providers.clear();
    await this.initialize();
  }
}
