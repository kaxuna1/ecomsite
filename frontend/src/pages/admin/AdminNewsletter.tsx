import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  EnvelopeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../../api/client';

interface NewsletterSubscription {
  id: number;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  source: string;
  ip_address?: string;
  user_agent?: string;
  subscribed_at: string;
  unsubscribed_at?: string;
  created_at: string;
}

interface SubscriptionStats {
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  sources: { source: string; count: number }[];
}

export default function AdminNewsletter() {
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Edit modal
  const [editingSubscription, setEditingSubscription] = useState<NewsletterSubscription | null>(null);
  const [editForm, setEditForm] = useState({ name: '', status: 'active' });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, search, statusFilter, sourceFilter, startDate, endDate]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/newsletter/admin/stats');
      setStats(response.data.data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: page.toString(),
        limit: limit.toString()
      };

      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/newsletter/admin/subscriptions', { params });

      setSubscriptions(response.data.data.subscriptions);
      setTotalPages(response.data.data.totalPages);
      setTotal(response.data.data.total);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/newsletter/admin/export', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscriptions-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to export: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (subscription: NewsletterSubscription) => {
    setEditingSubscription(subscription);
    setEditForm({
      name: subscription.name || '',
      status: subscription.status
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSubscription) return;

    try {
      await api.put(`/newsletter/admin/subscriptions/${editingSubscription.id}`, editForm);

      await fetchSubscriptions();
      await fetchStats();
      setEditingSubscription(null);
    } catch (err: any) {
      alert('Failed to update: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    try {
      await api.delete(`/newsletter/admin/subscriptions/${id}`);

      await fetchSubscriptions();
      await fetchStats();
    } catch (err: any) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      unsubscribed: 'bg-gray-100 text-gray-800 border-gray-200',
      bounced: 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      active: <CheckCircleIcon className="h-4 w-4" />,
      unsubscribed: <XCircleIcon className="h-4 w-4" />,
      bounced: <XCircleIcon className="h-4 w-4" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-midnight p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-champagne flex items-center gap-3">
            <EnvelopeIcon className="h-8 w-8 text-jade" />
            Newsletter Subscriptions
          </h1>
          <p className="mt-2 text-champagne/60">Manage newsletter subscribers and export data</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-champagne/60 text-sm">Total Subscribers</p>
                  <p className="text-3xl font-bold text-champagne mt-2">{stats.total}</p>
                </div>
                <EnvelopeIcon className="h-12 w-12 text-jade/50" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-champagne/60 text-sm">Active</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">{stats.active}</p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-green-400/50" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-champagne/60 text-sm">This Week</p>
                  <p className="text-3xl font-bold text-jade mt-2">{stats.weekCount}</p>
                </div>
                <ClockIcon className="h-12 w-12 text-jade/50" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-champagne/60 text-sm">This Month</p>
                  <p className="text-3xl font-bold text-jade mt-2">{stats.monthCount}</p>
                </div>
                <ClockIcon className="h-12 w-12 text-jade/50" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FunnelIcon className="h-5 w-5 text-jade" />
            <h2 className="font-semibold text-champagne">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-champagne/60 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-champagne/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Email or name..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne placeholder-champagne/30 focus:outline-none focus:border-jade"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-champagne/60 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-champagne/60 mb-2">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
              >
                <option value="">All Sources</option>
                <option value="website">Website</option>
                <option value="website_cms_block">CMS Block</option>
                <option value="checkout">Checkout</option>
                <option value="popup">Popup</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-champagne/60 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
              />
            </div>

            <div>
              <label className="block text-sm text-champagne/60 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne hover:bg-white/10 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-jade text-midnight rounded-lg font-semibold hover:bg-jade/90 transition-colors flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-champagne/60">Loading...</div>
        ) : (
          <>
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-champagne/60 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-champagne/60 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-champagne/60 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-champagne/60 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-champagne/60 uppercase tracking-wider">Subscribed</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-champagne/60 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-champagne">{sub.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-champagne/80">{sub.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(sub.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-champagne/80">{sub.source}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-champagne/80">
                          {format(new Date(sub.subscribed_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(sub)}
                            className="text-jade hover:text-jade/80 mr-3"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {subscriptions.length === 0 && (
                <div className="text-center py-12 text-champagne/60">No subscriptions found</div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-champagne/60 text-sm">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingSubscription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-midnight border border-white/10 rounded-xl max-w-md w-full p-6">
            <h3 className="font-display text-xl text-champagne mb-4">Edit Subscription</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-champagne/60 mb-2">Email</label>
                <input
                  type="text"
                  value={editingSubscription.email}
                  disabled
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne/40"
                />
              </div>

              <div>
                <label className="block text-sm text-champagne/60 mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
                />
              </div>

              <div>
                <label className="block text-sm text-champagne/60 mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne focus:outline-none focus:border-jade"
                >
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="bounced">Bounced</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingSubscription(null)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-champagne hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-jade text-midnight rounded-lg font-semibold hover:bg-jade/90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
