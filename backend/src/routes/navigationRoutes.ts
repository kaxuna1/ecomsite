// Navigation API Routes
// REST endpoints for managing navigation menus and menu items

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate as adminAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import * as navigationService from '../services/navigationService';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * GET /api/navigation/menu/:location
 * Get public menu by location code (header, footer, mobile)
 */
router.get(
  '/menu/:location',
  [
    param('location').isString().notEmpty().isIn(['header', 'footer', 'mobile']),
    query('lang').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const language = (req.query.lang as string) || 'en';
      const menu = await navigationService.getMenuByLocation(req.params.location, language);

      if (!menu) {
        return res.status(404).json({ message: 'Menu not found' });
      }

      res.json(menu);
    } catch (error) {
      console.error('Error fetching menu:', error);
      res.status(500).json({ message: 'Error fetching menu' });
    }
  }
);

/**
 * GET /api/navigation/suggestions
 * Get page suggestions for menu builder (static routes + CMS pages)
 */
router.get(
  '/suggestions',
  [query('lang').optional().isString()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const language = (req.query.lang as string) || 'en';
      const suggestions = await navigationService.getPageSuggestions(language);
      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching page suggestions:', error);
      res.status(500).json({ message: 'Error fetching page suggestions' });
    }
  }
);

// ============================================================================
// ADMIN ROUTES (Require authentication)
// ============================================================================

/**
 * GET /api/navigation/locations
 * Get all menu locations (header, footer, mobile)
 */
router.get(
  '/locations',
  adminAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const locations = await navigationService.getAllMenuLocations();
      res.json(locations);
    } catch (error) {
      console.error('Error fetching menu locations:', error);
      res.status(500).json({ message: 'Error fetching menu locations' });
    }
  }
);

/**
 * GET /api/navigation/items
 * Get all menu items with optional location filter
 */
router.get(
  '/items',
  adminAuth,
  [
    query('locationId').optional().isInt({ min: 1 }).toInt()
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;
      // Handle lang parameter - can be string or array if sent multiple times
      let language = 'en';
      if (req.query.lang) {
        language = Array.isArray(req.query.lang) ? req.query.lang[0] as string : req.query.lang as string;
      }
      const items = await navigationService.getAllMenuItems(locationId, language);
      res.json(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ message: 'Error fetching menu items' });
    }
  }
);

/**
 * GET /api/navigation/items/:id
 * Get single menu item by ID with translations
 */
router.get(
  '/items/:id',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const item = await navigationService.getMenuItemById(parseInt(req.params.id));

      if (!item) {
        return res.status(404).json({ message: 'Menu item not found' });
      }

      res.json(item);
    } catch (error) {
      console.error('Error fetching menu item:', error);
      res.status(500).json({ message: 'Error fetching menu item' });
    }
  }
);

/**
 * POST /api/navigation/items
 * Create a new menu item
 */
router.post(
  '/items',
  adminAuth,
  [
    body('locationId').isInt({ min: 1 }),
    body('parentId').optional({ nullable: true }).isInt({ min: 1 }),
    body('label').isString().notEmpty(),
    body('linkType').isString().isIn(['internal', 'external', 'cms_page', 'none']),
    body('linkUrl').optional({ nullable: true }).isString(),
    body('cmsPageId').optional({ nullable: true }).isInt({ min: 1 }),
    body('displayOrder').optional().isInt({ min: 0 }),
    body('isEnabled').optional().isBoolean(),
    body('openInNewTab').optional().isBoolean(),
    body('cssClass').optional({ nullable: true }).isString()
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Validate link type constraints
      const { linkType, linkUrl, cmsPageId } = req.body;

      if (linkType === 'external' && !linkUrl) {
        return res.status(400).json({ message: 'linkUrl is required for external link type' });
      }

      if (linkType === 'internal' && !linkUrl) {
        return res.status(400).json({ message: 'linkUrl is required for internal link type' });
      }

      if (linkType === 'cms_page' && !cmsPageId) {
        return res.status(400).json({ message: 'cmsPageId is required for cms_page link type' });
      }

      const item = await navigationService.createMenuItem(req.body);
      res.status(201).json(item);
    } catch (error: any) {
      console.error('Error creating menu item:', error);
      if (error.code === '23503') {
        return res.status(404).json({ message: 'Referenced location, parent, or CMS page not found' });
      }
      res.status(500).json({ message: 'Error creating menu item' });
    }
  }
);

/**
 * PUT /api/navigation/items/:id
 * Update an existing menu item
 */
router.put(
  '/items/:id',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('parentId').optional({ nullable: true }).isInt({ min: 1 }),
    body('label').optional().isString(),
    body('linkType').optional().isString().isIn(['internal', 'external', 'cms_page', 'none']),
    body('linkUrl').optional({ nullable: true }).isString(),
    body('cmsPageId').optional({ nullable: true }).isInt({ min: 1 }),
    body('displayOrder').optional().isInt({ min: 0 }),
    body('isEnabled').optional().isBoolean(),
    body('openInNewTab').optional().isBoolean(),
    body('cssClass').optional({ nullable: true }).isString()
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const item = await navigationService.updateMenuItem(parseInt(req.params.id), req.body);

      if (!item) {
        return res.status(404).json({ message: 'Menu item not found' });
      }

      res.json(item);
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      if (error.code === '23503') {
        return res.status(404).json({ message: 'Referenced parent or CMS page not found' });
      }
      res.status(500).json({ message: 'Error updating menu item' });
    }
  }
);

/**
 * DELETE /api/navigation/items/:id
 * Delete a menu item (CASCADE will delete children)
 */
router.delete(
  '/items/:id',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const deleted = await navigationService.deleteMenuItem(parseInt(req.params.id));

      if (!deleted) {
        return res.status(404).json({ message: 'Menu item not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      res.status(500).json({ message: 'Error deleting menu item' });
    }
  }
);

/**
 * POST /api/navigation/items/reorder
 * Batch update display order for menu items
 */
router.post(
  '/items/reorder',
  adminAuth,
  [
    body('items').isArray({ min: 1 }),
    body('items.*.id').isInt({ min: 1 }),
    body('items.*.displayOrder').isInt({ min: 0 })
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await navigationService.reorderMenuItems(req.body);
      res.json({ message: 'Menu items reordered successfully' });
    } catch (error) {
      console.error('Error reordering menu items:', error);
      res.status(500).json({ message: 'Error reordering menu items' });
    }
  }
);

/**
 * POST /api/navigation/items/:id/translations/:lang
 * Create or update a menu item translation
 */
router.post(
  '/items/:id/translations/:lang',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).toInt(),
    param('lang').isString().notEmpty(),
    body('label').isString().notEmpty()
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const translation = await navigationService.createMenuItemTranslation(
        parseInt(req.params.id),
        req.params.lang,
        req.body
      );

      res.status(201).json(translation);
    } catch (error: any) {
      console.error('Error creating menu item translation:', error);
      if (error.code === '23503') {
        return res.status(404).json({ message: 'Menu item or language not found' });
      }
      res.status(500).json({ message: 'Error creating menu item translation' });
    }
  }
);

export default router;
