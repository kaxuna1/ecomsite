/**
 * Newsletter Service
 *
 * Handles newsletter subscription operations
 */

import { pool } from '../db/client';

export interface NewsletterSubscription {
  id: number;
  email: string;
  name?: string;
  source: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  subscribed_at: Date;
  unsubscribed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSubscriptionData {
  email: string;
  name?: string;
  source?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
}

export interface UpdateSubscriptionData {
  name?: string;
  status?: 'active' | 'unsubscribed' | 'bounced';
  metadata?: any;
}

export interface SubscriptionFilters {
  status?: string;
  source?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Create a new newsletter subscription
 */
export async function createSubscription(data: CreateSubscriptionData): Promise<NewsletterSubscription> {
  const {
    email,
    name,
    source = 'website',
    ip_address,
    user_agent,
    metadata
  } = data;

  // Check if email already exists
  const existingCheck = await pool.query(
    'SELECT id, status FROM newsletter_subscriptions WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  // If already subscribed and active, return error
  if (existingCheck.rows.length > 0 && existingCheck.rows[0].status === 'active') {
    throw new Error('This email is already subscribed');
  }

  // If previously unsubscribed, reactivate
  if (existingCheck.rows.length > 0) {
    const result = await pool.query(
      `UPDATE newsletter_subscriptions
       SET status = 'active',
           name = COALESCE($2, name),
           source = $3,
           ip_address = $4,
           user_agent = $5,
           metadata = COALESCE($6, metadata),
           subscribed_at = CURRENT_TIMESTAMP,
           unsubscribed_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [existingCheck.rows[0].id, name, source, ip_address, user_agent, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
  }

  // Create new subscription
  const result = await pool.query(
    `INSERT INTO newsletter_subscriptions
     (email, name, source, status, ip_address, user_agent, metadata)
     VALUES ($1, $2, $3, 'active', $4, $5, $6)
     RETURNING *`,
    [email.toLowerCase(), name, source, ip_address, user_agent, metadata ? JSON.stringify(metadata) : null]
  );

  return result.rows[0];
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(id: number): Promise<NewsletterSubscription | null> {
  const result = await pool.query(
    'SELECT * FROM newsletter_subscriptions WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Get subscription by email
 */
export async function getSubscriptionByEmail(email: string): Promise<NewsletterSubscription | null> {
  const result = await pool.query(
    'SELECT * FROM newsletter_subscriptions WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  return result.rows[0] || null;
}

/**
 * List subscriptions with filters and pagination
 */
export async function listSubscriptions(filters: SubscriptionFilters = {}): Promise<{
  subscriptions: NewsletterSubscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const {
    status,
    source,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = filters;

  let query = 'SELECT * FROM newsletter_subscriptions WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) FROM newsletter_subscriptions WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  // Apply filters
  if (status) {
    query += ` AND status = $${paramIndex}`;
    countQuery += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (source) {
    query += ` AND source = $${paramIndex}`;
    countQuery += ` AND source = $${paramIndex}`;
    params.push(source);
    paramIndex++;
  }

  if (search) {
    query += ` AND (LOWER(email) LIKE LOWER($${paramIndex}) OR LOWER(name) LIKE LOWER($${paramIndex}))`;
    countQuery += ` AND (LOWER(email) LIKE LOWER($${paramIndex}) OR LOWER(name) LIKE LOWER($${paramIndex}))`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND created_at >= $${paramIndex}`;
    countQuery += ` AND created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND created_at <= $${paramIndex}`;
    countQuery += ` AND created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  // Get total count
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // Add pagination
  const offset = (page - 1) * limit;
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  // Get subscriptions
  const result = await pool.query(query, params);

  return {
    subscriptions: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Update subscription
 */
export async function updateSubscription(
  id: number,
  data: UpdateSubscriptionData
): Promise<NewsletterSubscription> {
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex}`);
    params.push(data.name);
    paramIndex++;
  }

  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex}`);
    params.push(data.status);
    paramIndex++;

    // If unsubscribing, set unsubscribed_at
    if (data.status === 'unsubscribed') {
      updates.push(`unsubscribed_at = CURRENT_TIMESTAMP`);
    }
  }

  if (data.metadata !== undefined) {
    updates.push(`metadata = $${paramIndex}`);
    params.push(JSON.stringify(data.metadata));
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  const query = `
    UPDATE newsletter_subscriptions
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    throw new Error('Subscription not found');
  }

  return result.rows[0];
}

/**
 * Delete subscription
 */
export async function deleteSubscription(id: number): Promise<void> {
  const result = await pool.query(
    'DELETE FROM newsletter_subscriptions WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Subscription not found');
  }
}

/**
 * Unsubscribe by email
 */
export async function unsubscribeByEmail(email: string): Promise<void> {
  const result = await pool.query(
    `UPDATE newsletter_subscriptions
     SET status = 'unsubscribed',
         unsubscribed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE LOWER(email) = LOWER($1) AND status = 'active'
     RETURNING id`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Active subscription not found for this email');
  }
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<{
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  sources: { source: string; count: number }[];
}> {
  // Get total counts by status
  const statusResult = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'active') as active,
      COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed,
      COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_count,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_count,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month_count
    FROM newsletter_subscriptions
  `);

  // Get counts by source
  const sourceResult = await pool.query(`
    SELECT source, COUNT(*) as count
    FROM newsletter_subscriptions
    WHERE status = 'active'
    GROUP BY source
    ORDER BY count DESC
    LIMIT 10
  `);

  const stats = statusResult.rows[0];

  return {
    total: parseInt(stats.total),
    active: parseInt(stats.active),
    unsubscribed: parseInt(stats.unsubscribed),
    bounced: parseInt(stats.bounced),
    todayCount: parseInt(stats.today_count),
    weekCount: parseInt(stats.week_count),
    monthCount: parseInt(stats.month_count),
    sources: sourceResult.rows.map(row => ({
      source: row.source,
      count: parseInt(row.count)
    }))
  };
}

/**
 * Export subscriptions to CSV format
 */
export async function exportSubscriptionsToCSV(filters: SubscriptionFilters = {}): Promise<string> {
  // Get all subscriptions matching filters (no pagination)
  const { subscriptions } = await listSubscriptions({
    ...filters,
    page: 1,
    limit: 100000 // Get all
  });

  // CSV header
  const headers = [
    'ID',
    'Email',
    'Name',
    'Status',
    'Source',
    'IP Address',
    'Subscribed At',
    'Unsubscribed At',
    'Created At'
  ];

  // CSV rows
  const rows = subscriptions.map(sub => [
    sub.id,
    sub.email,
    sub.name || '',
    sub.status,
    sub.source,
    sub.ip_address || '',
    sub.subscribed_at ? new Date(sub.subscribed_at).toISOString() : '',
    sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toISOString() : '',
    sub.created_at ? new Date(sub.created_at).toISOString() : ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}
