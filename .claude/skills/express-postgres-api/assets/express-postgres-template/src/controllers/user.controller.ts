import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { success, created } from '../utils/response';
import { CreateUserDto, UpdateUserDto, LoginDto } from '../models/user.model';

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await userService.getAllUsers(page, limit);

      success(res, result.users, 'Users retrieved successfully', 200, {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = await userService.getUserById(id);
      success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserDto = req.body;
      const user = await userService.createUser(userData);
      created(res, user, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const userData: UpdateUserDto = req.body;
      const user = await userService.updateUser(id, userData);
      success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await userService.deleteUser(id);
      success(res, null, 'User deleted successfully', 204);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials: LoginDto = req.body;
      const result = await userService.login(credentials);
      success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
