import { useAuth } from '@/contexts/AuthContext';
import { DemoFormData } from '@/types/demo';
import { AddDemoForm } from '@/components/AddDemoForm';
import { Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AddTabProps {
  onSuccess?: () => void;
}

export function AddTab({ onSuccess }: AddTabProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Shield className="w-5 h-5" />
            Admin Access Required
          </CardTitle>
          <CardDescription className="text-red-700">
            You must be an administrator to add new demos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium mb-1">Access Denied</p>
              <p>Only users with admin privileges can add new demo entries. Please contact your system administrator if you need access.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Shield className="w-5 h-5" />
            Admin Access Granted
          </CardTitle>
          <CardDescription className="text-green-700">
            You have full admin access to add and manage demos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700">
              <p className="font-medium mb-2">Production Ready</p>
              <p>This form is now protected by Supabase Auth with role-based access control. All new demos will be saved to the database with proper security and validation. Use external image URLs for screenshots.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddDemoForm onSubmit={async () => {}} onSuccess={onSuccess} />
    </div>
  );
}