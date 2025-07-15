import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Users, 
  Search, 
  BarChart3, 
  CheckCircle,
  Star,
  Shield,
  Sparkles,
  Clock,
  TrendingUp,
  Zap,
  Activity
} from 'lucide-react';

export function WelcomeMessage() {
  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="p-3 bg-gradient-to-br from-black to-gray-600 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-black mb-2">
          Welcome to Lyzr Concept Tracker
        </h1>
        <p className="text-gray-600 text-sm mb-3">
          Your competitive advantage in AI demo presentations
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Target className="w-3 h-3 mr-1" />
            For Account Executives
          </Badge>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Shield className="w-3 h-3 mr-1" />
            Internal Tool
          </Badge>
        </div>
      </div>

      {/* Key Benefits - 4 tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                <Search className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-black text-sm mb-1">Find Perfect Demos</h3>
                <p className="text-xs text-gray-600">Search by technology, use case, or industry to find the right concept for your prospect.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-black text-sm mb-1">Data-Driven Selection</h3>
                <p className="text-xs text-gray-600">View engagement metrics and popularity scores to choose proven successful demos.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-black text-sm mb-1">Instant Access</h3>
                <p className="text-xs text-gray-600">Quick links to live demos, technical docs, and resources.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-black text-sm mb-1">Track Performance</h3>
                <p className="text-xs text-gray-600">Monitor demo engagement and success rates.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features List */}
      <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-black text-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            What You Get Access To
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
              <span className="text-xs text-gray-700">Advanced search and filtering</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
              <span className="text-xs text-gray-700">Real-time performance analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
              <span className="text-xs text-gray-700">One-click access to live demos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
              <span className="text-xs text-gray-700">Smart tagging and categorization</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center">
        <p className="text-gray-600 text-sm">
          Ready to accelerate your sales process? 
          <br />
          <strong>Sign in to get started</strong> and discover how our demo library can transform your presentations.
        </p>
      </div>
    </div>
  );
}