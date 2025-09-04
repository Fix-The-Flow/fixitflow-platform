import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handlePaymentSuccess, hasPremiumAccess } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const plan = searchParams.get('plan');

      if (!sessionId || !plan) {
        toast.error('Invalid payment session');
        navigate('/');
        return;
      }

      try {
        const result = await handlePaymentSuccess(sessionId);
        
        if (result.success) {
          setSuccess(true);
          setSubscriptionDetails(result.data);
          
          // Redirect to home page after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          toast.error(result.message || 'Payment processing failed');
          navigate('/');
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        toast.error('Payment processing failed');
        navigate('/');
      } finally {
        setProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, handlePaymentSuccess, navigate]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Your Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we activate your premium subscription...
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    const plan = subscriptionDetails?.subscription?.plan || 'premium';
    const planNames = {
      daily: 'Pro Day Pass',
      monthly: 'Monthly Premium',
      annual: 'Annual Premium'
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Welcome to Premium!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your {planNames[plan] || 'Premium'} subscription has been activated successfully.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">You now have access to:</h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>✓ Complex troubleshooting guides</li>
              <li>✓ AI chat support</li>
              <li>✓ Video chat assistance</li>
              <li>✓ Linked video tutorials</li>
              {(plan === 'monthly' || plan === 'annual') && (
                <li>✓ Priority customer support</li>
              )}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Exploring Premium Features
            </button>
            
            <button
              onClick={() => navigate('/guides')}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              Browse Advanced Guides
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Redirecting to homepage in a few seconds...
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionSuccess;
