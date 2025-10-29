/**
 * API Keys Routes
 * 
 * Admin-only routes for managing API keys and secrets
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getAllAPIKeys,
  getAPIKey,
  setAPIKey,
  setMultipleAPIKeys,
  deleteAPIKey,
  deactivateAPIKey,
  validateAPIKeysForFeature
} from '../services/apiKeysService';

const router = Router();

// All routes require admin authentication
router.use(authMiddleware);

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
    
    const value = await getAPIKey(keyName, shouldDecrypt === 'true');
    
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
    
    // Get admin user ID from auth middleware
    const adminUserId = (req as any).user?.id;
    
    const result = await setAPIKey(
      keyName,
      keyValue,
      { category, description, isActive },
      adminUserId
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
    
    const deleted = await deleteAPIKey(keyName);
    
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
    
    const deactivated = await deactivateAPIKey(keyName);
    
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

