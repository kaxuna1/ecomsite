/**
 * Notification Service
 *
 * High-level notification service for sending emails about reviews.
 * Integrates with emailService and emailTemplates.
 */

import { queueEmail } from './emailService';
import { renderEmailTemplate } from './emailTemplates';
import { env } from '../config/env';
import type { ProductReview, ReviewWithDetails } from '../types/reviews';

const SITE_URL = env.nodeEnv === 'production'
  ? 'https://luxia.com' // Update with actual production URL
  : 'http://localhost:5173';

const ADMIN_URL = env.nodeEnv === 'production'
  ? 'https://luxia.com/admin'
  : 'http://localhost:5173/admin';

/**
 * Send notification when a customer submits a review
 */
export async function notifyReviewSubmitted(
  review: ProductReview & { productName?: string; productImageUrl?: string },
  customerEmail?: string,
  customerName?: string
): Promise<void> {
  if (!customerEmail) return;

  const { subject, html, text } = renderEmailTemplate('reviewSubmittedCustomer', {
    customerName: customerName || review.reviewerName || 'Customer',
    productName: review.productName || 'Product',
    productUrl: `${SITE_URL}/en/products/${review.productId}`,
    rating: review.rating,
    reviewTitle: review.title,
    reviewText: review.reviewText,
    siteUrl: SITE_URL,
  });

  await queueEmail({
    to: customerEmail,
    subject,
    html,
    text,
  });

  console.log(`📧 Review submitted notification queued for ${customerEmail}`);
}

/**
 * Send notification when a review is approved
 */
export async function notifyReviewApproved(
  review: ReviewWithDetails
): Promise<void> {
  const customerEmail = review.reviewerEmail || review.userEmail;
  if (!customerEmail) return;

  const { subject, html, text } = renderEmailTemplate('reviewApproved', {
    customerName: review.reviewerName || review.userName || 'Customer',
    productName: review.productName || 'Product',
    productUrl: `${SITE_URL}/en/products/${review.productId}#reviews`,
    rating: review.rating,
    reviewTitle: review.title,
    reviewText: review.reviewText,
    siteUrl: SITE_URL,
  });

  await queueEmail({
    to: customerEmail,
    subject,
    html,
    text,
  });

  console.log(`📧 Review approved notification queued for ${customerEmail}`);
}

/**
 * Send notification when admin responds to a review
 */
export async function notifyReviewResponse(
  review: ReviewWithDetails,
  responseText: string
): Promise<void> {
  const customerEmail = review.reviewerEmail || review.userEmail;
  if (!customerEmail) return;

  const { subject, html, text } = renderEmailTemplate('reviewResponse', {
    customerName: review.reviewerName || review.userName || 'Customer',
    productName: review.productName || 'Product',
    productUrl: `${SITE_URL}/en/products/${review.productId}#reviews`,
    rating: review.rating,
    reviewTitle: review.title,
    reviewText: review.reviewText,
    responseText,
    siteUrl: SITE_URL,
  });

  await queueEmail({
    to: customerEmail,
    subject,
    html,
    text,
  });

  console.log(`📧 Review response notification queued for ${customerEmail}`);
}

/**
 * Send review reminder to customer after purchase
 */
export async function sendReviewReminder(
  customerEmail: string,
  customerName: string,
  productId: number,
  productName: string,
  productImageUrl?: string,
  orderId?: number
): Promise<void> {
  const reviewUrl = `${SITE_URL}/en/products/${productId}?orderId=${orderId || ''}#write-review`;

  const { subject, html, text } = renderEmailTemplate('reviewReminder', {
    customerName,
    productName,
    productImageUrl: productImageUrl || '',
    reviewUrl,
    siteUrl: SITE_URL,
  });

  await queueEmail({
    to: customerEmail,
    subject,
    html,
    text,
  });

  console.log(`📧 Review reminder queued for ${customerEmail}`);
}

/**
 * Send notification to admin when new review is submitted
 */
export async function notifyAdminNewReview(
  review: ReviewWithDetails
): Promise<void> {
  // Get admin email from environment or use default
  const adminEmail = env.notifyAdminEmail || 'admin@luxia.local';

  const { subject, html, text } = renderEmailTemplate('newReviewAdmin', {
    productName: review.productName || 'Product',
    reviewerName: review.reviewerName || review.userName || 'Anonymous',
    reviewerEmail: review.reviewerEmail || review.userEmail || '',
    isVerifiedPurchase: review.isVerifiedPurchase,
    rating: review.rating,
    reviewTitle: review.title,
    reviewText: review.reviewText,
    adminReviewUrl: `${ADMIN_URL}/reviews`,
    siteUrl: SITE_URL,
  });

  await queueEmail({
    to: adminEmail,
    subject,
    html,
    text,
  });

  console.log(`📧 New review notification queued for admin ${adminEmail}`);
}

/**
 * Batch send review reminders for orders
 * This can be called by a cron job
 */
export async function sendBatchReviewReminders(
  orders: Array<{
    customerEmail: string;
    customerName: string;
    items: Array<{
      productId: number;
      productName: string;
      productImageUrl?: string;
    }>;
    orderId: number;
  }>
): Promise<number> {
  let sent = 0;

  for (const order of orders) {
    for (const item of order.items) {
      try {
        await sendReviewReminder(
          order.customerEmail,
          order.customerName,
          item.productId,
          item.productName,
          item.productImageUrl,
          order.orderId
        );
        sent++;
      } catch (error) {
        console.error(`Failed to send review reminder:`, error);
      }
    }
  }

  console.log(`📧 Sent ${sent} review reminders`);
  return sent;
}
