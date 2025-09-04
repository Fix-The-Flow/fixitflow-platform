import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { MascotProvider } from './contexts/MascotContext';

// Layout components
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import MascotAssistant from './components/Mascot/MascotAssistant';
import UserDebug from './components/Debug/UserDebug';

// Pages
import HomePage from './pages/HomePage';
import GuidesPage from './pages/GuidesPage';
import EbooksPage from './pages/EbooksPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import SubscriptionSuccess from './pages/SubscriptionSuccess';

// Import placeholder components
import {
  GuideDetailPage,
  CategoriesPage,
  CategoryDetailPage,
  EbookDetailPage,
  DashboardPage,
  ProfilePage,
  CheckoutPage,
  SearchPage
} from './pages/placeholders';

// Protected route component
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Error boundary
import ErrorBoundary from './components/ErrorBoundary';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Elements stripe={stripePromise}>
            <AuthProvider>
              <MascotProvider>
                <Router>
                  <Routes>
                    {/* Admin routes (no header/footer) */}
                    <Route path="/admin/*" element={
                      <ProtectedRoute requireAdmin>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    
                    {/* All other routes (with header/footer) */}
                    <Route path="*" element={
                      <div className="min-h-screen bg-gray-50 flex flex-col">
                        <Header />
                        
                        <main className="flex-1">
                          <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/guides" element={<GuidesPage />} />
                            <Route path="/guides/:slug" element={<GuideDetailPage />} />
                            <Route path="/categories" element={<CategoriesPage />} />
                            <Route path="/categories/:slug" element={<CategoryDetailPage />} />
                            <Route path="/ebooks" element={<EbooksPage />} />
                            <Route path="/ebooks/:slug" element={<EbookDetailPage />} />
                            <Route path="/search" element={<SearchPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                            <Route path="/subscription/cancel" element={<HomePage />} />
                            
                            {/* Protected user routes */}
                            <Route path="/dashboard" element={
                              <ProtectedRoute>
                                <DashboardPage />
                              </ProtectedRoute>
                            } />
                            <Route path="/profile" element={
                              <ProtectedRoute>
                                <ProfilePage />
                              </ProtectedRoute>
                            } />
                            <Route path="/checkout/:ebookId" element={
                              <ProtectedRoute>
                                <CheckoutPage />
                              </ProtectedRoute>
                            } />
                          </Routes>
                        </main>
                        
                        <Footer />
                        <MascotAssistant />
                        <UserDebug />
                      </div>
                    } />
                  </Routes>
                </Router>
              </MascotProvider>
            </AuthProvider>
          </Elements>
        </QueryClientProvider>
      </HelmetProvider>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
}

export default App;
