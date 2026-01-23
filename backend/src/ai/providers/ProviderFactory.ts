/**
 * Provider Factory
 *
 * Factory pattern for creating AI provider instances
 * Supports dynamic provider instantiation based on configuration
 */

import { IAIProvider, ProviderConfig } from '../types';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GeminiProvider } from './GeminiProvider';

export class ProviderFactory {
  /**
   * Create a provider instance based on configuration
   *
   * @param config Provider configuration
   * @param apiKey API key for the provider
   * @returns Provider instance
   */
  static createProvider(config: ProviderConfig, apiKey: string): IAIProvider {
    switch (config.name.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider(config, apiKey);

      case 'anthropic':
        return new AnthropicProvider(config, apiKey);

      case 'gemini':
        return new GeminiProvider(config, apiKey);

      // Future providers can be added here:
      // case 'cohere':
      //   return new CohereProvider(config, apiKey);

      default:
        throw new Error(`Unsupported AI provider: ${config.name}`);
    }
  }

  /**
   * Get list of supported provider names
   */
  static getSupportedProviders(): string[] {
    return ['openai', 'anthropic', 'gemini'];
  }

  /**
   * Check if a provider is supported
   */
  static isProviderSupported(providerName: string): boolean {
    return this.getSupportedProviders().includes(providerName.toLowerCase());
  }
}
