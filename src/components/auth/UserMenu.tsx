import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Crown, User } from 'lucide-react';
import { toast } from 'sonner';

export function UserMenu() {
  const { user, userProfile, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-500">
          {user ? 'Loading profile...' : 'Loading...'}
        </div>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = userProfile.display_name || userProfile.email.split('@')[0];
  const roleText = userProfile.role === 'admin' ? 'Admin' : 
                   userProfile.role === 'super_admin' ? 'Super Admin' : 'User';

  return (
    <div className="flex items-center gap-3">
      {/* User Info Display */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <span className="text-sm font-medium text-black">
              {displayName}
            </span>
            {isAdmin && (
              <Crown className="w-4 h-4 text-yellow-600" />
            )}
          </div>
          <div className="flex justify-end">
            <Badge 
              className={`text-xs h-5 px-2 ${
                userProfile.role === 'admin' ? 'bg-red-100 text-red-800' :
                userProfile.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {isAdmin ? (
                <>
                  <Crown className="w-3 h-3 mr-1" />
                  {roleText}
                </>
              ) : (
                <>
                  <User className="w-3 h-3 mr-1" />
                  {roleText}
                </>
              )}
            </Badge>
          </div>
        </div>
        
        <Avatar className="h-8 w-8">
          <AvatarImage src={userProfile.avatar_url} alt={displayName} />
          <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Sign Out Button */}
      <Button
        onClick={handleSignOut}
        size="sm"
        className="bg-red-600 hover:bg-red-700 text-white border-0"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}