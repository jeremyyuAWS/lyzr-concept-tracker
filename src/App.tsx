import React from 'react';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { verifyDatabaseSetup } from '@/lib/verifySetup';
import { LoginForm } from '@/components/auth/LoginForm';
import { UserMenu } from '@/components/auth/UserMenu';
import { WelcomeModal } from '@/components/WelcomeModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { useDemos } from '@/hooks/useDemos';
import { FeaturedTab } from '@/tabs/FeaturedTab';
import { CatalogTab } from '@/tabs/CatalogTab';
import { AddTab } from '@/tabs/AddTab';
import { AnalyticsTab } from '@/tabs/AnalyticsTab';
import { AdminTab } from '@/tabs/AdminTab';
import { Demo } from '@/types/demo';
import { Cat as Catalog, Plus, BarChart3, Shield, HelpCircle, Sparkles } from 'lucide-react';

// Production error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Production Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Application Error</h2>
            <p className="text-gray-600 mb-4">Something went wrong. Please try refreshing the page.</p>
            <div className="bg-gray-100 p-3 rounded text-left text-sm font-mono mb-4">
              <p className="text-red-600">Error: {this.state.error?.message || 'Unknown error'}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Environment variables validation
const validateEnvironment = () => {
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
  };

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    return false;
  }

  return true;
};

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { demos, loading, error, incrementPageViews, updateDemo, deleteDemo, refetch } = useDemos();
  const [activeTab, setActiveTab] = useState('featured');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [dbSetup, setDbSetup] = useState<boolean | null>(null);
  const [envValid, setEnvValid] = useState<boolean | null>(null);

  // Validate environment on mount
  useEffect(() => {
    console.log('🔍 Validating environment variables...');
    const isValid = validateEnvironment();
    setEnvValid(isValid);
    
    if (!isValid) {
      console.error('❌ Environment validation failed');
      return;
    }
    
    console.log('✅ Environment variables validated');
  }, []);

  // Setup database on app load
  useEffect(() => {
    if (envValid) {
      console.log('🔍 Verifying database setup...');
      verifyDatabaseSetup()
        .then(result => {
          console.log('Database verification result:', result);
          setDbSetup(result.success);
        })
        .catch(error => {
          console.error('Database verification failed:', error);
          setDbSetup(false);
        });
    }
  }, []);

  // Show welcome modal on first load
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('lyzr-welcome-seen');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('lyzr-welcome-seen', 'true');
  };

  const handleShowWelcome = () => {
    setShowWelcomeModal(true);
  };

  // Show loading state first
  if (authLoading || dbSetup === null || envValid === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {envValid === null ? 'Checking environment...' : 
             dbSetup === null ? 'Setting up database...' : 
             'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show environment error
  if (envValid === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Environment Configuration Error</h2>
          <p className="text-gray-600 mb-4">
            Required environment variables are missing. Please check:
          </p>
          <div className="bg-gray-100 p-3 rounded text-left text-sm font-mono">
            <p>1. VITE_SUPABASE_URL is set</p>
            <p>2. VITE_SUPABASE_ANON_KEY is set</p>
            <p>3. Variables are deployed to Netlify</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show database setup error
  if (dbSetup === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Database Setup Required</h2>
          <p className="text-gray-600 mb-4">
            There's an issue with the database setup. Please check:
          </p>
          <div className="bg-gray-100 p-3 rounded text-left text-sm font-mono">
            <p>1. SQL migrations were run correctly</p>
            <p>2. Environment variables are set</p>
            <p>3. Supabase project is active</p>
            <p>4. Storage bucket exists</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm />;
  }

  const handleDemoAdded = () => {
    refetch();
    setActiveTab('featured');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/lyzr-logo-cut.png" 
                alt="Lyzr Logo" 
                className="w-8 h-8 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-black">Lyzr Concept Tracker</h1>
                <p className="text-gray-600">Internal tool for demo app catalog and management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowWelcome}
                className="border-gray-300 hover:border-gray-400"
              >
                <HelpCircle className="w-4 h-4 mr-1.5" />
                Help
              </Button>
              <UserMenu />
            </div>
          </div>
        </header>

        <WelcomeModal 
          isOpen={showWelcomeModal} 
          onClose={handleCloseWelcome}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white p-1 rounded-lg border border-gray-200">
            <TabsTrigger 
              value="featured" 
              className="flex items-center gap-2 text-gray-600 bg-transparent hover:bg-blue-50 hover:text-blue-600 data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Featured</span>
            </TabsTrigger>
            <TabsTrigger 
              value="catalog" 
              className="flex items-center gap-2 text-gray-600 bg-transparent hover:bg-blue-50 hover:text-blue-600 data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              <Catalog className="w-4 h-4" />
              <span className="hidden sm:inline">Catalog</span>
            </TabsTrigger>
            <TabsTrigger 
              value="add" 
              className="flex items-center gap-2 text-gray-600 bg-transparent hover:bg-blue-50 hover:text-blue-600 data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Demo</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 text-gray-600 bg-transparent hover:bg-blue-50 hover:text-blue-600 data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="admin" 
              className="flex items-center gap-2 text-gray-600 bg-transparent hover:bg-blue-50 hover:text-blue-600 data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-sm"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 w-full">
            <TabsContent value="featured" className="mt-0">
              <FeaturedTab 
                demos={demos} 
                loading={loading}
                error={error}
                onViewIncrement={incrementPageViews}
                onDemoUpdate={updateDemo}
                onDemoDelete={deleteDemo}
                onRetry={refetch}
              />
            </TabsContent>

            <TabsContent value="catalog" className="mt-0">
              <CatalogTab 
                demos={demos} 
                loading={loading}
                error={error}
                onViewIncrement={incrementPageViews}
                onDemoUpdate={updateDemo}
                onDemoDelete={deleteDemo}
                onRetry={refetch}
              />
            </TabsContent>

            <TabsContent value="add" className="mt-0">
              <AddTab onSuccess={handleDemoAdded} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsTab demos={demos} />
            </TabsContent>

            <TabsContent value="admin" className="mt-0">
              <AdminTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;