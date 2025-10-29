# Admin User Setup Guide

## Overview

The Docker image now supports creating an initial admin user on first run using environment variables. This allows you to specify custom admin credentials without modifying code.

## Environment Variables

### Admin User Configuration

- **`INITIAL_ADMIN_EMAIL`** (optional)
  - Default: `admin@luxia.local`
  - The email address for the initial admin user

- **`INITIAL_ADMIN_PASSWORD`** (optional)
  - Default: `LuxiaAdmin2024!`
  - The password for the initial admin user
  - **Security Note**: Always change the default password in production!

- **`INITIAL_ADMIN_NAME`** (optional)
  - Default: `"Super Administrator"`
  - The display name for the initial admin user

## Usage Examples

### Example 1: Default Admin User

```bash
# Uses default credentials
docker run -d -p 80:80 \
  -e JWT_SECRET=your-secret \
  -e DB_PASSWORD=db_pass \
  -e POSTGRES_PASSWORD=db_pass \
  luxia-ecommerce:latest

# Login with:
# Email: admin@luxia.local
# Password: LuxiaAdmin2024!
```

### Example 2: Custom Admin User

```bash
# Custom admin credentials
docker run -d -p 80:80 \
  -e JWT_SECRET=your-secret \
  -e DB_PASSWORD=db_pass \
  -e POSTGRES_PASSWORD=db_pass \
  -e INITIAL_ADMIN_EMAIL=admin@mycompany.com \
  -e INITIAL_ADMIN_PASSWORD="MySecurePassword123!" \
  -e INITIAL_ADMIN_NAME="System Administrator" \
  luxia-ecommerce:latest

# Login with:
# Email: admin@mycompany.com
# Password: MySecurePassword123!
```

### Example 3: Docker Compose

```yaml
version: '3.8'

services:
  luxia-app:
    image: luxia-ecommerce:latest
    ports:
      - "80:80"
    environment:
      # Database
      - DB_PASSWORD=secure_db_password
      - POSTGRES_PASSWORD=secure_db_password
      - JWT_SECRET=your-jwt-secret-key

      # Custom Admin User
      - INITIAL_ADMIN_EMAIL=admin@example.com
      - INITIAL_ADMIN_PASSWORD=VerySecurePassword123!
      - INITIAL_ADMIN_NAME=John Administrator
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - uploads_data:/app/backend/uploads

volumes:
  postgres_data:
  uploads_data:
```

## How It Works

### 1. Initial Setup

On first run (when the database is empty):

1. PostgreSQL is initialized
2. Database and user are created
3. Main migrations run (creating tables)
4. Admin user setup script runs
5. If no admin users exist, the initial admin is created using environment variables

### 2. Subsequent Runs

On subsequent runs:

- The script detects existing admin users
- No new admin user is created
- Your existing admins remain unchanged

### 3. Admin Users Table

The `admin_users` table structure:

```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

Roles:
- `super_admin`: Full access (initial admin)
- `admin`: Standard admin access

## Security Best Practices

### Production Deployment

1. **Always Set Custom Credentials**
   ```bash
   -e INITIAL_ADMIN_EMAIL=your-email@company.com \
   -e INITIAL_ADMIN_PASSWORD="$(openssl rand -base64 24)" \
   ```

2. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Avoid common passwords

3. **Secure Storage**
   - Store credentials in a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Don't commit passwords to version control
   - Use environment variable files with restricted permissions

4. **Change Default Passwords**
   - Even if you set a custom password, change it after first login
   - Implement password rotation policies

### Example: Using Docker Secrets

```bash
# Create secrets
echo "admin@secure-company.com" | docker secret create admin_email -
echo "VerySecurePassword123!" | docker secret create admin_password -

# Run container with secrets
docker service create \
  --name luxia-app \
  --secret admin_email \
  --secret admin_password \
  -e INITIAL_ADMIN_EMAIL="$(cat /run/secrets/admin_email)" \
  -e INITIAL_ADMIN_PASSWORD="$(cat /run/secrets/admin_password)" \
  luxia-ecommerce:latest
```

## Verification

### Check Admin User Creation

After starting the container, check the logs:

```bash
docker logs your-container-name 2>&1 | grep -A 10 "admin"
```

You should see:
```
Creating admin_users table...
✓ admin_users table created
✓ Indexes created
Creating initial super admin user...

✅ Initial admin user created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: admin@luxia.local
🔑 Password: ********
👤 Name: Super Administrator
👤 Role: Super Admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Manual Database Check

```bash
# Connect to database
docker exec -it your-container-name bash

# Query admin users
PGPASSWORD=your_db_password psql -U luxia -d luxia \
  -c "SELECT email, name, role, is_active FROM admin_users;"
```

## Troubleshooting

### Issue: Can't Login with Custom Credentials

**Check 1: Verify Environment Variables**
```bash
docker inspect your-container-name | grep -A 3 "INITIAL_ADMIN"
```

**Check 2: Check Migration Logs**
```bash
docker exec your-container-name cat /var/log/supervisor/migrations.log
```

**Check 3: Verify Admin in Database**
```bash
docker exec your-container-name bash -c \
  "PGPASSWORD=\$DB_PASSWORD psql -U luxia -d luxia -c 'SELECT * FROM admin_users;'"
```

### Issue: "Admin users already exist" Message

This is normal on subsequent runs. The initial admin is only created if the table is empty.

To create additional admins:
1. Use the admin panel (if available)
2. Or manually insert via SQL:

```sql
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
  'another@admin.com',
  -- Generate hash: node -e "console.log(require('bcryptjs').hashSync('password', 10))"
  '$2b$10$...',
  'Another Admin',
  'admin'
);
```

### Issue: Password Not Working

1. **Clear existing data and restart**:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. **Check password in logs** (only shows for default password):
   ```bash
   docker logs your-container | grep "Password:"
   ```

3. **Reset admin password**:
   ```bash
   # Generate new hash
   NEW_HASH=$(node -e "console.log(require('bcryptjs').hashSync('NewPassword123!', 10))")

   # Update in database
   docker exec your-container bash -c \
     "PGPASSWORD=\$DB_PASSWORD psql -U luxia -d luxia -c \
     \"UPDATE admin_users SET password_hash='$NEW_HASH' WHERE email='admin@luxia.local';\""
   ```

## API Endpoints

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@luxia.local",
  "password": "LuxiaAdmin2024!"
}

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@luxia.local",
    "name": "Super Administrator",
    "role": "super_admin"
  }
}
```

### Using the Token

```bash
# Include token in Authorization header
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost/api/admin/endpoint
```

## Migration from Old System

If you were using the old `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` system:

### Old Way:
```bash
-e ADMIN_EMAIL=admin@example.com \
-e ADMIN_PASSWORD_HASH='$2b$10$...'
```

### New Way:
```bash
-e INITIAL_ADMIN_EMAIL=admin@example.com \
-e INITIAL_ADMIN_PASSWORD=YourPlainPassword
```

The new system:
- ✅ Simpler (no need to pre-hash passwords)
- ✅ More flexible (can set name)
- ✅ Database-backed (supports multiple admins)
- ✅ Includes role management

## Additional Features

### Multiple Admin Users

After creating the initial admin, you can add more through:

1. **Admin Panel** (if implemented)
2. **Direct Database Insert**
3. **Migration Scripts**

### Admin Roles

- **super_admin**: Full system access
- **admin**: Standard admin access

Modify roles as needed in your application logic.

### Audit Trail

The `last_login` field tracks when admins log in. Extend with:
- Login history table
- Failed login attempts
- Password change history
- Activity logs

## Related Documentation

- [Docker Build Guide](BUILD.md)
- [Docker Configuration](docker/README.md)
- [Environment Variables](docker-compose.yml)
- [Database Migrations](backend/src/scripts/migrate.ts)
