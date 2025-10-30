/**
 * API Keys Routes
 *
 * Admin-only routes for managing API keys and secrets
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
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

const router = Router();

// All routes require admin authentication
router.use(authMiddleware);

// Apply rate limiting to all API keys routes (30 requests per 15 minutes)
router.use(apiKeysRateLimiter);

/**
 * Helper function to extract audit context from request
 */
function getAuditContext(req: Request) {
  const user = (req as any).user;
  return {
    adminUserId: user?.id,
    adminUserEmail: user?.email,
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  };
}

/**
 * GET /api/admin/api-keys
 * Get all API keys (masked values for display)
 */
router.get('/', async (req: Request, res: Response) => {
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
 * GET /api/admin/api-keys/:keyName
 * Get a specific API key (returns actual value - use carefully!)
 */
router.get('/:keyName', async (req: Request, res: Response) => {
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
router.put('/', async (req: Request, res: Response) => {
  try {
    const { keys } = req.body;
    
    if (!keys || typeof keys !== 'object') {
      return res.status(400).json({
        message: 'Invalid request body. Expected { keys: { ... } }'
      });
    }
    
    // Get admin user ID from auth middleware
    const adminUserId = (req as any).user?.id;
    
    const count = await setMultipleAPIKeys(keys, adminUserId);
    
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
router.post('/', async (req: Request, res: Response) => {
  try {
    const { keyName, keyValue, category, description, isActive } = req.body;

    if (!keyName || !keyValue) {
      return res.status(400).json({
        message: 'keyName and keyValue are required'
      });
    }

    const adminUserId = (req as any).user?.id;
    const auditContext = getAuditContext(req);

    const result = await setAPIKey(
      keyName,
      keyValue,
      { category, description, isActive },
      adminUserId,
      auditContext
    );

    res.json({
      message: 'API key saved successfully',
      key: {
        id: result.id,
        keyName: result.keyName,
        category: result.category,
        isActive: result.isActive
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
router.delete('/:keyName', async (req: Request, res: Response) => {
  try {
    const { keyName } = req.params;
    const auditContext = getAuditContext(req);

    const deleted = await deleteAPIKey(keyName, auditContext);

    if (!deleted) {
      return res.status(404).json({
        message: 'API key not found'
      });
    }

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
router.patch('/:keyName/deactivate', async (req: Request, res: Response) => {
  try {
    const { keyName } = req.params;
    const auditContext = getAuditContext(req);

    const deactivated = await deactivateAPIKey(keyName, auditContext);

    if (!deactivated) {
      return res.status(404).json({
        message: 'API key not found'
      });
    }

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
 * GET /api/admin/api-keys/audit-log
 * Get audit log entries for API key access and modifications
 */
router.get('/audit-log', async (req: Request, res: Response) => {
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
 * POST /api/admin/api-keys/validate/:feature
 * Validate if required API keys are configured for a specific feature
 */
router.post('/validate/:feature', async (req: Request, res: Response) => {
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

export default router;

