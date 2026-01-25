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
import PageHeader from '../../components/admin/PageHeader';

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
    <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-modal-title"
        className="bg-bg-elevated border-2 border-primary/30 rounded-lg max-w-md w-full p-4 sm:p-5 lg:p-6 shadow-2xl"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
      >
        <h2 id="admin-user-modal-title" className="text-lg font-bold text-text-primary mb-4 sm:text-xl sm:mb-5 lg:text-2xl lg:mb-6">
          {user ? 'Edit Admin User' : 'Create Admin User'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-bg-elevated border border-border-default rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Password {!user && '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-bg-elevated border border-border-default rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder={user ? 'Leave blank to keep current password' : ''}
                required={!user}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-bg-elevated border border-border-default rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
                className="w-full px-4 py-2 bg-bg-elevated border border-border-default rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                className="h-4 w-4 text-primary focus:ring-primary border-border-default rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-text-primary">
                Active
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border-default text-text-primary rounded-md hover:bg-bg-secondary transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-interactive-default text-on-interactive rounded-md hover:bg-interactive-hover transition-colors disabled:opacity-50"
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
    <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-bg-elevated border-2 border-red-500/30 rounded-lg max-w-md w-full p-4 sm:p-5 lg:p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-text-primary mb-3 sm:text-xl sm:mb-4 lg:text-2xl">Confirm Delete</h2>
        <p className="text-text-primary mb-6">
          Are you sure you want to delete admin user <strong className="text-red-400">{userName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border-default text-text-primary rounded-md hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
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
    <div className="p-3 space-y-4 sm:p-4 sm:space-y-5 lg:p-8 lg:space-y-6">
      <PageHeader
        title="Admin Users"
        description="Manage admin user accounts and permissions"
        actions={(
          <button
            type="button"
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="bg-interactive-default text-on-interactive px-6 py-2 rounded-md hover:bg-interactive-hover transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Admin User
          </button>
        )}
      />

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-text-secondary mt-2">Loading admin users...</p>
        </div>
      ) : (
        <div className="bg-bg-elevated border border-border-default rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-3 sm:px-0">
              <table className="min-w-full divide-y divide-border-default">
                <thead className="bg-bg-secondary">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider sm:px-4 sm:py-3 lg:px-6">
                      Name
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider sm:px-4 sm:py-3 lg:px-6">
                      Email
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider sm:px-4 sm:py-3 lg:px-6">
                      Role
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider sm:px-4 sm:py-3 lg:px-6">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider sm:px-4 sm:py-3 lg:px-6">
                      Last Login
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider sm:px-4 sm:py-3 lg:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-elevated divide-y divide-border-default">
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-bg-secondary transition-colors">
                      <td className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                        <div className="text-xs font-medium text-text-primary sm:text-sm">{user.name}</div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                        <div className="text-xs text-text-secondary break-all sm:text-sm">{user.email}</div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full sm:px-3 sm:py-1 ${
                            user.role === 'super_admin'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-primary/20 text-primary border border-primary/30'
                          }`}
                        >
                          {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full sm:px-3 sm:py-1 ${
                            user.isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-text-secondary sm:px-4 sm:py-4 sm:text-sm lg:px-6">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="px-3 py-3 text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-6">
                        <div className="flex gap-1.5 sm:gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary hover:text-primary/80 transition-colors"
                        title="Edit"
                        aria-label="Edit"
                      >
                        <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, user })}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </div>

          {adminUsers.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-text-tertiary" />
              <p className="text-text-secondary mt-2">No admin users found</p>
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
