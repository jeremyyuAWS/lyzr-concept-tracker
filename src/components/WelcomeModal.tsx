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
  Sparkles,
  Zap,
  Grid,
  List,
  Folder,
  FolderPlus,
  TrendingUp,
  Clock,
  MousePointer,
  Keyboard,
  Activity,
  Play,
  Image,
  Tag,
  Upload,
  Settings,
  Download
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
      icon: <Sparkles className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/lyzr-logo-cut.png" 
                alt="Lyzr Logo" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-black mb-3">Your AI Demo Command Center</h2>
            <p className="text-gray-700 text-lg mb-6">
              The fastest way to find, organize, and present AI concept demos that win deals
            </p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Badge className={`text-sm px-3 py-1 ${isAdmin ? 'bg-black text-white' : 'bg-white text-black border-2 border-black'}`}>
                {isAdmin ? (
                  <>
                    <Crown className="w-4 h-4 mr-1" />
                    Admin Access
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-1" />
                    Team Member
                  </>
                )}
              </Badge>
              <Badge className="bg-white text-black border-2 border-gray-300">
                {userProfile?.display_name || userProfile?.email || 'User'}
              </Badge>
            </div>
          </div>

          <Card className="bg-white border-2 border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black text-xl">
                <Target className="w-6 h-6" />
                Why This Matters for Your Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-black text-lg">🎯 For Sales & Account Teams:</h4>
                  <ul className="space-y-2 text-black">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                      <span><strong>Find the perfect demo in seconds</strong> - No more digging through folders or Slack messages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                      <span><strong>Use proven winners</strong> - See view counts and engagement data to pick demos that convert</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                      <span><strong>Instant access to resources</strong> - One click to demo, docs, and technical details</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-bold text-black text-lg">⚡ For Internal Teams:</h4>
                  <ul className="space-y-2 text-black">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                      <span><strong>Central knowledge hub</strong> - All demo concepts in one searchable location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                      <span><strong>Performance insights</strong> - Track what's working and optimize your demos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                      <span><strong>Streamlined workflow</strong> - From discovery to presentation in minutes</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border-2 border-gray-300 hover:border-black transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-base flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Featured Demos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-black text-sm">Hand-picked premium demos that consistently win deals</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-gray-300 hover:border-black transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-base flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Smart Favorites
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-black text-sm">Organize demos into folders for quick client-specific access</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-gray-300 hover:border-black transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Live Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-black text-sm">Real-time engagement data to choose your best-performing demos</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-2 border-gray-300 hover:border-black transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-base flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Advanced Search
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-black text-sm">Find exactly what you need with intelligent search and filtering</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Featured & Favorites - Your Power Tools",
      icon: <Star className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-black mb-3">Start Here - Maximum Impact, Minimum Time</h3>
            <p className="text-gray-700 text-lg">These two tabs are designed to get you the best demos fastest</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-2 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black text-xl">
                  <Star className="w-6 h-6" />
                  Featured Tab - The Winners
                </CardTitle>
                <CardDescription className="text-gray-700 text-base">Premium curated demos that consistently close deals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">🎯 Three Smart Filters:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-black text-white">Featured</Badge>
                        <span className="text-black text-sm">Admin-curated best performers</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-white text-black border-2 border-black">Recent</Badge>
                        <span className="text-black text-sm">New demos from last 7 days</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-white text-black border-2 border-gray-400">Trending</Badge>
                        <span className="text-black text-sm">High-engagement rising stars</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">🚀 Perfect For:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>• <strong>Client presentations</strong> - Demos proven to impress</li>
                      <li>• <strong>High-stakes meetings</strong> - Our absolute best work</li>
                      <li>• <strong>Quick wins</strong> - When you need impact fast</li>
                      <li>• <strong>Competitive demos</strong> - Show cutting-edge capabilities</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black text-xl">
                  <Heart className="w-6 h-6" />
                  Favorites Tab - Your Personal Arsenal
                </CardTitle>
                <CardDescription className="text-gray-700 text-base">Build custom demo collections organized your way</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">📁 Smart Organization:</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-black" />
                        <span className="text-black text-sm"><strong>Create folders</strong> for different clients, industries, or use cases</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MousePointer className="w-5 h-5 text-black" />
                        <span className="text-black text-sm"><strong>Drag & organize</strong> demos between folders with ease</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Search className="w-5 h-5 text-black" />
                        <span className="text-black text-sm"><strong>Search within favorites</strong> to find specific demos quickly</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">💡 Pro Usage Examples:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>• <strong>"Enterprise Clients"</strong> folder with complex demos</li>
                      <li>• <strong>"Quick Wins"</strong> folder for 5-minute presentations</li>
                      <li>• <strong>"Fintech"</strong> folder for financial services prospects</li>
                      <li>• <strong>"Technical Deep Dives"</strong> for developer audiences</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-gray-50 border-2 border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black text-xl">
                <Zap className="w-6 h-6" />
                Workflow for Maximum Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border-2 border-black">
                    <h4 className="font-bold text-black text-center">1. DISCOVER</h4>
                  </div>
                  <ul className="text-black text-sm space-y-1">
                    <li>• Browse Featured for proven winners</li>
                    <li>• Check Recent for latest innovations</li>
                    <li>• Review engagement metrics</li>
                    <li>• Read descriptions and use cases</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border-2 border-black">
                    <h4 className="font-bold text-black text-center">2. ORGANIZE</h4>
                  </div>
                  <ul className="text-black text-sm space-y-1">
                    <li>• Heart icon to add to favorites</li>
                    <li>• Create client-specific folders</li>
                    <li>• Move demos to relevant folders</li>
                    <li>• Build presentation playlists</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border-2 border-black">
                    <h4 className="font-bold text-black text-center">3. PRESENT</h4>
                  </div>
                  <ul className="text-black text-sm space-y-1">
                    <li>• One-click access to live demos</li>
                    <li>• Open technical documentation</li>
                    <li>• View screenshots and videos</li>
                    <li>• Track demo performance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Catalog Tab - The Complete Library",
      icon: <Search className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-black mb-3">Your Complete Demo Discovery Engine</h3>
            <p className="text-gray-700 text-lg">Advanced search, filtering, and browsing for comprehensive demo exploration</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white border-2 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black text-lg">
                  <Search className="w-6 h-6" />
                  Intelligent Search
                </CardTitle>
                <CardDescription className="text-gray-700">Find demos with AI-powered suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <h4 className="font-bold text-black mb-2">🔍 Search Capabilities:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>• Search titles, descriptions, creators</li>
                      <li>• Auto-complete with smart suggestions</li>
                      <li>• Search history tracking</li>
                      <li>• Keyboard shortcut: <kbd className="bg-white border px-1 rounded">⌘+K</kbd></li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <h4 className="font-bold text-black mb-2">💡 Search Examples:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li><code className="bg-white px-1 rounded">"AI task"</code> → Task management demos</li>
                      <li><code className="bg-white px-1 rounded">"React"</code> → React-based applications</li>
                      <li><code className="bg-white px-1 rounded">"Jeremy"</code> → Demos by Jeremy</li>
                      <li><code className="bg-white px-1 rounded">"analytics"</code> → Dashboard demos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black text-lg">
                  <Filter className="w-6 h-6" />
                  Advanced Filtering
                </CardTitle>
                <CardDescription className="text-gray-700">Powerful filtering and organization tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <h4 className="font-bold text-black mb-2">🎛️ Filter Options:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>• <strong>Technology tags</strong> (AI, React, etc.)</li>
                      <li>• <strong>View count ranges</strong> (popular vs new)</li>
                      <li>• <strong>Creation dates</strong> (recent vs established)</li>
                      <li>• <strong>Featured status</strong> (curated quality)</li>
                      <li>• <strong>Creator/owner</strong> (team member)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <h4 className="font-bold text-black mb-2">📊 View Modes:</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Grid className="w-4 h-4" />
                      <span className="text-black text-sm"><strong>Grid view</strong> - Visual browsing with screenshots</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      <span className="text-black text-sm"><strong>List view</strong> - Detailed information focus</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black text-lg">
                  <Eye className="w-6 h-6" />
                  Demo Actions
                </CardTitle>
                <CardDescription className="text-gray-700">Quick access to demos and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <h4 className="font-bold text-black mb-2">⚡ Quick Actions:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>• <strong>Try App:</strong> Launch live demo (tracked)</li>
                      <li>• <strong>Heart:</strong> Add/remove from favorites</li>
                      <li>• <strong>Menu:</strong> Edit, feature, delete (admin)</li>
                      <li>• <strong>Screenshots:</strong> Click to view full-size</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <h4 className="font-bold text-black mb-2">🔗 Resource Links:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>• <FileText className="w-3 h-3 inline mr-1" />Excalidraw diagrams and wireframes</li>
                      <li>• <Database className="w-3 h-3 inline mr-1" />Supabase backend and database</li>
                      <li>• <Shield className="w-3 h-3 inline mr-1" />GitHub repositories and code</li>
                      <li>• <Play className="w-3 h-3 inline mr-1" />Video overviews and demos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-gray-50 border-2 border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black text-xl">
                <Target className="w-6 h-6" />
                Catalog Power User Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border-2 border-black">
                    <h4 className="font-bold text-black text-center">DISCOVERY</h4>
                  </div>
                  <ul className="text-black text-sm space-y-1">
                    <li>• Use popular tags to explore trends</li>
                    <li>• Sort by views to find proven demos</li>
                    <li>• Check recent additions for innovation</li>
                    <li>• Follow prolific creators for quality</li>
                    <li>• Combine multiple filters for precision</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border-2 border-black">
                    <h4 className="font-bold text-black text-center">EFFICIENCY</h4>
                  </div>
                  <ul className="text-black text-sm space-y-1">
                    <li>• Use <kbd className="bg-white border px-1 rounded">⌘+K</kbd> keyboard shortcut</li>
                    <li>• Save frequent searches in history</li>
                    <li>• Switch between grid/list as needed</li>
                    <li>• Bookmark high-value demos</li>
                    <li>• Use engagement data for selection</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border-2 border-black">
                    <h4 className="font-bold text-black text-center">CLIENT PREP</h4>
                  </div>
                  <ul className="text-black text-sm space-y-1">
                    <li>• Filter by client's tech stack</li>
                    <li>• Review screenshots beforehand</li>
                    <li>• Check all resource links work</li>
                    <li>• Favorite relevant demos for easy access</li>
                    <li>• Note view counts for credibility</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Analytics & Management - Data-Driven Decisions",
      icon: <BarChart3 className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-black mb-3">Performance Intelligence & System Control</h3>
            <p className="text-gray-700 text-lg">Make informed decisions with real-time data and comprehensive management tools</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-2 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black text-xl">
                  <BarChart3 className="w-6 h-6" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription className="text-gray-700 text-base">Comprehensive performance metrics and engagement insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">📊 Key Metrics Tracked:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-black" />
                        <span className="text-black">Total demo views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-black" />
                        <span className="text-black">Demo count & growth</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-black" />
                        <span className="text-black">Engagement rates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-black" />
                        <span className="text-black">Featured impact</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">📈 Interactive Charts:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>• <strong>Top performers</strong> - Demos ranked by engagement</li>
                      <li>• <strong>Technology trends</strong> - Popular tags and frameworks</li>
                      <li>• <strong>Creator leaderboards</strong> - Most active contributors</li>
                      <li>• <strong>Real-time activity</strong> - Live user interactions</li>
                      <li>• <strong>Health scoring</strong> - Demo quality assessments</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">💡 Use Analytics To:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>• Identify your most successful demo concepts</li>
                      <li>• Track which technologies are trending</li>
                      <li>• Monitor team engagement and platform usage</li>
                      <li>• Make data-driven demo selections for clients</li>
                      <li>• Optimize demo portfolios based on performance</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-2 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black text-xl">
                  {isAdmin ? (
                    <>
                      <Shield className="w-6 h-6" />
                      Admin Management
                      <Badge className="bg-black text-white text-xs">Admin Only</Badge>
                    </>
                  ) : (
                    <>
                      <Plus className="w-6 h-6" />
                      Demo Contributions
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-700 text-base">
                  {isAdmin ? 'Complete system management and control' : 'How to contribute new demos (admin access required)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {isAdmin ? (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-black mb-3">🛠️ Demo Management:</h4>
                        <ul className="text-black text-sm space-y-1">
                          <li>• <strong>Add new demos</strong> with rich metadata and screenshots</li>
                          <li>• <strong>Edit existing demos</strong> - update links, descriptions, tags</li>
                          <li>• <strong>Feature/unfeature demos</strong> for curation and highlighting</li>
                          <li>• <strong>Delete outdated demos</strong> to keep catalog clean</li>
                          <li>• <strong>Upload media</strong> - screenshots, videos, documentation</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-black mb-3">👥 User Management:</h4>
                        <ul className="text-black text-sm space-y-1">
                          <li>• <strong>Create team accounts</strong> and send invitations</li>
                          <li>• <strong>Manage roles</strong> - Admin, User permissions</li>
                          <li>• <strong>Monitor activity</strong> - Login history and engagement</li>
                          <li>• <strong>View user statistics</strong> - Active users, new signups</li>
                          <li>• <strong>System monitoring</strong> - Health checks and performance</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-black mb-3">⚙️ System Controls:</h4>
                        <ul className="text-black text-sm space-y-1">
                          <li>• <strong>Export data</strong> - Generate reports and backups</li>
                          <li>• <strong>Configure settings</strong> - System preferences and features</li>
                          <li>• <strong>Security monitoring</strong> - Access logs and permissions</li>
                          <li>• <strong>Performance optimization</strong> - Database and system health</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-black mb-3">📝 Demo Submission Process:</h4>
                        <ul className="text-black text-sm space-y-1">
                          <li>• <strong>Contact admin</strong> to request submission access</li>
                          <li>• <strong>Prepare demo info</strong> - title, description, tags, links</li>
                          <li>• <strong>Gather resources</strong> - screenshots, documentation, URLs</li>
                          <li>• <strong>Submit for review</strong> - Admin validates and publishes</li>
                          <li>• <strong>Track performance</strong> - Monitor engagement post-launch</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-400">
                        <h4 className="font-bold text-black mb-2">⚠️ Admin Access Required</h4>
                        <p className="text-black text-sm">
                          To add new demos or access management features, you need admin privileges. 
                          Contact your system administrator to request elevated access.
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <h4 className="font-bold text-black mb-3">🎯 What Makes a Great Demo Submission:</h4>
                        <ul className="text-black text-sm space-y-1">
                          <li>• <strong>Clear value proposition</strong> - Obvious business benefit</li>
                          <li>• <strong>Professional screenshots</strong> - High-quality visuals</li>
                          <li>• <strong>Comprehensive tags</strong> - Easy discovery and filtering</li>
                          <li>• <strong>Working links</strong> - All resources accessible and current</li>
                          <li>• <strong>Detailed description</strong> - Context and use cases</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-gray-50 border-2 border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black text-xl">
                <Activity className="w-6 h-6" />
                Engagement Tracking & Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-black text-lg">📈 What Gets Tracked:</h4>
                  <div className="bg-white p-3 rounded-lg border">
                    <ul className="text-black text-sm space-y-2">
                      <li><strong>Demo Views:</strong> How many people visit each demo</li>
                      <li><strong>Try App Clicks:</strong> Actual demo launches and usage</li>
                      <li><strong>Favorites Added:</strong> Which demos get bookmarked</li>
                      <li><strong>Search Queries:</strong> What people are looking for</li>
                      <li><strong>Time on Page:</strong> Engagement depth and interest</li>
                      <li><strong>Resource Clicks:</strong> Documentation and code access</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-bold text-black text-lg">🎯 How to Use This Data:</h4>
                  <div className="bg-white p-3 rounded-lg border">
                    <ul className="text-black text-sm space-y-2">
                      <li><strong>Choose winners:</strong> Pick demos with high view counts</li>
                      <li><strong>Identify trends:</strong> See which technologies are hot</li>
                      <li><strong>Optimize content:</strong> Improve low-performing demos</li>
                      <li><strong>Plan development:</strong> Build more of what works</li>
                      <li><strong>Measure success:</strong> Track your demo's impact</li>
                      <li><strong>Client insights:</strong> Understand user preferences</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Pro Tips & Advanced Features",
      icon: <Lightbulb className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-black mb-3">Master the Platform - Advanced Workflows</h3>
            <p className="text-gray-700 text-lg">Become a power user with these expert tips and hidden features</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-2 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black text-xl">
                  <Keyboard className="w-6 h-6" />
                  Keyboard Shortcuts & Speed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">⌨️ Essential Shortcuts:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-black text-sm">Open search</span>
                        <kbd className="bg-white border px-2 py-1 rounded text-xs">⌘ + K</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black text-sm">Close modals</span>
                        <kbd className="bg-white border px-2 py-1 rounded text-xs">Escape</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-black text-sm">Submit search</span>
                        <kbd className="bg-white border px-2 py-1 rounded text-xs">Enter</kbd>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">🚀 Speed Tips:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>• Use search history for repeated queries</li>
                      <li>• Bookmark frequently used tag filters</li>
                      <li>• Switch between grid/list views for different tasks</li>
                      <li>• Right-click demo links to open in new tabs</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-black">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black text-xl">
                  <Target className="w-6 h-6" />
                  Client Meeting Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">📋 Pre-Meeting Checklist:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>✅ Research client's tech stack and pain points</li>
                      <li>✅ Filter demos by relevant technologies</li>
                      <li>✅ Check view counts for proven performers</li>
                      <li>✅ Create client-specific favorites folder</li>
                      <li>✅ Test all demo links and resources</li>
                      <li>✅ Review screenshots and prepare talking points</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-bold text-black mb-3">🎯 During Meetings:</h4>
                    <ul className="text-black text-sm space-y-1">
                      <li>• Use your pre-organized favorites folder</li>
                      <li>• Show engagement metrics for credibility</li>
                      <li>• Open technical resources for deeper dives</li>
                      <li>• Track which demos resonate most</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-50 border-2 border-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black text-xl">
                <Sparkles className="w-6 h-6" />
                Advanced Organization Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border-2 border-black">
                    <h4 className="font-bold text-black text-center">BY INDUSTRY</h4>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <ul className="text-black text-sm space-y-1">
                      <li>• "Healthcare AI" folder</li>
                      <li>• "Financial Services" folder</li>
                      <li>• "E-commerce & Retail" folder</li>
                      <li>• "Manufacturing" folder</li>
                      <li>• "Education Tech" folder</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border-2 border-black">
                    <h4 className="font-bold text-black text-center">BY USE CASE</h4>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <ul className="text-black text-sm space-y-1">
                      <li>• "Quick Wins (5 min)" folder</li>
                      <li>• "Technical Deep Dives" folder</li>
                      <li>• "Executive Presentations" folder</li>
                      <li>• "Developer Demos" folder</li>
                      <li>• "ROI Calculators" folder</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border-2 border-black">
                    <h4 className="font-bold text-black text-center">BY COMPLEXITY</h4>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <ul className="text-black text-sm space-y-1">
                      <li>• "Simple & Clean" folder</li>
                      <li>• "Feature Rich" folder</li>
                      <li>• "Enterprise Grade" folder</li>
                      <li>• "Proof of Concepts" folder</li>
                      <li>• "Production Ready" folder</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black text-xl">
                <CheckCircle className="w-6 h-6" />
                Success Metrics & ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-black">📊 Track Your Success:</h4>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <ul className="text-black text-sm space-y-1">
                      <li>• Monitor which demos lead to meetings</li>
                      <li>• Track conversion rates by demo type</li>
                      <li>• Note client feedback and preferences</li>
                      <li>• Measure time saved in demo prep</li>
                      <li>• Calculate increased meeting success rates</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-bold text-black">🎯 Platform ROI Benefits:</h4>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <ul className="text-black text-sm space-y-1">
                      <li>• <strong>50%+ faster</strong> demo discovery and prep</li>
                      <li>• <strong>Higher win rates</strong> with proven demos</li>
                      <li>• <strong>Better presentations</strong> with comprehensive resources</li>
                      <li>• <strong>Team knowledge sharing</strong> - everyone benefits</li>
                      <li>• <strong>Data-driven decisions</strong> - no more guessing</li>
                    </ul>
                  </div>
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
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-7xl max-h-[90vh] overflow-y-auto bg-white p-8 rounded-lg shadow-lg border-2 border-black [&>button.absolute]:bg-white [&>button.absolute]:text-black [&>button.absolute:hover]:bg-gray-100 [&>button.absolute]:rounded-md [&>button.absolute]:border [&>button.absolute]:border-gray-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-black text-2xl font-bold">
            <div className="text-black">
              {currentStepData.icon}
            </div>
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between border-t-2 border-gray-200 pt-4">
            <div className="flex items-center gap-3">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    index === currentStep 
                      ? 'bg-black border-black' 
                      : index < currentStep 
                        ? 'bg-gray-400 border-gray-400' 
                        : 'bg-white border-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded border">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Step content */}
          <div className="min-h-[500px] w-full">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200 w-full">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-black border-2 border-gray-300"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-3">
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={onClose}
                  className="bg-black hover:bg-gray-800 text-white flex items-center gap-2 border-2 border-black"
                >
                  <CheckCircle className="w-4 h-4" />
                  Start Using the Platform
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="bg-black hover:bg-gray-800 text-white flex items-center gap-2 border-2 border-black"
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