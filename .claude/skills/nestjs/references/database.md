# Database Reference

## Contents
- TypeORM Configuration
- Entity Definitions
- Query Optimization
- Connection Pooling
- WARNING: Anti-Patterns

## TypeORM Configuration

See the **postgresql** skill for PostgreSQL-specific optimization.

```typescript
// src/database/database.module.ts
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false, // NEVER true in production
        poolSize: 20,
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
```

## Entity Definitions

```typescript
// src/products/entities/product.entity.ts
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('jsonb', { default: [] })
  categories: string[];

  @Column({ default: 0 })
  inventory: number;

  @Column({ type: 'tsvector', select: false })
  searchVector: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProductTranslation, (t) => t.product, { cascade: true })
  translations: ProductTranslation[];

  @OneToMany(() => ProductVariant, (v) => v.product)
  variants: ProductVariant[];
}
```

## Query Optimization

Prevent N+1 queries with eager loading and query builder.

```typescript
@Injectable()
export class ProductsService {
  // GOOD - Eager load relations
  async findWithRelations(id: number): Promise<Product> {
    return this.productRepo.findOne({
      where: { id },
      relations: ['translations', 'variants', 'variants.optionValues'],
    });
  }

  // GOOD - Query builder for complex queries
  async findByCategory(category: string, lang: string): Promise<Product[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'trans', 
        'trans.languageCode = :lang', { lang })
      .where('product.categories @> :category', { 
        category: JSON.stringify([category]) 
      })
      .orderBy('product.salesCount', 'DESC')
      .take(20)
      .getMany();
  }

  // GOOD - Batch load to prevent N+1
  async findManyWithTranslations(ids: number[], lang: string): Promise<Product[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.translations', 'trans',
        'trans.languageCode = :lang', { lang })
      .whereInIds(ids)
      .getMany();
  }
}
```

## Connection Pooling

See the **redis** skill for caching query results.

```typescript
// Monitor pool health
@Injectable()
export class DatabaseHealthService {
  constructor(private dataSource: DataSource) {}

  async checkHealth(): Promise<HealthStatus> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.query('SELECT 1');
      return { status: 'healthy', pool: this.dataSource.options };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    } finally {
      await queryRunner.release();
    }
  }
}
```

## WARNING: N+1 Query Problem

**The Problem:**

```typescript
// BAD - N+1 queries
async findAllWithTranslations(): Promise<Product[]> {
  const products = await this.productRepo.find();
  for (const product of products) {
    product.translations = await this.translationRepo.find({
      where: { productId: product.id },
    }); // Query per product!
  }
  return products;
}
```

**Why This Breaks:**
1. 1 query + N queries for N products
2. Database connection exhaustion
3. Exponential response time

**The Fix:**

```typescript
// GOOD - Single query with join
async findAllWithTranslations(): Promise<Product[]> {
  return this.productRepo.find({
    relations: ['translations'],
  });
}
```

## WARNING: Synchronize in Production

**The Problem:**

```typescript
// BAD - Auto-sync schema
TypeOrmModule.forRoot({
  synchronize: true, // DANGEROUS in production!
})
```

**Why This Breaks:**
1. Drops columns/tables unexpectedly
2. Data loss on entity changes
3. No migration history

**The Fix:**

```typescript
// GOOD - Use migrations
TypeOrmModule.forRoot({
  synchronize: false,
  migrationsRun: true,
  migrations: ['dist/migrations/*.js'],
})
```

See the **prisma** skill for migration-first database management.