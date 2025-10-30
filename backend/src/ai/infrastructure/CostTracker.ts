/**
 * Cost Tracker
 *
 * Tracks AI usage and costs to PostgreSQL database
 * Provides usage statistics and analytics
 */

import { pool } from '../../db/client';
import { CostEntry } from '../types';

export class CostTracker {
  /**
   * Track a single AI operation
   *
   * @param entry Cost entry with usage details
   */
  async track(entry: CostEntry): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO ai_usage_log
         (provider, feature, admin_user_id, prompt_tokens, completion_tokens, total_tokens, cost_usd, latency_ms, model_id, success, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          entry.provider,
          entry.feature,
          entry.adminUserId || null,
          entry.tokens, // Will be stored as prompt_tokens (we'll refine this)
          0, // completion_tokens (can be tracked separately if needed)
          entry.tokens,
          entry.cost,
          entry.latency,
          'unknown', // model_id (can be passed in metadata)
          true, // success (assume success if we're tracking)
          null // metadata as JSONB
        ]
      );
    } catch (error) {
      // Don't throw errors for tracking failures
      console.error('Failed to track AI cost:', error);
    }
  }

  /**
   * Track with detailed usage information
   */
  async trackDetailed(
    provider: string,
    feature: string,
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
    cost: number,
    latency: number,
    modelId: string,
    success: boolean,
    adminUserId?: number,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO ai_usage_log
         (provider, feature, admin_user_id, prompt_tokens, completion_tokens, total_tokens, cost_usd, latency_ms, model_id, success, error_message, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          provider,
          feature,
          adminUserId || null,
          promptTokens,
          completionTokens,
          totalTokens,
          cost,
          latency,
          modelId,
          success,
          errorMessage || null,
          metadata ? JSON.stringify(metadata) : null
        ]
      );
    } catch (error) {
      console.error('Failed to track detailed AI usage:', error);
    }
  }

  /**
   * Get usage statistics for a time period
   *
   * @param startDate Start date for statistics
   * @param endDate End date for statistics
   * @param provider Optional provider filter
   * @param feature Optional feature filter
   * @returns Usage statistics
   */
  async getStats(
    startDate: Date,
    endDate: Date,
    provider?: string,
    feature?: string
  ): Promise<{
    totalRequests: number;
    totalCost: number;
    totalTokens: number;
    averageLatency: number;
    successRate: number;
    byProvider: Record<string, { requests: number; cost: number; tokens: number }>;
    byFeature: Record<string, { requests: number; cost: number; tokens: number }>;
  }> {
    try {
      // Build query with optional filters
      let whereClause = 'WHERE created_at >= $1 AND created_at <= $2';
      const params: any[] = [startDate, endDate];

      if (provider) {
        params.push(provider);
        whereClause += ` AND provider = $${params.length}`;
      }

      if (feature) {
        params.push(feature);
        whereClause += ` AND feature = $${params.length}`;
      }

      // Get overall stats
      const overallQuery = `
        SELECT
          COUNT(*) as total_requests,
          COALESCE(SUM(cost_usd), 0) as total_cost,
          COALESCE(SUM(total_tokens), 0) as total_tokens,
          COALESCE(AVG(latency_ms), 0) as average_latency,
          COALESCE(SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0), 0) as success_rate
        FROM ai_usage_log
        ${whereClause}
      `;

      const overallResult = await pool.query(overallQuery, params);
      const overall = overallResult.rows[0];

      // Get stats by provider
      const providerQuery = `
        SELECT
          provider,
          COUNT(*) as requests,
          COALESCE(SUM(cost_usd), 0) as cost,
          COALESCE(SUM(total_tokens), 0) as tokens
        FROM ai_usage_log
        ${whereClause}
        GROUP BY provider
        ORDER BY cost DESC
      `;

      const providerResult = await pool.query(providerQuery, params);
      const byProvider: Record<string, any> = {};
      for (const row of providerResult.rows) {
        byProvider[row.provider] = {
          requests: parseInt(row.requests),
          cost: parseFloat(row.cost),
          tokens: parseInt(row.tokens)
        };
      }

      // Get stats by feature
      const featureQuery = `
        SELECT
          feature,
          COUNT(*) as requests,
          COALESCE(SUM(cost_usd), 0) as cost,
          COALESCE(SUM(total_tokens), 0) as tokens
        FROM ai_usage_log
        ${whereClause}
        GROUP BY feature
        ORDER BY cost DESC
      `;

      const featureResult = await pool.query(featureQuery, params);
      const byFeature: Record<string, any> = {};
      for (const row of featureResult.rows) {
        byFeature[row.feature] = {
          requests: parseInt(row.requests),
          cost: parseFloat(row.cost),
          tokens: parseInt(row.tokens)
        };
      }

      return {
        totalRequests: parseInt(overall.total_requests),
        totalCost: parseFloat(overall.total_cost),
        totalTokens: parseInt(overall.total_tokens),
        averageLatency: parseFloat(overall.average_latency),
        successRate: parseFloat(overall.success_rate),
        byProvider,
        byFeature
      };
    } catch (error) {
      console.error('Failed to get AI usage stats:', error);
      return {
        totalRequests: 0,
        totalCost: 0,
        totalTokens: 0,
        averageLatency: 0,
        successRate: 0,
        byProvider: {},
        byFeature: {}
      };
    }
  }

  /**
   * Get recent usage logs
   *
   * @param limit Number of logs to retrieve
   * @param adminUserId Optional filter by admin user
   * @returns Recent log entries
   */
  async getRecentLogs(limit: number = 50, adminUserId?: number): Promise<any[]> {
    try {
      let query = `
        SELECT
          id,
          provider,
          feature,
          admin_user_id,
          prompt_tokens,
          completion_tokens,
          total_tokens,
          cost_usd,
          latency_ms,
          model_id,
          success,
          error_message,
          metadata,
          created_at
        FROM ai_usage_log
      `;

      const params: any[] = [];

      if (adminUserId) {
        query += ' WHERE admin_user_id = $1';
        params.push(adminUserId);
        query += ' ORDER BY created_at DESC LIMIT $2';
        params.push(limit);
      } else {
        query += ' ORDER BY created_at DESC LIMIT $1';
        params.push(limit);
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to get recent AI logs:', error);
      return [];
    }
  }
}
