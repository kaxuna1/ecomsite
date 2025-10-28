import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/authService';

const router = Router();

router.post(
  '/login',
  [body('email').isEmail(), body('password').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.validateCredentials(email, password);
    if (!result) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json(result);
  }
);

export default router;
