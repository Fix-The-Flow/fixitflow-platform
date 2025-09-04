import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const UpgradeModal = ({ isOpen, onClose, requiredFeature = null }) => {
  const { getSubscriptionPlans, createPaymentSession } = useAuth();
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [email, setEmail] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    setLoading(true);
    const result = await getSubscriptionPlans();
    if (result.success) {
      setPlans(result.plans);
    } else {
      toast.error('Failed to load subscription plans');
    }
    setLoading(false);
  };

  const handleUpgrade = async () => {
    if (selectedPlan === 'free') return;

    setProcessingPayment(true);
    
    try {
      const result = await createPaymentSession(selectedPlan, email || null);
      
      if (result.success) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Payment session creation failed');
    }
    
    setProcessingPayment(false);
  };

  const getFeatureMessage = () => {
    const featureMessages = {
      complexGuides: 'Access advanced troubleshooting guides with detailed step-by-step solutions.',
      aiChat: 'Get instant help from our AI assistant for personalized troubleshooting.',
      videoChat: 'Connect with expert technicians via video chat for hands-on support.',
      linkedVideos: 'Watch linked video tutorials that demonstrate each troubleshooting step.'
    };

    return requiredFeature ? featureMessages[requiredFeature] : 
           'Unlock all premium features and get unlimited access to advanced troubleshooting tools.';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {requiredFeature ? 'Premium Feature Required' : 'Upgrade to Premium'}
              </h2>
              <p className="text-gray-600 mt-1">
                {getFeatureMessage()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div>
              {/* Plan Selection */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {Object.entries(plans)
                  .filter(([key]) => key !== 'free')
                  .map(([key, plan]) => (
                    <div
                      key={key}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        selectedPlan === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPlan(key)}
                    >
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {plan.name}
                        </h3>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-blue-600">
                            ${plan.price}
                          </span>
                          <span className="text-gray-600">
                            /{key === 'daily' ? 'day' : key === 'monthly' ? 'month' : 'year'}
                          </span>
                        </div>
                        
                        {key === 'annual' && (
                          <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full mb-4">
                            Save 40%!
                          </div>
                        )}
                        
                        {key === 'daily' && (
                          <div className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full mb-4">
                            Try it out!
                          </div>
                        )}
                        
                        <ul className="text-sm text-gray-600 space-y-2 text-left">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Email Input (Optional) */}
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional - for receipts and account recovery)
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can use FixItFlow without an account. Email helps us send receipts and allows account recovery.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={processingPayment}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    `Upgrade to ${plans[selectedPlan]?.name}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
