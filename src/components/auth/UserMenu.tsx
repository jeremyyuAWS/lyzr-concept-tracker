import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, User, Shield, Crown, ChevronDown } from 'lucide-react';
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

  if (!user || !userProfile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
        return <Crown className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const displayName = userProfile.display_name || userProfile.email.split('@')[0];
  const roleText = userProfile.role === 'admin' ? 'Admin' : 
                   userProfile.role === 'super_admin' ? 'Super Admin' : 'User';

  return (
    <div className="flex items-center gap-3">
      {/* User Info Display */}
      <div className="flex items-center gap-2 text-right">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-black">
              {displayName}
            </span>
            {isAdmin && (
              <Crown className="w-3 h-3 text-yellow-600" />
            )}
          </div>
          <Badge className={`text-xs ${getRoleColor(userProfile.role)} h-4 px-1`}>
            {roleText}
          </Badge>
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
        variant="outline"
        size="sm"
        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 flex items-center gap-1"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    </div>
  );
}