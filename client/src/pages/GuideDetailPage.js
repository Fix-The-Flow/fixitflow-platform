import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import UpgradeModal from '../components/Subscription/UpgradeModal';
import axios from 'axios';
import toast from 'react-hot-toast';

const GuideDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { hasPremiumAccess, hasFeatureAccess, subscriptionToken, isAuthenticated } = useAuth();
  
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [requiredFeature, setRequiredFeature] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    fetchGuide();
  }, [slug]);

  const fetchGuide = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = {};
      if (subscriptionToken) {
        headers['x-subscription-token'] = subscriptionToken;
      }
      
      const response = await axios.get(`/api/guides/${slug}`, { headers });
      setGuide(response.data.guide);
    } catch (err) {
      console.error('Error fetching guide:', err);
      
      if (err.response?.status === 403) {
        // Premium feature required
        const feature = err.response.data.feature || 'complexGuides';
        setRequiredFeature(feature);
        setShowUpgradeModal(true);
        setError('Premium subscription required for this guide');
      } else if (err.response?.status === 404) {
        setError('Guide not found');
      } else {
        setError('Failed to load guide');
        toast.error('Failed to load guide');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClose = () => {
    setShowUpgradeModal(false);
    navigate('/guides');
  };

  const renderSteps = () => {
    if (!guide?.steps || guide.steps.length === 0) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Step-by-Step Solution
          </h3>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {guide.steps.length}
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {guide.steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index === currentStep
                  ? 'bg-blue-600 text-white'
                  : index < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {index < currentStep ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </button>
          ))}
        </div>

        {/* Current Step */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">{currentStep + 1}</span>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                {guide.steps[currentStep]?.title || `Step ${currentStep + 1}`}
              </h4>
              <div className="prose prose-sm max-w-none text-gray-700 mb-4">
                {guide.steps[currentStep]?.description}
              </div>
              
              {/* Premium Features */}
              {guide.steps[currentStep]?.videoUrl && (
                <div className="mb-4">
                  {hasFeatureAccess('linkedVideos') ? (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <iframe
                        src={guide.steps[currentStep].videoUrl}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        title={`Step ${currentStep + 1} Video`}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 font-medium">Premium Video Tutorial</p>
                        <button
                          onClick={() => {setRequiredFeature('linkedVideos'); setShowUpgradeModal(true);}}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-1"
                        >
                          Upgrade to watch
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Chat for Premium Users */}
              {guide.isPremiumContent && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {hasFeatureAccess('aiChat') ? (
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                      💬 Get AI Help with This Step
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-blue-800 font-medium mb-2">Need help with this step?</p>
                      <button
                        onClick={() => {setRequiredFeature('aiChat'); setShowUpgradeModal(true);}}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        💬 Upgrade for AI Chat Support
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous Step
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(guide.steps.length - 1, currentStep + 1))}
            disabled={currentStep === guide.steps.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next Step
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !guide) {
    return (
      <>
        <Helmet><title>Guide Not Found - FixItFlow</title></Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Guide Not Available</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/guides')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Other Guides
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{guide?.title || 'Guide Detail'} - FixItFlow</title>
        <meta name="description" content={guide?.description} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {guide?.category}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    guide?.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    guide?.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {guide?.difficulty}
                  </span>
                  {guide?.isPremiumContent && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Premium
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {guide?.title}
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {guide?.description}
                </p>
              </div>
              
              {/* Video Chat Support for Premium */}
              {guide?.isPremiumContent && (
                <div className="ml-6 flex-shrink-0">
                  {hasFeatureAccess('videoChat') ? (
                    <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Video Support</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {setRequiredFeature('videoChat'); setShowUpgradeModal(true);}}
                      className="border border-green-600 text-green-600 px-4 py-2 rounded-md hover:bg-green-50 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Get Video Help</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Guide Steps */}
          {renderSteps()}
          
          {/* Guide not available fallback */}
          {(!guide?.steps || guide.steps.length === 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Guide Content Coming Soon</h3>
              <p className="text-gray-600">
                This guide is being prepared. Please check back later or browse other available guides.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={handleUpgradeClose}
        requiredFeature={requiredFeature}
      />
    </>
  );
};

export default GuideDetailPage;
