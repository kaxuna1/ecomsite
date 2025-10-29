import { pool } from '../db/client';
import bcrypt from 'bcryptjs';

const createAdminUsersTable = async () => {
  try {
    console.log('Creating admin_users table...');

    // Create admin_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `);

    console.log('✓ admin_users table created');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
      CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
    `);

    console.log('✓ Indexes created');

    // Check if initial admin exists
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM admin_users');
    const count = parseInt(rows[0].count);

    if (count === 0) {
      console.log('Creating initial super admin user...');

      // Get admin credentials from environment variables or use defaults
      const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@luxia.local';
      const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'LuxiaAdmin2024!';
      const initialAdminName = process.env.INITIAL_ADMIN_NAME || 'Super Administrator';

      const passwordHash = await bcrypt.hash(initialAdminPassword, 10);

      await pool.query(
        `INSERT INTO admin_users (email, password_hash, name, role)
         VALUES ($1, $2, $3, $4)`,
        [initialAdminEmail, passwordHash, initialAdminName, 'super_admin']
      );

      console.log('\n✅ Initial admin user created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', initialAdminEmail);
      console.log('🔑 Password:', process.env.INITIAL_ADMIN_PASSWORD ? '********' : initialAdminPassword);
      console.log('👤 Name:', initialAdminName);
      console.log('👤 Role: Super Admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      if (!process.env.INITIAL_ADMIN_PASSWORD) {
        console.log('⚠️  Using default password! Please change it after first login!');
      }
    } else {
      console.log(`Admin users already exist (${count} users found), skipping initial user creation`);
    }

    console.log('\n✅ Admin users setup completed successfully');
  } catch (error) {
    console.error('❌ Error creating admin users table:', error);
    throw error;
  }
};

const run = async () => {
  try {
    await createAdminUsersTable();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
