import { Router, Request, Response } from 'express';
import { attributeService } from '../services/attributeService';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public routes - for frontend filtering and display
router.get('/', async (req: Request, res: Response) => {
  try {
    const attributes = await attributeService.list();
    res.json(attributes);
  } catch (error: any) {
    console.error('Error listing attributes:', error);
    res.status(500).json({ message: error.message ?? 'Failed to list attributes' });
  }
});

router.get('/filterable', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const attributes = await attributeService.getFilterable(category);
    res.json(attributes);
  } catch (error: any) {
    console.error('Error getting filterable attributes:', error);
    res.status(500).json({ message: error.message ?? 'Failed to get filterable attributes' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid attribute ID' });
    }

    const attribute = await attributeService.get(id);
    if (!attribute) {
      return res.status(404).json({ message: 'Attribute not found' });
    }

    res.json(attribute);
  } catch (error: any) {
    console.error('Error getting attribute:', error);
    res.status(500).json({ message: error.message ?? 'Failed to get attribute' });
  }
});

// Get unique values for a specific attribute key
router.get('/:key/values', async (req: Request, res: Response) => {
  try {
    const key = req.params.key;
    const values = await attributeService.getUniqueValues(key);
    res.json(values);
  } catch (error: any) {
    console.error('Error getting attribute values:', error);
    res.status(500).json({ message: error.message ?? 'Failed to get attribute values' });
  }
});

// Admin routes - for managing attribute definitions
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Validate required fields
    if (!payload.attributeKey || !payload.attributeLabel || !payload.dataType) {
      return res.status(400).json({
        message: 'Missing required fields: attributeKey, attributeLabel, dataType'
      });
    }

    // Validate data type
    const validDataTypes = ['text', 'number', 'boolean', 'select', 'multiselect', 'date'];
    if (!validDataTypes.includes(payload.dataType)) {
      return res.status(400).json({
        message: `Invalid data type. Must be one of: ${validDataTypes.join(', ')}`
      });
    }

    // Validate options for select/multiselect
    if (['select', 'multiselect'].includes(payload.dataType) && !payload.options) {
      return res.status(400).json({
        message: 'Options are required for select and multiselect data types'
      });
    }

    const attribute = await attributeService.create(payload);
    res.status(201).json(attribute);
  } catch (error: any) {
    console.error('Error creating attribute:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'An attribute with this key already exists'
      });
    }

    res.status(500).json({ message: error.message ?? 'Failed to create attribute' });
  }
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid attribute ID' });
    }

    const payload = req.body;

    // Validate data type if provided
    if (payload.dataType) {
      const validDataTypes = ['text', 'number', 'boolean', 'select', 'multiselect', 'date'];
      if (!validDataTypes.includes(payload.dataType)) {
        return res.status(400).json({
          message: `Invalid data type. Must be one of: ${validDataTypes.join(', ')}`
        });
      }
    }

    const attribute = await attributeService.update(id, payload);
    if (!attribute) {
      return res.status(404).json({ message: 'Attribute not found' });
    }

    res.json(attribute);
  } catch (error: any) {
    console.error('Error updating attribute:', error);
    res.status(500).json({ message: error.message ?? 'Failed to update attribute' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid attribute ID' });
    }

    const success = await attributeService.remove(id);
    if (!success) {
      return res.status(404).json({ message: 'Attribute not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting attribute:', error);

    // Handle foreign key constraint violation
    if (error.code === '23503') {
      return res.status(409).json({
        message: 'Cannot delete attribute that is being used by products'
      });
    }

    res.status(500).json({ message: error.message ?? 'Failed to delete attribute' });
  }
});

export default router;
