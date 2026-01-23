# Error Handling Reference

## Contents
- Built-in Exceptions
- Custom Exceptions
- Exception Filters
- Validation Errors
- WARNING: Anti-Patterns

## Built-in Exceptions

NestJS provides HTTP exceptions that map to status codes.

```typescript
import {
  BadRequestException,    // 400
  UnauthorizedException,  // 401
  ForbiddenException,     // 403
  NotFoundException,      // 404
  ConflictException,      // 409
  InternalServerErrorException, // 500
} from '@nestjs/common';

@Injectable()
export class ProductsService {
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productRepo.findOne({ 
      where: { slug: dto.slug } 
    });
    if (existing) {
      throw new ConflictException(`Product with slug '${dto.slug}' exists`);
    }
    return this.productRepo.save(dto);
  }
}
```

## Custom Exceptions

```typescript
// src/common/exceptions/business.exception.ts
export class InsufficientInventoryException extends HttpException {
  constructor(productId: number, requested: number, available: number) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Insufficient Inventory',
        message: `Product #${productId} has ${available} items, requested ${requested}`,
        productId,
        available,
        requested,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

// Usage
if (product.inventory < dto.quantity) {
  throw new InsufficientInventoryException(
    product.id, 
    dto.quantity, 
    product.inventory,
  );
}
```

## Exception Filters

```typescript
// src/common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message,
    };

    this.logger.error(
      `${request.method} ${request.url} ${status}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}

// Register globally
// main.ts
app.useGlobalFilters(new HttpExceptionFilter());
```

## Validation Errors

See the **zod** skill for Zod-based validation.

```typescript
// src/common/filters/validation-exception.filter.ts
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse() as any;

    const errors = Array.isArray(exceptionResponse.message)
      ? exceptionResponse.message.reduce((acc, msg) => {
          const [field] = msg.split(' ');
          acc[field] = acc[field] || [];
          acc[field].push(msg);
          return acc;
        }, {})
      : { general: [exceptionResponse.message] };

    response.status(400).json({
      statusCode: 400,
      error: 'Validation Failed',
      errors,
    });
  }
}
```

## WARNING: Silent Failures

**The Problem:**

```typescript
// BAD - Swallowing errors
async create(dto: CreateDto) {
  try {
    return await this.repo.save(dto);
  } catch (error) {
    return null; // Caller has no idea it failed!
  }
}
```

**Why This Breaks:**
1. Caller assumes success
2. No debugging information
3. Data inconsistency

**The Fix:**

```typescript
// GOOD - Log and rethrow with context
async create(dto: CreateDto) {
  try {
    return await this.repo.save(dto);
  } catch (error) {
    this.logger.error('Failed to create entity', { dto, error });
    throw new InternalServerErrorException('Failed to create resource');
  }
}
```

## WARNING: Exposing Internal Errors

**The Problem:**

```typescript
// BAD - Stack trace to client
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(500).json({
      message: exception.message,
      stack: exception.stack, // Security risk!
    });
  }
}
```

**Why This Breaks:**
1. Exposes implementation details
2. Reveals file paths and dependencies
3. Aids attackers

**The Fix:**

```typescript
// GOOD - Generic message, log details server-side
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    
    this.logger.error(exception.message, exception.stack);
    
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}