import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BookOpen, 
  Users, 
  Plus, 
  Search, 
  BarChart3, 
  Shield, 
  Eye,
  Database,
  FileText,
  ExternalLink,
  Filter,
  Crown,
  User,
  Info,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { isAdmin, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Lyzr Concept Tracker",
      icon: <BookOpen className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/lyzr-logo-cut.png" 
                alt="Lyzr Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Lyzr Concept Tracker</h2>
            <p className="text-gray-600 mb-4">
              Your central hub for managing and showcasing AI demo concepts
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Badge className={`${isAdmin ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                {isAdmin ? (
                  <>
                    <Crown className="w-3 h-3 mr-1" />
                    Admin Access
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 mr-1" />
                    Standard Access
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="text-gray-700">
                {userProfile?.display_name || userProfile?.email || 'User'}
              </Badge>
            </div>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Info className="w-5 h-5" />
                What is this app?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 text-sm">
                This is Lyzr's internal tool for cataloging, managing, and tracking all AI demo concepts 
                created across Bolt.new and Lovable. It helps AEs showcase our capabilities and enables 
                internal teams to track demo performance and usage.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 text-sm">For Account Executives</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-green-700 text-xs space-y-1">
                  <li>• Browse and search demo concepts</li>
                  <li>• View demo analytics and popularity</li>
                  <li>• Access live demos and resources</li>
                  <li>• Filter by technology and use case</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800 text-sm">For Internal Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-purple-700 text-xs space-y-1">
                  <li>• Add and manage demo entries</li>
                  <li>• Track performance analytics</li>
                  <li>• Organize by tags and categories</li>
                  <li>• Monitor usage and engagement</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Navigating the App",
      icon: <Search className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-black mb-2">Four Main Sections</h3>
            <p className="text-gray-600">Each tab serves a specific purpose in the workflow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Search className="w-5 h-5" />
                  Catalog
                </CardTitle>
                <CardDescription>Browse and search all demos</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Search by title, description, or owner</li>
                  <li>• Filter by technology tags</li>
                  <li>• View demo details and screenshots</li>
                  <li>• Access live demos and resources</li>
                  <li>• Toggle between grid and list view</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Plus className="w-5 h-5" />
                  Add Demo
                  <Badge variant="outline" className="text-xs">Admin Only</Badge>
                </CardTitle>
                <CardDescription>Create new demo entries</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Add title, description, and tags</li>
                  <li>• Include Netlify, Excalidraw, Supabase links</li>
                  <li>• Upload screenshot images</li>
                  <li>• Set owner and metadata</li>
                  <li>• Publish directly to catalog</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <BarChart3 className="w-5 h-5" />
                  Analytics
                </CardTitle>
                <CardDescription>Track performance and usage</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View total demos and page views</li>
                  <li>• See top-performing demos</li>
                  <li>• Analyze tag distribution</li>
                  <li>• Track monthly growth trends</li>
                  <li>• Monitor owner performance</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Shield className="w-5 h-5" />
                  Admin
                  <Badge variant="outline" className="text-xs">Admin Only</Badge>
                </CardTitle>
                <CardDescription>System management and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View system information</li>
                  <li>• Manage user roles and permissions</li>
                  <li>• Monitor security features</li>
                  <li>• Access system logs</li>
                  <li>• Configure app settings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Using the Catalog",
      icon: <Eye className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-black mb-2">Finding and Accessing Demos</h3>
            <p className="text-gray-600">Everything you need to know about browsing demos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Search className="w-5 h-5" />
                    Search & Filter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">Search by title, description, or owner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">Filter by technology tags</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">Sort by views, date, or name</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <ExternalLink className="w-5 h-5" />
                    Demo Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="bg-black text-white text-xs">Try App</Button>
                      <span className="text-sm text-green-700">Access live demo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">View Excalidraw blueprints</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">Access Supabase backend</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">Open admin panel</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <Lightbulb className="w-5 h-5" />
                    Pro Tips for AEs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-yellow-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                      <span>Use filters to find demos by specific tech stack</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                      <span>Check page views to see popular demos</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                      <span>Screenshots help with quick visual reference</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                      <span>Owner field shows who built the demo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Users className="w-5 h-5" />
                    Team Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-purple-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-purple-600" />
                      <span>Click "Try App" to increment view count</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-purple-600" />
                      <span>Share demo URLs with prospects</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-purple-600" />
                      <span>Use analytics to track engagement</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-purple-600" />
                      <span>Report issues to demo owners</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      title: isAdmin ? "Admin Features" : "Understanding Analytics",
      icon: isAdmin ? <Shield className="w-8 h-8" /> : <BarChart3 className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          {isAdmin ? (
            <>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-black mb-2">Admin Capabilities</h3>
                <p className="text-gray-600">You have full admin access to manage demos</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <Card className="bg-red-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <Plus className="w-5 h-5" />
                      Adding Demos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-red-700">
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-red-600" />
                        <span>Fill out title, description, and tags</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-red-600" />
                        <span>Add Netlify URL (required)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-red-600" />
                        <span>Include optional links (Excalidraw, Supabase)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-red-600" />
                        <span>Upload screenshot for visual reference</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-red-600" />
                        <span>Set owner and publish to catalog</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200 w-full">
                  <CardHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <BarChart3 className="w-5 h-5" />
                      Key Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-blue-700">
                      <div className="flex items-start gap-2">
                        <Eye className="w-4 h-4 mt-0.5 text-blue-600" />
                        <span>Total page views across all demos</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <BarChart3 className="w-4 h-4 mt-0.5 text-blue-600" />
                        <span>Top-performing demos by views</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Filter className="w-4 h-4 mt-0.5 text-blue-600" />
                        <span>Popular technology tags</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 mt-0.5 text-blue-600" />
                        <span>Demo owner performance</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Lightbulb className="w-5 h-5" />
                      Using Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-green-700">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                        <span>Identify most popular demos for client calls</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                        <span>Track which technologies get most interest</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                        <span>Monitor growth trends over time</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                        <span>Report usage metrics to stakeholders</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-black mb-2">Understanding Analytics</h3>
                <p className="text-gray-600">Track demo performance and usage patterns</p>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <BarChart3 className="w-5 h-5" />
                      Key Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-blue-700">
                      <div className="flex items-start gap-2">
                        <Eye className="w-4 h-4 mt-0.5 text-blue-600" />
                        <span>Total page views across all demos</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <BarChart3 className="w-4 h-4 mt-0.5 text-blue-600" />
                        <span>Top-performing demos by views</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Filter className="w-4 h-4 mt-0.5 text-blue-600" />
                        <span>Popular technology tags</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 mt-0.5 text-blue-600" />
                        <span>Demo owner performance</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Lightbulb className="w-5 h-5" />
                      Using Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-green-700">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                        <span>Identify most popular demos for client calls</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                        <span>Track which technologies get most interest</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                        <span>Monitor growth trends over time</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                        <span>Report usage metrics to stakeholders</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
          )}
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto mx-auto [&>button.absolute]:bg-white [&>button.absolute]:text-black [&>button.absolute:hover]:bg-gray-100 [&>button.absolute]:rounded-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-black">
            <div className="text-gray-600">
              {currentStepData.icon}
            </div>
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentStep 
                      ? 'bg-black' 
                      : index < currentStep 
                        ? 'bg-gray-400' 
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Step content */}
          <div className="min-h-[400px] w-full">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 w-full">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={onClose}
                  className="bg-black hover:bg-gray-800 text-white flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Get Started
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="bg-black hover:bg-gray-800 text-white flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}