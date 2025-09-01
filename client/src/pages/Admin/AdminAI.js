import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'react-query';
import { 
  Sparkles, 
  BookOpen, 
  Brain, 
  Lightbulb, 
  FileText,
  Download,
  Edit,
  Save,
  Wand2
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminAI = () => {
  const [activeTab, setActiveTab] = useState('brainstorm');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch categories and guides for AI context
  const { data: categories } = useQuery('categories', async () => {
    const response = await axios.get('/api/categories');
    return response.data.categories;
  });

  const { data: guides } = useQuery('popular-guides', async () => {
    const response = await axios.get('/api/guides?sort=popular&limit=20');
    return response.data.guides;
  });

  // AI brainstorming mutation
  const brainstormMutation = useMutation(
    (data) => axios.post('/api/ai/brainstorm-ideas', data),
    {
      onSuccess: (response) => {
        setGeneratedContent(response.data);
        toast.success('eBook ideas generated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate ideas');
      }
    }
  );

  // Generate outline mutation
  const outlineMutation = useMutation(
    (data) => axios.post('/api/ai/generate-outline', data),
    {
      onSuccess: (response) => {
        setGeneratedContent(response.data);
        toast.success('eBook outline generated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate outline');
      }
    }
  );

  // Generate chapter mutation
  const chapterMutation = useMutation(
    (data) => axios.post('/api/ai/generate-chapter', data),
    {
      onSuccess: (response) => {
        setGeneratedContent(response.data);
        toast.success('Chapter content generated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate chapter');
      }
    }
  );

  // Title suggestions mutation
  const titleMutation = useMutation(
    (data) => axios.post('/api/ai/suggest-titles', data),
    {
      onSuccess: (response) => {
        setGeneratedContent(response.data);
        toast.success('Title suggestions generated!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate titles');
      }
    }
  );

  const handleBrainstorm = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const category = formData.get('category');
    
    setIsGenerating(true);
    try {
      await brainstormMutation.mutateAsync({ category });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateOutline = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      topic: formData.get('topic'),
      category: formData.get('category'),
      targetAudience: formData.get('targetAudience'),
      includeGuides: formData.getAll('includeGuides')
    };

    setIsGenerating(true);
    try {
      await outlineMutation.mutateAsync(data);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateChapter = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      chapterTitle: formData.get('chapterTitle'),
      chapterDescription: formData.get('chapterDescription'),
      ebookTitle: formData.get('ebookTitle'),
      tone: formData.get('tone'),
      length: formData.get('length'),
      includeGuides: formData.getAll('includeGuides')
    };

    setIsGenerating(true);
    try {
      await chapterMutation.mutateAsync(data);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestTitles = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      topic: formData.get('topic'),
      description: formData.get('description'),
      targetAudience: formData.get('targetAudience')
    };

    setIsGenerating(true);
    try {
      await titleMutation.mutateAsync(data);
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { id: 'brainstorm', label: 'Brainstorm Ideas', icon: Lightbulb },
    { id: 'outline', label: 'Generate Outline', icon: FileText },
    { id: 'chapter', label: 'Write Chapter', icon: Edit },
    { id: 'titles', label: 'Suggest Titles', icon: Wand2 }
  ];

  return (
    <>
      <Helmet>
        <title>AI eBook Assistant - Admin Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI eBook Assistant
            </h1>
            <p className="text-gray-600">
              Create compelling eBooks with AI-powered assistance
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - AI Tools */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Brain className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">AI Tools</h2>
                </div>

                {/* Tab Navigation */}
                <div className="space-y-2 mb-6">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                        activeTab === id
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Active Tool Form */}
                <div className="border-t border-gray-200 pt-6">
                  {activeTab === 'brainstorm' && (
                    <form onSubmit={handleBrainstorm} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category (Optional)
                        </label>
                        <select name="category" className="input-field">
                          <option value="">All Categories</option>
                          {categories?.map(cat => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isGenerating}
                        className="btn-primary w-full"
                      >
                        {isGenerating ? 'Generating...' : 'Generate Ideas'}
                      </button>
                    </form>
                  )}

                  {activeTab === 'outline' && (
                    <form onSubmit={handleGenerateOutline} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Topic *
                        </label>
                        <input
                          name="topic"
                          type="text"
                          required
                          className="input-field"
                          placeholder="e.g., Home WiFi Troubleshooting"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select name="category" className="input-field">
                          <option value="">Select Category</option>
                          {categories?.map(cat => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Audience
                        </label>
                        <input
                          name="targetAudience"
                          type="text"
                          className="input-field"
                          placeholder="e.g., Beginners, Tech enthusiasts"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isGenerating}
                        className="btn-primary w-full"
                      >
                        {isGenerating ? 'Generating...' : 'Generate Outline'}
                      </button>
                    </form>
                  )}

                  {activeTab === 'chapter' && (
                    <form onSubmit={handleGenerateChapter} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chapter Title *
                        </label>
                        <input
                          name="chapterTitle"
                          type="text"
                          required
                          className="input-field"
                          placeholder="e.g., Setting Up Your Router"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chapter Description *
                        </label>
                        <textarea
                          name="chapterDescription"
                          required
                          rows={3}
                          className="input-field"
                          placeholder="What should this chapter cover?"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tone
                        </label>
                        <select name="tone" className="input-field">
                          <option value="friendly">Friendly</option>
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Length
                        </label>
                        <select name="length" className="input-field">
                          <option value="short">Short (800-1200 words)</option>
                          <option value="medium">Medium (1500-2500 words)</option>
                          <option value="long">Long (2500-4000 words)</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isGenerating}
                        className="btn-primary w-full"
                      >
                        {isGenerating ? 'Writing...' : 'Generate Chapter'}
                      </button>
                    </form>
                  )}

                  {activeTab === 'titles' && (
                    <form onSubmit={handleSuggestTitles} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Topic *
                        </label>
                        <input
                          name="topic"
                          type="text"
                          required
                          className="input-field"
                          placeholder="e.g., Smart Home Setup"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          rows={3}
                          className="input-field"
                          placeholder="Brief description of the eBook content"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Audience
                        </label>
                        <input
                          name="targetAudience"
                          type="text"
                          className="input-field"
                          placeholder="e.g., Homeowners, Tech beginners"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isGenerating}
                        className="btn-primary w-full"
                      >
                        {isGenerating ? 'Generating...' : 'Suggest Titles'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Generated Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Generated Content</h2>
                  </div>
                  
                  {generatedContent && (
                    <div className="flex items-center space-x-2">
                      <button className="btn-secondary text-sm px-3 py-1">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </button>
                      <button className="btn-outline text-sm px-3 py-1">
                        <Save className="w-4 h-4 mr-1" />
                        Save as eBook
                      </button>
                    </div>
                  )}
                </div>

                {/* Content Display */}
                <div className="min-h-96">
                  {!generatedContent ? (
                    <div className="flex items-center justify-center h-96 text-gray-500">
                      <div className="text-center">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">Ready to create amazing content!</p>
                        <p>Select an AI tool from the left panel to get started.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Brainstorm Ideas Display */}
                      {activeTab === 'brainstorm' && generatedContent.ideas && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            eBook Ideas
                          </h3>
                          <div className="space-y-4">
                            {generatedContent.ideas.map((idea, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="border border-gray-200 rounded-lg p-4"
                              >
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  {idea.title}
                                </h4>
                                <p className="text-gray-600 text-sm mb-3">
                                  {idea.description}
                                </p>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">
                                    Target: {idea.targetAudience}
                                  </span>
                                  <span className="font-semibold text-primary-600">
                                    ${idea.suggestedPrice}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Outline Display */}
                      {activeTab === 'outline' && generatedContent.outline && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {generatedContent.outline.title}
                          </h3>
                          <div className="prose max-w-none">
                            <div className="mb-6">
                              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                              <p className="text-gray-600">{generatedContent.outline.description}</p>
                            </div>
                            
                            <div className="mb-6">
                              <h4 className="font-semibold text-gray-900 mb-2">Chapters</h4>
                              <div className="space-y-3">
                                {generatedContent.outline.chapters?.map((chapter, index) => (
                                  <div key={index} className="border-l-4 border-primary-500 pl-4">
                                    <h5 className="font-medium text-gray-900">
                                      {index + 1}. {chapter.title}
                                    </h5>
                                    <p className="text-sm text-gray-600">{chapter.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {generatedContent.outline.metadata && (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Metadata</h4>
                                <p className="text-sm text-gray-600">
                                  Estimated: {generatedContent.outline.metadata.estimatedWordCount} words
                                  • {generatedContent.outline.metadata.estimatedReadingTime}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Chapter Content Display */}
                      {activeTab === 'chapter' && generatedContent.content && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Generated Chapter
                            </h3>
                            {generatedContent.metadata && (
                              <div className="text-sm text-gray-500">
                                {generatedContent.metadata.wordCount} words
                                • {generatedContent.metadata.estimatedReadingTime}
                              </div>
                            )}
                          </div>
                          <div className="prose max-w-none bg-gray-50 p-6 rounded-lg">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                              {generatedContent.content}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Title Suggestions Display */}
                      {activeTab === 'titles' && generatedContent.titles && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Title Suggestions
                          </h3>
                          <div className="grid grid-cols-1 gap-3">
                            {generatedContent.titles.map((title, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors duration-200"
                              >
                                <span className="text-gray-900">{title}</span>
                                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                  Use This
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAI;
