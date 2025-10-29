import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  loginSchema,
} from '../models/user.model';

const router = Router();

// Public routes
router.post('/register', validate(createUserSchema), userController.create.bind(userController));
router.post('/login', validate(loginSchema), userController.login.bind(userController));

// Protected routes
router.get('/', authenticate, userController.getAll.bind(userController));
router.get('/:id', authenticate, validate(getUserSchema), userController.getById.bind(userController));
router.put('/:id', authenticate, validate(updateUserSchema), userController.update.bind(userController));
router.delete('/:id', authenticate, validate(getUserSchema), userController.delete.bind(userController));

export default router;
