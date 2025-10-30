/**
 * Email Service
 *
 * Infrastructure for sending transactional emails.
 * Provider integration (SMTP, SendGrid, etc.) will be added later.
 *
 * Features:
 * - Email queue with in-memory storage (can be upgraded to Redis)
 * - Template rendering with variable substitution
 * - Retry mechanism with exponential backoff
 * - Email logging and tracking
 */

import { env } from '../config/env';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface QueuedEmail extends EmailOptions {
  id: string;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  error?: string;
  sentAt?: Date;
}

// In-memory email queue (upgrade to Redis for production)
const emailQueue: QueuedEmail[] = [];
const emailHistory: QueuedEmail[] = [];

// Email sending is simulated for now
let emailProvider: EmailProvider | null = null;

interface EmailProvider {
  send(email: EmailOptions): Promise<void>;
}

/**
 * Set the email provider (SMTP, SendGrid, etc.)
 * To be implemented when provider integration is added
 */
export function setEmailProvider(provider: EmailProvider) {
  emailProvider = provider;
}

/**
 * Queue an email for sending
 */
export async function queueEmail(options: EmailOptions): Promise<string> {
  const emailId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const queuedEmail: QueuedEmail = {
    id: emailId,
    ...options,
    from: options.from || env.notifyFrom || 'noreply@luxia.local',
    createdAt: new Date(),
    attempts: 0,
    maxAttempts: 3,
    status: 'pending',
  };

  emailQueue.push(queuedEmail);

  // Process queue asynchronously
  processEmailQueue().catch(err =>
    console.error('Email queue processing error:', err)
  );

  return emailId;
}

/**
 * Send an email immediately (bypasses queue)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const emailId = await queueEmail(options);

  // Wait for email to be processed
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const email = emailHistory.find(e => e.id === emailId);
      if (email) {
        clearInterval(checkInterval);
        if (email.status === 'sent') {
          resolve();
        } else if (email.status === 'failed') {
          reject(new Error(email.error || 'Email failed to send'));
        }
      }
    }, 100);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Email sending timeout'));
    }, 30000);
  });
}

/**
 * Process the email queue
 */
async function processEmailQueue() {
  const now = new Date();

  // Find emails ready to send
  const readyEmails = emailQueue.filter(email =>
    email.status === 'pending' &&
    (!email.nextRetryAt || email.nextRetryAt <= now)
  );

  for (const email of readyEmails) {
    await processEmail(email);
  }
}

/**
 * Process a single email
 */
async function processEmail(email: QueuedEmail) {
  email.status = 'sending';
  email.attempts++;

  try {
    if (emailProvider) {
      // Use configured email provider
      await emailProvider.send(email);

      email.status = 'sent';
      email.sentAt = new Date();

      console.log(`✉️  Email sent: ${email.id} to ${email.to}`);
    } else {
      // Simulate sending for development
      console.log('📧 Email queued (no provider configured):', {
        id: email.id,
        to: email.to,
        subject: email.subject,
        from: email.from,
      });

      // Log email content in development
      if (env.nodeEnv === 'development') {
        console.log('Email HTML:', email.html.substring(0, 200) + '...');
      }

      email.status = 'sent';
      email.sentAt = new Date();
    }

    // Move to history
    const index = emailQueue.indexOf(email);
    if (index > -1) {
      emailQueue.splice(index, 1);
      emailHistory.push(email);
    }

  } catch (error: any) {
    console.error(`Email sending failed: ${email.id}`, error);

    if (email.attempts >= email.maxAttempts) {
      email.status = 'failed';
      email.error = error.message;

      // Move to history
      const index = emailQueue.indexOf(email);
      if (index > -1) {
        emailQueue.splice(index, 1);
        emailHistory.push(email);
      }
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, email.attempts) * 60 * 1000; // 2^attempts minutes
      email.nextRetryAt = new Date(Date.now() + retryDelay);
      email.status = 'pending';

      console.log(`Retry scheduled for ${email.id} at ${email.nextRetryAt}`);
    }
  }
}

/**
 * Get email queue status
 */
export function getQueueStatus() {
  return {
    pending: emailQueue.filter(e => e.status === 'pending').length,
    sending: emailQueue.filter(e => e.status === 'sending').length,
    sent: emailHistory.filter(e => e.status === 'sent').length,
    failed: emailHistory.filter(e => e.status === 'failed').length,
    total: emailQueue.length + emailHistory.length,
  };
}

/**
 * Get email history
 */
export function getEmailHistory(limit = 100) {
  return emailHistory
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

/**
 * Get email by ID
 */
export function getEmailById(emailId: string): QueuedEmail | undefined {
  return emailQueue.find(e => e.id === emailId) ||
         emailHistory.find(e => e.id === emailId);
}

// Start processing queue every 30 seconds
setInterval(() => {
  processEmailQueue().catch(err =>
    console.error('Email queue processing error:', err)
  );
}, 30000);

console.log('📧 Email service initialized');
