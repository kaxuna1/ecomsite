/**
 * Anthropic Provider Implementation
 *
 * Implements AI provider interface for Anthropic's Claude models
 * Uses official Anthropic SDK for API communication
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './BaseProvider';
import {
  GenerateTextParams,
  GenerateTextResponse,
  ProviderConfig
} from '../types';

export class AnthropicProvider extends BaseProvider {
  private client: Anthropic;
  public readonly name: string = 'anthropic';
  public readonly modelId: string;

  constructor(config: ProviderConfig, apiKey: string) {
    super(config, apiKey);
    this.validateApiKey();

    this.modelId = config.defaultModel || 'claude-sonnet-4-5-20250929';

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: this.apiKey
    });
  }

  /**
   * Generate text using Anthropic's Messages API
   */
  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    const startTime = Date.now();

    try {
      // Use retry logic from BaseProvider
      const response = await this.retryWithBackoff(async () => {
        // Build messages array for Claude
        const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

        // Claude requires alternating user/assistant messages
        // System prompt is handled separately
        messages.push({
          role: 'user',
          content: params.prompt
        });

        // Prepare request parameters
        const requestParams: Anthropic.MessageCreateParams = {
          model: this.modelId,
          max_tokens: params.maxTokens || 1000,
          messages,
          temperature: params.temperature !== undefined ? params.temperature : 0.7,
          top_p: params.topP,
          stop_sequences: params.stopSequences,
        };

        // Add system prompt if provided
        if (params.systemPrompt) {
          requestParams.system = params.systemPrompt;
        }

        // Make API call
        return await this.client.messages.create(requestParams);
      });

      const latency = Date.now() - startTime;

      // Extract response data
      const contentBlock = response.content[0];
      const content = contentBlock.type === 'text' ? contentBlock.text : '';
      const usage = response.usage;

      // Calculate actual cost based on usage
      const promptCost = (usage.input_tokens / 1000) * this.config.costPerPromptToken;
      const completionCost = (usage.output_tokens / 1000) * this.config.costPerCompletionToken;
      const totalCost = promptCost + completionCost;

      // Map Claude finish reason to standardized format
      const finishReason = this.mapFinishReason(response.stop_reason);

      return {
        content,
        finishReason,
        usage: {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens
        },
        cost: totalCost,
        latency,
        provider: this.name,
        modelId: this.modelId,
        metadata: {
          finishReasonRaw: response.stop_reason,
          model: response.model,
          ...params.metadata
        }
      };
    } catch (error: any) {
      console.error('Anthropic API error:', error);

      // Return error response
      return {
        content: '',
        finishReason: 'error',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        cost: 0,
        latency: Date.now() - startTime,
        provider: this.name,
        modelId: this.modelId,
        metadata: {
          error: error.message,
          errorType: error.type || 'unknown',
          errorCode: error.status,
          ...params.metadata
        }
      };
    }
  }

  /**
   * Provider capabilities
   */
  supportsStreaming(): boolean {
    return true;
  }

  supportsVision(): boolean {
    // Claude 3 Opus, Sonnet, and Haiku support vision
    return this.modelId.includes('claude-3') || this.modelId.includes('claude-sonnet');
  }

  supportsJson(): boolean {
    // Claude supports JSON mode through prompt engineering
    // Not as strict as OpenAI's JSON mode, but functional
    return true;
  }

  /**
   * Map Claude finish reasons to standardized format
   */
  private mapFinishReason(
    reason: string | null | undefined
  ): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      case 'tool_use':
        return 'stop'; // Treat tool use as normal completion
      default:
        return 'error';
    }
  }

  /**
   * Enhanced health check for Anthropic
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test with minimal request
      const response = await this.client.messages.create({
        model: this.modelId,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }]
      });

      return response.content.length > 0;
    } catch (error: any) {
      console.error(`Anthropic provider health check failed:`, error.message);
      return false;
    }
  }
}
