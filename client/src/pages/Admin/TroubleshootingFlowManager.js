import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Tag,
  Clock,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Settings,
  Zap,
  Crown,
  Star,
  Filter,
  BarChart3,
  Target,
  TrendingUp,
  Award
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const TroubleshootingFlowManager = () => {
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [showFlowBuilder, setShowFlowBuilder] = useState(false);
  const [activeView, setActiveView] = useState('list'); // list, analytics, categories
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    difficulty: '',
    membershipTier: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const queryClient = useQueryClient();

  // Fetch troubleshooting flows (using guides endpoint for now)
  const { data: flowsData, isLoading } = useQuery(
    ['admin-flows', currentPage, filters],
    async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });
      const response = await axios.get(`/api/admin/guides?${params}`);
      return {
        flows: response.data.guides || [],
        pagination: response.data.pagination || { total: 0, pages: 1, current: 1 }
      };
    },
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching troubleshooting flows:', error);
        toast.error('Failed to load troubleshooting flows');
      }
    }
  );

  // Fetch categories with auto-organization stats
  const { data: categories } = useQuery('troubleshooting-categories', async () => {
    const response = await axios.get('/api/admin/troubleshooting-categories');
    return response.data.categories;
  });

  // Fetch flow analytics
  const { data: analytics } = useQuery('flow-analytics', async () => {
    const response = await axios.get('/api/admin/flows/analytics');
    return response.data.analytics;
  });

  // Delete flow mutation
  const deleteMutation = useMutation(
    (id) => axios.delete(`/api/admin/troubleshooting-flows/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-flows');
        toast.success('Troubleshooting flow deleted successfully');
        setSelectedFlow(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete flow');
      }
    }
  );

  const handleDelete = (flow) => {
    if (window.confirm(`Are you sure you want to delete "${flow.title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(flow._id);
    }
  };

  const handleEdit = (flow) => {
    setSelectedFlow(flow);
    setShowFlowBuilder(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Auto-organize CSV flows
  const autoOrganizeMutation = useMutation(
    () => axios.post('/api/admin/flows/auto-organize'),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['admin-flows', 'troubleshooting-categories']);
        toast.success(`Auto-organized ${response.data.organized} flows into categories`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to auto-organize flows');
      }
    }
  );

  // Download CSV template
  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/api/admin/guides/csv-template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'troubleshooting-guides-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV template downloaded successfully');
    } catch (error) {
      console.error('Download template error:', error);
      toast.error('Failed to download template. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Troubleshooting Flow Management - Admin Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Troubleshooting Flow Manager
              </h1>
              <p className="text-gray-600">
                Create and manage step-by-step troubleshooting workflows for everyday problems
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setActiveView(activeView === 'analytics' ? 'list' : 'analytics')}
                className="btn-outline flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{activeView === 'analytics' ? 'Back to Flows' : 'Analytics'}</span>
              </button>
              <button 
                onClick={downloadTemplate}
                className="btn-outline flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download CSV Template</span>
              </button>
              <button 
                onClick={() => setShowCsvUpload(true)}
                className="btn-outline flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Import CSV</span>
              </button>
              <button 
                onClick={autoOrganizeMutation.mutate}
                disabled={autoOrganizeMutation.isLoading}
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>{autoOrganizeMutation.isLoading ? 'Organizing...' : 'Auto-Organize'}</span>
              </button>
              <button 
                onClick={() => {
                  setSelectedFlow(null);
                  setShowFlowBuilder(true);
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Flow</span>
              </button>
            </div>
          </div>

          {activeView === 'analytics' ? (
            <FlowAnalyticsDashboard analytics={analytics} />
          ) : (
            <>
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search flows..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                  
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Categories</option>
                    {categories?.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>

                  <select
                    value={filters.membershipTier}
                    onChange={(e) => handleFilterChange('membershipTier', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Tiers</option>
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
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>

                  <button
                    onClick={() => {
                      setFilters({ search: '', category: '', status: '', difficulty: '', membershipTier: '' });
                      setCurrentPage(1);
                    }}
                    className="btn-outline"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Flows List */}
              <div className="bg-white rounded-lg shadow-sm">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading troubleshooting flows...</p>
                  </div>
                ) : flowsData?.flows?.length === 0 ? (
                  <div className="p-8 text-center">
                    <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No troubleshooting flows found</h3>
                    <p className="text-gray-500 mb-4">
                      {Object.values(filters).some(f => f) 
                        ? 'Try adjusting your filters or create your first flow.' 
                        : 'Create your first troubleshooting flow or import from CSV to get started.'
                      }
                    </p>
                    <div className="space-x-3">
                      <button 
                        onClick={() => {
                          setSelectedFlow(null);
                          setShowFlowBuilder(true);
                        }}
                        className="btn-primary"
                      >
                        Create New Flow
                      </button>
                      <button 
                        onClick={() => setShowCsvUpload(true)}
                        className="btn-outline"
                      >
                        Import from CSV
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-4 font-medium text-gray-700 text-sm">
                        <div className="col-span-4">Troubleshooting Flow</div>
                        <div className="col-span-2">Category</div>
                        <div className="col-span-1">Difficulty</div>
                        <div className="col-span-1">Access</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-1">Success Rate</div>
                        <div className="col-span-2">Actions</div>
                      </div>
                    </div>

                    {/* Flows */}
                    <div className="divide-y divide-gray-200">
                      {flowsData?.flows?.map((flow) => (
                        <motion.div
                          key={flow._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Flow Info */}
                            <div className="col-span-4">
                              <div className="flex items-start space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                  {flow.title.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900 mb-1">
                                    {flow.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {flow.description}
                                  </p>
                                  <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                                    <span className="flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {flow.estimatedTime}
                                    </span>
                                    <span>{flow.totalSteps} steps</span>
                                    <span>{flow.completions || 0} completions</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Category */}
                            <div className="col-span-2">
                              <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: `${flow.category?.color || '#3B82F6'}20`,
                                  color: flow.category?.color || '#3B82F6'
                                }}
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {flow.category?.name}
                              </span>
                            </div>

                            {/* Difficulty */}
                            <div className="col-span-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                flow.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                                flow.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {flow.difficulty}
                              </span>
                            </div>

                            {/* Membership Tier */}
                            <div className="col-span-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                flow.membershipTier === 'free' ? 'bg-gray-100 text-gray-800' :
                                flow.membershipTier === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {flow.membershipTier === 'free' && <span>Free</span>}
                                {flow.membershipTier === 'premium' && (
                                  <>
                                    <Star className="w-3 h-3 mr-1" />
                                    Premium
                                  </>
                                )}
                                {flow.membershipTier === 'pro' && (
                                  <>
                                    <Crown className="w-3 h-3 mr-1" />
                                    Pro
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="col-span-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                flow.isPublished
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {flow.isPublished ? (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Live
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Draft
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Success Rate */}
                            <div className="col-span-1">
                              <div className="text-center">
                                <div className={`text-sm font-medium ${
                                  (flow.successRate || 0) >= 80 ? 'text-green-600' :
                                  (flow.successRate || 0) >= 60 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {flow.successRate || 0}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {flow.totalAttempts || 0} attempts
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEdit(flow)}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                  title="Edit flow"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleDelete(flow)}
                                  disabled={deleteMutation.isLoading}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title="Delete flow"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => setSelectedFlow(flow)}
                                  className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                                  title="Preview flow"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {flowsData?.pagination && flowsData.pagination.pages > 1 && (
                      <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, flowsData.pagination.total)} of {flowsData.pagination.total} flows
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
                              Page {currentPage} of {flowsData.pagination.pages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, flowsData.pagination.pages))}
                              disabled={currentPage === flowsData.pagination.pages}
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

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Flows</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {flowsData?.pagination?.total || 0}
                      </p>
                    </div>
                    <Brain className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Published</p>
                      <p className="text-2xl font-bold text-green-600">
                        {flowsData?.flows?.filter(f => f.isPublished).length || 0}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Premium Flows</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {flowsData?.flows?.filter(f => f.membershipTier === 'premium').length || 0}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pro Flows</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {flowsData?.flows?.filter(f => f.membershipTier === 'pro').length || 0}
                      </p>
                    </div>
                    <Crown className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Success Rate</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {flowsData?.flows?.length ? (
                          Math.round(
                            flowsData.flows.reduce((sum, f) => sum + (f.successRate || 0), 0) / flowsData.flows.length
                          )
                        ) : 0}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSV Upload Modal */}
      {showCsvUpload && (
        <CsvUploadModal
          onClose={() => setShowCsvUpload(false)}
          onImportComplete={() => {
            queryClient.invalidateQueries('admin-flows');
            setShowCsvUpload(false);
          }}
        />
      )}

      {/* Flow Builder Modal */}
      {showFlowBuilder && (
        <FlowBuilderModal
          flow={selectedFlow}
          categories={categories}
          onClose={() => {
            setShowFlowBuilder(false);
            setSelectedFlow(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries('admin-flows');
            setShowFlowBuilder(false);
            setSelectedFlow(null);
          }}
        />
      )}
    </>
  );
};

// Flow Analytics Dashboard Component
const FlowAnalyticsDashboard = ({ analytics }) => {
  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Completions</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.totalCompletions || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{analytics?.completionGrowth || 0}% this month
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.averageSuccessRate || 0}%
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{analytics?.successRateImprovement || 0}% vs last month
              </p>
            </div>
            <Award className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Time to Solve</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.averageTimeToSolve || '0m'}
              </p>
              <p className="text-xs text-red-600 mt-1">
                -{analytics?.timeReduction || 0}% faster
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Premium Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.premiumUsage || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Of total completions
              </p>
            </div>
            <Crown className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Charts and detailed analytics would go here */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Flow Performance Analytics</h3>
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Detailed analytics charts coming soon...</p>
        </div>
      </div>
    </div>
  );
};

// CSV Upload Modal Component
const CsvUploadModal = ({ onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [autoOrganize, setAutoOrganize] = useState(true);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setPreview(null);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('csv_file', file);
    formData.append('auto_organize', autoOrganize);

    try {
      const response = await axios.post('/api/admin/guides/csv-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreview(response.data.preview);
      toast.success('CSV file parsed successfully');
    } catch (error) {
      console.error('CSV preview error:', error);
      toast.error(error.response?.data?.message || 'Failed to parse CSV file. Please check the format and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setIsImporting(true);
    try {
      const response = await axios.post('/api/admin/guides/csv-import', {
        fileName: preview.fileName || file.name,
        autoOrganize
      });
      
      const results = response.data.results;
      toast.success(`Successfully imported ${results.successful} troubleshooting flows`);
      
      if (results.autoOrganized > 0) {
        toast.success(`Auto-organized ${results.autoOrganized} flows into categories`);
      }
      
      if (results.failed > 0) {
        toast.error(`${results.failed} flows failed to import`);
      }
      
      onImportComplete();
    } catch (error) {
      console.error('CSV import error:', error);
      toast.error(error.response?.data?.message || 'Failed to import troubleshooting flows. Please check the file format and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Bulk Import Troubleshooting Flows
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">How to use CSV import:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Download the CSV template using the button above</li>
              <li>2. Fill in your troubleshooting flow data following the template format</li>
              <li>3. Include decision trees and step sequences in the flow structure</li>
              <li>4. Upload your completed CSV file</li>
              <li>5. Enable auto-organization to categorize flows automatically</li>
              <li>6. Preview the data and import</li>
            </ol>
          </div>

          {/* Auto-Organization Option */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoOrganize"
                checked={autoOrganize}
                onChange={(e) => setAutoOrganize(e.target.checked)}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="autoOrganize" className="ml-3">
                <div className="text-sm font-medium text-gray-900">Enable Auto-Organization</div>
                <div className="text-xs text-gray-600">
                  Automatically categorize flows based on keywords and problem types using AI
                </div>
              </label>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {/* Preview Button */}
          {file && !preview && (
            <button
              onClick={handlePreview}
              disabled={isUploading}
              className="btn-primary w-full"
            >
              {isUploading ? 'Parsing & Organizing...' : 'Preview CSV Data'}
            </button>
          )}

          {/* Preview Results */}
          {preview && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Preview Results</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Total Rows: {preview.totalRows}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Valid Flows: {preview.validRows}</span>
                  </div>
                  {autoOrganize && (
                    <div className="flex items-center">
                      <Settings className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Auto-Organized: {preview.autoOrganized || 0}</span>
                    </div>
                  )}
                  {preview.errors.length > 0 && (
                    <div className="col-span-2">
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span>Errors: {preview.errors.length}</span>
                      </div>
                      <div className="mt-2 text-xs text-red-600">
                        {preview.errors.slice(0, 3).map((error, idx) => (
                          <div key={idx}>Row {error.row}: {error.errors}</div>
                        ))}
                        {preview.errors.length > 3 && <div>... and {preview.errors.length - 3} more errors</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Data Preview */}
              {preview.data.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Sample Flows (First 3):</h4>
                  <div className="space-y-2 text-sm">
                    {preview.data.slice(0, 3).map((flow, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{flow.title}</div>
                            <div className="text-gray-600">{flow.category} • {flow.difficulty}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">{flow.totalSteps} steps</div>
                            {flow.membershipTier !== 'free' && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                flow.membershipTier === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {flow.membershipTier === 'premium' ? 'Premium' : 'Pro'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={isImporting || preview.errors.length > 0}
                className="btn-primary w-full"
              >
                {isImporting ? 'Importing...' : `Import ${preview.validRows} Troubleshooting Flows`}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Flow Builder Modal Component
const FlowBuilderModal = ({ flow, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: flow?.title || '',
    description: flow?.description || '',
    category: flow?.category?._id || '',
    difficulty: flow?.difficulty || 'beginner',
    membershipTier: flow?.membershipTier || 'free',
    estimatedTime: flow?.estimatedTime || '',
    tags: flow?.tags?.join(', ') || '',
    steps: flow?.steps || [
      {
        id: 1,
        type: 'question',
        title: '',
        description: '',
        options: [
          { text: '', nextStep: 2 },
          { text: '', nextStep: 3 }
        ]
      }
    ],
    isPublished: flow?.isPublished || false
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const processedData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        totalSteps: formData.steps.length
      };

      const url = flow ? `/api/admin/troubleshooting-flows/${flow._id}` : '/api/admin/troubleshooting-flows';
      const method = flow ? 'put' : 'post';
      
      const response = await axios[method](url, processedData);
      toast.success(response.data.message);
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save troubleshooting flow');
    } finally {
      setIsSaving(false);
    }
  };

  const addStep = (type = 'question') => {
    const newStep = {
      id: formData.steps.length + 1,
      type,
      title: '',
      description: '',
      options: type === 'question' ? [
        { text: '', nextStep: formData.steps.length + 2 }
      ] : []
    };
    
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const removeStep = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {flow ? 'Edit Troubleshooting Flow' : 'Create New Troubleshooting Flow'}
            </h2>
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
                Flow Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
                placeholder="e.g., WiFi Connection Problems"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time *
              </label>
              <input
                type="text"
                required
                value={formData.estimatedTime}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                className="input-field"
                placeholder="e.g., 5-10 minutes"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input-field"
              placeholder="Describe what this troubleshooting flow helps solve"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                <option value="">Select a category</option>
                {categories?.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty *
              </label>
              <select
                required
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="input-field"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Level *
              </label>
              <select
                required
                value={formData.membershipTier}
                onChange={(e) => setFormData(prev => ({ ...prev, membershipTier: e.target.value }))}
                className="input-field"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="pro">Pro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="input-field"
                placeholder="wifi, internet, connection"
              />
            </div>
          </div>

          {/* Flow Steps Builder */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Troubleshooting Steps</h3>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => addStep('question')}
                  className="btn-outline text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Question
                </button>
                <button
                  type="button"
                  onClick={() => addStep('action')}
                  className="btn-outline text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Action
                </button>
                <button
                  type="button"
                  onClick={() => addStep('solution')}
                  className="btn-secondary text-sm px-3 py-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Solution
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {formData.steps.map((step, index) => (
                <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        step.type === 'question' ? 'bg-blue-500' :
                        step.type === 'action' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}>
                        {index + 1}
                      </span>
                      <h4 className="text-sm font-medium text-gray-700">
                        {step.type === 'question' ? 'Question' : 
                         step.type === 'action' ? 'Action' : 'Solution'} Step
                      </h4>
                    </div>
                    {formData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateStep(index, 'title', e.target.value)}
                      className="input-field"
                      placeholder={`${step.type === 'question' ? 'Question' : step.type === 'action' ? 'Action' : 'Solution'} title`}
                    />
                    <textarea
                      rows={2}
                      value={step.description}
                      onChange={(e) => updateStep(index, 'description', e.target.value)}
                      className="input-field"
                      placeholder={`Detailed ${step.type} description...`}
                    />

                    {/* Question Options */}
                    {step.type === 'question' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Answer Options:</label>
                        {step.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => {
                                const newOptions = [...(step.options || [])];
                                newOptions[optionIndex] = { ...newOptions[optionIndex], text: e.target.value };
                                updateStep(index, 'options', newOptions);
                              }}
                              className="input-field flex-1"
                              placeholder="Answer option"
                            />
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={option.nextStep}
                              onChange={(e) => {
                                const newOptions = [...(step.options || [])];
                                newOptions[optionIndex] = { ...newOptions[optionIndex], nextStep: parseInt(e.target.value) };
                                updateStep(index, 'options', newOptions);
                              }}
                              className="input-field w-20"
                              placeholder="Next"
                            />
                          </div>
                        )) || []}
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...(step.options || []), { text: '', nextStep: index + 2 }];
                            updateStep(index, 'options', newOptions);
                          }}
                          className="btn-outline text-sm px-3 py-1"
                        >
                          Add Option
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publish Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
              Publish immediately
            </label>
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
              {isSaving ? 'Saving...' : (flow ? 'Update Flow' : 'Create Flow')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TroubleshootingFlowManager;
