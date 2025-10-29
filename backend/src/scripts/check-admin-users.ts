import { pool } from '../db/client';

const checkAdminUsers = async () => {
  try {
    const { rows } = await pool.query('SELECT id, email, name, role, is_active FROM admin_users');
    console.log('Existing admin users:');
    console.table(rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
};

checkAdminUsers();
