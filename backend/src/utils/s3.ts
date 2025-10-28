import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env';

export const s3Client = new S3Client({
  region: env.s3Region,
  endpoint: env.s3Endpoint,
  forcePathStyle: env.s3ForcePathStyle,
  credentials:
    env.s3AccessKeyId && env.s3SecretAccessKey
      ? {
          accessKeyId: env.s3AccessKeyId,
          secretAccessKey: env.s3SecretAccessKey
        }
      : undefined
});

export const publicUrlForKey = (key: string) => {
  if (env.s3PublicUrl) {
    return `${env.s3PublicUrl.replace(/\/$/, '')}/${key}`;
  }

  const baseHost = `https://${env.s3Bucket}.s3.${env.s3Region}.amazonaws.com`;
  return `${baseHost}/${key}`;
};
