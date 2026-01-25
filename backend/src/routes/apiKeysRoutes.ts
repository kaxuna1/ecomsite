/**
 * API Keys Routes
 *
 * Admin-only routes for managing API keys and secrets
 */

import { Router, Response } from 'express';
import { adminAuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { apiKeysRateLimiter } from '../middleware/rateLimiter';
import {
  getAllAPIKeys,
  getAPIKey,
  setAPIKey,
  setMultipleAPIKeys,
  deleteAPIKey,
  deactivateAPIKey,
  validateAPIKeysForFeature,
  getAuditLog
} from '../services/apiKeysService';
import { getAIServiceManager } from '../ai';
import { testS3Connection, clearS3ClientCache } from '../services/storageService';
import { checkStorageStatus } from '../services/mediaService';

const router = Router();

// All routes require admin authentication
router.use(adminAuthMiddleware);

// Apply rate limiting to all API keys routes (30 requests per 15 minutes)
router.use(apiKeysRateLimiter);

/**
 * Helper function to extract audit context from request
 */
function getAuditContext(req: AuthenticatedRequest) {
  return {
    adminUserId: req.adminId,
    adminUserEmail: req.user?.email,
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };
}

const AI_PROVIDER_KEYS = new Set(['openai_api_key', 'anthropic_api_key', 'gemini_api_key']);
const S3_KEYS = new Set(['s3_access_key', 's3_secret_key', 's3_endpoint', 's3_region', 's3_bucket', 's3_public_url']);

async function clearS3CacheIfNeeded(keyNames: string[]) {
  const shouldClear = keyNames.some((key) => S3_KEYS.has(key));
  if (shouldClear) {
    clearS3ClientCache();
  }
}

async function reinitializeAIProvidersIfNeeded(keyNames: string[]) {
  const shouldReinitialize = keyNames.some((key) => AI_PROVIDER_KEYS.has(key));
  if (!shouldReinitialize) {
    return;
  }

  try {
    const aiService = await getAIServiceManager();
    await aiService.reinitialize();
  } catch (error: any) {
    console.warn('Failed to reinitialize AI providers after API key update:', error?.message || error);
  }
}

/**
 * GET /api/admin/api-keys
 * Get all API keys (masked values for display)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only return masked values for display in UI
    const keys = await getAllAPIKeys(false);
    
    res.json(keys);
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      message: 'Failed to fetch API keys',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/api-keys/audit-log
 * Get audit log entries for API key access and modifications
 * NOTE: This route must be defined BEFORE /:keyName to avoid being caught by it
 */
router.get('/audit-log', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keyName, limit } = req.query;

    const entries = await getAuditLog(
      keyName as string | undefined,
      limit ? parseInt(limit as string) : 100
    );

    res.json(entries);
  } catch (error: any) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/api-keys/storage-status
 * Get current storage configuration status
 * NOTE: This route must be defined BEFORE /:keyName to avoid being caught by it
 */
router.get('/storage-status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = await checkStorageStatus();
    
    res.json(status);
  } catch (error: any) {
    console.error('Error checking storage status:', error);
    res.status(500).json({
      configured: false,
      provider: null,
      bucket: null,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/api-keys/:keyName
 * Get a specific API key (returns actual value - use carefully!)
 */
router.get('/:keyName', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keyName } = req.params;
    const { decrypt: shouldDecrypt } = req.query;
    const auditContext = getAuditContext(req);

    const value = await getAPIKey(keyName, shouldDecrypt === 'true', auditContext);

    if (value === null) {
      return res.status(404).json({
        message: 'API key not found'
      });
    }

    res.json({ value });
  } catch (error: any) {
    console.error('Error fetching API key:', error);
    res.status(500).json({
      message: 'Failed to fetch API key',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/api-keys
 * Update multiple API keys at once
 * 
 * Body: { keys: { keyName: value, ... } }
 */
router.put('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keys } = req.body;
    
    if (!keys || typeof keys !== 'object') {
      return res.status(400).json({
        message: 'Invalid request body. Expected { keys: { ... } }'
      });
    }
    
    // Get admin user ID from auth middleware
    const adminUserId = req.adminId;
    
    const count = await setMultipleAPIKeys(keys, adminUserId);

    const keyNames = Object.keys(keys);
    await reinitializeAIProvidersIfNeeded(keyNames);
    await clearS3CacheIfNeeded(keyNames);
    
    res.json({
      message: `Successfully updated ${count} API key(s)`,
      count
    });
  } catch (error: any) {
    console.error('Error updating API keys:', error);
    res.status(500).json({
      message: 'Failed to update API keys',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/api-keys
 * Create or update a single API key
 *
 * Body: {
 *   keyName: string,
 *   keyValue: string,
 *   category?: string,
 *   description?: string,
 *   isActive?: boolean
 * }
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keyName, keyValue, category, description, isActive } = req.body;

    if (!keyName || !keyValue) {
      return res.status(400).json({
        message: 'keyName and keyValue are required'
      });
    }

    const adminUserId = req.adminId;
    const auditContext = getAuditContext(req);

    const result = await setAPIKey(
      keyName,
      keyValue,
      { category, description, isActive },
      adminUserId,
      auditContext
    );

    await reinitializeAIProvidersIfNeeded([keyName]);
    await clearS3CacheIfNeeded([keyName]);

    res.json({
      message: 'API key saved successfully',
      key: {
        id: result.id,
        keyName: result.key_name,
        category: result.category,
        isActive: result.is_active
      }
    });
  } catch (error: any) {
    console.error('Error saving API key:', error);
    res.status(500).json({
      message: 'Failed to save API key',
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/api-keys/:keyName
 * Permanently delete an API key
 */
router.delete('/:keyName', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keyName } = req.params;
    const auditContext = getAuditContext(req);

    const deleted = await deleteAPIKey(keyName, auditContext);

    if (!deleted) {
      return res.status(404).json({
        message: 'API key not found'
      });
    }

    await reinitializeAIProvidersIfNeeded([keyName]);

    res.json({
      message: 'API key deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      message: 'Failed to delete API key',
      error: error.message
    });
  }
});

/**
 * PATCH /api/admin/api-keys/:keyName/deactivate
 * Soft delete (deactivate) an API key
 */
router.patch('/:keyName/deactivate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keyName } = req.params;
    const auditContext = getAuditContext(req);

    const deactivated = await deactivateAPIKey(keyName, auditContext);

    if (!deactivated) {
      return res.status(404).json({
        message: 'API key not found'
      });
    }

    await reinitializeAIProvidersIfNeeded([keyName]);

    res.json({
      message: 'API key deactivated successfully'
    });
  } catch (error: any) {
    console.error('Error deactivating API key:', error);
    res.status(500).json({
      message: 'Failed to deactivate API key',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/api-keys/validate/:feature
 * Validate if required API keys are configured for a specific feature
 */
router.post('/validate/:feature', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { feature } = req.params;

    const validation = await validateAPIKeysForFeature(feature);

    res.json(validation);
  } catch (error: any) {
    console.error('Error validating API keys:', error);
    res.status(500).json({
      message: 'Failed to validate API keys',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/api-keys/test-s3
 * Test S3 connection with current configuration
 */
router.post('/test-s3', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await testS3Connection();
    
    res.json(result);
  } catch (error: any) {
    console.error('Error testing S3 connection:', error);
    res.status(500).json({
      success: false,
      message: `Connection test failed: ${error.message}`
    });
  }
});

export default router;
