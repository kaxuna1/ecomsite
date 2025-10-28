import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/authService';

const router = Router();

router.post(
  '/login',
  [body('username').isString().trim().notEmpty(), body('password').isLength({ min: 6 })],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body as { username: string; password: string };
    const result = await authService.validateCredentials(username, password);
    if (!result) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json(result);
  }
);

export default router;
