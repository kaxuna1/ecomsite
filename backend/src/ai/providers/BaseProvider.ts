/**
 * Base Provider Implementation
 *
 * Abstract base class for all AI providers with common functionality:
 * - Retry logic with exponential backoff
 * - Error handling
 * - Cost estimation utilities
 * - Health check abstraction
 */

import {
  IAIProvider,
  GenerateTextParams,
  GenerateTextResponse,
  ProviderConfig
} from '../types';

export abstract class BaseProvider implements IAIProvider {
  protected config: ProviderConfig;
  protected apiKey: string;

  abstract readonly name: string;
  abstract readonly modelId: string;

  constructor(config: ProviderConfig, apiKey: string) {
    this.config = config;
    this.apiKey = apiKey;
  }

  /**
   * Main text generation method (must be implemented by child classes)
   */
  abstract generateText(params: GenerateTextParams): Promise<GenerateTextResponse>;

  /**
   * Provider capabilities (must be implemented by child classes)
   */
  abstract supportsStreaming(): boolean;
  abstract supportsVision(): boolean;
  abstract supportsJson(): boolean;

  /**
   * Health check - verify provider is available and API key is valid
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Simple test with minimal tokens
      const testParams: GenerateTextParams = {
        prompt: 'Test',
        maxTokens: 5,
        temperature: 0
      };

      await this.generateText(testParams);
      return true;
    } catch (error) {
      console.error(`Provider ${this.name} health check failed:`, error);
      return false;
    }
  }

  /**
   * Estimate cost based on input parameters
   * Uses approximate token counts (4 chars = ~1 token)
   */
  estimateCost(params: GenerateTextParams): number {
    const promptTokens = this.estimateTokenCount(params.prompt);
    const systemPromptTokens = params.systemPrompt
      ? this.estimateTokenCount(params.systemPrompt)
      : 0;
    const maxCompletionTokens = params.maxTokens || 1000;

    const totalPromptTokens = promptTokens + systemPromptTokens;
    const promptCost = (totalPromptTokens / 1000) * this.config.costPerPromptToken;
    const completionCost = (maxCompletionTokens / 1000) * this.config.costPerCompletionToken;

    return promptCost + completionCost;
  }

  /**
   * Retry logic with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors (authentication, invalid request, etc.)
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Calculate exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
        console.log(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms for provider ${this.name}`
        );

        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Retry failed with unknown error');
  }

  /**
   * Determine if error should not be retried
   */
  protected isNonRetryableError(error: any): boolean {
    // Authentication errors
    if (error.status === 401 || error.status === 403) {
      return true;
    }

    // Invalid request errors
    if (error.status === 400 || error.status === 422) {
      return true;
    }

    // Not found errors
    if (error.status === 404) {
      return true;
    }

    return false;
  }

  /**
   * Estimate token count from text (rough approximation)
   * More accurate counting would require tiktoken library
   */
  protected estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API key format (basic validation)
   */
  protected validateApiKey(): void {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new Error(`Invalid API key for provider ${this.name}`);
    }
  }

  /**
   * Create standardized error response
   */
  protected createErrorResponse(error: any): never {
    const errorMessage = error.message || 'Unknown error';
    const errorStatus = error.status || error.statusCode || 500;

    throw new Error(
      `Provider ${this.name} error (${errorStatus}): ${errorMessage}`
    );
  }
}
