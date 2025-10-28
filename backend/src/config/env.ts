import dotenv from 'dotenv';

dotenv.config();

const required = (value: string | undefined, fallback?: string) => {
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error('Missing required environment variable');
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required(process.env.DATABASE_URL),
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: required(process.env.JWT_SECRET, 'super-secret-key'),
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  notifyFrom: process.env.NOTIFY_FROM ?? 'Luxia Rituals <no-reply@luxia.local>',
  smsFrom: process.env.SMS_FROM,
  smsWebhookUrl: process.env.SMS_WEBHOOK_URL,
  smsApiKey: process.env.SMS_API_KEY,
  s3Region: required(process.env.S3_REGION),
  s3Bucket: required(process.env.S3_BUCKET),
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  s3Endpoint: process.env.S3_ENDPOINT,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  s3PublicUrl: process.env.S3_PUBLIC_URL
};
