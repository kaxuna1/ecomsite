// Theme API Routes
// RESTful endpoints for theme management

import express, { Request, Response } from 'express';
import { themeService } from '../services/themeService';
import { adminAuthMiddleware } from '../middleware/authMiddleware';
import type { CreateThemeInput, UpdateThemeInput } from '../types/theme';

const router = express.Router();

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/**
 * GET /api/themes/active
 * Get currently active theme (public endpoint)
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const theme = await themeService.getActiveTheme();

    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'No active theme found'
      });
    }

    // Generate CSS from tokens
    const css = themeService.generateCSS(theme.tokens);

    res.json({
      success: true,
      data: {
        theme: {
          name: theme.name,
          displayName: theme.displayName,
          tokens: theme.tokens,
          css
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching active theme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active theme',
      error: error.message
    });
  }
});

/**
 * GET /api/themes/fonts
 * Get font library (public endpoint)
 */
router.get('/fonts', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const fonts = await themeService.getFonts(category);

    res.json({
      success: true,
      data: {
        fonts
      }
    });
  } catch (error: any) {
    console.error('Error fetching fonts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fonts',
      error: error.message
    });
  }
});

// ============================================================================
// ADMIN ENDPOINTS (Protected)
// ============================================================================

/**
 * GET /api/themes
 * List all themes
 */
router.get('/', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const themes = await themeService.getAllThemes(includeInactive);
    const activeTheme = await themeService.getActiveTheme();

    res.json({
      success: true,
      data: {
        themes,
        activeTheme: activeTheme ? {
          id: activeTheme.id,
          name: activeTheme.name
        } : null
      }
    });
  } catch (error: any) {
    console.error('Error fetching themes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch themes',
      error: error.message
    });
  }
});

/**
 * GET /api/themes/:id
 * Get theme by ID with full details
 */
router.get('/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme ID'
      });
    }

    const theme = await themeService.getThemeById(id);

    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'Theme not found'
      });
    }

    // Generate CSS from tokens
    const css = themeService.generateCSS(theme.tokens);

    res.json({
      success: true,
      data: {
        theme,
        css
      }
    });
  } catch (error: any) {
    console.error('Error fetching theme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch theme',
      error: error.message
    });
  }
});

/**
 * POST /api/themes
 * Create new theme
 */
router.post('/', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const input: CreateThemeInput = req.body;
    const adminUserId = (req as any).user?.id;

    // Validate required fields
    if (!input.name || !input.displayName || !input.tokens) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, displayName, tokens'
      });
    }

    // Check if theme name already exists
    const existingTheme = await themeService.getThemeByName(input.name);
    if (existingTheme) {
      return res.status(409).json({
        success: false,
        message: `Theme with name '${input.name}' already exists`
      });
    }

    const theme = await themeService.createTheme(input, adminUserId);

    res.status(201).json({
      success: true,
      message: 'Theme created successfully',
      data: {
        theme
      }
    });
  } catch (error: any) {
    console.error('Error creating theme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create theme',
      error: error.message
    });
  }
});

/**
 * PUT /api/themes/:id
 * Update theme
 */
router.put('/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates: UpdateThemeInput = req.body;
    const adminUserId = (req as any).user?.id;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme ID'
      });
    }

    const theme = await themeService.updateTheme(id, updates, adminUserId);

    res.json({
      success: true,
      message: 'Theme updated successfully',
      data: {
        theme
      }
    });
  } catch (error: any) {
    console.error('Error updating theme:', error);

    if (error.message === 'Theme not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Cannot modify system themes') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update theme',
      error: error.message
    });
  }
});

/**
 * PATCH /api/themes/:id/activate
 * Activate theme
 */
router.patch('/:id/activate', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const adminUserId = (req as any).user?.id;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme ID'
      });
    }

    const theme = await themeService.getThemeById(id);
    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'Theme not found'
      });
    }

    await themeService.activateTheme(id, adminUserId);

    res.json({
      success: true,
      message: `Theme '${theme.name}' activated successfully`,
      data: {
        activeTheme: theme.name
      }
    });
  } catch (error: any) {
    console.error('Error activating theme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate theme',
      error: error.message
    });
  }
});

/**
 * PATCH /api/themes/:id/deactivate
 * Deactivate theme
 */
router.patch('/:id/deactivate', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const adminUserId = (req as any).user?.id;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme ID'
      });
    }

    await themeService.deactivateTheme(id, adminUserId);

    res.json({
      success: true,
      message: 'Theme deactivated successfully'
    });
  } catch (error: any) {
    console.error('Error deactivating theme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate theme',
      error: error.message
    });
  }
});

/**
 * DELETE /api/themes/:id
 * Delete theme
 */
router.delete('/:id', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme ID'
      });
    }

    await themeService.deleteTheme(id);

    res.json({
      success: true,
      message: 'Theme deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting theme:', error);

    if (error.message === 'Theme not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete theme',
      error: error.message
    });
  }
});

/**
 * GET /api/themes/:id/history
 * Get theme change history
 */
router.get('/:id/history', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme ID'
      });
    }

    const history = await themeService.getThemeHistory(id, limit, offset);

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page,
          limit,
          hasMore: history.length === limit
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching theme history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch theme history',
      error: error.message
    });
  }
});

/**
 * GET /api/themes/presets
 * Get theme presets
 */
router.get('/presets/list', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const presets = await themeService.getThemePresets(category);

    res.json({
      success: true,
      data: {
        presets
      }
    });
  } catch (error: any) {
    console.error('Error fetching theme presets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch theme presets',
      error: error.message
    });
  }
});

export default router;
