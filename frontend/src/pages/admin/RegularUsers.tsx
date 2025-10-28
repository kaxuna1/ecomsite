import { useState, useEffect, useMemo } from 'react';
import { PencilIcon, TrashIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import type { RegularUser, UpdateRegularUserRequest, UserStats } from '../../types/user';
import {
  getAllUsers,
  updateUser,
  deleteUser,
  getUserStats,
} from '../../api/users';

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
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-midnight border-2 border-jade/30 rounded-lg max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-champagne mb-6">Edit Customer</h2>
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
    <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-midnight border-2 border-blush/30 rounded-lg max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-champagne mb-4">Confirm Delete</h2>
        <p className="text-champagne/80 mb-6">
          Are you sure you want to delete customer <strong className="text-blush">{userName}</strong>? This action cannot be undone.
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-midnight flex items-center gap-2">
          <UsersIcon className="h-8 w-8" />
          Customers
        </h1>
        <p className="text-midnight/70 mt-1">Manage customer accounts and view statistics</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-midnight/50 border border-champagne/20 rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-champagne/70">Total Customers</p>
                <p className="text-3xl font-bold text-champagne mt-1">{stats.totalUsers}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-jade/50" />
            </div>
          </div>

          <div className="bg-midnight/50 border border-champagne/20 rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-champagne/70">Active Users (30d)</p>
                <p className="text-3xl font-bold text-jade mt-1">{stats.activeUsers}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-jade/50" />
            </div>
          </div>

          <div className="bg-midnight/50 border border-champagne/20 rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-champagne/70">New Users (30d)</p>
                <p className="text-3xl font-bold text-blush mt-1">{stats.newUsers}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-blush/50" />
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-champagne/40" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-midnight border border-champagne/30 text-champagne placeholder-champagne/40 rounded-md focus:outline-none focus:ring-2 focus:ring-jade focus:border-jade"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-jade"></div>
          <p className="text-midnight/70 mt-2">Loading customers...</p>
        </div>
      ) : (
        <div className="bg-midnight/50 border border-champagne/20 rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-champagne/20">
              <thead className="bg-midnight/80">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider cursor-pointer hover:bg-jade/10"
                    onClick={() => handleSort('name')}
                  >
                    Name{getSortIcon('name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider">
                    Email
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider cursor-pointer hover:bg-jade/10"
                    onClick={() => handleSort('orderCount')}
                  >
                    Orders{getSortIcon('orderCount')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider cursor-pointer hover:bg-jade/10"
                    onClick={() => handleSort('totalSpent')}
                  >
                    Total Spent{getSortIcon('totalSpent')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider cursor-pointer hover:bg-jade/10"
                    onClick={() => handleSort('createdAt')}
                  >
                    Joined{getSortIcon('createdAt')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-champagne uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-midnight/30 divide-y divide-champagne/10">
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-jade/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-champagne">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-champagne/70">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-champagne">{user.orderCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-jade">
                        {formatCurrency(user.totalSpent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-champagne/70">
                      {formatDate(user.createdAt)}
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
          </div>

          {filteredAndSortedUsers.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-champagne/30" />
              <p className="text-champagne/70 mt-2">
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
