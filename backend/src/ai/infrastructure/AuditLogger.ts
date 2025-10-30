/**
 * Audit Logger
 *
 * Logs all AI operations for compliance and debugging
 * Stores logs in PostgreSQL ai_usage_log table
 */

import { pool } from '../../db/client';
import { AuditLogEntry } from '../types';

export class AuditLogger {
  /**
   * Log an AI operation
   *
   * @param entry Audit log entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO ai_usage_log
         (provider, feature, admin_user_id, prompt_tokens, completion_tokens, total_tokens, cost_usd, latency_ms, model_id, success, error_message, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          entry.provider,
          entry.feature || null,
          null, // admin_user_id (will be set when available)
          entry.promptLength || 0,
          entry.responseLength || 0,
          (entry.promptLength || 0) + (entry.responseLength || 0),
          entry.cost || 0,
          0, // latency_ms (can be added if needed)
          'unknown', // model_id
          entry.success,
          entry.error || null,
          JSON.stringify({
            promptLength: entry.promptLength,
            responseLength: entry.responseLength,
            timestamp: entry.timestamp || new Date()
          })
        ]
      );
    } catch (error) {
      // Don't throw errors for audit logging failures
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Log AI operation with full details
   */
  async logDetailed(
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
      console.error('Failed to write detailed audit log:', error);
    }
  }

  /**
   * Log a successful AI operation
   */
  async logSuccess(
    provider: string,
    feature: string,
    promptTokens: number,
    completionTokens: number,
    cost: number,
    latency: number,
    modelId: string,
    adminUserId?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logDetailed(
      provider,
      feature,
      promptTokens,
      completionTokens,
      promptTokens + completionTokens,
      cost,
      latency,
      modelId,
      true,
      adminUserId,
      undefined,
      metadata
    );
  }

  /**
   * Log a failed AI operation
   */
  async logError(
    provider: string,
    feature: string,
    errorMessage: string,
    adminUserId?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logDetailed(
      provider,
      feature,
      0,
      0,
      0,
      0,
      0,
      'unknown',
      false,
      adminUserId,
      errorMessage,
      metadata
    );
  }

  /**
   * Get audit logs with filters
   *
   * @param options Filter options
   * @returns Audit log entries
   */
  async getLogs(options: {
    provider?: string;
    feature?: string;
    adminUserId?: number;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    limit?: number;
  }): Promise<any[]> {
    try {
      let query = 'SELECT * FROM ai_usage_log WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (options.provider) {
        query += ` AND provider = $${paramIndex}`;
        params.push(options.provider);
        paramIndex++;
      }

      if (options.feature) {
        query += ` AND feature = $${paramIndex}`;
        params.push(options.feature);
        paramIndex++;
      }

      if (options.adminUserId) {
        query += ` AND admin_user_id = $${paramIndex}`;
        params.push(options.adminUserId);
        paramIndex++;
      }

      if (options.startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(options.startDate);
        paramIndex++;
      }

      if (options.endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(options.endDate);
        paramIndex++;
      }

      if (options.success !== undefined) {
        query += ` AND success = $${paramIndex}`;
        params.push(options.success);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      if (options.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(options.limit);
      } else {
        query += ' LIMIT 100';
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit log statistics
   */
  async getStats(startDate: Date, endDate: Date): Promise<{
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    totalCost: number;
    averageLatency: number;
  }> {
    try {
      const result = await pool.query(
        `SELECT
           COUNT(*) as total_operations,
           SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_operations,
           SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_operations,
           COALESCE(SUM(cost_usd), 0) as total_cost,
           COALESCE(AVG(latency_ms), 0) as average_latency
         FROM ai_usage_log
         WHERE created_at >= $1 AND created_at <= $2`,
        [startDate, endDate]
      );

      const row = result.rows[0];

      return {
        totalOperations: parseInt(row.total_operations),
        successfulOperations: parseInt(row.successful_operations),
        failedOperations: parseInt(row.failed_operations),
        totalCost: parseFloat(row.total_cost),
        averageLatency: parseFloat(row.average_latency)
      };
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        totalCost: 0,
        averageLatency: 0
      };
    }
  }
}
