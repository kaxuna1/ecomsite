/**
 * URL Helper Utilities
 * Generates proper URLs for static assets (images, files, etc.)
 */

/**
 * Get the base URL for the backend server
 * In development: http://localhost:4000
 * In production/Docker: can be configured via BASE_URL env variable
 */
export function getBaseUrl(): string {
  return process.env.BASE_URL || process.env.API_URL || 'http://localhost:4000';
}

/**
 * Convert a relative media path to an absolute URL
 * @param relativePath - Path like '/api/uploads/cms/filename.webp' or 'uploads/cms/filename.webp'
 * @returns Full URL like 'http://localhost:4000/api/uploads/cms/filename.webp'
 */
export function getAbsoluteMediaUrl(relativePath: string): string {
  const baseUrl = getBaseUrl();

  // Remove leading slash if present to avoid double slashes
  const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;

  // Ensure baseUrl doesn't end with slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return `${cleanBaseUrl}/${cleanPath}`;
}

/**
 * Get media URL for a filename
 * @param filename - Just the filename like '1234567890-abc-image.webp'
 * @param subdirectory - Subdirectory within uploads (default: 'cms')
 * @returns Full URL to the media file
 */
export function getMediaUrl(filename: string, subdirectory: string = 'cms'): string {
  return getAbsoluteMediaUrl(`api/uploads/${subdirectory}/${filename}`);
}
