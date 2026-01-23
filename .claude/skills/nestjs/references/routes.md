# Routes Reference

## Contents
- Controller Basics
- Route Parameters and Query
- Request Body Validation
- Response Handling
- WARNING: Anti-Patterns

## Controller Basics

Controllers handle incoming requests and return responses. Each controller groups related routes.

```typescript
// src/orders/orders.controller.ts
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req): Promise<Order[]> {
    return this.ordersService.findByUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto, @Request() req): Promise<Order> {
    return this.ordersService.create(dto, req.user.id);
  }
}
```

## Route Parameters and Query

```typescript
// Path parameters with validation
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) {
  return this.service.findOne(id);
}

// Query parameters with DTO
@Get()
findAll(
  @Query() query: PaginationDto,
  @Query('category') category?: string,
) {
  return this.service.findAll({ ...query, category });
}

// Multiple path parameters
@Get(':userId/orders/:orderId')
findUserOrder(
  @Param('userId', ParseIntPipe) userId: number,
  @Param('orderId', ParseIntPipe) orderId: number,
) {
  return this.service.findUserOrder(userId, orderId);
}
```

## Request Body Validation

Use class-validator with DTOs. See the **zod** skill for alternative validation.

```typescript
// src/products/dto/create-product.dto.ts
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductTranslationDto)
  translations?: ProductTranslationDto[];
}
```

## Response Handling

```typescript
// Custom response with status code
@Post()
@HttpCode(HttpStatus.CREATED)
create(@Body() dto: CreateDto) {
  return this.service.create(dto);
}

// Redirect
@Get('old-route')
@Redirect('/new-route', 301)
redirectOld() {}

// Raw response access (AVOID unless necessary)
@Get('download/:id')
async download(
  @Param('id') id: string,
  @Res() res: Response,
) {
  const file = await this.service.getFile(id);
  res.download(file.path, file.name);
}
```

## WARNING: Business Logic in Controllers

**The Problem:**

```typescript
// BAD - Controller doing service work
@Post()
async create(@Body() dto: CreateOrderDto, @Request() req) {
  const product = await this.productRepo.findOne(dto.productId);
  if (!product) throw new NotFoundException();
  
  const order = this.orderRepo.create({
    ...dto,
    userId: req.user.id,
    total: product.price * dto.quantity,
  });
  
  await this.productRepo.decrement({ id: product.id }, 'inventory', dto.quantity);
  return this.orderRepo.save(order);
}
```

**Why This Breaks:**
1. Untestable without HTTP context
2. Violates single responsibility
3. Duplicated logic when used elsewhere

**The Fix:**

```typescript
// GOOD - Controller delegates to service
@Post()
create(@Body() dto: CreateOrderDto, @Request() req) {
  return this.ordersService.create(dto, req.user.id);
}
```

## WARNING: Missing Input Validation

**The Problem:**

```typescript
// BAD - No validation pipe
@Post()
create(@Body() body: any) {
  return this.service.create(body);
}
```

**Why This Breaks:**
1. Invalid data reaches database
2. Type errors at runtime
3. Security vulnerabilities

**The Fix:**

```typescript
// GOOD - DTO with validation
@Post()
@UsePipes(new ValidationPipe({ whitelist: true }))
create(@Body() dto: CreateProductDto) {
  return this.service.create(dto);
}