import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  Tag,
  Settings
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const AdminEbookManager = () => {
  const [selectedEbook, setSelectedEbook] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const queryClient = useQueryClient();

  // Fetch eBooks
  const { data: ebooksData, isLoading, error } = useQuery(
    ['admin-ebooks', currentPage, filters],
    async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });
      const response = await axios.get(`/api/admin/ebooks?${params}`);
      return response.data;
    },
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching ebooks:', error);
        toast.error('Failed to load ebooks');
      }
    }
  );

  // Fetch categories for filters
  const { data: categories } = useQuery('categories', async () => {
    const response = await axios.get('/api/categories');
    return response.data.categories;
  });

  // Publish/Unpublish mutation
  const publishMutation = useMutation(
    ({ id, isPublished }) => 
      axios.patch(`/api/admin/ebooks/${id}/publish`, { isPublished }),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('admin-ebooks');
        toast.success(response.data.message);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update eBook');
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => axios.delete(`/api/admin/ebooks/${id}`),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('admin-ebooks');
        toast.success(response.data.message);
        setSelectedEbook(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete eBook');
      }
    }
  );

  const handlePublishToggle = (ebook) => {
    publishMutation.mutate({
      id: ebook._id,
      isPublished: !ebook.isPublished
    });
  };

  const handleDelete = (ebook) => {
    if (window.confirm(`Are you sure you want to delete "${ebook.title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(ebook._id);
    }
  };

  const handleEdit = (ebook) => {
    setSelectedEbook(ebook);
    setIsEditing(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <>
      <Helmet>
        <title>eBook Management - Admin Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                eBook Management
              </h1>
              <p className="text-gray-600">
                Create, edit, and manage your digital eBooks
              </p>
            </div>
            <button 
              onClick={() => {
                setSelectedEbook(null);
                setIsEditing(true);
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New eBook</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search eBooks..."
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

          {/* eBooks List */}
          <div className="bg-white rounded-lg shadow-sm">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading eBooks...</p>
              </div>
            ) : ebooksData?.ebooks?.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No eBooks found</h3>
                <p className="text-gray-500 mb-4">
                  {Object.values(filters).some(f => f) 
                    ? 'Try adjusting your filters or create your first eBook.' 
                    : 'Create your first eBook to get started.'
                  }
                </p>
                <button 
                  onClick={() => {
                    setSelectedEbook(null);
                    setIsEditing(true);
                  }}
                  className="btn-primary"
                >
                  Create New eBook
                </button>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 font-medium text-gray-700 text-sm">
                    <div className="col-span-4">eBook</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-1">Price</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Created</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>

                {/* eBooks */}
                <div className="divide-y divide-gray-200">
                  {ebooksData?.ebooks?.map((ebook) => (
                    <motion.div
                      key={ebook._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* eBook Info */}
                        <div className="col-span-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                              {ebook.title.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 mb-1">
                                {ebook.title}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {ebook.description}
                              </p>
                              {ebook.metadata?.pageCount && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {ebook.metadata.pageCount} pages • {ebook.metadata.readingTime}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Category */}
                        <div className="col-span-2">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${ebook.category?.color || '#3B82F6'}20`,
                              color: ebook.category?.color || '#3B82F6'
                            }}
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {ebook.category?.name}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="col-span-1">
                          <span className="font-medium text-gray-900">
                            ${ebook.price}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ebook.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ebook.isPublished ? (
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
                            {formatDistanceToNow(new Date(ebook.createdAt), { addSuffix: true })}
                          </div>
                          <div className="text-xs text-gray-500">
                            by {ebook.author?.username}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(ebook)}
                              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                              title="Edit eBook"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handlePublishToggle(ebook)}
                              disabled={publishMutation.isLoading}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                ebook.isPublished
                                  ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              }`}
                              title={ebook.isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {ebook.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleDelete(ebook)}
                              disabled={deleteMutation.isLoading}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete eBook"
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
                {ebooksData?.pagination && ebooksData.pagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, ebooksData.pagination.total)} of {ebooksData.pagination.total} eBooks
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
                          Page {currentPage} of {ebooksData.pagination.pages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, ebooksData.pagination.pages))}
                          disabled={currentPage === ebooksData.pagination.pages}
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
                  <p className="text-sm font-medium text-gray-600">Total eBooks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {ebooksData?.pagination?.total || 0}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600">
                    {ebooksData?.ebooks?.filter(e => e.isPublished).length || 0}
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
                    {ebooksData?.ebooks?.filter(e => !e.isPublished).length || 0}
                  </p>
                </div>
                <EyeOff className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${ebooksData?.ebooks?.length ? (
                      ebooksData.ebooks.reduce((sum, e) => sum + e.price, 0) / ebooksData.ebooks.length
                    ).toFixed(2) : '0.00'}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* eBook Editor Modal */}
      {isEditing && (
        <EbookEditorModal
          ebook={selectedEbook}
          categories={categories}
          onClose={() => {
            setIsEditing(false);
            setSelectedEbook(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries('admin-ebooks');
            setIsEditing(false);
            setSelectedEbook(null);
          }}
        />
      )}
    </>
  );
};

// eBook Editor Modal Component
const EbookEditorModal = ({ ebook, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: ebook?.title || '',
    description: ebook?.description || '',
    category: ebook?.category?._id || '',
    price: ebook?.price || '',
    coverImage: ebook?.coverImage || '',
    content: {
      introduction: ebook?.content?.introduction || '',
      chapters: ebook?.content?.chapters || [{ title: '', content: '' }],
      conclusion: ebook?.content?.conclusion || ''
    },
    metadata: {
      pageCount: ebook?.metadata?.pageCount || '',
      wordCount: ebook?.metadata?.wordCount || '',
      readingTime: ebook?.metadata?.readingTime || '',
      language: ebook?.metadata?.language || 'en'
    },
    isPublished: ebook?.isPublished || false
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Log the request details for debugging
      console.log('Submitting ebook data:', {
        isEdit: !!ebook,
        formData,
        url: ebook ? `/api/admin/ebooks/${ebook._id}` : '/api/admin/ebooks',
        method: ebook ? 'put' : 'post'
      });

      const url = ebook ? `/api/admin/ebooks/${ebook._id}` : '/api/admin/ebooks';
      const method = ebook ? 'put' : 'post';
      
      // Validate required fields before sending
      if (!formData.title || !formData.description || !formData.category) {
        throw new Error('Please fill in all required fields (title, description, category)');
      }

      const response = await axios[method](url, formData);
      toast.success(response.data.message);
      onSave();
    } catch (error) {
      console.error('Ebook save error:', {
        error,
        response: error.response,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.message.includes('fill in all required fields')) {
        toast.error(error.message);
      } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        toast.error('Connection error. Please check if you are logged in as an admin and the server is running.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save eBook');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addChapter = () => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        chapters: [...prev.content.chapters, { title: '', content: '' }]
      }
    }));
  };

  const removeChapter = (index) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        chapters: prev.content.chapters.filter((_, i) => i !== index)
      }
    }));
  };

  const updateChapter = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        chapters: prev.content.chapters.map((chapter, i) => 
          i === index ? { ...chapter, [field]: value } : chapter
        )
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {ebook ? 'Edit eBook' : 'Create New eBook'}
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
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
                placeholder="Enter eBook title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="input-field"
                placeholder="0.00"
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
              placeholder="Describe what this eBook covers"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Cover Image URL
              </label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                className="input-field"
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Content</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Introduction
                </label>
                <textarea
                  rows={4}
                  value={formData.content.introduction}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, introduction: e.target.value }
                  }))}
                  className="input-field"
                  placeholder="Write an engaging introduction..."
                />
              </div>

              {/* Chapters */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Chapters
                  </label>
                  <button
                    type="button"
                    onClick={addChapter}
                    className="btn-outline text-sm px-3 py-1"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Chapter
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.content.chapters.map((chapter, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          Chapter {index + 1}
                        </h4>
                        {formData.content.chapters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChapter(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => updateChapter(index, 'title', e.target.value)}
                          className="input-field"
                          placeholder="Chapter title"
                        />
                        <textarea
                          rows={4}
                          value={chapter.content}
                          onChange={(e) => updateChapter(index, 'content', e.target.value)}
                          className="input-field"
                          placeholder="Chapter content..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conclusion
                </label>
                <textarea
                  rows={4}
                  value={formData.content.conclusion}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, conclusion: e.target.value }
                  }))}
                  className="input-field"
                  placeholder="Write a compelling conclusion..."
                />
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.metadata.pageCount}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, pageCount: e.target.value }
                  }))}
                  className="input-field"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Word Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.metadata.wordCount}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, wordCount: e.target.value }
                  }))}
                  className="input-field"
                  placeholder="15000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reading Time
                </label>
                <input
                  type="text"
                  value={formData.metadata.readingTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, readingTime: e.target.value }
                  }))}
                  className="input-field"
                  placeholder="2 hours"
                />
              </div>
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
              {isSaving ? 'Saving...' : (ebook ? 'Update eBook' : 'Create eBook')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEbookManager;
