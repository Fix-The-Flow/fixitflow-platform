import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { 
  BookOpen, 
  Save, 
  X, 
  Eye,
  FileText,
  Hash,
  Wand2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EbookEditor = ({ ebook, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    rawContent: '',
    chapters: []
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const queryClient = useQueryClient();

  // Load existing ebook data
  useEffect(() => {
    if (ebook) {
      setFormData({
        title: ebook.title || '',
        description: ebook.description || '',
        price: ebook.price || '',
        rawContent: ebook.rawContent || '',
        chapters: ebook.chapters || []
      });
    }
  }, [ebook]);


  // Auto-organize content into chapters
  const organizeIntoChapters = (content) => {
    if (!content.trim()) return [];

    const lines = content.split('\n').filter(line => line.trim());
    const chapters = [];
    let currentChapter = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect chapter headers (various formats)
      if (
        trimmedLine.match(/^(chapter\s+\d+|ch\s+\d+|\d+\.)/i) ||
        trimmedLine.match(/^#{1,3}\s/) ||
        (trimmedLine.length < 100 && trimmedLine.endsWith(':')) ||
        trimmedLine.match(/^[A-Z][^a-z]*$/) ||
        (currentChapter === null && trimmedLine.length > 0)
      ) {
        // Start new chapter
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          title: trimmedLine.replace(/^#+\s*/, '').replace(/^(chapter\s+\d+:?\s*)/i, ''),
          content: ''
        };
      } else if (currentChapter) {
        // Add content to current chapter
        currentChapter.content += (currentChapter.content ? '\n' : '') + trimmedLine;
      }
    }

    // Add the last chapter
    if (currentChapter) {
      chapters.push(currentChapter);
    }

    return chapters;
  };

  const handleProcessContent = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const chapters = organizeIntoChapters(formData.rawContent);
      setFormData(prev => ({ ...prev, chapters }));
      setIsProcessing(false);
      toast.success(`Organized content into ${chapters.length} chapters!`);
    }, 1000);
  };

  // Save/Update ebook mutation
  const saveMutation = useMutation(
    async (data) => {
      const payload = {
        ...data,
        content: data.chapters.map((chapter, index) => ({
          chapter: index + 1,
          title: chapter.title,
          content: chapter.content
        }))
      };

      if (ebook) {
        return axios.put(`/api/admin/ebooks/${ebook._id}`, payload);
      } else {
        return axios.post('/api/admin/ebooks', payload);
      }
    },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('admin-ebooks');
        toast.success(response.data.message);
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save eBook');
      }
    }
  );

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (formData.chapters.length === 0) {
      toast.error('Please add content and organize into chapters');
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChapterEdit = (index, field, value) => {
    const updatedChapters = [...formData.chapters];
    updatedChapters[index] = { ...updatedChapters[index], [field]: value };
    setFormData(prev => ({ ...prev, chapters: updatedChapters }));
  };

  const removeChapter = (index) => {
    const updatedChapters = formData.chapters.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, chapters: updatedChapters }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {ebook ? 'Edit eBook' : 'Create New eBook'}
              </h2>
              <p className="text-sm text-gray-500">
                {ebook ? 'Update your existing eBook' : 'Write and publish your eBook'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="btn-outline flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>{previewMode ? 'Edit' : 'Preview'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {!previewMode ? (
            /* Edit Mode */
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    eBook Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter your eBook title..."
                    className="input-field"
                    required
                  />
                </div>

              </div>

              {/* Description and Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of your eBook..."
                    className="input-field h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  eBook Content
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <strong>How to organize your content:</strong>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>Paste your entire eBook content below</li>
                        <li>Use "Chapter 1:", "Chapter 2:" or similar for chapter headers</li>
                        <li>You can also use "# Chapter Title" (markdown style)</li>
                        <li>Click "Organize into Chapters" to auto-format</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <textarea
                  value={formData.rawContent}
                  onChange={(e) => handleInputChange('rawContent', e.target.value)}
                  placeholder={`Paste your entire eBook content here...

Example:
Chapter 1: Introduction
This is the introduction to my eBook...

Chapter 2: Getting Started
In this chapter, we'll cover...

Chapter 3: Advanced Topics
Here we dive deeper into...`}
                  className="input-field h-64 resize-none font-mono text-sm"
                />

                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500">
                    {formData.rawContent.length} characters
                  </span>
                  <button
                    onClick={handleProcessContent}
                    disabled={!formData.rawContent.trim() || isProcessing}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>
                      {isProcessing ? 'Organizing...' : 'Organize into Chapters'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Organized Chapters */}
              {formData.chapters.length > 0 && (
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Organized Chapters ({formData.chapters.length})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {formData.chapters.map((chapter, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">
                              Chapter {index + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => removeChapter(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => handleChapterEdit(index, 'title', e.target.value)}
                          placeholder="Chapter title..."
                          className="input-field mb-3"
                        />

                        <textarea
                          value={chapter.content}
                          onChange={(e) => handleChapterEdit(index, 'content', e.target.value)}
                          placeholder="Chapter content..."
                          className="input-field h-32 resize-none text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Preview Mode */
            <div className="prose max-w-none">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {formData.title || 'Untitled eBook'}
              </h1>
              
              {formData.description && (
                <p className="text-lg text-gray-600 mb-8">
                  {formData.description}
                </p>
              )}

              {formData.chapters.map((chapter, index) => (
                <div key={index} className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Chapter {index + 1}: {chapter.title}
                  </h2>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {chapter.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {formData.chapters.length > 0 && (
              <span>{formData.chapters.length} chapters ready to publish</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
              <button
              onClick={handleSave}
              disabled={saveMutation.isLoading || !formData.title || formData.chapters.length === 0}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {saveMutation.isLoading 
                  ? 'Saving...' 
                  : ebook 
                    ? 'Update eBook' 
                    : 'Create eBook'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EbookEditor;
