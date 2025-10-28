import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { userAuthService } from '../services/userAuthService';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// POST /api/user/auth/register - Register new user
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required')
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name } = req.body;
      const result = await userAuthService.register({ email, password, name });

      if (!result) {
        return res.status(409).json({ message: 'User already exists with this email' });
      }

      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message ?? 'Internal server error' });
    }
  }
);

// POST /api/user/auth/login - Login user
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const result = await userAuthService.login({ email, password });

      if (!result) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message ?? 'Internal server error' });
    }
  }
);

// GET /api/user/auth/me - Get current user (protected route)
router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const user = await userAuthService.getUserById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

export default router;
