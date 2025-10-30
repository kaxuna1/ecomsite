/**
 * Simple in-memory rate limiter middleware
 *
 * For production, consider using express-rate-limit with Redis store
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Create rate limiter middleware
 *
 * @param options - Rate limit configuration
 * @returns Express middleware function
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req: Request) => {
      // Default: use IP address
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.socket.remoteAddress
        || 'unknown';
      return ip;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Create new entry or reset if window expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
      res.setHeader('Retry-After', retryAfter.toString());

      return res.status(429).json({
        message: 'Too many requests, please try again later',
        retryAfter: retryAfter
      });
    }

    // Increment counter (conditionally based on response status)
    if (!skipSuccessfulRequests && !skipFailedRequests) {
      // Always increment
      entry.count++;
    } else {
      // Store original end function
      const originalEnd = res.end;

      // Override end to conditionally increment
      res.end = function(this: Response, chunk?: any, encoding?: any, cb?: any) {
        const statusCode = res.statusCode;
        const isSuccess = statusCode >= 200 && statusCode < 300;
        const isFailed = statusCode >= 400;

        if (
          (!skipSuccessfulRequests || !isSuccess) &&
          (!skipFailedRequests || !isFailed)
        ) {
          entry!.count++;
        }

        // Call original end
        return originalEnd.call(this, chunk, encoding, cb);
      } as any;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

    next();
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Strict rate limiter for sensitive operations (10 requests per 15 minutes)
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10
});

// Moderate rate limiter for API endpoints (100 requests per 15 minutes)
export const moderateRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100
});

// Lenient rate limiter for general use (1000 requests per 15 minutes)
export const lenientRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000
});

// API keys specific rate limiter (30 requests per 15 minutes)
export const apiKeysRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30,
  keyGenerator: (req: Request) => {
    // Use combination of IP and admin user ID for more granular control
    const user = (req as any).user;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket.remoteAddress
      || 'unknown';
    return `api-keys:${user?.id || 'anonymous'}:${ip}`;
  }
});
