/**
 * Cache Manager
 *
 * In-memory caching for AI responses with TTL support
 * Uses SHA-256 hashing for cache key generation
 */

import { createHash } from 'crypto';
import { GenerateTextParams, GenerateTextResponse } from '../types';

interface CacheEntry {
  response: GenerateTextResponse;
  timestamp: number;
  expiresAt: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private defaultTTL: number; // in seconds

  constructor(maxSize: number = 1000, defaultTTL: number = 3600) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;

    // Start cleanup interval (every 5 minutes)
    this.startCleanupInterval();
  }

  /**
   * Generate cache key from prompt parameters
   * Uses SHA-256 hash of relevant parameters
   */
  generateCacheKey(params: GenerateTextParams, provider: string): string {
    const keyData = {
      provider,
      prompt: params.prompt,
      systemPrompt: params.systemPrompt || '',
      maxTokens: params.maxTokens,
      temperature: params.temperature,
      topP: params.topP,
      responseFormat: params.responseFormat
    };

    const keyString = JSON.stringify(keyData);
    return createHash('sha256').update(keyString).digest('hex');
  }

  /**
   * Get cached response if available and not expired
   */
  get(key: string): GenerateTextResponse | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  /**
   * Store response in cache with TTL
   */
  set(key: string, response: GenerateTextResponse, ttl?: number): void {
    // If cache is full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const ttlSeconds = ttl || this.defaultTTL;
    const now = Date.now();

    const entry: CacheEntry = {
      response,
      timestamp: now,
      expiresAt: now + ttlSeconds * 1000
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove a specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Evict oldest cache entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    // Find oldest entry
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Remove expired entries (cleanup job)
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }
}
