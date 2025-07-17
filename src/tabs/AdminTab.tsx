import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService, UserProfile } from '@/lib/supabase';
import { Demo } from '@/types/demo';
import { UserManagement } from '@/components/UserManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Database, Users, Activity, Shield, Clock, User, Crown, ChevronDown, ChevronUp } from 'lucide-react';

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

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, demos]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
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
      {/* Welcome Card */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Shield className="w-5 h-5" />
            Admin Dashboard
          </CardTitle>
          <CardDescription className="text-green-700">
            Full administrative access to the Lyzr Concept Tracker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-green-700">
            <p className="font-medium mb-2">🚀 Production Ready</p>
            <p>Full admin capabilities are now available including user management, demo editing/deletion, image uploads, and comprehensive security features.</p>
          </div>
        </CardContent>
      </Card>

      {/* User Management Section - Now at the top */}
      <UserManagement />

      {/* Collapsible Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* System Information */}
        <CollapsibleSection
          title="System Information"
          description="Current system status and configuration"
          icon={<Settings className="w-5 h-5 text-blue-600" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {systemInfo.map((info, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-600">{info.label}</span>
                <span className="text-sm font-medium text-black">{info.value}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Quick Actions */}
        <CollapsibleSection
          title="Quick Actions"
          description="Common administrative tasks"
          icon={<Activity className="w-5 h-5 text-purple-600" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" disabled>
              <Database className="w-4 h-4 mr-2" />
              Export Demo Data
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Activity className="w-4 h-4 mr-2" />
              View System Logs
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Settings className="w-4 h-4 mr-2" />
              Configure Settings
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Clock className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>
        </CollapsibleSection>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active Features */}
        <CollapsibleSection
          title="Active Features"
          description="Currently implemented admin capabilities"
          icon={<Database className="w-5 h-5 text-green-600" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 gap-4">
            {adminFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-600 mt-0.5">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-black text-sm">{feature.title}</h4>
                    <Badge variant="outline" className={`text-xs ${
                      feature.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {feature.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Security Features */}
        <CollapsibleSection
          title="Security Features"
          description="Security and access control systems"
          icon={<Shield className="w-5 h-5 text-red-600" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 gap-4">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-600 mt-0.5">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-black text-sm">{feature.title}</h4>
                    <Badge variant="outline" className={`text-xs ${
                      feature.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {feature.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Real Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">System Statistics</CardTitle>
          <CardDescription className="text-gray-600">Real-time system usage and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-800">{stats.totalUsers}</div>
                <div className="text-sm text-blue-600">Total Users</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-800">{stats.adminUsers}</div>
                <div className="text-sm text-red-600">Admins</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-800">{stats.activeUsers}</div>
                <div className="text-sm text-green-600">Active Users</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-800">{stats.recentLogins}</div>
                <div className="text-sm text-purple-600">Recent Logins</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-800">{stats.totalDemos}</div>
                <div className="text-sm text-orange-600">Total Demos</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-800">{stats.totalViews.toLocaleString()}</div>
                <div className="text-sm text-yellow-600">Total Views</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">Performance Metrics</CardTitle>
          <CardDescription className="text-gray-600">Demo performance and engagement statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-black">{stats.avgViewsPerDemo}</div>
                <div className="text-sm text-gray-600">Avg Views/Demo</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-black">{stats.featuredDemos}</div>
                <div className="text-sm text-gray-600">Featured Demos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-black">{stats.recentActivity}</div>
                <div className="text-sm text-gray-600">Recent Activity</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-black">
                  {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Active Rate</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}