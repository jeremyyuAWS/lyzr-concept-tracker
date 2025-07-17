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
  Lightbulb,
  Star,
  Heart,
  Target,
  Sparkles
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
      title: "Lyzr Concept Tracker - Feature Overview",
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
              The complete platform for discovering, managing, and tracking AI demo concepts
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

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Info className="w-5 h-5" />
                Core Purpose & Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-blue-700 text-sm">
                <p className="font-medium">🎯 For Account Executives & Sales Teams:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Instantly find the perfect demo for any prospect or use case</li>
                  <li>Access performance data to choose proven successful concepts</li>
                  <li>One-click access to live demos, technical docs, and resources</li>
                  <li>Track which demos resonate most with clients</li>
                </ul>
                <p className="font-medium mt-4">⚡ For Internal Teams:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Centralized catalog of all AI demo concepts across platforms</li>
                  <li>Real-time analytics on demo performance and engagement</li>
                  <li>Streamlined demo management and content organization</li>
                  <li>Data-driven insights for future demo development</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800 text-sm flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Smart Discovery
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-green-700 text-xs space-y-2">
                  <li>• Advanced search with auto-suggestions</li>
                  <li>• Filter by technology, industry, complexity</li>
                  <li>• Featured demos curated by experts</li>
                  <li>• Trending demos based on engagement</li>
                  <li>• Favorite demos for quick access</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-purple-800 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Performance Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-purple-700 text-xs space-y-2">
                  <li>• Real-time view counts and engagement</li>
                  <li>• Demo performance comparisons</li>
                  <li>• Technology trend analysis</li>
                  <li>• Creator leaderboards and insights</li>
                  <li>• Usage patterns and optimization tips</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-800 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Admin Control
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-orange-700 text-xs space-y-2">
                  <li>• Add, edit, and manage demo entries</li>
                  <li>• User management and role control</li>
                  <li>• Feature/unfeature demo curation</li>
                  <li>• System monitoring and health checks</li>
                  <li>• Export and reporting capabilities</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Featured & Favorites Tabs - Your Starting Point",
      icon: <Star className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-black mb-2">Start Here - Discover Premium Content</h3>
            <p className="text-gray-600">The Featured and Favorites tabs help you quickly find the best demos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Star className="w-6 h-6" />
                  Featured Tab
                </CardTitle>
                <CardDescription className="text-yellow-700">Premium curated demos showcasing our best work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Three Smart Filters:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li><strong>Featured:</strong> Hand-picked demos by admins</li>
                      <li><strong>Recent:</strong> New demos from the last 7 days</li>
                      <li><strong>Trending:</strong> High-engagement demos gaining traction</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Perfect For:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Client presentations and demos</li>
                      <li>• Finding proven successful concepts</li>
                      <li>• Discovering what's new and trending</li>
                      <li>• Quick access to top-performing demos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-800">
                  <Heart className="w-6 h-6" />
                  Favorites Tab
                </CardTitle>
                <CardDescription className="text-pink-700">Your personal collection of bookmarked demos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-pink-800 mb-2">Smart Organization:</h4>
                    <ul className="text-sm text-pink-700 space-y-1">
                      <li><strong>Recent:</strong> Latest favorited demos</li>
                      <li><strong>Popular:</strong> Sorted by view count</li>
                      <li><strong>Alphabetical:</strong> Easy name-based browsing</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-pink-800 mb-2">Use Cases:</h4>
                    <ul className="text-sm text-pink-700 space-y-1">
                      <li>• Build custom demo playlists for clients</li>
                      <li>• Quick access to your go-to demos</li>
                      <li>• Save demos for specific verticals</li>
                      <li>• Personal curation for presentations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Lightbulb className="w-5 h-5" />
                Pro Tips for Maximum Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-800">For Client Meetings:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Start with Featured demos for proven impact</li>
                    <li>• Use Trending to show cutting-edge capabilities</li>
                    <li>• Favorite relevant demos before the meeting</li>
                    <li>• Check view counts to gauge popularity</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-800">For Research & Prep:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Browse Recent for latest innovations</li>
                    <li>• Build industry-specific favorite collections</li>
                    <li>• Track demo performance over time</li>
                    <li>• Use filters to find niche technologies</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Catalog Tab - Complete Demo Discovery",
      icon: <Search className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-black mb-2">Your Complete Demo Library</h3>
            <p className="text-gray-600">Advanced search, filtering, and browsing capabilities</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Search className="w-6 h-6" />
                  Smart Search Engine
                </CardTitle>
                <CardDescription className="text-blue-700">Intelligent search with auto-suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Search Capabilities:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Search titles, descriptions, owners</li>
                      <li>• Auto-complete suggestions</li>
                      <li>• Search history tracking</li>
                      <li>• Keyboard shortcuts (⌘+K)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Quick Examples:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>"AI task" → Task management demos</li>
                      <li>"React" → React-based applications</li>
                      <li>"Jeremy" → Demos by Jeremy</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Filter className="w-6 h-6" />
                  Advanced Filtering
                </CardTitle>
                <CardDescription className="text-green-700">Powerful filtering and organization tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Filter Options:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Technology tags (AI, React, etc.)</li>
                      <li>• View count ranges</li>
                      <li>• Creation date ranges</li>
                      <li>• Featured status</li>
                      <li>• Owner/creator</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">View Modes:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Grid view for visual browsing</li>
                      <li>• List view for detailed information</li>
                      <li>• Sort by popularity, date, name</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Eye className="w-6 h-6" />
                  Demo Actions
                </CardTitle>
                <CardDescription className="text-purple-700">Quick access to demos and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Quick Actions:</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• <strong>Try App:</strong> Launch live demo</li>
                      <li>• <strong>Heart:</strong> Add/remove from favorites</li>
                      <li>• <strong>Menu:</strong> Edit, feature, or delete (admin)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Resource Links:</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Excalidraw diagrams and wireframes</li>
                      <li>• Supabase backend and database</li>
                      <li>• GitHub repositories and code</li>
                      <li>• Screenshots and video overviews</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Target className="w-5 h-5" />
                Catalog Power User Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-yellow-800">Discovery Strategies:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Use popular tags to explore trends</li>
                    <li>• Sort by views to find proven demos</li>
                    <li>• Check recent additions for innovation</li>
                    <li>• Follow prolific creators</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-yellow-800">Efficiency Tips:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Use ⌘+K keyboard shortcut</li>
                    <li>• Save frequent searches in history</li>
                    <li>• Combine search terms with filters</li>
                    <li>• Switch between grid/list as needed</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-yellow-800">Client Prep:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Filter by client's tech stack</li>
                    <li>• Check demo health scores</li>
                    <li>• Review resource links beforehand</li>
                    <li>• Favorite relevant demos for easy access</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Analytics & Admin Tabs - Insights & Management",
      icon: <BarChart3 className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-black mb-2">Performance Insights & System Management</h3>
            <p className="text-gray-600">Data-driven decisions and administrative control</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <BarChart3 className="w-6 h-6" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription className="text-blue-700">Comprehensive performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Key Metrics:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Total demos and cumulative views</li>
                      <li>• Engagement scores and health metrics</li>
                      <li>• Growth trends and performance tracking</li>
                      <li>• Featured demo impact analysis</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Interactive Charts:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Top-performing demos by views</li>
                      <li>• Technology trend analysis</li>
                      <li>• Creator leaderboards and contributions</li>
                      <li>• Real-time activity feed</li>
                      <li>• Demo health scoring system</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Use Analytics To:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Identify most successful demo concepts</li>
                      <li>• Track which technologies are trending</li>
                      <li>• Monitor team engagement and usage</li>
                      <li>• Make data-driven demo selections</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {isAdmin && (
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <Shield className="w-6 h-6" />
                  Admin Dashboard
                  <Badge className="bg-red-100 text-red-800 text-xs">Admin Only</Badge>
                </CardTitle>
                <CardDescription className="text-red-700">Complete system management and control</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Demo Management:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Add new demos with rich metadata</li>
                      <li>• Edit existing demo information</li>
                      <li>• Feature/unfeature demo curation</li>
                      <li>• Delete outdated or irrelevant demos</li>
                      <li>• Upload screenshots and video overviews</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">User Management:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Create and invite new team members</li>
                      <li>• Manage user roles and permissions</li>
                      <li>• Monitor user activity and engagement</li>
                      <li>• View login history and statistics</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">System Monitoring:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• System health and performance metrics</li>
                      <li>• Database and security status</li>
                      <li>• Export data and generate reports</li>
                      <li>• Configure app settings and features</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
            
            {!isAdmin && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Plus className="w-6 h-6" />
                  Add Demo Tab
                </CardTitle>
                <CardDescription className="text-green-700">Contribute new demos to the catalog (Admin access required)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Demo Submission:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Rich form with title, description, tags</li>
                      <li>• Link to live demos and resources</li>
                      <li>• Screenshot and video upload</li>
                      <li>• Owner attribution and metadata</li>
                      <li>• Feature designation for curation</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Admin Access Required</h4>
                    <p className="text-sm text-yellow-700">
                      You need admin privileges to add new demos. Contact your system administrator to request access.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
          
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Sparkles className="w-5 h-5" />
                Advanced Features & Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-800">For Sales Professionals:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li><strong>1. Research Phase:</strong> Use Analytics to identify top performers</li>
                    <li><strong>2. Discovery:</strong> Search Catalog by client's tech stack</li>
                    <li><strong>3. Curation:</strong> Build Favorites collection for meeting</li>
                    <li><strong>4. Presentation:</strong> Use Featured demos for maximum impact</li>
                    <li><strong>5. Follow-up:</strong> Track engagement from your demos</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-800">For Content Managers:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li><strong>1. Content Planning:</strong> Use Analytics to identify gaps</li>
                    <li><strong>2. Demo Creation:</strong> Add demos via Admin interface</li>
                    <li><strong>3. Curation:</strong> Feature high-quality demos</li>
                    <li><strong>4. Optimization:</strong> Monitor performance and iterate</li>
                    <li><strong>5. Team Management:</strong> Control access and permissions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
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
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-lg shadow-lg [&>button.absolute]:bg-white [&>button.absolute]:text-black [&>button.absolute:hover]:bg-gray-100 [&>button.absolute]:rounded-md">
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