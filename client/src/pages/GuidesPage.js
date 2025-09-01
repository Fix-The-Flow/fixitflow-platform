import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Eye,
  ChevronDown,
  X
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useMascot } from '../contexts/MascotContext';

const GuidesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    severity: searchParams.getAll('severity') || [],
    difficulty: searchParams.getAll('difficulty') || [],
    sort: searchParams.get('sort') || 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { showContextualTip } = useMascot();

  // Show search tip when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      showContextualTip('search');
    }, 1500);
    return () => clearTimeout(timer);
  }, [showContextualTip]);

  // Fetch categories for filter
  const { data: categories } = useQuery('categories', async () => {
    const response = await axios.get('/api/categories');
    return response.data.categories;
  });

  // Build query string from filters
  const buildQueryString = (newFilters = filters, newPage = page) => {
    const params = new URLSearchParams();
    
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.severity.length) {
      params.set('severity', newFilters.severity.join(','));
    }
    if (newFilters.difficulty.length) {
      params.set('difficulty', newFilters.difficulty.join(','));
    }
    if (newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
    if (newPage > 1) params.set('page', newPage);
    
    return params.toString();
  };

  // Fetch guides based on filters
  const { data: guidesData, isLoading } = useQuery(
    ['guides', filters, page],
    async () => {
      const queryString = buildQueryString();
      const response = await axios.get(`/api/guides?${queryString}&page=${page}`);
      return response.data;
    },
    {
      keepPreviousData: true
    }
  );

  // Update URL when filters change
  useEffect(() => {
    const queryString = buildQueryString();
    setSearchParams(queryString);
  }, [filters, page, setSearchParams]);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'severity' || filterType === 'difficulty') {
      setFilters(prev => ({
        ...prev,
        [filterType]: prev[filterType].includes(value)
          ? prev[filterType].filter(item => item !== value)
          : [...prev[filterType], value]
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterType]: value
      }));
    }
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      severity: [],
      difficulty: [],
      sort: 'newest'
    });
    setPage(1);
  };

  const severityOptions = ['low', 'medium', 'high', 'critical'];
  const difficultyOptions = ['beginner', 'intermediate', 'advanced'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'title', label: 'Alphabetical' }
  ];

  return (
    <>
      <Helmet>
        <title>Troubleshooting Guides - FixItFlow</title>
        <meta name="description" content="Browse our comprehensive collection of step-by-step troubleshooting guides for DIY, tech, home repair, and more." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Troubleshooting Guides
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Step-by-step solutions for everyday problems. Find the help you need, when you need it.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  {(filters.category || filters.severity.length || filters.difficulty.length) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search guides..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="input-field pl-10"
                    />
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="input-field"
                  >
                    <option value="">All Categories</option>
                    {categories?.map(category => (
                      <option key={category._id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severity Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <div className="space-y-2">
                    {severityOptions.map(severity => (
                      <label key={severity} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.severity.includes(severity)}
                          onChange={() => handleFilterChange('severity', severity)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-600 capitalize">
                          {severity}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <div className="space-y-2">
                    {difficultyOptions.map(difficulty => (
                      <label key={difficulty} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.difficulty.includes(difficulty)}
                          onChange={() => handleFilterChange('difficulty', difficulty)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-600 capitalize">
                          {difficulty}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Sort and Results Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                  {guidesData?.pagination?.total || 0} guides found
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                      value={filters.sort}
                      onChange={(e) => handleFilterChange('sort', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Guides Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="card p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {guidesData?.guides?.map((guide, index) => (
                    <motion.div
                      key={guide._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Link to={`/guides/${guide.slug}`} className="card card-hover block">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span 
                              className={`px-2 py-1 rounded-full text-xs font-medium severity-${guide.severity}`}
                            >
                              {guide.severity}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium difficulty-${guide.difficulty}`}>
                              {guide.difficulty}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                            {guide.title}
                          </h3>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {guide.description}
                          </p>

                          <div className="flex items-center space-x-2 mb-4">
                            <span 
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: guide.category.color }}
                            ></span>
                            <span className="text-sm text-gray-500">
                              {guide.category.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{guide.estimatedTime}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1">
                                <Eye className="w-4 h-4" />
                                <span>{guide.views}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span>{guide.rating.average || 'New'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* No Results */}
              {!isLoading && (!guidesData?.guides?.length) && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No guides found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or browse our categories
                  </p>
                  <button onClick={clearFilters} className="btn-primary">
                    Clear Filters
                  </button>
                </div>
              )}

              {/* Pagination */}
              {guidesData?.pagination?.pages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  {[...Array(guidesData.pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        page === i + 1
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuidesPage;
