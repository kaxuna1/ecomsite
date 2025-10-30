/**
 * AI Service Type Definitions
 *
 * Provider-agnostic interfaces for AI service layer
 */

/**
 * Base AI Provider Interface
 * All AI providers must implement this interface
 */
export interface IAIProvider {
  readonly name: string;
  readonly modelId: string;

  // Core generation method
  generateText(params: GenerateTextParams): Promise<GenerateTextResponse>;

  // Provider capabilities
  supportsStreaming(): boolean;
  supportsVision(): boolean;
  supportsJson(): boolean;

  // Health check
  isAvailable(): Promise<boolean>;

  // Cost estimation
  estimateCost(params: GenerateTextParams): number;
}

/**
 * Text generation parameters (provider-agnostic)
 */
export interface GenerateTextParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  responseFormat?: 'text' | 'json';
  metadata?: Record<string, any>; // For tracking/logging
}

/**
 * Standardized response format
 */
export interface GenerateTextResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number; // Estimated cost in USD
  latency: number; // Response time in ms
  provider: string;
  modelId: string;
  metadata?: Record<string, any>;
}

/**
 * AI Feature Interface
 * All AI features must implement this interface
 */
export interface IAIFeature {
  readonly name: string;
  readonly description: string;
  readonly requiredCapabilities: string[];

  // Execute the feature
  execute(input: any, options?: FeatureOptions): Promise<any>;

  // Get cost estimate before execution
  estimateCost(input: any): Promise<number>;
}

/**
 * Feature execution options
 */
export interface FeatureOptions {
  provider?: string; // Specific provider to use (optional)
  preferredProviders?: string[]; // Ordered list of preferred providers
  maxCost?: number; // Maximum acceptable cost
  timeout?: number; // Maximum execution time in ms
  useCache?: boolean; // Whether to use cached responses
  language?: string; // Target language for i18n features
  metadata?: Record<string, any>; // Additional tracking data
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  name: string;
  enabled: boolean;
  apiKeyName: string; // Reference to API key in api_keys table
  defaultModel: string;
  availableModels: string[];
  maxRetries: number;
  timeout: number;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  costPerPromptToken: number; // USD per token
  costPerCompletionToken: number;
}

/**
 * Feature configuration
 */
export interface FeatureConfig {
  name: string;
  enabled: boolean;
  defaultProvider: string;
  fallbackProviders: string[];
  cacheEnabled: boolean;
  cacheTTL: number; // Cache time-to-live in seconds
  maxCostPerExecution: number;
  rateLimitPerUser?: number; // Requests per hour per user
}

/**
 * AI Service Configuration
 */
export interface AIServiceConfig {
  providers: ProviderConfig[];
  features: FeatureConfig[];
  cache: {
    enabled: boolean;
    strategy: 'memory' | 'redis' | 'database';
    maxSize: number; // Max cached items
    ttl: number; // Default TTL in seconds
  };
  queue: {
    enabled: boolean;
    maxConcurrency: number;
    retryAttempts: number;
    retryDelay: number;
  };
  monitoring: {
    enabled: boolean;
    trackCosts: boolean;
    trackLatency: boolean;
    logAllRequests: boolean;
  };
}

/**
 * Cost tracking entry
 */
export interface CostEntry {
  provider: string;
  feature: string;
  cost: number;
  tokens: number;
  latency: number;
  adminUserId?: number;
  timestamp?: Date;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  provider: string;
  feature?: string;
  promptLength: number;
  responseLength?: number;
  cost?: number;
  tokens?: number;
  success: boolean;
  error?: string;
  timestamp?: Date;
}
