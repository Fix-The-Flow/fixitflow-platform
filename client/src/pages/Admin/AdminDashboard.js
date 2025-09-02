import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  BarChart3,
  Users,
  BookOpen,
  FileText,
  Brain,
  Settings,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  LogOut,
  Home,
  CheckCircle,
  Crown
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import admin components
import AdminEbookManager from './AdminEbookManager';
import AdminAI from './AdminAI';
import TroubleshootingFlowManager from './TroubleshootingFlowManager';
import UserManagement from './UserManagement';
import MembershipManagement from '../../components/Admin/MembershipManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery('admin-dashboard', async () => {
    const response = await axios.get('/api/admin/dashboard');
    return response.data.stats;
  });

  const navigation = [
    { 
      id: 'overview', 
      label: 'Dashboard Overview', 
      icon: BarChart3,
      description: 'Platform statistics and recent activity'
    },
    { 
      id: 'ebooks', 
      label: 'eBook Management', 
      icon: BookOpen,
      description: 'Create, edit, and manage eBooks'
    },
    { 
      id: 'guides', 
      label: 'Guide Management', 
      icon: FileText,
      description: 'Manage repair guides and tutorials'
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users,
      description: 'Manage user accounts and permissions'
    },
    { 
      id: 'membership', 
      label: 'Membership Management', 
      icon: Crown,
      description: 'Manage subscriptions and pricing'
    },
    { 
      id: 'ai', 
      label: 'AI Assistant', 
      icon: Brain,
      description: 'AI-powered content creation tools'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: TrendingUp,
      description: 'Sales and engagement analytics'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - FixItFlow</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-8">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>

              <nav className="space-y-2">
                {navigation.map(({ id, label, icon: Icon, description }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-start space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === id
                        ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${
                      activeTab === id ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-500 mt-1">{description}</div>
                    </div>
                  </button>
                ))}
              </nav>
              
              {/* Bottom Navigation */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  <button
                    onClick={handleGoHome}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  >
                    <Home className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Back to Site</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
                
                {/* User Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user?.profile?.firstName?.charAt(0) || user?.username?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        {user?.profile?.firstName ? 
                          `${user.profile.firstName} ${user.profile.lastName}` : 
                          user?.username
                        }
                      </p>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && <DashboardOverview stats={stats} isLoading={isLoading} setActiveTab={setActiveTab} />}
            {activeTab === 'ebooks' && <AdminEbookManager />}
            {activeTab === 'ai' && <AdminAI />}
            {activeTab === 'guides' && <TroubleshootingFlowManager />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'membership' && <MembershipManagement />}
            {activeTab === 'analytics' && <div className="p-6"><h2 className="text-2xl font-bold text-gray-900">Analytics</h2><p className="text-gray-600 mt-2">Analytics dashboard coming soon...</p></div>}
          </div>
        </div>
      </div>
    </>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ stats, isLoading, setActiveTab }) => {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          FixItFlow Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your dual-purpose platform: Troubleshooting Solutions & Digital eBook Store
        </p>
      </div>

      {/* Platform Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.overview?.totalUsers || 0}
              </p>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Free: {stats?.overview?.freeUsers || 0}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 ml-1">
                  Premium: {stats?.overview?.premiumUsers || 0}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 ml-1">
                  Pro: {stats?.overview?.proUsers || 0}
                </span>
              </div>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Troubleshooting Flows</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.overview?.totalFlows || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.overview?.activeFlows || 0} active • {stats?.overview?.totalCompletions || 0} completions
              </p>
            </div>
            <Brain className="w-8 h-8 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Published eBooks</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.overview?.totalEbooks || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.overview?.ebookSales || 0} total sales
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(stats?.overview?.totalRevenue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ${(stats?.overview?.monthlyRevenue || 0).toFixed(2)} this month
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats?.overview?.premiumUsers || 0) + (stats?.overview?.proUsers || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ${(stats?.overview?.subscriptionRevenue || 0).toFixed(2)} MRR
              </p>
            </div>
            <Award className="w-8 h-8 text-indigo-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.overview?.successRate || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Troubleshooting completion rate
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
        </motion.div>
      </div>

      {/* Dual Business Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Troubleshooting Platform Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Troubleshooting Platform</h2>
                <p className="text-blue-100">Help users solve everyday problems</p>
              </div>
              <Brain className="w-12 h-12 text-blue-100" />
            </div>
          </div>
          
          {/* Troubleshooting Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Flows</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats?.troubleshooting?.activeFlows || 0}
                  </p>
                </div>
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completions Today</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats?.troubleshooting?.todayCompletions || 0}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Problem Categories</h3>
            <div className="space-y-3">
              {stats?.troubleshooting?.topCategories?.slice(0, 5).map((category, index) => (
                <div key={category._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{category.count} uses</span>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* eBook Store Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Digital eBook Store</h2>
                <p className="text-purple-100">Create and sell knowledge products</p>
              </div>
              <BookOpen className="w-12 h-12 text-purple-100" />
            </div>
          </div>
          
          {/* eBook Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published eBooks</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats?.ebooks?.published || 0}
                  </p>
                </div>
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sales Today</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats?.ebooks?.todaySales || 0}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Best Selling eBooks */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Selling eBooks</h3>
            <div className="space-y-3">
              {stats?.ebooks?.bestSellers?.slice(0, 5).map((ebook, index) => (
                <div key={ebook._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900 line-clamp-1">{ebook.title}</span>
                      <span className="text-xs text-gray-500">${ebook.price}</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{ebook.sales} sales</span>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No sales data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* New Users */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {stats?.recentActivity?.newUsers?.length > 0 ? (
              stats.recentActivity.newUsers.map((user) => (
                <div key={user._id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {user.profile?.firstName?.charAt(0) || user.username.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {user.profile?.firstName ? 
                        `${user.profile.firstName} ${user.profile.lastName}` : 
                        user.username
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent users</p>
            )}
          </div>
        </div>

        {/* Popular Guides */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Popular Guides</h3>
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {stats?.recentActivity?.popularGuides?.length > 0 ? (
              stats.recentActivity.popularGuides.map((guide) => (
                <div key={guide._id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {guide.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {guide.category?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {guide.views} views
                    </p>
                    <p className="text-xs text-gray-500">
                      {guide.completions} completed
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No popular guides yet</p>
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Purchases</h3>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {stats?.recentActivity?.recentPurchases?.length > 0 ? (
              stats.recentActivity.recentPurchases.map((purchase) => (
                <div key={purchase._id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {purchase.ebook?.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {purchase.user?.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      ${purchase.ebook?.price}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(purchase.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent purchases</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('ebooks')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-primary-600" />
              <div>
                <h4 className="font-medium text-gray-900">Create New eBook</h4>
                <p className="text-sm text-gray-500">Start writing your next eBook</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('guides')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">Manage Guides</h4>
                <p className="text-sm text-gray-500">Create or import guides via CSV</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">AI Content Assistant</h4>
                <p className="text-sm text-gray-500">Generate content with AI</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">View Analytics</h4>
                <p className="text-sm text-gray-500">Check your performance</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};


export default AdminDashboard;
