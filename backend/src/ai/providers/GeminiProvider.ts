/**
 * Gemini Provider Implementation
 *
 * Implements AI provider interface for Google's Gemini models
 * Uses the official @google/genai SDK (no direct HTTP calls)
 */

import { GoogleGenAI } from '@google/genai';
import { BaseProvider } from './BaseProvider';
import {
  GenerateTextParams,
  GenerateTextResponse,
  ProviderConfig
} from '../types';
import { getModelCostPerToken } from '../config';

export class GeminiProvider extends BaseProvider {
  private client: GoogleGenAI;
  public readonly name: string = 'gemini';
  public readonly modelId: string;

  constructor(config: ProviderConfig, apiKey: string) {
    super(config, apiKey);
    this.validateApiKey();

    this.modelId = config.defaultModel || 'gemini-3-flash-preview';
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  /**
   * Generate text using Gemini's generateContent API
   */
  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    const startTime = Date.now();

    try {
      const response = await this.retryWithBackoff(async () => {
        return this.client.models.generateContent({
          model: this.modelId,
          contents: params.prompt,
          config: {
            systemInstruction: params.systemPrompt,
            temperature: params.temperature !== undefined ? params.temperature : 0.7,
            topP: params.topP,
            stopSequences: params.stopSequences,
            maxOutputTokens: params.maxTokens || 1000,
            responseMimeType: params.responseFormat === 'json'
              ? 'application/json'
              : 'text/plain'
          }
        });
      });

      const latency = Date.now() - startTime;
      const content = response.text || '';

      const usage = response.usageMetadata;
      const promptTokens = usage?.promptTokenCount || 0;
      const completionTokens = usage?.candidatesTokenCount || 0;
      const totalTokens = usage?.totalTokenCount || promptTokens + completionTokens;

      const costRates = getModelCostPerToken(this.modelId);
      const promptCostRate = costRates?.input ?? this.config.costPerPromptToken;
      const completionCostRate = costRates?.output ?? this.config.costPerCompletionToken;

      const totalCost = promptTokens > 0 || completionTokens > 0
        ? (promptTokens * promptCostRate) + (completionTokens * completionCostRate)
        : this.estimateCost(params);

      const finishReason = this.mapFinishReason(response.candidates?.[0]?.finishReason);

      return {
        content,
        finishReason,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens
        },
        cost: totalCost,
        latency,
        provider: this.name,
        modelId: this.modelId,
        metadata: {
          finishReasonRaw: response.candidates?.[0]?.finishReason,
          modelVersion: response.modelVersion,
          safetyRatings: response.candidates?.[0]?.safetyRatings,
          ...params.metadata
        }
      };
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsVision(): boolean {
    return true;
  }

  supportsJson(): boolean {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.models.generateContent({
        model: this.modelId,
        contents: 'Hi',
        config: {
          maxOutputTokens: 5
        }
      });

      return Boolean(response.text);
    } catch (error: any) {
      console.error('Gemini provider health check failed:', error.message);
      return false;
    }
  }

  private mapFinishReason(reason: any): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
      case 'RECITATION':
      case 'LANGUAGE':
      case 'BLOCKLIST':
        return 'content_filter';
      default:
        return reason ? 'error' : 'stop';
    }
  }
}
