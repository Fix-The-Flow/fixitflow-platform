import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Configure axios base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  subscription: {
    plan: 'free',
    features: [],
    isExpired: false
  },
  subscriptionToken: null,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        subscription: action.payload.user?.subscription || state.subscription,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        subscription: {
          plan: 'free',
          features: [],
          isExpired: false
        },
        subscriptionToken: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        subscription: action.payload.subscription || state.subscription,
      };
    case 'SET_SUBSCRIPTION':
      return {
        ...state,
        subscription: action.payload.subscription,
        subscriptionToken: action.payload.subscriptionToken,
      };
    default:
      return state;
  }
};

// Configure axios defaults
const setupAxiosDefaults = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    Cookies.set('authToken', token, { expires: 7 });
  } else {
    delete axios.defaults.headers.common['Authorization'];
    Cookies.remove('authToken');
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('authToken');
      const subscriptionToken = Cookies.get('subscriptionToken');
      
      if (token) {
        try {
          setupAxiosDefaults(token);
          const response = await axios.get('/api/auth/me');
          
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data.user,
              token,
            },
          });
        } catch (error) {
          console.error('Auth initialization failed:', error);
          setupAxiosDefaults(null);
          dispatch({ type: 'AUTH_FAILURE' });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE' });
      }
      
      // Initialize anonymous subscription if exists
      if (subscriptionToken && !token) {
        try {
          const response = await axios.get(`/api/subscription/verify?token=${subscriptionToken}`);
          if (response.data.success && response.data.isValid) {
            dispatch({
              type: 'SET_SUBSCRIPTION',
              payload: {
                subscription: response.data.subscription,
                subscriptionToken
              }
            });
          } else {
            Cookies.remove('subscriptionToken');
          }
        } catch (error) {
          console.error('Subscription verification failed:', error);
          Cookies.remove('subscriptionToken');
        }
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      
      setupAxiosDefaults(token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });

      toast.success('Welcome back!');
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      
      setupAxiosDefaults(token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });

      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setupAxiosDefaults(null);
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/auth/profile', profileData);
      
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.user,
      });

      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Get subscription plans
  const getSubscriptionPlans = async () => {
    try {
      const response = await axios.get('/api/subscription/plans');
      return { success: true, plans: response.data.plans };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to get plans';
      return { success: false, message };
    }
  };

  // Create payment session
  const createPaymentSession = async (plan, email = null) => {
    try {
      const response = await axios.post('/api/subscription/create-session', {
        plan,
        email,
        returnUrl: window.location.origin
      });
      
      return { success: true, url: response.data.url, sessionId: response.data.sessionId };
    } catch (error) {
      const message = error.response?.data?.message || 'Payment session creation failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (sessionId, email = null) => {
    try {
      const response = await axios.post('/api/subscription/payment-success', {
        sessionId,
        email
      });
      
      if (response.data.subscriptionToken) {
        // Anonymous user subscription
        const subscriptionToken = response.data.subscriptionToken;
        Cookies.set('subscriptionToken', subscriptionToken, { expires: 365 });
        
        dispatch({
          type: 'SET_SUBSCRIPTION',
          payload: {
            subscription: response.data.subscription,
            subscriptionToken
          }
        });
      } else if (response.data.user) {
        // Registered user subscription
        dispatch({
          type: 'UPDATE_USER',
          payload: response.data.user
        });
      }
      
      toast.success('Premium subscription activated!');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Payment processing failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Check if user has premium access
  const hasPremiumAccess = () => {
    if (state.isAuthenticated && state.user) {
      return state.user.isPremium || false;
    }
    
    // Check anonymous subscription
    if (state.subscription && !state.subscription.isExpired) {
      return ['monthly', 'daily', 'annual'].includes(state.subscription.plan);
    }
    
    return false;
  };

  // Check specific feature access
  const hasFeatureAccess = (feature) => {
    if (state.isAuthenticated && state.user) {
      return state.user.subscription?.features?.[feature] || false;
    }
    
    // Check anonymous subscription features
    if (state.subscription && !state.subscription.isExpired) {
      const featureMap = {
        complexGuides: 'Complex guides',
        aiChat: 'AI chat support',
        videoChat: 'Video chat',
        linkedVideos: 'Linked videos'
      };
      
      return state.subscription.features?.includes(featureMap[feature]) || false;
    }
    
    return false;
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    getSubscriptionPlans,
    createPaymentSession,
    handlePaymentSuccess,
    hasPremiumAccess,
    hasFeatureAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
