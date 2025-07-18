import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService, UserProfile } from '@/lib/supabase';
import { Demo } from '@/types/demo';
import { UserManagement } from '@/components/UserManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Database, Users, Activity, Shield, Clock, User, Crown, ChevronDown, ChevronUp, RefreshCw, Eye, ExternalLink, Heart, Search, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Collapsible Section Component
function CollapsibleSection({ title, description, icon, children, defaultOpen = false }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <CardDescription className="text-gray-600">{description}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );
}

interface AdminTabProps {
  demos?: Demo[];
}

export function AdminTab({ demos = [] }: AdminTabProps) {
  const { isAdmin, userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loginStats, setLoginStats] = useState({
    dailyActiveUsers: 0,
    weeklyActiveUsers: 0,
    monthlyActiveUsers: 0,
    newUsersThisWeek: 0
  });
  const [sessionMetrics, setSessionMetrics] = useState({
    todaySessions: 0,
    weekSessions: 0,
    monthSessions: 0,
    averageSessionDuration: 0
  });
  const [demoEngagementMetrics, setDemoEngagementMetrics] = useState({
    totalViews: 0,
    totalTryApps: 0,
    totalFavorites: 0,
    totalSearches: 0,
    conversionRate: 0
  });
  const [engagementStats, setEngagementStats] = useState({
    topDemos: [],
    topFavoritedDemos: []
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    activeUsers: 0,
    recentLogins: 0,
    totalDemos: 0,
    totalViews: 0,
    avgViewsPerDemo: 0,
    featuredDemos: 0,
    recentActivity: 0
  });

  // Skeleton loading component
  const SkeletonCard = () => (
    <div className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
    </div>
  );

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, demos]);

  const loadAdminData = async () => {
    try {
      // Don't set loading to true if we already have data (for refreshes)
      if (users.length === 0) {
        setLoading(true);
      }
      
      // Load users
      const userList = await userService.getAllUserProfiles();
      setUsers(userList);
      
      // Load activity logs
      const logs = await userService.getActivityLogs(100);
      setActivityLogs(logs);
      
      // Calculate statistics
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const totalUsers = userList.length;
      const adminUsers = userList.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
      const activeUsers = userList.filter(u => u.is_active).length;
      const recentLogins = userList.filter(u => 
        u.last_login && new Date(u.last_login).getTime() > sevenDaysAgo.getTime()
      ).length;
      
      const totalDemos = demos.length;
      const totalViews = demos.reduce((sum, demo) => sum + demo.page_views, 0);
      const avgViewsPerDemo = totalDemos > 0 ? Math.round(totalViews / totalDemos) : 0;
      const featuredDemos = demos.filter(d => d.is_featured).length;
      
      const recentActivity = logs.filter(log => 
        new Date(log.created_at).getTime() > sevenDaysAgo.getTime()
      ).length;
      
      setStats({
        totalUsers,
        adminUsers,
        activeUsers,
        recentLogins,
        totalDemos,
        totalViews,
        avgViewsPerDemo,
        featuredDemos,
        recentActivity
      });
      
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      await loadAdminData();
      
      // Load additional stats
      try {
        const [loginStatsData, sessionStatsData, engagementStatsData, demoStatsData] = await Promise.all([
          userService.getUserLoginStats().catch(() => ({
            dailyActiveUsers: 0,
            weeklyActiveUsers: 0,
            monthlyActiveUsers: 0,
            newUsersThisWeek: 0
          })),
          userService.getSessionMetrics?.().catch(() => ({
            todaySessions: 0,
            weekSessions: 0,
            monthSessions: 0,
            averageSessionDuration: 0
          })) || Promise.resolve({
            todaySessions: 0,
            weekSessions: 0,
            monthSessions: 0,
            averageSessionDuration: 0
          }),
          userService.getDemoEngagementStats().catch(() => ({
            totalViews: 0,
            totalTryApps: 0,
            totalFavorites: 0,
            totalSearches: 0,
            conversionRate: 0
          })),
          userService.getDemoEngagementStats().catch(() => ({
            topDemos: [],
            topFavoritedDemos: []
          }))
        ]);
        
        setLoginStats(loginStatsData);
        setSessionMetrics(sessionStatsData);
        setDemoEngagementMetrics(engagementStatsData);
        setEngagementStats(demoStatsData);
      } catch (error) {
        console.error('Error loading additional stats:', error);
      }
    } catch (error) {
      console.error('Error refreshing admin data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Shield className="w-5 h-5" />
            Access Denied
          </CardTitle>
          <CardDescription className="text-red-700">
            You don't have permission to access this section
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">
            Only administrators can access the admin panel. Please contact your system administrator if you need access.
          </p>
        </CardContent>
      </Card>
    );
  }

  const adminFeatures = [
    {
      icon: <Database className="w-5 h-5" />,
      title: 'Database Management',
      description: '✅ Real Supabase database with RLS and proper schema',
      status: 'Active'
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'User Management',
      description: '✅ Role-based access control with admin authentication',
      status: 'Active'
    },
    {
      icon: <Activity className="w-5 h-5" />,
      title: 'System Logs',
      description: '✅ Activity logging for all user actions',
      status: 'Active'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Demo Management',
      description: '✅ Full CRUD operations with image upload',
      status: 'Active'
    }
  ];

  const securityFeatures = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Row Level Security',
      description: 'Database access controlled by user roles',
      status: 'Active'
    },
    {
      icon: <User className="w-5 h-5" />,
      title: 'Authentication',
      description: 'Supabase Auth with email/password',
      status: 'Active'
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: 'Data Protection',
      description: 'Encrypted storage with proper backup',
      status: 'Active'
    },
    {
      icon: <Activity className="w-5 h-5" />,
      title: 'Audit Trail',
      description: 'Complete activity logging system',
      status: 'Active'
    },
  ];

  const systemInfo = [
    { label: 'App Version', value: 'v0.1.0' },
    { label: 'Environment', value: 'Production' },
    { label: 'Database', value: 'Supabase Postgres' },
    { label: 'Authentication', value: 'Supabase Auth' },
    { label: 'Storage', value: 'Supabase Storage' },
    { label: 'Your Role', value: userProfile?.role || 'Unknown' },
    { label: 'Last Updated', value: new Date().toLocaleDateString() }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <Crown className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <p className="text-gray-600">Real-time metrics and system management</p>
        </div>
        <Button
          onClick={handleRefreshData}
          disabled={refreshing}
          className="bg-black hover:bg-gray-800 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Real-Time User Login Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            User Login Analytics
          </CardTitle>
          <CardDescription>
            Live user engagement and login patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-800">{loginStats.dailyActiveUsers || 0}</div>
                <div className="text-sm text-blue-600">Daily Active Users</div>
                <div className="text-xs text-blue-500 mt-1">Today</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-800">{loginStats.weeklyActiveUsers || 0}</div>
                <div className="text-sm text-green-600">Weekly Active Users</div>
                <div className="text-xs text-green-500 mt-1">Last 7 days</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-800">{loginStats.monthlyActiveUsers || 0}</div>
                <div className="text-sm text-purple-600">Monthly Active Users</div>
                <div className="text-xs text-purple-500 mt-1">Last 30 days</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-3xl font-bold text-orange-800">{loginStats.newUsersThisWeek || 0}</div>
                <div className="text-sm text-orange-600">New Users</div>
                <div className="text-xs text-orange-500 mt-1">This week</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Session Analytics
          </CardTitle>
          <CardDescription>
            User session data and engagement time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-black">{sessionMetrics.todaySessions || 0}</div>
                <div className="text-sm text-gray-600">Sessions Today</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-black">{sessionMetrics.weekSessions || 0}</div>
                <div className="text-sm text-gray-600">Sessions This Week</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-black">{sessionMetrics.monthSessions || 0}</div>
                <div className="text-sm text-gray-600">Sessions This Month</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-black">{sessionMetrics.averageSessionDuration || 0}</div>
                <div className="text-sm text-gray-600">Avg Session (min)</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Demo Engagement Metrics
          </CardTitle>
          <CardDescription>
            Real-time demo interaction and conversion data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200 min-h-[100px] flex flex-col justify-center">
                  <div className="flex items-center justify-center mb-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-800">{demoEngagementMetrics.totalViews || 0}</div>
                  <div className="text-sm text-blue-600">Demo Views</div>
                  <div className="text-xs text-blue-500 mt-1">Last 7 days</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 min-h-[100px] flex flex-col justify-center">
                  <div className="flex items-center justify-center mb-2">
                    <ExternalLink className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-800">{demoEngagementMetrics.totalTryApps || 0}</div>
                  <div className="text-sm text-green-600">Try App Clicks</div>
                  <div className="text-xs text-green-500 mt-1">Last 7 days</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200 min-h-[100px] flex flex-col justify-center">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-800">{demoEngagementMetrics.totalFavorites || 0}</div>
                  <div className="text-sm text-red-600">New Favorites</div>
                  <div className="text-xs text-red-500 mt-1">Last 7 days</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200 min-h-[100px] flex flex-col justify-center">
                  <div className="flex items-center justify-center mb-2">
                    <Search className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-800">{demoEngagementMetrics.totalSearches || 0}</div>
                  <div className="text-sm text-purple-600">Searches</div>
                  <div className="text-xs text-purple-500 mt-1">Last 7 days</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200 min-h-[100px] flex flex-col justify-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-orange-800">{demoEngagementMetrics.conversionRate || 0}%</div>
                  <div className="text-sm text-orange-600">Conversion Rate</div>
                  <div className="text-xs text-orange-500 mt-1">Try App / Views</div>
                </div>
              </div>
              
              {/* Conversion Rate Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Demo to Try App Conversion</span>
                  <span className="text-sm text-gray-600">{demoEngagementMetrics.conversionRate || 0}%</span>
                </div>
                <Progress value={demoEngagementMetrics.conversionRate || 0} className="h-3" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>Good: 15%+</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Demos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-yellow-600" />
            Top Performing Demos
          </CardTitle>
          <CardDescription>
            Most viewed and favorited demos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse min-h-[60px]">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Viewed */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Most Viewed
                </h4>
                <div className="space-y-3 min-h-[200px]">
                  {engagementStats.topDemos?.slice(0, 5).map((demo: any, index: number) => (
                    <div key={demo.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 min-h-[60px]">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-600 text-white">#{index + 1}</Badge>
                        <div>
                          <h5 className="font-medium text-blue-900">{demo.title}</h5>
                          <p className="text-xs text-blue-700">by {demo.owner}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-800">{demo.page_views.toLocaleString()}</div>
                        <div className="text-xs text-blue-600">views</div>
                      </div>
                    </div>
                  )) || []}
                  {!engagementStats.topDemos?.length && (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-gray-500 text-sm">No demo data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Most Favorited */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Most Favorited
                </h4>
                <div className="space-y-3 min-h-[200px]">
                  {engagementStats.topFavoritedDemos?.slice(0, 5).map((demo: any, index: number) => (
                    <div key={demo.demo_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 min-h-[60px]">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-600 text-white">#{index + 1}</Badge>
                        <div>
                          <h5 className="font-medium text-red-900">{demo.title}</h5>
                          <p className="text-xs text-red-700">by {demo.owner}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-800">{demo.favorite_count}</div>
                        <div className="text-xs text-red-600">favorites</div>
                      </div>
                    </div>
                  )) || []}
                  {!engagementStats.topFavoritedDemos?.length && (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-gray-500 text-sm">No favorite data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health & Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            System Health & Performance
          </CardTitle>
          <CardDescription>
            Overall system statistics and health indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-black">{users.length}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-black">
                  {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
                </div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-black">
                  {users.filter(u => u.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-black">{demos.length}</div>
                <div className="text-sm text-gray-600">Total Demos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-black">
                  {demos.reduce((sum, demo) => sum + demo.page_views, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-2xl font-bold text-black">{demos.filter(d => d.is_featured).length}</div>
                <div className="text-sm text-gray-600">Featured Demos</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Analytics Components */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-600" />
              Demo Health Scoring
            </CardTitle>
            <CardDescription>
              Advanced health metrics (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500 min-h-[120px] flex flex-col justify-center">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Health scoring system in development</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Real-Time Activity Feed
            </CardTitle>
            <CardDescription>
              Live user activity tracking (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500 min-h-[120px] flex flex-col justify-center">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Activity feed system in development</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management - Keep this at the bottom */}
      <UserManagement />

      {/* Collapsible System Information */}
      <CollapsibleSection
        title="System Information"
        description="Technical system details and configuration"
        icon={<Settings className="w-5 h-5 text-gray-600" />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Application Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">App Version</span>
                <span className="text-sm font-medium text-black">v0.1.0</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Environment</span>
                <span className="text-sm font-medium text-black">Production</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Your Role</span>
                <span className="text-sm font-medium text-black">{userProfile?.role || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium text-black">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Database & Services</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-black">Supabase Postgres</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Authentication</span>
                <span className="text-sm font-medium text-black">Supabase Auth</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Storage</span>
                <span className="text-sm font-medium text-black">Supabase Storage</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Analytics</span>
                <span className="text-sm font-medium text-black">Real-time Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}