# Authentication Reference

## Contents
- JWT Strategy
- Guards
- Role-Based Access Control
- Custom Decorators
- WARNING: Anti-Patterns

## JWT Strategy

```typescript
// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
```

## Guards

```typescript
// src/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: Error, user: User, info: Error) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}

// src/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

## Role-Based Access Control

```typescript
// src/auth/decorators/roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Usage in controller
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminProductsController {
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: number) {
    return this.productsService.remove(id);
  }
}
```

## Custom Decorators

```typescript
// src/auth/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Usage
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: User) {
  return user;
}

@Get('my-orders')
@UseGuards(JwtAuthGuard)
getOrders(@CurrentUser('id') userId: number) {
  return this.ordersService.findByUser(userId);
}
```

## WARNING: Hardcoded Secrets

**The Problem:**

```typescript
// BAD - Secret in code
JwtModule.register({
  secret: 'my-secret-key', // Exposed in git!
})
```

**Why This Breaks:**
1. Secret in version control
2. Same secret across environments
3. Cannot rotate without code change

**The Fix:**

```typescript
// GOOD - Environment variable
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow('JWT_SECRET'),
    signOptions: { expiresIn: '7d' },
  }),
})
```

## WARNING: Missing Guard on Routes

**The Problem:**

```typescript
// BAD - No protection
@Controller('users')
export class UsersController {
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id); // Anyone can access!
  }
}
```

**Why This Breaks:**
1. Unauthorized access to user data
2. IDOR vulnerabilities
3. Compliance violations

**The Fix:**

```typescript
// GOOD - Protected with ownership check
@Get(':id')
@UseGuards(JwtAuthGuard)
findOne(@Param('id') id: number, @CurrentUser() user: User) {
  if (user.id !== id && !user.roles.includes(Role.ADMIN)) {
    throw new ForbiddenException();
  }
  return this.usersService.findOne(id);
}