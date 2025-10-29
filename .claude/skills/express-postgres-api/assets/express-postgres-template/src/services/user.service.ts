import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { CreateUserDto, UpdateUserDto, LoginDto, User, toUserResponse, UserResponseDto } from '../models/user.model';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { env } from '../config/env';

export class UserService {
  async getAllUsers(page = 1, limit = 10): Promise<{ users: UserResponseDto[]; total: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const users = await userRepository.findAll(limit, offset);
    const total = await userRepository.count();
    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map(toUserResponse),
      total,
      totalPages,
    };
  }

  async getUserById(id: number): Promise<UserResponseDto> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toUserResponse(user);
  }

  async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return toUserResponse(user);
  }

  async updateUser(id: number, userData: UpdateUserDto): Promise<UserResponseDto> {
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await userRepository.findByEmail(userData.email);
      if (emailExists) {
        throw new ConflictError('Email already exists');
      }
    }

    const updatedUser = await userRepository.update(id, userData);
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    return toUserResponse(updatedUser);
  }

  async deleteUser(id: number): Promise<void> {
    const deleted = await userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('User not found');
    }
  }

  async login(credentials: LoginDto): Promise<{ user: UserResponseDto; token: string; refreshToken: string }> {
    const user = await userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: toUserResponse(user),
      token,
      refreshToken,
    };
  }

  private generateToken(userId: number): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  private generateRefreshToken(userId: number): string {
    return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });
  }

  async verifyToken(token: string): Promise<{ userId: number }> {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: number };
      return payload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}

export const userService = new UserService();
