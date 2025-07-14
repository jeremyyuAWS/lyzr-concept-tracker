import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, formData.displayName);
        toast.success('Account created successfully!');
      } else {
        await signIn(formData.email, formData.password);
        toast.success('Signed in successfully!');
      }
    } catch (err: any) {
      // Handle specific error cases
      if (err.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please check your credentials or create a new account.');
      } else if (err.message === 'User not found') {
        setError('No account found with this email. Please sign up first.');
      } else if (err.message === 'Email not confirmed') {
        setError('Please check your email and confirm your account before signing in.');
      } else {
        setError(err.message || 'An error occurred during authentication');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="w-full shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/lyzr-logo-cut.png" 
                alt="Lyzr Logo" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-black mb-2">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isSignUp 
                ? 'Create your admin account to manage demos'
                : 'Sign in to access the Lyzr Concept Tracker'
              }
            </CardDescription>
          </CardHeader>
        
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  className="text-left h-12 text-base"
                />
              </div>

              {isSignUp && (
                <div className="space-y-3">
                  <Label htmlFor="displayName" className="text-sm font-medium text-black">
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="Enter your display name"
                    disabled={isLoading}
                    className="text-left h-12 text-base"
                  />
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-black">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="text-left h-12 text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-blue-600 text-white mt-8 h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
                disabled={isLoading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Create one"
                }
              </button>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                <strong>Admin Users:</strong> jeremy@lyzr.ai and admin@lyzr.ai get automatic admin access.
                <br />
                <strong>Test Users:</strong> Any email can create an account with standard access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}