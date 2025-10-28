import { pool } from '../db/client';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodeCreatePayload {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: Date;
  validUntil: Date;
  isActive?: boolean;
  createdBy?: number;
}

export interface PromoCodeValidationResult {
  valid: boolean;
  promoCode?: PromoCode;
  discountAmount?: number;
  error?: string;
}

const mapPromoCode = (row: any): PromoCode => ({
  id: row.id,
  code: row.code,
  description: row.description,
  discountType: row.discount_type,
  discountValue: parseFloat(row.discount_value),
  minOrderAmount: row.min_order_amount ? parseFloat(row.min_order_amount) : null,
  maxDiscountAmount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : null,
  usageLimit: row.usage_limit,
  usageCount: row.usage_count,
  perUserLimit: row.per_user_limit,
  validFrom: row.valid_from,
  validUntil: row.valid_until,
  isActive: row.is_active,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const promoCodeService = {
  /**
   * Get all promo codes (admin)
   */
  async list(): Promise<PromoCode[]> {
    const result = await pool.query(
      'SELECT * FROM promo_codes ORDER BY created_at DESC'
    );
    return result.rows.map(mapPromoCode);
  },

  /**
   * Get promo code by ID
   */
  async getById(id: number): Promise<PromoCode | null> {
    const result = await pool.query(
      'SELECT * FROM promo_codes WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return null;
    return mapPromoCode(result.rows[0]);
  },

  /**
   * Get promo code by code string
   */
  async getByCode(code: string): Promise<PromoCode | null> {
    const result = await pool.query(
      'SELECT * FROM promo_codes WHERE UPPER(code) = UPPER($1)',
      [code]
    );
    if (result.rows.length === 0) return null;
    return mapPromoCode(result.rows[0]);
  },

  /**
   * Create new promo code
   */
  async create(payload: PromoCodeCreatePayload): Promise<PromoCode> {
    const result = await pool.query(
      `INSERT INTO promo_codes (
        code, description, discount_type, discount_value,
        min_order_amount, max_discount_amount, usage_limit, per_user_limit,
        valid_from, valid_until, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        payload.code.toUpperCase(),
        payload.description || null,
        payload.discountType,
        payload.discountValue,
        payload.minOrderAmount || null,
        payload.maxDiscountAmount || null,
        payload.usageLimit || null,
        payload.perUserLimit || null,
        payload.validFrom,
        payload.validUntil,
        payload.isActive !== undefined ? payload.isActive : true,
        payload.createdBy || null
      ]
    );
    return mapPromoCode(result.rows[0]);
  },

  /**
   * Update promo code
   */
  async update(id: number, payload: Partial<PromoCodeCreatePayload>): Promise<PromoCode | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (payload.code !== undefined) {
      updates.push(`code = $${paramCount++}`);
      values.push(payload.code.toUpperCase());
    }
    if (payload.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(payload.description);
    }
    if (payload.discountType !== undefined) {
      updates.push(`discount_type = $${paramCount++}`);
      values.push(payload.discountType);
    }
    if (payload.discountValue !== undefined) {
      updates.push(`discount_value = $${paramCount++}`);
      values.push(payload.discountValue);
    }
    if (payload.minOrderAmount !== undefined) {
      updates.push(`min_order_amount = $${paramCount++}`);
      values.push(payload.minOrderAmount);
    }
    if (payload.maxDiscountAmount !== undefined) {
      updates.push(`max_discount_amount = $${paramCount++}`);
      values.push(payload.maxDiscountAmount);
    }
    if (payload.usageLimit !== undefined) {
      updates.push(`usage_limit = $${paramCount++}`);
      values.push(payload.usageLimit);
    }
    if (payload.perUserLimit !== undefined) {
      updates.push(`per_user_limit = $${paramCount++}`);
      values.push(payload.perUserLimit);
    }
    if (payload.validFrom !== undefined) {
      updates.push(`valid_from = $${paramCount++}`);
      values.push(payload.validFrom);
    }
    if (payload.validUntil !== undefined) {
      updates.push(`valid_until = $${paramCount++}`);
      values.push(payload.validUntil);
    }
    if (payload.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(payload.isActive);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE promo_codes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return mapPromoCode(result.rows[0]);
  },

  /**
   * Delete promo code
   */
  async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM promo_codes WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Validate promo code and calculate discount
   */
  async validate(
    code: string,
    cartTotal: number,
    userId?: number
  ): Promise<PromoCodeValidationResult> {
    // Get promo code
    const promoCode = await this.getByCode(code);

    if (!promoCode) {
      return { valid: false, error: 'Promo code not found' };
    }

    // Check if active
    if (!promoCode.isActive) {
      return { valid: false, error: 'This promo code is no longer active' };
    }

    // Check date validity
    const now = new Date();
    const validFrom = new Date(promoCode.validFrom);
    const validUntil = new Date(promoCode.validUntil);

    if (now < validFrom) {
      return { valid: false, error: 'This promo code is not yet valid' };
    }

    if (now > validUntil) {
      return { valid: false, error: 'This promo code has expired' };
    }

    // Check usage limit
    if (promoCode.usageLimit !== null && promoCode.usageCount >= promoCode.usageLimit) {
      return { valid: false, error: 'This promo code has reached its usage limit' };
    }

    // Check per-user limit
    if (userId && promoCode.perUserLimit !== null) {
      const usageResult = await pool.query(
        'SELECT COUNT(*) as count FROM promo_code_usage WHERE promo_code_id = $1 AND user_id = $2',
        [promoCode.id, userId]
      );
      const userUsageCount = parseInt(usageResult.rows[0].count);

      if (userUsageCount >= promoCode.perUserLimit) {
        return { valid: false, error: 'You have already used this promo code the maximum number of times' };
      }
    }

    // Check minimum order amount
    if (promoCode.minOrderAmount !== null && cartTotal < promoCode.minOrderAmount) {
      return {
        valid: false,
        error: `Minimum order amount of $${promoCode.minOrderAmount.toFixed(2)} required`
      };
    }

    // Calculate discount amount
    let discountAmount = 0;

    if (promoCode.discountType === 'PERCENTAGE') {
      discountAmount = (cartTotal * promoCode.discountValue) / 100;

      // Apply max discount cap if set
      if (promoCode.maxDiscountAmount !== null && discountAmount > promoCode.maxDiscountAmount) {
        discountAmount = promoCode.maxDiscountAmount;
      }
    } else if (promoCode.discountType === 'FIXED_AMOUNT') {
      discountAmount = promoCode.discountValue;

      // Don't allow discount to exceed cart total
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
      }
    } else if (promoCode.discountType === 'FREE_SHIPPING') {
      // Free shipping - discount amount is handled separately
      discountAmount = 0;
    }

    return {
      valid: true,
      promoCode,
      discountAmount: Math.round(discountAmount * 100) / 100 // Round to 2 decimals
    };
  },

  /**
   * Record promo code usage
   */
  async recordUsage(
    promoCodeId: number,
    orderId: number,
    discountApplied: number,
    userId?: number
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert usage record
      await client.query(
        `INSERT INTO promo_code_usage (promo_code_id, user_id, order_id, discount_applied)
         VALUES ($1, $2, $3, $4)`,
        [promoCodeId, userId || null, orderId, discountApplied]
      );

      // Increment usage count
      await client.query(
        'UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = $1',
        [promoCodeId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get usage statistics for a promo code
   */
  async getStats(promoCodeId: number) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_uses,
        SUM(discount_applied) as total_discount,
        AVG(discount_applied) as avg_discount,
        COUNT(DISTINCT user_id) as unique_users
       FROM promo_code_usage
       WHERE promo_code_id = $1`,
      [promoCodeId]
    );

    return {
      usageCount: parseInt(result.rows[0].total_uses) || 0,
      totalDiscountGiven: parseFloat(result.rows[0].total_discount) || 0,
      averageOrderValue: parseFloat(result.rows[0].avg_discount) || 0,
      uniqueUsers: parseInt(result.rows[0].unique_users) || 0
    };
  }
};
