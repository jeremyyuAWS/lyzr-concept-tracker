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
  TrendingUp
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
        <h1 className="text-2xl font-bold text-black mb-2">
          Welcome to Lyzr Concept Tracker
        </h1>
        <p className="text-gray-600 mb-3">
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

      {/* Business Value */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
            <Users className="w-5 h-5" />
            Built for Sales Success
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-blue-800 text-sm mb-3">
            <strong>Stop spending hours searching for the right demo.</strong> Get instant access to Lyzr's complete demo library with performance insights and technical details.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/60 p-3 rounded-lg">
              <div className="text-xl font-bold text-blue-700">150+</div>
              <div className="text-xs text-blue-600">Demo Concepts</div>
            </div>
            <div className="bg-white/60 p-3 rounded-lg">
              <div className="text-xl font-bold text-blue-700">25+</div>
              <div className="text-xs text-blue-600">Technologies</div>
            </div>
            <div className="bg-white/60 p-3 rounded-lg">
              <div className="text-xl font-bold text-blue-700">100%</div>
              <div className="text-xs text-blue-600">Production Ready</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
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

      {/* Success Message */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-green-600" />
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-900 mb-2">
              Join Your Successful Colleagues
            </h3>
            <p className="text-green-800 text-sm">
              AEs using our demo tracker report <strong>40% faster</strong> demo preparation and <strong>25% higher</strong> engagement rates.
            </p>
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
</parameter>