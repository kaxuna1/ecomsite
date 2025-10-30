import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as staticTranslationsService from '../services/staticTranslationsService';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// ============================================================================
// ADMIN ROUTES - Must be defined BEFORE public parameterized routes
// ============================================================================

/**
 * ADMIN: Get all translation keys
 * GET /api/static-translations/admin/keys
 */
router.get(
  '/admin/keys',
  authenticate,
  query('namespace').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { namespace } = req.query;
      const keys = await staticTranslationsService.getTranslationKeys(namespace as string);

      res.json({ keys });
    } catch (error) {
      console.error('Error fetching translation keys:', error);
      res.status(500).json({ error: 'Failed to fetch translation keys' });
    }
  }
);

/**
 * ADMIN: Get all namespaces
 * GET /api/admin/static-translations/namespaces
 */
router.get('/admin/namespaces', authenticate, async (req, res) => {
  try {
    const namespaces = await staticTranslationsService.getNamespaces();

    res.json({ namespaces });
  } catch (error) {
    console.error('Error fetching namespaces:', error);
    res.status(500).json({ error: 'Failed to fetch namespaces' });
  }
});

/**
 * ADMIN: Get translations for a specific key across all languages
 * GET /api/admin/static-translations/key/:key
 */
router.get(
  '/admin/key/:key',
  authenticate,
  param('key').isString(),
  query('namespace').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { key } = req.params;
      const { namespace } = req.query;

      const translations = await staticTranslationsService.getTranslationsForKey(
        key,
        namespace as string
      );

      res.json({ translations });
    } catch (error) {
      console.error('Error fetching translations for key:', error);
      res.status(500).json({ error: 'Failed to fetch translations' });
    }
  }
);

/**
 * ADMIN: Upsert a single translation
 * POST /api/admin/static-translations
 */
router.post(
  '/admin',
  authenticate,
  body('translationKey').isString().isLength({ min: 1, max: 255 }),
  body('languageCode').isString().isLength({ min: 2, max: 10 }),
  body('translationValue').isString(),
  body('namespace').optional().isString().isLength({ min: 1, max: 50 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { translationKey, languageCode, translationValue, namespace = 'common' } = req.body;

      const translation = await staticTranslationsService.upsertTranslation(
        translationKey,
        languageCode,
        translationValue,
        namespace
      );

      res.json({ translation });
    } catch (error) {
      console.error('Error upserting translation:', error);
      res.status(500).json({ error: 'Failed to save translation' });
    }
  }
);

/**
 * ADMIN: Bulk upsert translations
 * POST /api/admin/static-translations/bulk
 */
router.post(
  '/admin/bulk',
  authenticate,
  body('translations').isArray(),
  body('translations.*.translationKey').isString().isLength({ min: 1, max: 255 }),
  body('translations.*.languageCode').isString().isLength({ min: 2, max: 10 }),
  body('translations.*.translationValue').isString(),
  body('translations.*.namespace').isString().isLength({ min: 1, max: 50 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { translations } = req.body;

      const count = await staticTranslationsService.bulkUpsertTranslations(translations);

      res.json({ success: true, count });
    } catch (error) {
      console.error('Error bulk upserting translations:', error);
      res.status(500).json({ error: 'Failed to save translations' });
    }
  }
);

/**
 * ADMIN: Delete a translation
 * DELETE /api/admin/static-translations
 */
router.delete(
  '/admin',
  authenticate,
  body('translationKey').isString(),
  body('languageCode').isString(),
  body('namespace').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { translationKey, languageCode, namespace = 'common' } = req.body;

      const deleted = await staticTranslationsService.deleteTranslation(
        translationKey,
        languageCode,
        namespace
      );

      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Translation not found' });
      }
    } catch (error) {
      console.error('Error deleting translation:', error);
      res.status(500).json({ error: 'Failed to delete translation' });
    }
  }
);

/**
 * ADMIN: Search translations
 * GET /api/admin/static-translations/search
 */
router.get(
  '/admin/search',
  authenticate,
  query('q').isString().isLength({ min: 1 }),
  query('languageCode').optional().isString(),
  query('namespace').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { q, languageCode, namespace } = req.query;

      const results = await staticTranslationsService.searchTranslations(
        q as string,
        languageCode as string,
        namespace as string
      );

      res.json({ results });
    } catch (error) {
      console.error('Error searching translations:', error);
      res.status(500).json({ error: 'Failed to search translations' });
    }
  }
);

/**
 * ADMIN: Get translation statistics
 * GET /api/admin/static-translations/stats
 */
router.get('/admin/stats', authenticate, async (req, res) => {
  try {
    const stats = await staticTranslationsService.getTranslationStats();

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching translation stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * ADMIN: Find missing translations
 * GET /api/static-translations/admin/missing
 */
router.get(
  '/admin/missing',
  authenticate,
  query('sourceLanguage').optional().isString(),
  query('targetLanguage').isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { sourceLanguage = 'en', targetLanguage } = req.query;

      const missing = await staticTranslationsService.findMissingTranslations(
        sourceLanguage as string,
        targetLanguage as string
      );

      res.json({ missing });
    } catch (error) {
      console.error('Error finding missing translations:', error);
      res.status(500).json({ error: 'Failed to find missing translations' });
    }
  }
);

// ============================================================================
// PUBLIC ROUTES - Must be defined AFTER admin routes to avoid conflicts
// ============================================================================

/**
 * PUBLIC: Get all translations for a language (used by i18next)
 * GET /api/static-translations/:languageCode
 */
router.get(
  '/:languageCode',
  param('languageCode').isString().isLength({ min: 2, max: 10 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { languageCode } = req.params;
      const translations = await staticTranslationsService.getTranslationsByLanguage(languageCode);

      res.json(translations);
    } catch (error) {
      console.error('Error fetching translations:', error);
      res.status(500).json({ error: 'Failed to fetch translations' });
    }
  }
);

/**
 * PUBLIC: Get translations for specific namespace and language
 * GET /api/static-translations/:languageCode/:namespace
 */
router.get(
  '/:languageCode/:namespace',
  param('languageCode').isString().isLength({ min: 2, max: 10 }),
  param('namespace').isString().isLength({ min: 1, max: 50 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { languageCode, namespace } = req.params;
      const translations = await staticTranslationsService.getTranslationsByNamespaceAndLanguage(
        namespace,
        languageCode
      );

      res.json(translations);
    } catch (error) {
      console.error('Error fetching namespace translations:', error);
      res.status(500).json({ error: 'Failed to fetch translations' });
    }
  }
);

export default router;
