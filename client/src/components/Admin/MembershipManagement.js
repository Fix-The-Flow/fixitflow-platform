import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  Crown, 
  Star, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  Search,
  Plus,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MembershipBadge, PricingPlans } from '../Membership/MembershipSystem';

const MembershipManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Fetch membership analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery(
    'membership-analytics',
    async () => {
      const response = await axios.get('/api/admin/membership/analytics');
      return response.data;
    }
  );

  // Fetch membership subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading, refetch } = useQuery(
    ['membership-subscriptions', searchTerm, selectedTier],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTier !== 'all') params.append('tier', selectedTier);
      
      const response = await axios.get(`/api/admin/membership/subscriptions?${params}`);
      return response.data.subscriptions;
    }
  );

  const handleUpdatePricing = async (planData) => {
    try {
      await axios.put('/api/admin/membership/pricing', planData);
      toast.success('Pricing updated successfully');
      setShowPricingModal(false);
    } catch (error) {
      toast.error('Failed to update pricing');
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
      await axios.post(`/api/admin/membership/cancel/${subscriptionId}`);
      toast.success('Subscription cancelled');
      refetch();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const handleManualUpgrade = async (userId, newTier) => {
    try {
      await axios.post(`/api/admin/membership/manual-upgrade`, {
        userId,
        tier: newTier,
        reason: 'Admin manual upgrade'
      });
      toast.success('User upgraded successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to upgrade user');
    }
  };

  const exportSubscriptions = async () => {
    try {
      const response = await axios.get('/api/admin/membership/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `subscriptions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Subscriptions exported successfully');
    } catch (error) {
      toast.error('Failed to export subscriptions');
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 flex items-center ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {change > 0 ? '+' : ''}{change}% this month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'subscriptions', label: 'Subscriptions', icon: Users },
    { id: 'pricing', label: 'Pricing Plans', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: Calendar }
  ];

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Management</h1>
          <p className="text-gray-600 mt-1">Manage subscriptions, pricing, and membership analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportSubscriptions}
            className="btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
          <button
            onClick={() => setShowPricingModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Update Pricing
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Users}
              title="Total Subscribers"
              value={analytics?.totalSubscribers || 0}
              change={analytics?.subscriberGrowth || 0}
              color="blue"
            />
            <StatCard
              icon={DollarSign}
              title="Monthly Revenue"
              value={`$${analytics?.monthlyRevenue?.toLocaleString() || 0}`}
              change={analytics?.revenueGrowth || 0}
              color="green"
            />
            <StatCard
              icon={Star}
              title="Premium Users"
              value={analytics?.premiumUsers || 0}
              change={analytics?.premiumGrowth || 0}
              color="yellow"
            />
            <StatCard
              icon={Crown}
              title="Pro Users"
              value={analytics?.proUsers || 0}
              change={analytics?.proGrowth || 0}
              color="purple"
            />
          </div>

          {/* Membership Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Distribution</h3>
            <div className="space-y-4">
              {analytics?.tierDistribution?.map((tier) => (
                <div key={tier.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MembershipBadge tier={tier.name.toLowerCase()} />
                    <span className="ml-3 text-gray-900">{tier.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{tier.count} users</div>
                      <div className="text-xs text-gray-500">{tier.percentage}% of total</div>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          tier.name === 'Free' ? 'bg-gray-500' :
                          tier.name === 'Premium' ? 'bg-yellow-500' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${tier.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Subscription Activity</h3>
            <div className="space-y-4">
              {analytics?.recentActivity?.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      activity.type === 'upgrade' ? 'bg-green-500' :
                      activity.type === 'downgrade' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                      <p className="text-xs text-gray-500">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{activity.date}</p>
                    <MembershipBadge tier={activity.newTier} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Billing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptionsLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : subscriptions?.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subscription.user.name}</div>
                          <div className="text-sm text-gray-500">{subscription.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <MembershipBadge tier={subscription.tier} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                          subscription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${subscription.totalRevenue?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleManualUpgrade(subscription.user.id, 'pro')}
                            className="text-purple-600 hover:text-purple-900"
                            disabled={subscription.tier === 'pro'}
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelSubscription(subscription.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={subscription.status === 'cancelled'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Pricing Plans</h3>
            <PricingPlans onSelectPlan={(tier) => console.log('Selected:', tier)} />
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart component would go here
            </div>
          </div>

          {/* Conversion Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Free to Premium</h4>
              <p className="text-2xl font-bold text-gray-900">{analytics?.conversions?.freeToPremium || 0}%</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Premium to Pro</h4>
              <p className="text-2xl font-bold text-gray-900">{analytics?.conversions?.premiumToPro || 0}%</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Churn Rate</h4>
              <p className="text-2xl font-bold text-gray-900">{analytics?.churnRate || 0}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Pricing</h3>
            <p className="text-gray-600 mb-4">Pricing management functionality would go here.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowPricingModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdatePricing({})}
                className="btn-primary"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipManagement;
