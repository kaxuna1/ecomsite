# Prisma Workflows Reference

## Contents
- Migration Workflow
- Schema Evolution
- Introspection from Existing Database
- Testing and Seeding

---

## Migration Workflow

### Initial Setup (New Project)

```bash
# Initialize Prisma with PostgreSQL
npx prisma init --datasource-provider postgresql

# Configure DATABASE_URL in .env
# DATABASE_URL="postgresql://user:password@localhost:5432/luxia?schema=public"

# Create first migration after schema definition
npx prisma migrate dev --name init
```

### Standard Migration Flow

Copy this checklist and track progress:
- [ ] Step 1: Modify `prisma/schema.prisma`
- [ ] Step 2: Run `npx prisma migrate dev --name descriptive_name`
- [ ] Step 3: Review generated SQL in `prisma/migrations/`
- [ ] Step 4: Test changes locally
- [ ] Step 5: Commit migration files

### Migration Commands

| Command | When to Use |
|---------|-------------|
| `prisma migrate dev` | Development - creates and applies migration |
| `prisma migrate deploy` | Production - applies pending migrations |
| `prisma migrate reset` | Development - drop DB, apply all migrations |
| `prisma db push` | Prototyping - sync schema without migration |

### Production Deployment

```bash
# In production deployment script
npx prisma migrate deploy

# If using Docker, add to entrypoint
#!/bin/bash
npx prisma migrate deploy
exec node dist/server.js
```

---

## Schema Evolution

### Adding a New Model

```prisma
// 1. Define the model
model Review {
  id        Int      @id @default(autoincrement())
  productId Int      @map("product_id")
  userId    Int      @map("user_id")
  rating    Int
  content   String?
  createdAt DateTime @default(now()) @map("created_at")
  
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("product_reviews")
}

// 2. Add relation to existing models
model Product {
  // ... existing fields
  reviews Review[]
}
```

```bash
# 3. Generate migration
npx prisma migrate dev --name add_reviews
```

### Adding a Column

```prisma
model Product {
  // ... existing fields
  metaTitle       String? @map("meta_title") @db.VarChar(255)
  metaDescription String? @map("meta_description")
}
```

### Renaming a Column

```prisma
// Use @map to preserve database column name
model Product {
  shortDesc String @map("short_description")  // Renamed in code, same in DB
}
```

### Handling Breaking Changes

Migrate data before removing columns:

1. Add new column
2. Migrate data with raw SQL
3. Remove old column

```prisma
// prisma/migrations/xxx_rename_field/migration.sql
-- Copy data to new column
UPDATE products SET new_column = old_column;
-- In next migration: drop old_column
```

---

## Introspection from Existing Database

### Pull Existing Schema

This project has 40+ tables with raw SQL. To adopt Prisma:

```bash
# Generate schema from existing database
npx prisma db pull

# This creates schema.prisma from existing tables
# Review and refine the generated schema
```

### Post-Introspection Cleanup

```prisma
// BEFORE (auto-generated)
model products {
  id Int @id @default(autoincrement())
  short_description String
  created_at DateTime? @default(now())
}

// AFTER (cleaned up)
model Product {
  id               Int      @id @default(autoincrement())
  shortDescription String   @map("short_description")
  createdAt        DateTime @default(now()) @map("created_at")
  
  @@map("products")
}
```

### Incremental Adoption Strategy

1. Run `prisma db pull` to generate initial schema
2. Clean up model names (PascalCase) and field names (camelCase)
3. Add `@map` decorators to preserve database names
4. Define relations that introspection may have missed
5. Run `prisma generate` to create client
6. Migrate one service at a time from raw SQL to Prisma

---

## Testing and Seeding

### Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Languages
  await prisma.language.upsert({
    where: { code: 'en' },
    update: {},
    create: { code: 'en', name: 'English', nativeName: 'English', isDefault: true },
  });

  // Products
  await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Scalp Revitalizing Serum',
      shortDescription: 'Professional-grade scalp treatment',
      description: 'Full description...',
      price: 49.99,
      imageUrl: '/uploads/serum.webp',
      categories: ['Serums', 'Treatments'],
      inventory: 100,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

```bash
# Run seed
npx prisma db seed
```

### Test Database Setup

```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Reset test database
  execSync('npx prisma migrate reset --force', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

---

## Validation Workflow

1. Make schema changes
2. Validate: `npx prisma validate`
3. If validation fails, fix schema and repeat step 2
4. Generate migration: `npx prisma migrate dev`
5. Generate client: `npx prisma generate`

---

## Related Skills

- See the **postgresql** skill for PostgreSQL-specific features like JSONB operators and full-text search
- See the **typescript** skill for leveraging Prisma's generated types
- See the **docker** skill for containerized database setup