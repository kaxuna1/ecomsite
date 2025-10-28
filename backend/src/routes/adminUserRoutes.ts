import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { adminUserService } from '../services/adminUserService';
import { regularUserService } from '../services/regularUserService';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============ Admin Users Management ============

// Get all admin users
router.get('/admins', async (req, res) => {
  try {
    const users = await adminUserService.list();
    res.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Failed to fetch admin users' });
  }
});

// Get single admin user
router.get('/admins/:id', async (req, res) => {
  try {
    const user = await adminUserService.getById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching admin user:', error);
    res.status(500).json({ message: 'Failed to fetch admin user' });
  }
});

// Create new admin user
router.post('/admins', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await adminUserService.create({ email, password, name, role });
    res.status(201).json(user);
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    if (error.message === 'Email already exists') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to create admin user' });
  }
});

// Update admin user
router.patch('/admins/:id', async (req, res) => {
  try {
    const { email, name, role, isActive, password } = req.body;

    if (role && !['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await adminUserService.update(parseInt(req.params.id), {
      email,
      name,
      role,
      isActive,
      password
    });

    if (!user) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error updating admin user:', error);
    if (error.message === 'Email already exists') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to update admin user' });
  }
});

// Delete admin user
router.delete('/admins/:id', async (req, res) => {
  try {
    const success = await adminUserService.delete(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting admin user:', error);
    if (error.message === 'Cannot delete the last super admin') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to delete admin user' });
  }
});

// ============ Regular Users Management ============

// Get all regular users
router.get('/users', async (req, res) => {
  try {
    const users = await regularUserService.list();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user stats
router.get('/users/stats', async (req, res) => {
  try {
    const stats = await regularUserService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user stats' });
  }
});

// Get single regular user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await regularUserService.getById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update regular user
router.patch('/users/:id', async (req, res) => {
  try {
    const { email, name } = req.body;
    const user = await regularUserService.update(parseInt(req.params.id), { email, name });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.message === 'Email already exists') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete regular user
router.delete('/users/:id', async (req, res) => {
  try {
    const success = await regularUserService.delete(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;
