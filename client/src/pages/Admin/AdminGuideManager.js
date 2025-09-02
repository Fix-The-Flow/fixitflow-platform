import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  FileText, 
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
  Clock
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const AdminGuideManager = () => {
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const queryClient = useQueryClient();

  // Fetch guides
  const { data: guidesData, isLoading } = useQuery(
    ['admin-guides', currentPage, filters],
    async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });
      const response = await axios.get(`/api/admin/guides?${params}`);
      return response.data;
    }
  );

  // Fetch categories
  const { data: categories } = useQuery('categories', async () => {
    const response = await axios.get('/api/categories');
    return response.data.categories;
  });

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => axios.delete(`/api/guides/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-guides');
        toast.success('Guide deleted successfully');
        setSelectedGuide(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete guide');
      }
    }
  );

  const handleDelete = (guide) => {
    if (window.confirm(`Are you sure you want to delete "${guide.title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(guide._id);
    }
  };

  const handleEdit = (guide) => {
    setSelectedGuide(guide);
    setIsEditing(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Download CSV template
  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/api/admin/guides/csv-template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'guides-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV template downloaded');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  return (
    <>
      <Helmet>
        <title>Guide Management - Admin Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Guide Management
              </h1>
              <p className="text-gray-600">
                Create, edit, and manage troubleshooting guides
              </p>
            </div>
            <div className="flex items-center space-x-3">
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
                onClick={() => {
                  setSelectedGuide(null);
                  setIsEditing(true);
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Guide</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search guides..."
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
                  setFilters({ search: '', category: '', status: '' });
                  setCurrentPage(1);
                }}
                className="btn-outline"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Guides List */}
          <div className="bg-white rounded-lg shadow-sm">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading guides...</p>
              </div>
            ) : guidesData?.guides?.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No guides found</h3>
                <p className="text-gray-500 mb-4">
                  {Object.values(filters).some(f => f) 
                    ? 'Try adjusting your filters or create your first guide.' 
                    : 'Create your first guide or import from CSV to get started.'
                  }
                </p>
                <div className="space-x-3">
                  <button 
                    onClick={() => {
                      setSelectedGuide(null);
                      setIsEditing(true);
                    }}
                    className="btn-primary"
                  >
                    Create New Guide
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
                    <div className="col-span-4">Guide</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-1">Difficulty</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Created</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>

                {/* Guides */}
                <div className="divide-y divide-gray-200">
                  {guidesData?.guides?.map((guide) => (
                    <motion.div
                      key={guide._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Guide Info */}
                        <div className="col-span-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                              {guide.title.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 mb-1">
                                {guide.title}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {guide.description}
                              </p>
                              <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {guide.estimatedTime}
                                </span>
                                <span>{guide.views || 0} views</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Category */}
                        <div className="col-span-2">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${guide.category?.color || '#3B82F6'}20`,
                              color: guide.category?.color || '#3B82F6'
                            }}
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {guide.category?.name}
                          </span>
                        </div>

                        {/* Difficulty */}
                        <div className="col-span-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            guide.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                            guide.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {guide.difficulty}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            guide.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {guide.isPublished ? (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Published
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Draft
                              </>
                            )}
                          </span>
                        </div>

                        {/* Created Date */}
                        <div className="col-span-2">
                          <div className="text-sm text-gray-600">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDistanceToNow(new Date(guide.createdAt), { addSuffix: true })}
                          </div>
                          <div className="text-xs text-gray-500">
                            by {guide.author?.username}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(guide)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Edit guide"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDelete(guide)}
                              disabled={deleteMutation.isLoading}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete guide"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {guidesData?.pagination && guidesData.pagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, guidesData.pagination.total)} of {guidesData.pagination.total} guides
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
                          Page {currentPage} of {guidesData.pagination.pages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, guidesData.pagination.pages))}
                          disabled={currentPage === guidesData.pagination.pages}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Guides</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {guidesData?.pagination?.total || 0}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600">
                    {guidesData?.guides?.filter(g => g.isPublished).length || 0}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {guidesData?.guides?.filter(g => !g.isPublished).length || 0}
                  </p>
                </div>
                <EyeOff className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {categories?.length || 0}
                  </p>
                </div>
                <Tag className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Upload Modal */}
      {showCsvUpload && (
        <CsvUploadModal
          onClose={() => setShowCsvUpload(false)}
          onImportComplete={() => {
            queryClient.invalidateQueries('admin-guides');
            setShowCsvUpload(false);
          }}
        />
      )}

      {/* Guide Editor Modal */}
      {isEditing && (
        <GuideEditorModal
          guide={selectedGuide}
          categories={categories}
          onClose={() => {
            setIsEditing(false);
            setSelectedGuide(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries('admin-guides');
            setIsEditing(false);
            setSelectedGuide(null);
          }}
        />
      )}
    </>
  );
};

// CSV Upload Modal Component
const CsvUploadModal = ({ onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

    try {
      const response = await axios.post('/api/admin/guides/csv-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreview(response.data.preview);
      toast.success('CSV file parsed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to parse CSV file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setIsImporting(true);
    try {
      const response = await axios.post('/api/admin/guides/csv-import', {
        fileName: preview.fileName || file.name
      });
      
      const results = response.data.results;
      toast.success(`Successfully imported ${results.successful} guides`);
      
      if (results.failed > 0) {
        toast.error(`${results.failed} guides failed to import`);
      }
      
      onImportComplete();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import guides');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Bulk Import Guides from CSV
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
              <li>2. Fill in your guide data following the template format</li>
              <li>3. Upload your completed CSV file</li>
              <li>4. Preview the data and import</li>
            </ol>
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
              {isUploading ? 'Parsing...' : 'Preview CSV Data'}
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
                    <span>Valid Rows: {preview.validRows}</span>
                  </div>
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
                  <h4 className="font-medium text-gray-900 mb-3">Sample Data (First 3 rows):</h4>
                  <div className="space-y-2 text-sm">
                    {preview.data.slice(0, 3).map((guide, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border">
                        <div className="font-medium">{guide.title}</div>
                        <div className="text-gray-600">{guide.category} • {guide.difficulty}</div>
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
                {isImporting ? 'Importing...' : `Import ${preview.validRows} Guides`}
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

// Placeholder Guide Editor Modal (you can expand this)
const GuideEditorModal = ({ guide, categories, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {guide ? 'Edit Guide' : 'Create New Guide'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>
        <div className="p-6 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Guide Editor</h3>
          <p className="text-gray-600 mb-4">
            Individual guide editing interface coming soon. For now, use CSV import for bulk operations.
          </p>
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminGuideManager;
