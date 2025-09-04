import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  Search, 
  Star, 
  DollarSign,
  BookOpen,
  Clock,
  Filter,
  ChevronDown
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useMascot } from '../contexts/MascotContext';

const EbooksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'newest'
  });
  const [page, setPage] = useState(1);

  const { showContextualTip } = useMascot();

  useEffect(() => {
    const timer = setTimeout(() => {
      showContextualTip('ebooks');
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
    if (newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
    if (newPage > 1) params.set('page', newPage);
    
    return params.toString();
  };

  // Fetch ebooks based on filters
  const { data: ebooksData, isLoading } = useQuery(
    ['ebooks', filters, page],
    async () => {
      const queryString = buildQueryString();
      const response = await axios.get(`/api/ebooks?${queryString}&page=${page}`);
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
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      sort: 'newest'
    });
    setPage(1);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Best Selling' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'title', label: 'Alphabetical' }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <>
      <Helmet>
        <title>eBook Library - FixItFlow</title>
        <meta name="description" content="Browse our collection of comprehensive eBooks covering troubleshooting, DIY projects, and more." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              eBook Library
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Comprehensive guides and reference materials for troubleshooting, DIY projects, and skill building.
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
                  {(filters.category || filters.search) && (
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
                      placeholder="Search eBooks..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pl-10"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories?.map(category => (
                      <option key={category._id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

            {/* Main Content */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                      <div className="h-48 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : ebooksData?.ebooks?.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No eBooks found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                <>
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {ebooksData?.pagination?.total || 0} eBooks found
                    </h2>
                  </div>

                  {/* eBooks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ebooksData?.ebooks?.map((ebook) => (
                      <motion.div
                        key={ebook._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <Link to={`/ebooks/${ebook.slug}`}>
                          <div className="p-6">
                            {/* Placeholder Cover */}
                            <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center mb-4">
                              <BookOpen className="w-16 h-16 text-white" />
                            </div>
                            
                            {/* eBook Info */}
                            <div className="space-y-3">
                              <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">
                                {ebook.title}
                              </h3>
                              
                              <p className="text-sm text-gray-600 line-clamp-3">
                                {ebook.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-primary-600">
                                    {formatPrice(ebook.price)}
                                  </span>
                                  {ebook.sales?.count > 0 && (
                                    <span className="text-xs text-gray-500">
                                      {ebook.sales.count} sold
                                    </span>
                                  )}
                                </div>
                                
                                {ebook.rating?.average > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-sm font-medium text-gray-700">
                                      {ebook.rating.average.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({ebook.rating.count})
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {ebook.metadata && (
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  {ebook.metadata.pageCount && (
                                    <span>{ebook.metadata.pageCount} pages</span>
                                  )}
                                  {ebook.metadata.readingTime && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{ebook.metadata.readingTime}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {ebooksData?.pagination?.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <div className="flex items-center space-x-2">
                        {[...Array(ebooksData.pagination.pages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setPage(i + 1)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              page === i + 1
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EbooksPage;
