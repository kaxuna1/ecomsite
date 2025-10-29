# Security Checklist for Express APIs

## Authentication & Authorization

### JWT Implementation

```typescript
import jwt from 'jsonwebtoken';

// ✅ Strong secret (minimum 32 characters)
const JWT_SECRET = process.env.JWT_SECRET; // e.g., 64-char random string

// ✅ Set appropriate expiration
const token = jwt.sign(
  { userId: user.id },
  JWT_SECRET,
  { expiresIn: '7d' } // Not too long!
);

// ✅ Verify token properly
try {
  const payload = jwt.verify(token, JWT_SECRET);
} catch (error) {
  throw new UnauthorizedError('Invalid token');
}
```

### Password Security

```typescript
import bcrypt from 'bcrypt';

// ✅ Use bcrypt with appropriate salt rounds
const SALT_ROUNDS = 10; // 10-12 is good for most applications

// Hash password
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Never:**
- ❌ Store passwords in plain text
- ❌ Use weak hashing (MD5, SHA1)
- ❌ Use encryption instead of hashing for passwords
- ❌ Hash passwords on client side only

### Authorization Middleware

```typescript
// Check user owns resource
export const authorize = (resourceKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const resourceId = parseInt(req.params[resourceKey]);
    const resource = await findResourceOwner(resourceId);

    if (resource.userId !== req.userId) {
      throw new ForbiddenError('Access denied');
    }

    next();
  };
};

// Usage
router.delete('/posts/:id', authenticate, authorize('id'), deletePost);
```

## Input Validation

### Always Validate Input

```typescript
import { z } from 'zod';

// ✅ Validate all inputs with Zod
const userSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  age: z.number().int().min(0).max(150),
  website: z.string().url().optional(),
});

// ✅ Sanitize HTML content
import DOMPurify from 'isomorphic-dompurify';
const cleanHtml = DOMPurify.sanitize(userInput);
```

### SQL Injection Prevention

```typescript
// ✅ ALWAYS use parameterized queries
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ NEVER concatenate user input
const result = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### NoSQL Injection Prevention

```typescript
// ✅ Validate input types
const userId = z.string().uuid().parse(req.params.id);

// ❌ Don't trust input
db.collection.find({ _id: req.params.id }); // Vulnerable!
```

## XSS Protection

### Content Security Policy

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
```

### Output Encoding

```typescript
// ✅ Express automatically escapes JSON responses
res.json({ message: userInput }); // Safe

// ❌ Be careful with HTML responses
res.send(`<div>${userInput}</div>`); // Vulnerable!

// ✅ Use template engines that auto-escape
res.render('template', { userInput }); // Safe if using EJS/Pug
```

## CSRF Protection

```typescript
import csrf from 'csurf';

// For cookie-based sessions
const csrfProtection = csrf({ cookie: true });

app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/submit', csrfProtection, (req, res) => {
  // Protected from CSRF
});
```

For JWT/stateless APIs, CSRF is less of a concern if:
- Tokens are stored in httpOnly cookies
- Use SameSite cookie attribute

## CORS Configuration

```typescript
import cors from 'cors';

// ✅ Restrictive CORS in production
app.use(cors({
  origin: process.env.CORS_ORIGIN, // Specific origin, not '*'
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));

// ❌ Don't use in production
app.use(cors({ origin: '*' }));
```

## Rate Limiting

### Basic Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

### Stricter Limits for Sensitive Endpoints

```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
});

app.post('/api/v1/users/login', authLimiter, loginController);
```

### Account Lockout

```typescript
// Track failed login attempts
async function checkLoginAttempts(email: string) {
  const attempts = await redis.get(`login:attempts:${email}`);

  if (attempts && parseInt(attempts) >= 5) {
    throw new TooManyRequestsError('Account locked. Try again later.');
  }
}

// Increment on failed login
async function recordFailedLogin(email: string) {
  await redis.incr(`login:attempts:${email}`);
  await redis.expire(`login:attempts:${email}`, 900); // 15 minutes
}

// Clear on successful login
async function clearLoginAttempts(email: string) {
  await redis.del(`login:attempts:${email}`);
}
```

## Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet()); // Sets multiple security headers

// Equivalent to:
app.use(helmet.contentSecurityPolicy());
app.use(helmet.crossOriginEmbedderPolicy());
app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.crossOriginResourcePolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
```

### Key Headers Explained

```http
# Prevent clickjacking
X-Frame-Options: DENY

# Prevent MIME sniffing
X-Content-Type-Options: nosniff

# Enable XSS protection
X-XSS-Protection: 1; mode=block

# Force HTTPS
Strict-Transport-Security: max-age=31536000; includeSubDomains

# Control referrer information
Referrer-Policy: no-referrer-when-downgrade
```

## Environment Variables

```typescript
// ✅ Use environment variables for secrets
const config = {
  jwtSecret: process.env.JWT_SECRET,
  dbPassword: process.env.DB_PASSWORD,
  apiKey: process.env.API_KEY,
};

// ✅ Validate environment variables on startup
import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(32),
  DB_PASSWORD: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

const env = envSchema.parse(process.env);
```

**.env file security:**
- ✅ Add `.env` to `.gitignore`
- ✅ Use `.env.example` as template (without real secrets)
- ✅ Use secret management services in production (AWS Secrets Manager, HashiCorp Vault)
- ❌ Never commit `.env` to git
- ❌ Never hardcode secrets in code

## File Upload Security

```typescript
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// ✅ Validate file types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// ✅ Limit file size
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      // ✅ Generate safe random filename
      const randomName = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname);
      cb(null, `${randomName}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// ✅ Scan uploads for malware (in production)
// Use ClamAV or similar
```

## Database Security

### Connection Security

```typescript
// ✅ Use SSL for database connections in production
const pool = new Pool({
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
  },
});
```

### Least Privilege Principle

```sql
-- ✅ Create separate database users with limited permissions
CREATE USER app_user WITH PASSWORD 'strong_password';

-- Only grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO app_user;

-- ❌ Don't use superuser for application
-- ❌ Don't grant ALL PRIVILEGES
```

### Connection Pooling Limits

```typescript
const pool = new Pool({
  max: 20, // Limit connections
  idleTimeoutMillis: 30000, // Close idle connections
  connectionTimeoutMillis: 2000,
});
```

## Logging & Monitoring

### Log Security Events

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'security.log', level: 'warn' }),
  ],
});

// Log authentication events
logger.warn('Failed login attempt', { email, ip: req.ip });
logger.info('Successful login', { userId, ip: req.ip });
logger.warn('JWT verification failed', { token, error });
logger.error('SQL injection attempt detected', { query, ip: req.ip });
```

### What to Log

✅ Log:
- Authentication attempts (success/failure)
- Authorization failures
- Input validation errors
- Rate limit violations
- Security header violations
- Suspicious activities

❌ Never log:
- Passwords (even hashed)
- JWT tokens
- API keys
- Credit card numbers
- Personal data (unless necessary)

## Dependencies

### Keep Dependencies Updated

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update packages
npm update
```

### Use npm/yarn Security Features

```bash
# Generate security report
npm audit

# Review package before installing
npm view <package-name>

# Lock dependencies
npm shrinkwrap
```

## Error Handling

### Don't Leak Information

```typescript
// ✅ Generic error messages in production
if (env.NODE_ENV === 'production') {
  res.status(500).json({
    success: false,
    error: { message: 'Internal server error' }
  });
} else {
  // ✅ Detailed errors in development
  res.status(500).json({
    success: false,
    error: {
      message: error.message,
      stack: error.stack,
    }
  });
}

// ❌ Don't expose stack traces in production
```

## HTTPS/TLS

### Force HTTPS

```typescript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

// Or use middleware
import enforceHttps from 'express-enforces-ssl';
app.use(enforceHttps());
```

### Certificate Management

- ✅ Use Let's Encrypt for free SSL certificates
- ✅ Auto-renew certificates
- ✅ Use TLS 1.2 or higher
- ❌ Don't use self-signed certificates in production

## API Keys & Tokens

### API Key Management

```typescript
// ✅ Store API keys securely
const API_KEY = process.env.API_KEY;

// ✅ Validate API keys
const validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

app.use('/api/', validateApiKey);
```

### Token Rotation

```typescript
// Implement refresh tokens
const refreshToken = jwt.sign(
  { userId: user.id },
  REFRESH_SECRET,
  { expiresIn: '30d' }
);

// Store refresh token in database
await db.query(
  'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
  [user.id, refreshToken]
);

// Revoke tokens on logout
await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
```

## Production Checklist

Before deploying to production:

- [ ] Environment variables are set correctly
- [ ] Secrets are not hardcoded
- [ ] HTTPS is enforced
- [ ] Rate limiting is enabled
- [ ] Security headers are set (Helmet)
- [ ] CORS is configured correctly
- [ ] Input validation is implemented
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection is enabled
- [ ] Authentication is secure (JWT + bcrypt)
- [ ] Error messages don't leak information
- [ ] Logging is configured properly
- [ ] Dependencies are up to date (npm audit)
- [ ] Database uses least privilege access
- [ ] File uploads are validated and limited
- [ ] API documentation doesn't expose sensitive endpoints
- [ ] Health check endpoint doesn't expose sensitive info
- [ ] Backup and disaster recovery plan is in place
