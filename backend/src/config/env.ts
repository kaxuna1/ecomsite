import dotenv from 'dotenv';

dotenv.config();

const required = (value: string | undefined, fallback?: string) => {
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error('Missing required environment variable');
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  dbPath: process.env.DATABASE_PATH ?? './data/luxia.db',
  jwtSecret: required(process.env.JWT_SECRET, 'super-secret-key'),
  adminEmail: required(process.env.ADMIN_EMAIL, 'concierge@luxia.local'),
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  notifyFrom: process.env.NOTIFY_FROM ?? 'Luxia Rituals <no-reply@luxia.local>',
  smsFrom: process.env.SMS_FROM,
  smsWebhookUrl: process.env.SMS_WEBHOOK_URL,
  smsApiKey: process.env.SMS_API_KEY
};
