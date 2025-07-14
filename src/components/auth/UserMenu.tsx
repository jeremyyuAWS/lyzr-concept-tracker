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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 px-3 py-2 hover:bg-gray-100 rounded-lg">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userProfile.avatar_url} alt={userProfile.display_name} />
              <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                {getInitials(userProfile.display_name || userProfile.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-black">
                  {userProfile.display_name || userProfile.email.split('@')[0]}
                </span>
                {isAdmin && (
                  <Crown className="w-3 h-3 text-yellow-600" />
                )}
              </div>
              <Badge className={`text-xs ${getRoleColor(userProfile.role)} h-4 px-1`}>
                {userProfile.role === 'admin' ? 'Admin' : userProfile.role === 'super_admin' ? 'Super Admin' : 'User'}
              </Badge>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none text-black">
                {userProfile.display_name || 'User'}
              </p>
              <Badge className={`text-xs ${getRoleColor(userProfile.role)} flex items-center gap-1`}>
                {getRoleIcon(userProfile.role)}
                {userProfile.role === 'admin' ? 'Admin' : userProfile.role === 'super_admin' ? 'Super Admin' : 'User'}
              </Badge>
            </div>
            <p className="text-xs leading-none text-gray-500">
              {userProfile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        {isAdmin && (
          <DropdownMenuItem disabled>
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin Settings</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}