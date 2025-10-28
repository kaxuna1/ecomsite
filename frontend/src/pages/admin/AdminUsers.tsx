import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import type { AdminUser, CreateAdminUserRequest, UpdateAdminUserRequest } from '../../types/user';
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../../api/users';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateAdminUserRequest | UpdateAdminUserRequest) => Promise<void>;
  user?: AdminUser | null;
}

const AdminUserModal = ({ isOpen, onClose, onSave, user }: AdminUserModalProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin' as 'admin' | 'super_admin',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'admin',
        isActive: true,
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.name) {
      toast.error('Email and name are required');
      return;
    }

    if (!user && !formData.password) {
      toast.error('Password is required for new admin users');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      if (user) {
        // Update - only include password if it was changed
        const updateData: UpdateAdminUserRequest = {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          isActive: formData.isActive,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await onSave(updateData);
      } else {
        // Create
        await onSave(formData as CreateAdminUserRequest);
      }
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-midnight border-2 border-jade/30 rounded-lg max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-champagne mb-6">
          {user ? 'Edit Admin User' : 'Create Admin User'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-champagne/80 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-midnight border border-champagne/30 rounded-md text-champagne focus:outline-none focus:ring-2 focus:ring-jade focus:border-jade"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-champagne/80 mb-1">
                Password {!user && '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-midnight border border-champagne/30 rounded-md text-champagne focus:outline-none focus:ring-2 focus:ring-jade focus:border-jade"
                placeholder={user ? 'Leave blank to keep current password' : ''}
                required={!user}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-champagne/80 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-midnight border border-champagne/30 rounded-md text-champagne focus:outline-none focus:ring-2 focus:ring-jade focus:border-jade"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-champagne/80 mb-1">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
                className="w-full px-4 py-2 bg-midnight border border-champagne/30 rounded-md text-champagne focus:outline-none focus:ring-2 focus:ring-jade focus:border-jade"
                required
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-jade focus:ring-jade border-champagne/30 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-champagne">
                Active
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-champagne/30 text-champagne rounded-md hover:bg-champagne/10 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-jade text-midnight rounded-md hover:bg-jade/90 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, userName }: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-midnight border-2 border-blush/30 rounded-lg max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-champagne mb-4">Confirm Delete</h2>
        <p className="text-champagne/80 mb-6">
          Are you sure you want to delete admin user <strong className="text-blush">{userName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-champagne/30 text-champagne rounded-md hover:bg-champagne/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blush text-midnight rounded-md hover:bg-blush/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminUsers() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; user: AdminUser | null }>({
    isOpen: false,
    user: null,
  });

  const loadAdminUsers = async () => {
    try {
      const users = await getAllAdminUsers();
      setAdminUsers(users);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const handleCreateOrUpdate = async (data: CreateAdminUserRequest | UpdateAdminUserRequest) => {
    try {
      if (editingUser) {
        await updateAdminUser(editingUser.id, data as UpdateAdminUserRequest);
        toast.success('Admin user updated successfully');
      } else {
        await createAdminUser(data as CreateAdminUserRequest);
        toast.success('Admin user created successfully');
      }
      loadAdminUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save admin user');
      throw error;
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.user) return;

    const superAdminCount = adminUsers.filter((u) => u.role === 'super_admin').length;
    if (deleteConfirm.user.role === 'super_admin' && superAdminCount <= 1) {
      toast.error('Cannot delete the last super admin user');
      setDeleteConfirm({ isOpen: false, user: null });
      return;
    }

    try {
      await deleteAdminUser(deleteConfirm.user.id);
      toast.success('Admin user deleted successfully');
      loadAdminUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete admin user');
    } finally {
      setDeleteConfirm({ isOpen: false, user: null });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-midnight flex items-center gap-2">
            <UserGroupIcon className="h-8 w-8" />
            Admin Users
          </h1>
          <p className="text-midnight/70 mt-1">Manage admin user accounts and permissions</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}
          className="bg-jade text-white px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Admin User
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-jade"></div>
          <p className="text-midnight/70 mt-2">Loading admin users...</p>
        </div>
      ) : (
        <div className="bg-midnight/50 border border-champagne/20 rounded-lg shadow-xl overflow-hidden">
          <table className="min-w-full divide-y divide-champagne/20">
            <thead className="bg-midnight/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-midnight/30 divide-y divide-champagne/10">
              {adminUsers.map((user) => (
                <tr key={user.id} className="hover:bg-jade/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-champagne">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-champagne/70">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'super_admin'
                          ? 'bg-jade/20 text-jade border border-jade/30'
                          : 'bg-blush/20 text-blush border border-blush/30'
                      }`}
                    >
                      {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-jade/20 text-jade border border-jade/30'
                          : 'bg-blush/20 text-blush border border-blush/30'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-champagne/70">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-jade hover:text-jade/80 transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, user })}
                        className="text-blush hover:text-blush/80 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {adminUsers.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-champagne/30" />
              <p className="text-champagne/70 mt-2">No admin users found</p>
            </div>
          )}
        </div>
      )}

      <AdminUserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleCreateOrUpdate}
        user={editingUser}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, user: null })}
        onConfirm={handleDelete}
        userName={deleteConfirm.user?.name || ''}
      />
    </div>
  );
}
