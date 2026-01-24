/**
 * Storage Service
 * 
 * Handles file uploads using S3-compatible storage (AWS S3, DigitalOcean Spaces, MinIO, etc.)
 * Configuration is read from the API keys database for runtime flexibility.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAPIKey } from './apiKeysService';
import sharp from 'sharp';

// S3 Configuration interface
export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
  bucket: string;
  publicUrl?: string; // Optional CDN URL
}

// Cache the S3 client to avoid recreating on every request
let s3ClientCache: { client: S3Client; config: S3Config } | null = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute cache

/**
 * Get S3 configuration from API keys database
 */
export async function getS3Config(): Promise<S3Config | null> {
  const [accessKeyId, secretAccessKey, endpoint, region, bucket, publicUrl] = await Promise.all([
    getAPIKey('s3_access_key'),
    getAPIKey('s3_secret_key'),
    getAPIKey('s3_endpoint'),
    getAPIKey('s3_region'),
    getAPIKey('s3_bucket'),
    getAPIKey('s3_public_url')
  ]);

  // All required fields must be present
  if (!accessKeyId || !secretAccessKey || !endpoint || !region || !bucket) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint,
    region,
    bucket,
    publicUrl: publicUrl || undefined
  };
}

/**
 * Check if S3 storage is configured
 */
export async function isS3Configured(): Promise<boolean> {
  const config = await getS3Config();
  return config !== null;
}

/**
 * Get or create S3 client with current configuration
 */
export async function getS3Client(): Promise<{ client: S3Client; config: S3Config } | null> {
  const now = Date.now();
  
  // Return cached client if still valid
  if (s3ClientCache && (now - configCacheTime) < CONFIG_CACHE_TTL) {
    return s3ClientCache;
  }

  const config = await getS3Config();
  if (!config) {
    s3ClientCache = null;
    return null;
  }

  // Create new S3 client
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true, // Required for most S3-compatible services
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });

  s3ClientCache = { client, config };
  configCacheTime = now;

  return s3ClientCache;
}

/**
 * Clear the S3 client cache (call after updating S3 configuration)
 */
export function clearS3ClientCache(): void {
  s3ClientCache = null;
  configCacheTime = 0;
}

/**
 * Upload a file to S3
 * 
 * @param key - The S3 object key (path/filename)
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file
 * @param metadata - Optional metadata
 * @returns Public URL of the uploaded file
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  mimeType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const s3 = await getS3Client();
  if (!s3) {
    throw new Error('S3 storage is not configured. Please configure S3 credentials in Settings > API Keys.');
  }

  const { client, config } = s3;

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    Metadata: metadata,
    ACL: 'public-read' // Make files publicly readable
  });

  await client.send(command);

  return getPublicUrl(key, config);
}

/**
 * Upload and optimize an image to S3
 * 
 * @param key - The S3 object key (without extension, .webp will be added)
 * @param buffer - Image buffer
 * @param options - Optimization options
 * @returns Object with public URL and image metadata
 */
export async function uploadImageToS3(
  key: string,
  buffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): Promise<{
  url: string;
  key: string;
  width: number | null;
  height: number | null;
  mimeType: string;
}> {
  const {
    maxWidth = 2560,
    maxHeight = 2560,
    quality = 90,
    format = 'webp'
  } = options;

  // Ensure key has correct extension
  const finalKey = key.replace(/\.[^/.]+$/, '') + '.' + format;

  // Process image with sharp
  const image = sharp(buffer);
  const metadata = await image.metadata();

  let width = metadata.width || null;
  let height = metadata.height || null;

  // Resize if necessary and convert to desired format
  let processedBuffer: Buffer;
  let mimeType: string;

  switch (format) {
    case 'jpeg':
      processedBuffer = await image
        .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();
      mimeType = 'image/jpeg';
      break;
    case 'png':
      processedBuffer = await image
        .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
        .png({ quality })
        .toBuffer();
      mimeType = 'image/png';
      break;
    case 'webp':
    default:
      processedBuffer = await image
        .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();
      mimeType = 'image/webp';
      break;
  }

  // Get dimensions after processing
  const processedMetadata = await sharp(processedBuffer).metadata();
  width = processedMetadata.width || null;
  height = processedMetadata.height || null;

  // Upload to S3
  const url = await uploadToS3(finalKey, processedBuffer, mimeType, {
    'original-width': String(metadata.width || ''),
    'original-height': String(metadata.height || '')
  });

  return {
    url,
    key: finalKey,
    width,
    height,
    mimeType
  };
}

/**
 * Delete a file from S3
 * 
 * @param key - The S3 object key
 * @returns True if deleted successfully
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  const s3 = await getS3Client();
  if (!s3) {
    console.warn('S3 storage is not configured, cannot delete file');
    return false;
  }

  const { client, config } = s3;

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return false;
  }
}

/**
 * Check if a file exists in S3
 * 
 * @param key - The S3 object key
 * @returns True if file exists
 */
export async function existsInS3(key: string): Promise<boolean> {
  const s3 = await getS3Client();
  if (!s3) {
    return false;
  }

  const { client, config } = s3;

  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Get a signed URL for temporary access to a private file
 * 
 * @param key - The S3 object key
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedUrlForS3(key: string, expiresIn: number = 3600): Promise<string | null> {
  const s3 = await getS3Client();
  if (!s3) {
    return null;
  }

  const { client, config } = s3;

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate public URL for an S3 object
 * 
 * @param key - The S3 object key
 * @param config - S3 configuration
 * @returns Public URL
 */
export function getPublicUrl(key: string, config: S3Config): string {
  // Use custom public URL if configured (e.g., CDN)
  if (config.publicUrl) {
    const baseUrl = config.publicUrl.replace(/\/$/, '');
    return `${baseUrl}/${key}`;
  }

  // Parse endpoint to determine URL format
  const endpoint = config.endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // DigitalOcean Spaces format: https://bucket.region.digitaloceanspaces.com/key
  if (endpoint.includes('digitaloceanspaces.com')) {
    return `https://${config.bucket}.${config.region}.digitaloceanspaces.com/${key}`;
  }
  
  // AWS S3 format: https://bucket.s3.region.amazonaws.com/key
  if (endpoint.includes('amazonaws.com')) {
    return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  }

  // Generic S3-compatible format: endpoint/bucket/key
  const protocol = config.endpoint.startsWith('https') ? 'https' : 'http';
  return `${protocol}://${endpoint}/${config.bucket}/${key}`;
}

/**
 * Generate a unique key for uploading
 * 
 * @param originalFilename - Original file name
 * @param folder - Optional folder prefix
 * @returns Unique S3 key
 */
export function generateUniqueKey(originalFilename: string, folder: string = 'media'): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const sanitizedName = originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${folder}/${timestamp}-${randomString}-${sanitizedName}`;
}

/**
 * Test S3 connection with current configuration
 * 
 * @returns Object with success status and message
 */
export async function testS3Connection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getS3Config();
    if (!config) {
      return {
        success: false,
        message: 'S3 is not configured. Please fill in all required fields.'
      };
    }

    const s3 = await getS3Client();
    if (!s3) {
      return {
        success: false,
        message: 'Failed to create S3 client.'
      };
    }

    // Try to upload a small test file
    const testKey = `test/connection-test-${Date.now()}.txt`;
    const testContent = Buffer.from('Connection test - ' + new Date().toISOString());

    const putCommand = new PutObjectCommand({
      Bucket: config.bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    });

    await s3.client.send(putCommand);

    // Clean up test file
    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: testKey
    });

    await s3.client.send(deleteCommand);

    // Clear cache to ensure fresh connection on next request
    clearS3ClientCache();

    return {
      success: true,
      message: 'Successfully connected to S3 storage.'
    };
  } catch (error: any) {
    console.error('S3 connection test failed:', error);
    
    // Clear cache on error
    clearS3ClientCache();
    
    // Provide user-friendly error messages
    if (error.name === 'InvalidAccessKeyId' || error.Code === 'InvalidAccessKeyId') {
      return {
        success: false,
        message: 'Invalid Access Key ID. Please check your credentials.'
      };
    }
    
    if (error.name === 'SignatureDoesNotMatch' || error.Code === 'SignatureDoesNotMatch') {
      return {
        success: false,
        message: 'Invalid Secret Access Key. Please check your credentials.'
      };
    }
    
    if (error.name === 'NoSuchBucket' || error.Code === 'NoSuchBucket') {
      return {
        success: false,
        message: 'Bucket does not exist. Please check the bucket name.'
      };
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: 'Cannot connect to endpoint. Please check the endpoint URL.'
      };
    }

    return {
      success: false,
      message: `Connection failed: ${error.message || 'Unknown error'}`
    };
  }
}
