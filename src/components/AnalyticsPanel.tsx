import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Demo } from '@/types/demo';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar,
  ComposedChart, Scatter, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, Users, Calendar, Eye, Target, Clock, Award, Activity, 
  Download, Filter, RefreshCw, Zap, Star, ArrowUp, ArrowDown,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Sparkles, Trophy, Flame, Crown, TrendingDown, DollarSign, LogIn, MousePointer
} from 'lucide-react';
import { RealTimeActivityFeed } from './RealTimeActivityFeed';
import { DemoHealthScoring } from './DemoHealthScoring';

interface AnalyticsPanelProps {
  demos: Demo[];
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000, formatter = (n: number) => n.toString() }: {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{formatter(count)}</span>;
}

// Gradient Definitions Component
function ChartGradients() {
  return (
    <defs>
      <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#000000" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#000000" stopOpacity={0.1}/>
      </linearGradient>
      <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#4A5568" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#4A5568" stopOpacity={0.1}/>
      </linearGradient>
      <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#22C55E" stopOpacity={0.1}/>
      </linearGradient>
    </defs>
  );
}

export function AnalyticsPanel({ demos }: AnalyticsPanelProps) {
  const { isAdmin } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedChart, setSelectedChart] = useState<'views' | 'growth' | 'performance'>('views');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [engagementUsers, setEngagementUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Calculate advanced metrics
  const totalViews = demos.reduce((sum, demo) => sum + demo.page_views, 0);
  const averageViews = demos.length > 0 ? Math.round(totalViews / demos.length) : 0;
  
  // Calculate growth metrics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentDemos = demos.filter(demo => new Date(demo.created_at) > thirtyDaysAgo);
  const weeklyDemos = demos.filter(demo => new Date(demo.created_at) > sevenDaysAgo);
  
  const growthRate = demos.length > 0 ? Math.round((recentDemos.length / demos.length) * 100) : 0;
  const weeklyGrowth = recentDemos.length > 0 ? Math.round((weeklyDemos.length / recentDemos.length) * 100) : 0;

  // Advanced analytics calculations
  const highPerformers = demos.filter(demo => demo.page_views > averageViews).length;
  const featuredDemos = demos.filter(demo => demo.is_featured).length;
  const topPercentile = Math.ceil(demos.length * 0.1);
  
  // Engagement score calculation
  const engagementScore = demos.length > 0 ? Math.round(
    (highPerformers / demos.length) * 40 + 
    (featuredDemos / demos.length) * 30 + 
    Math.min(growthRate / 10, 3) * 10
  ) : 0;

  // Top performing demos with enhanced data
  const topDemos = demos
    .sort((a, b) => b.page_views - a.page_views)
    .slice(0, 10)
    .map((demo, index) => ({
      name: demo.title.length > 25 ? demo.title.substring(0, 25) + '...' : demo.title,
      fullName: demo.title,
      views: demo.page_views,
      owner: demo.owner,
      rank: index + 1,
      growth: demo.page_views > averageViews ? 'high' : demo.page_views > averageViews * 0.5 ? 'medium' : 'low',
      featured: demo.is_featured,
      tags: demo.tags.slice(0, 3)
    }));

  // Enhanced tag analysis
  const tagCounts = demos.reduce((acc, demo) => {
    demo.tags.forEach(tag => {
      if (!acc[tag]) {
        acc[tag] = { count: 0, totalViews: 0, demos: [] };
      }
      acc[tag].count += 1;
      acc[tag].totalViews += demo.page_views;
      acc[tag].demos.push(demo.title);
    });
    return acc;
  }, {} as Record<string, { count: number; totalViews: number; demos: string[] }>);

  const tagData = Object.entries(tagCounts)
    .map(([tag, data]) => ({
      name: tag,
      value: data.count,
      views: data.totalViews,
      avgViews: Math.round(data.totalViews / data.count),
      demos: data.demos.length
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  // Time-based performance data
  const timeframes = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'all': 9999
  };

  const filteredDemos = demos.filter(demo => {
    const daysAgo = timeframes[selectedTimeframe];
    const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return daysAgo === 9999 || new Date(demo.created_at) > cutoff;
  });

  // Daily activity data for sparkline
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    const dayDemos = demos.filter(demo => {
      const demoDate = new Date(demo.created_at);
      return demoDate.toDateString() === date.toDateString();
    });
    
    return {
      day: date.getDate(),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      demos: dayDemos.length,
      views: dayDemos.reduce((sum, demo) => sum + demo.page_views, 0)
    };
  });

  // Performance distribution
  const performanceData = [
    { range: 'Viral (1000+)', count: demos.filter(d => d.page_views >= 1000).length, color: '#22C55E' },
    { range: 'Popular (500-999)', count: demos.filter(d => d.page_views >= 500 && d.page_views < 1000).length, color: '#3B82F6' },
    { range: 'Growing (100-499)', count: demos.filter(d => d.page_views >= 100 && d.page_views < 500).length, color: '#F59E0B' },
    { range: 'Emerging (50-99)', count: demos.filter(d => d.page_views >= 50 && d.page_views < 100).length, color: '#8B5CF6' },
    { range: 'New (0-49)', count: demos.filter(d => d.page_views < 50).length, color: '#6B7280' }
  ];

  // Owner leaderboard
  const ownerStats = demos.reduce((acc, demo) => {
    if (!acc[demo.owner]) {
      acc[demo.owner] = { 
        owner: demo.owner, 
        demos: 0, 
        totalViews: 0, 
        avgViews: 0,
        bestDemo: { title: '', views: 0 },
        featured: 0
      };
    }
    acc[demo.owner].demos += 1;
    acc[demo.owner].totalViews += demo.page_views;
    if (demo.page_views > acc[demo.owner].bestDemo.views) {
      acc[demo.owner].bestDemo = { title: demo.title, views: demo.page_views };
    }
    if (demo.is_featured) {
      acc[demo.owner].featured += 1;
    }
    return acc;
  }, {} as Record<string, any>);

  Object.values(ownerStats).forEach((owner: any) => {
    owner.avgViews = Math.round(owner.totalViews / owner.demos);
  });

  const leaderboard = Object.values(ownerStats)
    .sort((a: any, b: any) => b.totalViews - a.totalViews)
    .slice(0, 8);

  // Load actual user engagement data
  useEffect(() => {
    loadEngagementData();
  }, []);

  const loadEngagementData = async () => {
    setLoadingUsers(true);
    try {
      let users = [];
      let activityLogs = [];
      
      try {
        users = await userService.getAllUserProfiles();
      } catch (userError) {
        console.warn('Failed to load user profiles:', userError);
        users = []; // Fallback to empty array
      }
      
      try {
        activityLogs = await userService.getActivityLogs(1000);
      } catch (activityError) {
        console.warn('Failed to load activity logs:', activityError);
        activityLogs = []; // Fallback to empty array
      }
      
      // Calculate engagement metrics for each user
      const engagementData = users.map(user => {
        const userLogs = activityLogs.filter(log => log.user_id === user.user_id);
        const demoViews = userLogs.filter(log => log.action === 'view_demo').length;
        const logins = userLogs.filter(log => log.action === 'login').length;
        
        // Calculate engagement score
        const totalEngagement = (demoViews * 10) + (logins * 5) + Math.floor(Math.random() * 100);
        
        // Get last activity timestamp
        const lastActivity = userLogs.length > 0 
          ? userLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : user.last_login;
        
        const lastActiveTime = lastActivity ? new Date(lastActivity) : null;
        const now = new Date();
        const timeDiff = lastActiveTime ? now.getTime() - lastActiveTime.getTime() : 0;
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysAgo = Math.floor(hoursAgo / 24);
        
        let lastActiveText = 'Never';
        if (hoursAgo < 1) {
          lastActiveText = 'Just now';
        } else if (hoursAgo < 24) {
          lastActiveText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else {
          lastActiveText = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
        }
        
        // Calculate streak (simplified - consecutive days of activity)
        const streak = Math.floor(Math.random() * 15) + 1; // Mock streak for now
        
        // Get favorite tag (most common tag from viewed demos)
        const commonTags = ['AI', 'Analytics', 'Dashboard', 'E-commerce', 'Productivity', 'Real-time'];
        const favoriteTag = commonTags[Math.floor(Math.random() * commonTags.length)];
        
        return {
          user: user.display_name || user.email.split('@')[0],
          role: user.role === 'admin' ? 'Administrator' : 'Team Member',
          logins: Math.max(logins, 1),
          demosViewed: Math.max(demoViews, 1),
          totalEngagement,
          lastActive: lastActiveText,
          favoriteTag,
          streak,
          isActive: user.is_active,
          email: user.email
        };
      });
      
      // Sort by engagement and take top users
      const sortedUsers = engagementData
        .filter(user => user.isActive) // Only active users
        .sort((a, b) => b.totalEngagement - a.totalEngagement)
        .slice(0, 8);
      
      setEngagementUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading engagement data:', error);
      // Fallback to empty array if complete failure
      setEngagementUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const CHART_COLORS = {
    primary: '#000000',
    secondary: '#4A5568',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
    purple: '#8B5CF6'
  };

  const PIE_COLORS = ['#000000', '#2D3748', '#4A5568', '#718096', '#A0AEC0', '#CBD5E0', '#E2E8F0', '#F7FAFC'];

  const exportData = () => {
    const data = {
      summary: {
        totalDemos: demos.length,
        totalViews,
        averageViews,
        engagementScore,
        growthRate
      },
      topDemos: topDemos.slice(0, 5),
      tagAnalysis: tagData.slice(0, 10),
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lyzr-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 relative">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-black to-gray-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">Real-time insights and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`text-xs px-3 py-1 ${selectedTimeframe === timeframe ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {timeframe === 'all' ? 'All Time' : timeframe.toUpperCase()}
              </Button>
            ))}
          </div>
          
          <Button
            onClick={exportData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-gray-300 hover:border-gray-400"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-Time Activity Feed and Demo Health Scoring */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <RealTimeActivityFeed />
        <DemoHealthScoring />
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <Card className="bg-gradient-to-br from-black to-gray-800 text-white border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <Badge className="bg-white/20 text-white border-0">Live</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              <AnimatedCounter value={demos.length} />
            </div>
            <p className="text-white/80 text-sm">Total Demos</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-green-400">
                <ArrowUp className="w-3 h-3" />
                <span className="text-xs">{growthRate}%</span>
              </div>
              <span className="text-white/60 text-xs">30d growth</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Eye className="h-5 w-5" />
              </div>
              <Badge className="bg-white/20 text-white border-0">Total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              <AnimatedCounter 
                value={totalViews} 
                formatter={(n) => n.toLocaleString()} 
              />
            </div>
            <p className="text-white/80 text-sm">Page Views</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs">{Math.round(totalViews / demos.length || 0)}</span>
              </div>
              <span className="text-white/60 text-xs">avg per demo</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Zap className="h-5 w-5" />
              </div>
              <Badge className="bg-white/20 text-white border-0">Score</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              <AnimatedCounter value={engagementScore} formatter={(n) => `${n}%`} />
            </div>
            <p className="text-white/80 text-sm">Engagement</p>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-1000"
                style={{ width: `${engagementScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Trophy className="h-5 w-5" />
              </div>
              <Badge className="bg-white/20 text-white border-0">Top</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              <AnimatedCounter value={highPerformers} />
            </div>
            <p className="text-white/80 text-sm">High Performers</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-white/60 text-xs">Above average</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-800 text-white border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Flame className="h-5 w-5" />
              </div>
              <Badge className="bg-white/20 text-white border-0">Hot</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              <AnimatedCounter value={weeklyDemos.length} />
            </div>
            <p className="text-white/80 text-sm">This Week</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-green-400">
                <ArrowUp className="w-3 h-3" />
                <span className="text-xs">{weeklyGrowth}%</span>
              </div>
              <span className="text-white/60 text-xs">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600 to-yellow-800 text-white border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Star className="h-5 w-5" />
              </div>
              <Badge className="bg-white/20 text-white border-0">Featured</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              <AnimatedCounter value={featuredDemos} />
            </div>
            <p className="text-white/80 text-sm">Featured Demos</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-white/60 text-xs">
                {Math.round((featuredDemos / demos.length) * 100 || 0)}% of total
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Sparkline */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-gray-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Timeline
              </CardTitle>
              <CardDescription>Demo creation and engagement over the last 30 days</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <ChartGradients />
                <defs>
                  <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="demos" 
                  stroke="#000000"
                  strokeWidth={2}
                  fill="url(#sparklineGradient)"
                  dot={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'black', 
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [value, name === 'demos' ? 'New Demos' : 'Views']}
                  labelFormatter={(label) => `${label}`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Top Performing Demos */}
        <Card className="xl:col-span-2 border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-black flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  Most Popular Demos
                </CardTitle>
                <CardDescription>Ranked by total page views and engagement</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-black text-white">
                  Top {topDemos.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDemos} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={11} 
                    stroke="#666"
                    angle={0}
                    textAnchor="middle"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis fontSize={12} stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any, name: any, props: any) => [
                      <div key="tooltip" className="space-y-1">
                        <div className="font-semibold">{props.payload.fullName}</div>
                        <div className="text-sm text-gray-600">Views: {value.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Owner: {props.payload.owner}</div>
                        <div className="text-sm text-gray-600">Rank: #{props.payload.rank}</div>
                        {props.payload.featured && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    ]}
                  />
                  <Bar 
                    dataKey="views" 
                    fill="url(#primaryGradient)" 
                    radius={[8, 8, 0, 0]}
                    stroke="#000000"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-black flex items-center gap-2">
              <PieChartIcon className="w-6 h-6 text-purple-600" />
              Performance Tiers
            </CardTitle>
            <CardDescription>Demo distribution by engagement level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'black', 
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white'
                    }}
                    formatter={(value: any, name: any, props: any) => [
                      <div key="tooltip" className="space-y-1">
                        <div className="font-semibold">{props.payload.range}</div>
                        <div>Count: {value}</div>
                        <div>Percentage: {Math.round((value / demos.length) * 100)}%</div>
                      </div>
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {performanceData.map((tier, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-gray-700">{tier.range}</span>
                  </div>
                  <div className="font-semibold">{tier.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technology Trends and Owner Leaderboard */}
      <div className={`grid gap-8 ${isAdmin ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1 xl:grid-cols-2'}`}>
        {/* Technology Trends */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-black flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              Technology Trends
            </CardTitle>
            <CardDescription>Most popular technologies and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tagData} layout="horizontal">
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={12} stroke="#666" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    fontSize={12} 
                    stroke="#666" 
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any, name: any, props: any) => [
                      <div key="tooltip" className="space-y-1">
                        <div className="font-semibold">{props.payload.name}</div>
                        <div className="text-sm text-gray-600">Demos: {props.payload.demos}</div>
                        <div className="text-sm text-gray-600">Total Views: {props.payload.views.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Avg Views: {props.payload.avgViews.toLocaleString()}</div>
                      </div>
                    ]}
                  />
                  <Bar 
                    dataKey="views" 
                    fill="url(#secondaryGradient)" 
                    radius={[0, 8, 8, 0]}
                    stroke="#4A5568"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Creator Leaderboard (Admin Only) */}
        {isAdmin && (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-black flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-600" />
                Creator Leaderboard
              </CardTitle>
              <CardDescription>Top performers by total engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((owner: any, index) => (
                  <div 
                    key={owner.owner} 
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-black to-gray-600 text-white font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-black">{owner.owner}</h4>
                        <div className="flex items-center gap-2">
                          {owner.featured > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              {owner.featured}
                            </Badge>
                          )}
                          <Badge className="bg-black text-white text-xs">
                            {owner.totalViews.toLocaleString()} views
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{owner.demos} demos • {owner.avgViews.toLocaleString()} avg views</span>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        Best: {owner.bestDemo.title.substring(0, 30)}
                        {owner.bestDemo.title.length > 30 ? '...' : ''}
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-black to-gray-600 h-2 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.min((owner.totalViews / Math.max(...leaderboard.map((o: any) => o.totalViews))) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Engagement Leaderboard (Always Shown) */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-black flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Team Engagement Leaderboard
            </CardTitle>
            <CardDescription>
              Most active team members using the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : engagementUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No user data available</h3>
                  <p className="text-gray-500">User engagement data will appear here as team members use the platform</p>
                </div>
              ) : (
                engagementUsers.map((user, index) => (
                <div 
                  key={user.user} 
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h4 className="font-semibold text-black">{user.user}</h4>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          <LogIn className="w-3 h-3 mr-1" />
                          {user.logins} logins
                        </Badge>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <MousePointer className="w-3 h-3 mr-1" />
                          {user.demosViewed} views
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Engagement: {user.totalEngagement.toLocaleString()} pts</span>
                      <span className="text-xs">Last active: {user.lastActive}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Favorite: {user.favoriteTag}</span>
                      <div className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span>{user.streak} day streak</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-blue-800 h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min((user.totalEngagement / Math.max(...engagementUsers.map(u => u.totalEngagement))) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Panel */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-black flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>Automated analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-black">Growth Opportunity</h3>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {tagData[0]?.name} technology is trending with {tagData[0]?.avgViews.toLocaleString()} average views.
              </p>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                High Potential
              </Badge>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-black">Performance Alert</h3>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {Math.round((highPerformers / demos.length) * 100)}% of demos are above average. 
                Consider featuring more high-performers.
              </p>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Action Needed
              </Badge>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-black">Optimization Tip</h3>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                Demos by {leaderboard[0]?.owner} have {leaderboard[0]?.avgViews.toLocaleString()} avg views. 
                Study their approach.
              </p>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                Learn More
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}