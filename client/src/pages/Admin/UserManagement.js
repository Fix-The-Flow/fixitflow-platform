import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, 
  Search, 
  Filter,
  Edit, 
  Trash2, 
  Eye,
  Crown,
  Star,
  Shield,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  UserPlus,
  UserMinus,
  Settings,
  BarChart3,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';

const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeView, setActiveView] = useState('users'); // users, subscriptions, analytics
  const [filters, setFilters] = useState({
    search: '',
    membershipTier: '',
    status: '',
    joinedDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading } = useQuery(
    ['admin-users', currentPage, filters],
    async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 15,
        ...filters
      });
      const response = await axios.get(`/api/admin/users?${params}`);
      return response.data;
    }
  );

  // Fetch subscription analytics
  const { data: subscriptionStats } = useQuery('subscription-stats', async () => {
    const response = await axios.get('/api/admin/subscriptions/stats');
    return response.data.stats;
  });

  // Update user membership mutation
  const updateMembershipMutation = useMutation(
    ({ userId, membershipTier, action }) => 
      axios.patch(`/api/admin/users/${userId}/membership`, { membershipTier, action }),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['admin-users', 'subscription-stats']);
        toast.success(response.data.message);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update membership');
      }
    }
  );

  // Suspend/Activate user mutation
  const toggleUserStatusMutation = useMutation(
    ({ userId, action }) => 
      axios.patch(`/api/admin/users/${userId}/status`, { action }),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('admin-users');
        toast.success(response.data.message);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user status');
      }
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleUserEdit = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleMembershipChange = (user, newTier) => {
    const action = newTier === 'free' ? 'downgrade' : 'upgrade';
    updateMembershipMutation.mutate({
      userId: user._id,
      membershipTier: newTier,
      action
    });
  };

  const handleUserStatusToggle = (user) => {
    const action = user.isActive ? 'suspend' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} ${user.username}?`)) {
      toggleUserStatusMutation.mutate({
        userId: user._id,
        action
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>User Management - Admin Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage user accounts, memberships, and subscriptions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setActiveView(activeView === 'analytics' ? 'users' : 'analytics')}
                className="btn-outline flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{activeView === 'analytics' ? 'Back to Users' : 'Analytics'}</span>
              </button>
              <button 
                onClick={() => setActiveView(activeView === 'subscriptions' ? 'users' : 'subscriptions')}
                className="btn-outline flex items-center space-x-2"
              >
                <Crown className="w-4 h-4" />
                <span>{activeView === 'subscriptions' ? 'All Users' : 'Subscriptions'}</span>
              </button>
            </div>
          </div>

          {/* Membership Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usersData?.pagination?.total || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {subscriptionStats?.newUsersThisMonth || 0} new this month
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Premium Members</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {subscriptionStats?.premiumUsers || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ${(subscriptionStats?.premiumMRR || 0).toFixed(2)} MRR
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pro Members</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {subscriptionStats?.proUsers || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ${(subscriptionStats?.proMRR || 0).toFixed(2)} MRR
                  </p>
                </div>
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {subscriptionStats?.conversionRate || 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Free to paid conversion
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {activeView === 'analytics' ? (
            <UserAnalyticsDashboard subscriptionStats={subscriptionStats} />
          ) : activeView === 'subscriptions' ? (
            <SubscriptionManagement subscriptionStats={subscriptionStats} />
          ) : (
            <>
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                  
                  <select
                    value={filters.membershipTier}
                    onChange={(e) => handleFilterChange('membershipTier', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Memberships</option>
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="pro">Pro</option>
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>

                  <select
                    value={filters.joinedDate}
                    onChange={(e) => handleFilterChange('joinedDate', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                  </select>

                  <button
                    onClick={() => {
                      setFilters({ search: '', membershipTier: '', status: '', joinedDate: '' });
                      setCurrentPage(1);
                    }}
                    className="btn-outline"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Users List */}
              <div className="bg-white rounded-lg shadow-sm">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading users...</p>
                  </div>
                ) : usersData?.users?.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500 mb-4">
                      {Object.values(filters).some(f => f) 
                        ? 'Try adjusting your filters.' 
                        : 'No users registered yet.'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-4 font-medium text-gray-700 text-sm">
                        <div className="col-span-3">User</div>
                        <div className="col-span-2">Membership</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Activity</div>
                        <div className="col-span-2">Joined</div>
                        <div className="col-span-1">Actions</div>
                      </div>
                    </div>

                    {/* Users */}
                    <div className="divide-y divide-gray-200">
                      {usersData?.users?.map((user) => (
                        <motion.div
                          key={user._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* User Info */}
                            <div className="col-span-3">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {user.profile?.firstName?.charAt(0) || user.username.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {user.profile?.firstName ? 
                                      `${user.profile.firstName} ${user.profile.lastName}` : 
                                      user.username
                                    }
                                  </h3>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {user.isEmailVerified ? 'Verified' : 'Unverified'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Membership */}
                            <div className="col-span-2">
                              <div className="space-y-1">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  user.membershipTier === 'free' ? 'bg-gray-100 text-gray-800' :
                                  user.membershipTier === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {user.membershipTier === 'free' && 'Free'}
                                  {user.membershipTier === 'premium' && (
                                    <>
                                      <Star className="w-3 h-3 mr-1" />
                                      Premium
                                    </>
                                  )}
                                  {user.membershipTier === 'pro' && (
                                    <>
                                      <Crown className="w-3 h-3 mr-1" />
                                      Pro
                                    </>
                                  )}
                                </span>
                                {user.subscription?.status && (
                                  <div className="text-xs text-gray-500">
                                    {user.subscription.status === 'active' && 'Active subscription'}
                                    {user.subscription.status === 'canceled' && 'Canceled'}
                                    {user.subscription.status === 'past_due' && 'Payment due'}
                                  </div>
                                )}
                                {user.subscription?.nextBillingDate && (
                                  <div className="text-xs text-gray-500">
                                    Next: {format(new Date(user.subscription.nextBillingDate), 'MMM d')}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                              <div className="space-y-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.isActive ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Suspended
                                    </>
                                  )}
                                </span>
                                {user.lastLoginAt && (
                                  <div className="text-xs text-gray-500">
                                    Last login: {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Activity */}
                            <div className="col-span-2">
                              <div className="text-sm">
                                <div className="text-gray-900 font-medium">
                                  {user.stats?.flowsCompleted || 0} flows completed
                                </div>
                                <div className="text-gray-600">
                                  {user.stats?.ebooksPurchased || 0} eBooks purchased
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Total spent: ${(user.stats?.totalSpent || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* Joined Date */}
                            <div className="col-span-2">
                              <div className="text-sm text-gray-600">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(user.createdAt), 'MMM d, yyyy')}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="col-span-1">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleUserEdit(user)}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                  title="Edit user"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleUserStatusToggle(user)}
                                  disabled={toggleUserStatusMutation.isLoading}
                                  className={`p-2 rounded-lg transition-colors duration-200 ${
                                    user.isActive
                                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                      : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                  }`}
                                  title={user.isActive ? 'Suspend user' : 'Activate user'}
                                >
                                  {user.isActive ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {usersData?.pagination && usersData.pagination.pages > 1 && (
                      <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Showing {((currentPage - 1) * 15) + 1} to {Math.min(currentPage * 15, usersData.pagination.total)} of {usersData.pagination.total} users
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="btn-outline text-sm px-3 py-1 disabled:opacity-50"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {currentPage} of {usersData.pagination.pages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, usersData.pagination.pages))}
                              disabled={currentPage === usersData.pagination.pages}
                              className="btn-outline text-sm px-3 py-1 disabled:opacity-50"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* User Edit Modal */}
      {showUserModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries(['admin-users', 'subscription-stats']);
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onMembershipChange={handleMembershipChange}
        />
      )}
    </>
  );
};

// User Analytics Dashboard Component
const UserAnalyticsDashboard = ({ subscriptionStats }) => {
  return (
    <div className="space-y-8">
      {/* Membership Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Recurring Revenue</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Premium MRR</span>
              <span className="font-medium">${(subscriptionStats?.premiumMRR || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pro MRR</span>
              <span className="font-medium">${(subscriptionStats?.proMRR || 0).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900">Total MRR</span>
                <span className="font-bold text-green-600">
                  ${((subscriptionStats?.premiumMRR || 0) + (subscriptionStats?.proMRR || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Churn Analysis</h3>
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Monthly Churn Rate</span>
              <span className="font-medium text-red-600">{subscriptionStats?.churnRate || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Churned This Month</span>
              <span className="font-medium">{subscriptionStats?.churnedThisMonth || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg. Lifetime (days)</span>
              <span className="font-medium">{subscriptionStats?.avgLifetime || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Engagement Metrics</h3>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Daily Active Users</span>
              <span className="font-medium">{subscriptionStats?.dailyActiveUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Weekly Active Users</span>
              <span className="font-medium">{subscriptionStats?.weeklyActiveUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg. Session Time</span>
              <span className="font-medium">{subscriptionStats?.avgSessionTime || '0m'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth & Subscription Trends</h3>
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Detailed user analytics charts coming soon...</p>
        </div>
      </div>
    </div>
  );
};

// Subscription Management Component
const SubscriptionManagement = ({ subscriptionStats }) => {
  return (
    <div className="space-y-8">
      {/* Subscription Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {(subscriptionStats?.premiumUsers || 0) + (subscriptionStats?.proUsers || 0)}
              </p>
            </div>
            <Crown className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Cancellations</p>
              <p className="text-2xl font-bold text-red-600">
                {subscriptionStats?.pendingCancellations || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Payments</p>
              <p className="text-2xl font-bold text-orange-600">
                {subscriptionStats?.failedPayments || 0}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trial Conversions</p>
              <p className="text-2xl font-bold text-green-600">
                {subscriptionStats?.trialConversions || 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Subscription Management Interface */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Management</h3>
        <div className="text-center py-12">
          <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Advanced subscription management interface coming soon...</p>
          <p className="text-sm text-gray-400 mt-2">Manage billing, cancellations, refunds, and more</p>
        </div>
      </div>
    </div>
  );
};

// User Edit Modal Component
const UserEditModal = ({ user, onClose, onSave, onMembershipChange }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    firstName: user.profile?.firstName || '',
    lastName: user.profile?.lastName || '',
    membershipTier: user.membershipTier,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    notes: user.adminNotes || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await axios.patch(`/api/admin/users/${user._id}`, formData);
      toast.success(response.data.message);
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMembershipUpdate = (newTier) => {
    if (newTier !== formData.membershipTier) {
      onMembershipChange(user, newTier);
      setFormData(prev => ({ ...prev, membershipTier: newTier }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {user.profile?.firstName?.charAt(0) || user.username.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit User: {user.username}
                </h2>
                <p className="text-sm text-gray-600">User ID: {user._id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="input-field"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          {/* Membership Management */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Membership Tier
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['free', 'premium', 'pro'].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleMembershipUpdate(tier)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.membershipTier === tier
                      ? tier === 'premium' 
                        ? 'border-yellow-400 bg-yellow-50 text-yellow-800'
                        : tier === 'pro'
                        ? 'border-purple-400 bg-purple-50 text-purple-800'
                        : 'border-gray-400 bg-gray-50 text-gray-800'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    {tier === 'free' && <Shield className="w-6 h-6 mx-auto mb-2 text-gray-600" />}
                    {tier === 'premium' && <Star className="w-6 h-6 mx-auto mb-2 text-yellow-600" />}
                    {tier === 'pro' && <Crown className="w-6 h-6 mx-auto mb-2 text-purple-600" />}
                    <div className="font-medium capitalize">{tier}</div>
                    <div className="text-xs text-gray-500">
                      {tier === 'free' && 'Basic access'}
                      {tier === 'premium' && '$9.99/month'}
                      {tier === 'pro' && '$19.99/month'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Status Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Account Status</label>
                <p className="text-xs text-gray-500">Active users can access the platform</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Email Verified</label>
                <p className="text-xs text-gray-500">Verified emails can receive notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isEmailVerified}
                  onChange={(e) => setFormData(prev => ({ ...prev, isEmailVerified: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input-field"
              placeholder="Internal notes about this user..."
            />
          </div>

          {/* User Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">User Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Flows Completed:</span>
                <span className="font-medium ml-2">{user.stats?.flowsCompleted || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">eBooks Purchased:</span>
                <span className="font-medium ml-2">{user.stats?.ebooksPurchased || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Spent:</span>
                <span className="font-medium ml-2">${(user.stats?.totalSpent || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium ml-2">{format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? 'Saving...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;
