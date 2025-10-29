#!/usr/bin/env python3
"""
Generate a complete CRUD endpoint for Express + PostgreSQL API.
Creates: Model, Repository, Service, Controller, Routes, and Migration.

Usage:
    python generate_endpoint.py <resource_name> [--plural <plural_name>] [--fields <field1:type field2:type ...>]

Example:
    python generate_endpoint.py product --fields name:string price:number description:string inStock:boolean
"""

import os
import sys
import argparse
from datetime import datetime
from pathlib import Path


def to_pascal_case(text):
    """Convert text to PascalCase (e.g., user_profile -> UserProfile)"""
    return ''.join(word.capitalize() for word in text.replace('-', '_').split('_'))


def to_camel_case(text):
    """Convert text to camelCase (e.g., user_profile -> userProfile)"""
    pascal = to_pascal_case(text)
    return pascal[0].lower() + pascal[1:]


def to_snake_case(text):
    """Convert text to snake_case (e.g., UserProfile -> user_profile)"""
    import re
    text = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', text)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', text).lower()


def generate_model(resource, fields, output_dir):
    """Generate TypeScript model with Zod schemas"""
    class_name = to_pascal_case(resource)
    camel_name = to_camel_case(resource)

    # Generate interface fields
    interface_fields = "\n  ".join([
        "id: number;",
        *[f"{field['name']}: {field['ts_type']};" for field in fields],
        "createdAt: Date;",
        "updatedAt: Date;"
    ])

    # Generate Zod schema fields
    zod_fields = ",\n    ".join([
        f"{field['name']}: z.{field['zod_type']}" for field in fields
    ])

    content = f"""import {{ z }} from 'zod';

// Database model
export interface {class_name} {{
  {interface_fields}
}}

// Validation schemas
export const create{class_name}Schema = z.object({{
  body: z.object({{
    {zod_fields}
  }}),
}});

export const update{class_name}Schema = z.object({{
  body: z.object({{
    {zod_fields.replace('z.', 'z.').replace(')', ').optional()')}
  }}),
  params: z.object({{
    id: z.string().regex(/^\\d+$/, 'ID must be a number').transform(Number),
  }}),
}});

export const get{class_name}Schema = z.object({{
  params: z.object({{
    id: z.string().regex(/^\\d+$/, 'ID must be a number').transform(Number),
  }}),
}});

// DTOs
export type Create{class_name}Dto = z.infer<typeof create{class_name}Schema>['body'];
export type Update{class_name}Dto = z.infer<typeof update{class_name}Schema>['body'];
export type {class_name}ResponseDto = {class_name};
"""

    file_path = output_dir / f"src/models/{camel_name}.model.ts"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content)
    print(f"✅ Created: {file_path}")


def generate_repository(resource, fields, output_dir):
    """Generate repository for database operations"""
    class_name = to_pascal_case(resource)
    camel_name = to_camel_case(resource)
    snake_name = to_snake_case(resource)

    db_fields = ", ".join([f['db_column'] for f in fields])
    ts_fields = ", ".join([f'"{f["name"]}"' for f in fields])

    content = f"""import {{ db }} from '../config/database';
import {{ {class_name}, Create{class_name}Dto, Update{class_name}Dto }} from '../models/{camel_name}.model';

export class {class_name}Repository {{
  async findAll(limit = 10, offset = 0): Promise<{class_name}[]> {{
    const query = `
      SELECT id, {db_fields}, created_at as "createdAt", updated_at as "updatedAt"
      FROM {snake_name}s
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query<{class_name}>(query, [limit, offset]);
    return result.rows;
  }}

  async findById(id: number): Promise<{class_name} | null> {{
    const query = `
      SELECT id, {db_fields}, created_at as "createdAt", updated_at as "updatedAt"
      FROM {snake_name}s
      WHERE id = $1
    `;
    const result = await db.query<{class_name}>(query, [id]);
    return result.rows[0] || null;
  }}

  async create(data: Create{class_name}Dto): Promise<{class_name}> {{
    const query = `
      INSERT INTO {snake_name}s ({", ".join([f['db_column'] for f in fields])})
      VALUES ({", ".join([f"${i+1}" for i in range(len(fields))])})
      RETURNING id, {db_fields}, created_at as "createdAt", updated_at as "updatedAt"
    `;
    const result = await db.query<{class_name}>(query, [
      {", ".join([f"data.{f['name']}" for f in fields])}
    ]);
    return result.rows[0];
  }}

  async update(id: number, data: Update{class_name}Dto): Promise<{class_name} | null> {{
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    {chr(10).join([f'''
    if (data.{field['name']} !== undefined) {{
      fields.push(`{field['db_column']} = ${{paramCount++}}`);
      values.push(data.{field['name']});
    }}''' for field in fields])}

    if (fields.length === 0) {{
      return this.findById(id);
    }}

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE {snake_name}s
      SET ${{fields.join(', ')}}
      WHERE id = ${{paramCount}}
      RETURNING id, {db_fields}, created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await db.query<{class_name}>(query, values);
    return result.rows[0] || null;
  }}

  async delete(id: number): Promise<boolean> {{
    const query = 'DELETE FROM {snake_name}s WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }}

  async count(): Promise<number> {{
    const query = 'SELECT COUNT(*) as count FROM {snake_name}s';
    const result = await db.query<{{ count: string }}>(query);
    return parseInt(result.rows[0].count, 10);
  }}
}}

export const {camel_name}Repository = new {class_name}Repository();
"""

    file_path = output_dir / f"src/repositories/{camel_name}.repository.ts"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content)
    print(f"✅ Created: {file_path}")


def generate_service(resource, output_dir):
    """Generate service with business logic"""
    class_name = to_pascal_case(resource)
    camel_name = to_camel_case(resource)

    content = f"""import {{ {camel_name}Repository }} from '../repositories/{camel_name}.repository';
import {{ Create{class_name}Dto, Update{class_name}Dto, {class_name}ResponseDto }} from '../models/{camel_name}.model';
import {{ NotFoundError }} from '../utils/errors';

export class {class_name}Service {{
  async getAll(page = 1, limit = 10): Promise<{{ data: {class_name}ResponseDto[]; total: number; totalPages: number }}> {{
    const offset = (page - 1) * limit;
    const data = await {camel_name}Repository.findAll(limit, offset);
    const total = await {camel_name}Repository.count();
    const totalPages = Math.ceil(total / limit);

    return {{ data, total, totalPages }};
  }}

  async getById(id: number): Promise<{class_name}ResponseDto> {{
    const item = await {camel_name}Repository.findById(id);
    if (!item) {{
      throw new NotFoundError('{class_name} not found');
    }}
    return item;
  }}

  async create(data: Create{class_name}Dto): Promise<{class_name}ResponseDto> {{
    return await {camel_name}Repository.create(data);
  }}

  async update(id: number, data: Update{class_name}Dto): Promise<{class_name}ResponseDto> {{
    const updated = await {camel_name}Repository.update(id, data);
    if (!updated) {{
      throw new NotFoundError('{class_name} not found');
    }}
    return updated;
  }}

  async delete(id: number): Promise<void> {{
    const deleted = await {camel_name}Repository.delete(id);
    if (!deleted) {{
      throw new NotFoundError('{class_name} not found');
    }}
  }}
}}

export const {camel_name}Service = new {class_name}Service();
"""

    file_path = output_dir / f"src/services/{camel_name}.service.ts"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content)
    print(f"✅ Created: {file_path}")


def generate_controller(resource, output_dir):
    """Generate controller for request handling"""
    class_name = to_pascal_case(resource)
    camel_name = to_camel_case(resource)

    content = f"""import {{ Request, Response, NextFunction }} from 'express';
import {{ {camel_name}Service }} from '../services/{camel_name}.service';
import {{ success, created }} from '../utils/response';
import {{ Create{class_name}Dto, Update{class_name}Dto }} from '../models/{camel_name}.model';

export class {class_name}Controller {{
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {{
    try {{
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await {camel_name}Service.getAll(page, limit);

      success(res, result.data, '{class_name}s retrieved successfully', 200, {{
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      }});
    }} catch (error) {{
      next(error);
    }}
  }}

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {{
    try {{
      const id = parseInt(req.params.id);
      const item = await {camel_name}Service.getById(id);
      success(res, item, '{class_name} retrieved successfully');
    }} catch (error) {{
      next(error);
    }}
  }}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {{
    try {{
      const data: Create{class_name}Dto = req.body;
      const item = await {camel_name}Service.create(data);
      created(res, item, '{class_name} created successfully');
    }} catch (error) {{
      next(error);
    }}
  }}

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {{
    try {{
      const id = parseInt(req.params.id);
      const data: Update{class_name}Dto = req.body;
      const item = await {camel_name}Service.update(id, data);
      success(res, item, '{class_name} updated successfully');
    }} catch (error) {{
      next(error);
    }}
  }}

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {{
    try {{
      const id = parseInt(req.params.id);
      await {camel_name}Service.delete(id);
      success(res, null, '{class_name} deleted successfully', 204);
    }} catch (error) {{
      next(error);
    }}
  }}
}}

export const {camel_name}Controller = new {class_name}Controller();
"""

    file_path = output_dir / f"src/controllers/{camel_name}.controller.ts"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content)
    print(f"✅ Created: {file_path}")


def generate_routes(resource, output_dir):
    """Generate Express routes"""
    class_name = to_pascal_case(resource)
    camel_name = to_camel_case(resource)

    content = f"""import {{ Router }} from 'express';
import {{ {camel_name}Controller }} from '../controllers/{camel_name}.controller';
import {{ authenticate }} from '../middleware/auth.middleware';
import {{ validate }} from '../middleware/validation.middleware';
import {{
  create{class_name}Schema,
  update{class_name}Schema,
  get{class_name}Schema,
}} from '../models/{camel_name}.model';

const router = Router();

router.get('/', authenticate, {camel_name}Controller.getAll.bind({camel_name}Controller));
router.get('/:id', authenticate, validate(get{class_name}Schema), {camel_name}Controller.getById.bind({camel_name}Controller));
router.post('/', authenticate, validate(create{class_name}Schema), {camel_name}Controller.create.bind({camel_name}Controller));
router.put('/:id', authenticate, validate(update{class_name}Schema), {camel_name}Controller.update.bind({camel_name}Controller));
router.delete('/:id', authenticate, validate(get{class_name}Schema), {camel_name}Controller.delete.bind({camel_name}Controller));

export default router;
"""

    file_path = output_dir / f"src/routes/{camel_name}.routes.ts"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content)
    print(f"✅ Created: {file_path}")


def generate_migration(resource, fields, output_dir):
    """Generate database migration"""
    snake_name = to_snake_case(resource)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

    # Generate field definitions
    field_defs = "\n  ".join([
        f"{field['db_column']} {field['sql_type']} NOT NULL," for field in fields
    ])

    content = f"""-- Create {snake_name}s table
CREATE TABLE IF NOT EXISTS {snake_name}s (
  id SERIAL PRIMARY KEY,
  {field_defs}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_{snake_name}s_created_at ON {snake_name}s(created_at DESC);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_{snake_name}s_updated_at
  BEFORE UPDATE ON {snake_name}s
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
"""

    file_path = output_dir / f"migrations/{timestamp}_create_{snake_name}s_table.sql"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content)
    print(f"✅ Created: {file_path}")


def parse_field(field_str):
    """Parse field string like 'name:string' into field definition"""
    parts = field_str.split(':')
    if len(parts) != 2:
        raise ValueError(f"Invalid field format: {field_str}. Expected 'name:type'")

    name, type_str = parts
    camel_name = to_camel_case(name)
    snake_name = to_snake_case(name)

    type_mappings = {
        'string': {'ts': 'string', 'zod': 'string()', 'sql': 'VARCHAR(255)'},
        'number': {'ts': 'number', 'zod': 'number()', 'sql': 'INTEGER'},
        'boolean': {'ts': 'boolean', 'zod': 'boolean()', 'sql': 'BOOLEAN'},
        'date': {'ts': 'Date', 'zod': 'date()', 'sql': 'TIMESTAMP'},
        'text': {'ts': 'string', 'zod': 'string()', 'sql': 'TEXT'},
    }

    if type_str not in type_mappings:
        raise ValueError(f"Unknown type: {type_str}. Supported: {', '.join(type_mappings.keys())}")

    mapping = type_mappings[type_str]

    return {
        'name': camel_name,
        'db_column': snake_name,
        'ts_type': mapping['ts'],
        'zod_type': mapping['zod'],
        'sql_type': mapping['sql'],
    }


def main():
    parser = argparse.ArgumentParser(description='Generate Express + PostgreSQL CRUD endpoint')
    parser.add_argument('resource', help='Resource name (e.g., product, order)')
    parser.add_argument('--fields', nargs='+', help='Fields in format name:type (e.g., name:string price:number)')
    parser.add_argument('--output', default='.', help='Output directory (defaults to current directory)')

    args = parser.parse_args()

    if not args.fields:
        print("Error: --fields is required")
        print("Example: python generate_endpoint.py product --fields name:string price:number")
        sys.exit(1)

    try:
        fields = [parse_field(f) for f in args.fields]
        output_dir = Path(args.output)

        print(f"\n🚀 Generating CRUD endpoint for: {args.resource}\n")

        generate_model(args.resource, fields, output_dir)
        generate_repository(args.resource, fields, output_dir)
        generate_service(args.resource, output_dir)
        generate_controller(args.resource, output_dir)
        generate_routes(args.resource, output_dir)
        generate_migration(args.resource, fields, output_dir)

        print(f"\n✅ Successfully generated all files for {args.resource}!")
        print(f"\n📝 Next steps:")
        print(f"1. Import the routes in src/routes/index.ts:")
        print(f"   import {to_camel_case(args.resource)}Routes from './{to_camel_case(args.resource)}.routes';")
        print(f"   router.use('/{to_snake_case(args.resource)}s', {to_camel_case(args.resource)}Routes);")
        print(f"2. Run the migration: npm run migrate:up")
        print(f"3. Test your new endpoints!")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
