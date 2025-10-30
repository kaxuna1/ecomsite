import dotenv from 'dotenv';

dotenv.config();

const required = (value: string | undefined, fallback?: string) => {
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error('Missing required environment variable');
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  dbHost: process.env.DB_HOST ?? 'localhost',
  dbPort: Number(process.env.DB_PORT ?? 5432),
  dbName: process.env.DB_NAME ?? 'luxia',
  dbUser: process.env.DB_USER ?? 'postgres',
  dbPassword: process.env.DB_PASSWORD ?? '',
  jwtSecret: required(process.env.JWT_SECRET, 'super-secret-key'),
  adminEmail: required(process.env.ADMIN_EMAIL, 'concierge@luxia.local'),
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  notifyFrom: process.env.NOTIFY_FROM ?? 'Luxia Products <no-reply@luxia.local>',
  notifyAdminEmail: process.env.NOTIFY_ADMIN_EMAIL,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  smsFrom: process.env.SMS_FROM,
  smsWebhookUrl: process.env.SMS_WEBHOOK_URL,
  smsApiKey: process.env.SMS_API_KEY,
  // S3 Configuration (optional)
  s3Endpoint: process.env.S3_ENDPOINT,
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3Bucket: process.env.S3_BUCKET ?? '',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  s3PublicUrl: process.env.S3_PUBLIC_URL,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
};
