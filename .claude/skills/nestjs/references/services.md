# Services Reference

## Contents
- Service Basics
- Dependency Injection
- Repository Pattern
- Transaction Handling
- WARNING: Anti-Patterns

## Service Basics

Services contain business logic and are injectable via DI. Mark with `@Injectable()`.

```typescript
// src/products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(query: FindProductsDto): Promise<PaginatedResult<Product>> {
    const [items, total] = await this.productRepo.findAndCount({
      where: this.buildWhereClause(query),
      skip: query.offset,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total, page: query.page, limit: query.limit };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }
}
```

## Dependency Injection

Register services in module providers. Export for use in other modules.

```typescript
// src/products/products.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductTranslation]),
    CacheModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductsSearchService,
    {
      provide: 'PRODUCT_VALIDATOR',
      useClass: ProductValidatorService,
    },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
```

Use in other services:

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly productsService: ProductsService,
    @Inject('PRODUCT_VALIDATOR')
    private readonly validator: ProductValidatorService,
  ) {}
}
```

## Repository Pattern

Encapsulate database operations. See the **prisma** skill for Prisma alternative.

```typescript
@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findWithTranslations(id: number, lang: string): Promise<Product> {
    return this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'translation', 
        'translation.languageCode = :lang', { lang })
      .where('product.id = :id', { id })
      .getOne();
  }

  async search(term: string): Promise<Product[]> {
    return this.repo
      .createQueryBuilder('product')
      .where('product.searchVector @@ plainto_tsquery(:term)', { term })
      .orderBy('ts_rank(product.searchVector, plainto_tsquery(:term))', 'DESC')
      .getMany();
  }
}
```

## Transaction Handling

Use QueryRunner for transactions. See the **postgresql** skill for connection pooling.

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async create(dto: CreateOrderDto, userId: number): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = queryRunner.manager.create(Order, {
        ...dto,
        userId,
        status: OrderStatus.PENDING,
      });
      await queryRunner.manager.save(order);

      for (const item of dto.items) {
        await queryRunner.manager.decrement(
          Product,
          { id: item.productId },
          'inventory',
          item.quantity,
        );
      }

      await queryRunner.commitTransaction();
      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

## WARNING: Circular Dependencies

**The Problem:**

```typescript
// BAD - Services depend on each other
@Injectable()
export class UsersService {
  constructor(private ordersService: OrdersService) {}
}

@Injectable()
export class OrdersService {
  constructor(private usersService: UsersService) {} // Circular!
}
```

**Why This Breaks:**
1. Runtime undefined errors
2. Impossible to instantiate
3. Poor architecture signal

**The Fix:**

```typescript
// GOOD - Use forwardRef or restructure
@Injectable()
export class OrdersService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}
}

// BETTER - Extract shared logic
@Injectable()
export class UserOrdersService {
  constructor(
    private usersRepo: UsersRepository,
    private ordersRepo: OrdersRepository,
  ) {}
}
```

## WARNING: Sync Operations in Async Context

**The Problem:**

```typescript
// BAD - Blocking file read
@Injectable()
export class ConfigService {
  getConfig() {
    return JSON.parse(fs.readFileSync('config.json', 'utf-8')); // Blocks!
  }
}
```

**Why This Breaks:**
1. Blocks event loop
2. Degrades all concurrent requests
3. Causes timeouts under load

**The Fix:**

```typescript
// GOOD - Async read
@Injectable()
export class ConfigService {
  async getConfig() {
    const data = await fs.promises.readFile('config.json', 'utf-8');
    return JSON.parse(data);
  }
}