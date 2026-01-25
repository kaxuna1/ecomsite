import { useState, useEffect, useMemo } from 'react';
import { PencilIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import type { RegularUser, UpdateRegularUserRequest, UserStats } from '../../types/user';
import {
  getAllUsers,
  updateUser,
  deleteUser,
  getUserStats,
} from '../../api/users';
import PageHeader from '../../components/admin/PageHeader';
import SearchInput from '../../components/admin/SearchInput';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateRegularUserRequest) => Promise<void>;
  user: RegularUser | null;
}

const EditUserModal = ({ isOpen, onClose, onSave, user }: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        name: user.name,
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name) {
      toast.error('Email and name are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
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
        aria-labelledby="edit-customer-title"
        className="bg-bg-elevated border-2 border-primary/30 rounded-lg max-w-md w-full p-4 sm:p-5 lg:p-6 shadow-2xl"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
      >
        <h2 id="edit-customer-title" className="text-lg font-bold text-text-primary mb-4 sm:text-xl sm:mb-5 lg:text-2xl lg:mb-6">Edit Customer</h2>
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
              {isSubmitting ? 'Saving...' : 'Update'}
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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-customer-title"
        className="bg-bg-elevated border-2 border-red-500/30 rounded-lg max-w-md w-full p-6 shadow-2xl"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
      >
        <h2 id="delete-customer-title" className="text-2xl font-bold text-text-primary mb-4">Confirm Delete</h2>
        <p className="text-text-primary mb-6">
          Are you sure you want to delete customer <strong className="text-red-400">{userName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border-default text-text-primary rounded-md hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
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

type SortField = 'name' | 'orderCount' | 'totalSpent' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function RegularUsers() {
  const [users, setUsers] = useState<RegularUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<RegularUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; user: RegularUser | null }>({
    isOpen: false,
    user: null,
  });

  const loadUsers = async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        getAllUsers(),
        getUserStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date sorting
      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [users, searchQuery, sortField, sortDirection]);

  const handleUpdate = async (data: UpdateRegularUserRequest) => {
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, data);
      toast.success('Customer updated successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update customer');
      throw error;
    }
  };

  const handleEdit = (user: RegularUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.user) return;

    try {
      await deleteUser(deleteConfirm.user.id);
      toast.success('Customer deleted successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
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
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer accounts and view statistics"
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-bg-elevated border border-border-default rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Customers</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{stats.totalUsers}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-primary/50" />
            </div>
          </div>

          <div className="bg-bg-elevated border border-border-default rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Active Users (30d)</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.activeUsers}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-emerald-400/50" />
            </div>
          </div>

          <div className="bg-bg-elevated border border-border-default rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">New Users (30d)</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.newUsers}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-primary/50" />
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={searchQuery ? () => setSearchQuery('') : undefined}
          placeholder="Search by name or email..."
          label="Search customers"
          resultsCount={filteredUsers.length}
          resultsLabel="customers"
          className="rounded-md px-10 py-2"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-text-secondary mt-2">Loading customers...</p>
        </div>
      ) : (
        <div className="bg-bg-elevated border border-border-default rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-3 sm:px-0">
              <table className="min-w-full divide-y divide-champagne/20">
                <thead className="bg-midnight/80">
                  <tr>
                    <th
                      className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider cursor-pointer hover:bg-bg-elevated transition-colors sm:px-4 sm:py-3 lg:px-6"
                      onClick={() => handleSort('name')}
                    >
                      Name{getSortIcon('name')}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider sm:px-4 sm:py-3 lg:px-6">
                      Email
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider cursor-pointer hover:bg-bg-elevated transition-colors sm:px-4 sm:py-3 lg:px-6"
                      onClick={() => handleSort('orderCount')}
                    >
                      Orders{getSortIcon('orderCount')}
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider cursor-pointer hover:bg-bg-elevated transition-colors sm:px-4 sm:py-3 lg:px-6"
                      onClick={() => handleSort('totalSpent')}
                    >
                      Total Spent{getSortIcon('totalSpent')}
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider cursor-pointer hover:bg-bg-elevated transition-colors sm:px-4 sm:py-3 lg:px-6"
                      onClick={() => handleSort('createdAt')}
                    >
                      Joined{getSortIcon('createdAt')}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-text-primary uppercase tracking-wider sm:px-4 sm:py-3 lg:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-elevated divide-y divide-border-default">
                  {filteredAndSortedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-bg-secondary transition-colors">
                      <td className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                        <div className="text-xs font-medium text-text-primary sm:text-sm">{user.name}</div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                        <div className="text-xs text-text-secondary break-all sm:text-sm">{user.email}</div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                        <div className="text-xs text-text-primary sm:text-sm">{user.orderCount}</div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
                        <div className="text-xs font-semibold text-emerald-400 sm:text-sm">
                          {formatCurrency(user.totalSpent)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-text-secondary sm:px-4 sm:py-4 sm:text-sm lg:px-6">
                        {formatDate(user.createdAt)}
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
                            aria-label="Delete"
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

          {filteredAndSortedUsers.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-text-tertiary" />
              <p className="text-text-secondary mt-2">
                {searchQuery ? 'No customers found matching your search' : 'No customers found'}
              </p>
            </div>
          )}
        </div>
      )}

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleUpdate}
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
