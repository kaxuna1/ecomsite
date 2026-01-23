# Zod Workflows Reference

## Contents
- Adding Zod to This Project
- Creating Shared Schemas
- Migrating from express-validator
- Error Handling Patterns

---

## Adding Zod to This Project

### Installation Checklist

Copy this checklist:
- [ ] Install zod in frontend: `cd frontend && npm install zod @hookform/resolvers`
- [ ] Install zod in backend: `cd backend && npm install zod`
- [ ] Create `shared/schemas/` directory for reusable schemas
- [ ] Update `backend/src/config/env.ts` to use Zod
- [ ] Add Zod resolver to checkout form
- [ ] Validate API responses in `frontend/src/api/`

### Environment Variable Validation

Replace `backend/src/config/env.ts`:

```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('luxia'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string(),
  
  // Auth
  JWT_SECRET: z.string().min(32),
  
  // Optional SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
```

---

## Creating Shared Schemas

### Product Schema Example

```typescript
// Can be placed in backend/src/schemas/product.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(255),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  salePrice: z.number().positive().nullable(),
  imageUrl: z.string().url().nullable(),
  inventory: z.number().int().nonnegative(),
  categories: z.array(z.string()),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

export const CreateProductSchema = ProductSchema.omit({ id: true });
export const UpdateProductSchema = CreateProductSchema.partial();

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
```

---

## Migrating from express-validator

### Current Pattern (express-validator)

```typescript
// backend/src/routes/userAuthRoutes.ts
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... handler
});
```

### Zod Equivalent

```typescript
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(6),
  name: z.string().trim().min(1),
});

// Middleware factory
function validate<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        errors: result.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = result.data; // Typed and transformed
    next();
  };
}

router.post('/register', validate(RegisterSchema), async (req, res) => {
  const { email, password, name } = req.body; // Fully typed
  // ...
});
```

---

## Error Handling Patterns

### Frontend Error Display

```typescript
import { z } from 'zod';

function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    formatted[path] = issue.message;
  }
  return formatted;
}

// Usage with react-hook-form
const { setError } = useForm();

try {
  const data = schema.parse(formData);
} catch (err) {
  if (err instanceof z.ZodError) {
    const errors = formatZodErrors(err);
    Object.entries(errors).forEach(([field, message]) => {
      setError(field as any, { message });
    });
  }
}
```

### API Error Responses

```typescript
// Standardized error response
function handleValidationError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    message: 'Validation failed',
    errors: error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    })),
  });
}
```

---

## Integration Workflow

### Form with TanStack Query

```typescript
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';

const ReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(100).optional(),
  reviewText: z.string().max(2000).optional(),
});

type ReviewForm = z.infer<typeof ReviewSchema>;

export function ReviewFormComponent({ productId }: { productId: number }) {
  const form = useForm<ReviewForm>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: { rating: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: ReviewForm) => api.post(`/reviews`, { ...data, productId }),
    onSuccess: () => {
      form.reset();
      // invalidate queries
    },
  });

  return (
    <form onSubmit={form.handleSubmit(data => mutation.mutate(data))}>
      {/* form fields */}
    </form>
  );
}
```

---

## Validation Iteration Pattern

For complex validation development:

1. Define schema with strict types
2. Test with sample data: `schema.safeParse(testData)`
3. If validation fails, check `error.issues` for details
4. Adjust schema or data, repeat step 2
5. Only proceed when `safeParse` returns `{ success: true }`

```typescript
// Development helper
function debugSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    console.log('✅ Valid:', result.data);
  } else {
    console.log('❌ Invalid:');
    result.error.issues.forEach(issue => {
      console.log(`  ${issue.path.join('.')}: ${issue.message}`);
    });
  }
  return result;
}