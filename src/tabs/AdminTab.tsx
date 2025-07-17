import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

export function AdminTab() {
  const { isAdmin, userProfile } = useAuth();

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
      status: 'Coming Soon'
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

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">Usage Statistics</CardTitle>
          <CardDescription className="text-gray-600">System usage and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-black">--</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-black">
                --
              </div>
              <div className="text-sm text-gray-600">Admins</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-black">
                --
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}