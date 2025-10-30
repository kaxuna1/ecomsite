/**
 * OpenAI Provider Implementation
 *
 * Implements AI provider interface for OpenAI's GPT models
 * Uses official OpenAI SDK for API communication
 */

import OpenAI from 'openai';
import { BaseProvider } from './BaseProvider';
import {
  GenerateTextParams,
  GenerateTextResponse,
  ProviderConfig
} from '../types';

export class OpenAIProvider extends BaseProvider {
  private client: OpenAI;
  public readonly name: string = 'openai';
  public readonly modelId: string;

  constructor(config: ProviderConfig, apiKey: string) {
    super(config, apiKey);
    this.validateApiKey();

    this.modelId = config.defaultModel || 'gpt-4-turbo-preview';

    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: this.apiKey
    });
  }

  /**
   * Generate text using OpenAI's chat completion API
   */
  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    const startTime = Date.now();

    try {
      // Use retry logic from BaseProvider
      const response = await this.retryWithBackoff(async () => {
        // Build messages array
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

        // Add system prompt if provided
        if (params.systemPrompt) {
          messages.push({
            role: 'system',
            content: params.systemPrompt
          });
        }

        // Add user prompt
        messages.push({
          role: 'user',
          content: params.prompt
        });

        // Prepare request parameters
        const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
          model: this.modelId,
          messages,
          max_tokens: params.maxTokens || 1000,
          temperature: params.temperature !== undefined ? params.temperature : 0.7,
          top_p: params.topP,
          stop: params.stopSequences,
        };

        // Add response format for JSON mode if requested
        if (params.responseFormat === 'json') {
          requestParams.response_format = { type: 'json_object' };
        }

        // Make API call
        return await this.client.chat.completions.create(requestParams);
      });

      const latency = Date.now() - startTime;

      // Extract response data
      const choice = response.choices[0];
      const content = choice.message.content || '';
      const usage = response.usage;

      if (!usage) {
        throw new Error('OpenAI response missing usage data');
      }

      // Calculate actual cost based on usage
      const promptCost = (usage.prompt_tokens / 1000) * this.config.costPerPromptToken;
      const completionCost = (usage.completion_tokens / 1000) * this.config.costPerCompletionToken;
      const totalCost = promptCost + completionCost;

      // Map OpenAI finish reason to standardized format
      const finishReason = this.mapFinishReason(choice.finish_reason);

      return {
        content,
        finishReason,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        cost: totalCost,
        latency,
        provider: this.name,
        modelId: this.modelId,
        metadata: {
          finishReasonRaw: choice.finish_reason,
          model: response.model,
          ...params.metadata
        }
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error);

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
          errorCode: error.code || error.status,
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
    // GPT-4 Vision models support vision
    return this.modelId.includes('vision') || this.modelId.includes('gpt-4o');
  }

  supportsJson(): boolean {
    // JSON mode is supported in gpt-4-turbo and gpt-3.5-turbo
    return this.modelId.includes('gpt-4') || this.modelId.includes('gpt-3.5');
  }

  /**
   * Map OpenAI finish reasons to standardized format
   */
  private mapFinishReason(
    reason: string | null | undefined
  ): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      case 'function_call':
      case 'tool_calls':
        return 'stop'; // Treat function/tool calls as normal completion
      default:
        return 'error';
    }
  }

  /**
   * Enhanced health check for OpenAI
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test with minimal request
      const response = await this.client.chat.completions.create({
        model: this.modelId,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      });

      return response.choices.length > 0;
    } catch (error: any) {
      console.error(`OpenAI provider health check failed:`, error.message);
      return false;
    }
  }
}
