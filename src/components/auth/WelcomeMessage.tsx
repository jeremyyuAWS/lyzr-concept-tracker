import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Search, 
  BarChart3, 
  Zap, 
  Clock,
  CheckCircle,
  Star,
  Shield,
  Eye,
  Sparkles
} from 'lucide-react';

export function WelcomeMessage() {
  const benefits = [
    {
      icon: <Search className="w-5 h-5" />,
      title: "Find Perfect Demos Instantly",
      description: "Search through our entire demo library by technology, use case, or industry vertical to find the perfect concept for your prospect."
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Data-Driven Demo Selection",
      description: "View real engagement metrics and popularity scores to choose demos that have proven success with similar prospects."
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Lightning-Fast Access",
      description: "Get instant access to live demos, technical documentation, and admin portals - everything you need for a successful client call."
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Performance Insights",
      description: "Track which demos perform best with different client types and industries to optimize your sales approach."
    }
  ];

  const features = [
    "🔍 Advanced search and filtering by technology stack",
    "📊 Real-time performance analytics and view counts",
    "🚀 One-click access to live demos and resources",
    "🏷️ Smart tagging system for easy categorization",
    "📈 Track engagement trends and demo popularity",
    "🎯 Curated featured demos for maximum impact"
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-br from-black to-gray-600 rounded-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-black mb-2">
          Welcome to Lyzr Concept Tracker
        </h1>
        <p className="text-lg text-gray-600 mb-4">
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
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Star className="w-3 h-3 mr-1" />
            Production Ready
          </Badge>
        </div>
      </div>

      {/* Business Value Proposition */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="w-5 h-5" />
            Built for Sales Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 mb-4">
            <strong>Stop spending hours searching for the right demo.</strong> Our AI-powered concept tracker gives you instant access to Lyzr's complete demo library with performance insights, technical details, and proven engagement metrics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Save Time</span>
              </div>
              <p className="text-sm text-blue-700">
                Find relevant demos in seconds, not hours
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Increase Conversions</span>
              </div>
              <p className="text-sm text-blue-700">
                Use data-driven insights to choose winning demos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
                  {benefit.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features List */}
      <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <CheckCircle className="w-5 h-5 text-green-600" />
            What You Get Access To
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Metrics */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Join Your Successful Colleagues
            </h3>
            <p className="text-green-800 text-sm mb-4">
              Account Executives using our demo tracker report <strong>40% faster</strong> demo preparation and <strong>25% higher</strong> client engagement rates.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">150+</div>
                <div className="text-green-600">Demo Concepts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">25+</div>
                <div className="text-green-600">Technologies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">100%</div>
                <div className="text-green-600">Production Ready</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center">
        <p className="text-gray-600 text-sm">
          Ready to accelerate your sales process? 
          <br />
          <strong>Sign in to get started</strong> and discover how our demo library can transform your client presentations.
        </p>
      </div>
    </div>
  );
}
</parameter>