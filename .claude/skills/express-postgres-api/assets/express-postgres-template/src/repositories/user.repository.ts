import { db } from '../config/database';
import { User, CreateUserDto, UpdateUserDto } from '../models/user.model';

export class UserRepository {
  async findAll(limit = 10, offset = 0): Promise<User[]> {
    const query = `
      SELECT id, email, password, first_name as "firstName", last_name as "lastName",
             is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query<User>(query, [limit, offset]);
    return result.rows;
  }

  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, email, password, first_name as "firstName", last_name as "lastName",
             is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE id = $1
    `;
    const result = await db.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, password, first_name as "firstName", last_name as "lastName",
             is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE email = $1
    `;
    const result = await db.query<User>(query, [email]);
    return result.rows[0] || null;
  }

  async create(userData: CreateUserDto & { password: string }): Promise<User> {
    const query = `
      INSERT INTO users (email, password, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, password, first_name as "firstName", last_name as "lastName",
                is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;
    const result = await db.query<User>(query, [
      userData.email,
      userData.password,
      userData.firstName,
      userData.lastName,
    ]);
    return result.rows[0];
  }

  async update(id: number, userData: UpdateUserDto): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (userData.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(userData.email);
    }
    if (userData.firstName) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(userData.firstName);
    }
    if (userData.lastName) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(userData.lastName);
    }
    if (userData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(userData.isActive);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, password, first_name as "firstName", last_name as "lastName",
                is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await db.query<User>(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM users';
    const result = await db.query<{ count: string }>(query);
    return parseInt(result.rows[0].count, 10);
  }
}

export const userRepository = new UserRepository();
