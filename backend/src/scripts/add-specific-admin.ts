import { pool } from '../db/client';
import bcrypt from 'bcryptjs';

const addAdmin = async () => {
  try {
    const email = 'kaxgel11@gmail.com';
    const password = 'GVA@edw0fke6urq8wer';
    const name = 'Kakha Admin';
    const role = 'super_admin';

    console.log(`Creating admin user: ${email}...`);

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         is_active = EXCLUDED.is_active`,
      [email, passwordHash, name, role, true]
    );

    console.log('✅ Admin user created/updated successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
};

addAdmin();
