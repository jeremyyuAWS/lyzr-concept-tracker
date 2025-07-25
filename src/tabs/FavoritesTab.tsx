import { useState, useEffect } from 'react';
import { Demo } from '@/types/demo';
import { DemoCard } from '@/components/DemoCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Heart, 
  Search, 
  Grid, 
  List, 
  FolderPlus,
  Folder,
  FolderOpen,
  Plus,
  Edit3,
  Trash2,
  MoreHorizontal,
  Star,
  Clock,
  TrendingUp,
  Globe,
  Crown,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface FavoritesTabProps {
  favoritesDemos: Demo[];
  loading: boolean;
  error: string | null;
  onViewIncrement?: (id: string) => void;
  onDemoUpdate?: (updatedDemo: Demo) => void;
  onDemoDelete?: (demoId: string) => void;
  onRetry?: () => void;
  onToggleFavorite?: (demoId: string) => void;
  isFavorited?: (demoId: string) => boolean;
}

interface FavoriteFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  demos: Demo[];
}

export function FavoritesTab({ 
  favoritesDemos: propFavoritesDemos, 
  loading: propLoading, 
  error: propError, 
  onViewIncrement, 
  onDemoUpdate, 
  onDemoDelete, 
  onRetry, 
  onToggleFavorite, 
  isFavorited 
}: FavoritesTabProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Local state for favorites and folders
  const [favorites, setFavorites] = useState<Demo[]>([]);
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFolders, setGlobalFolders] = useState<FavoriteFolder[]>([]);
  
  // Folder management
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateGlobalFolder, setShowCreateGlobalFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  // Folder display management
  const [showGlobalFolders, setShowGlobalFolders] = useState(true);
  const [showPersonalFolders, setShowPersonalFolders] = useState(true);
  const [folderViewMode, setFolderViewMode] = useState<'compact' | 'detailed'>('compact');
  const [maxFoldersToShow, setMaxFoldersToShow] = useState(8);
  const [showAllGlobalFolders, setShowAllGlobalFolders] = useState(false);
  const [showAllPersonalFolders, setShowAllPersonalFolders] = useState(false);

  // Load favorites and folders
  useEffect(() => {
    if (user) {
      loadFavoritesAndFolders();
    }
  }, [user]);

  const loadFavoritesAndFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load user's favorites with demo details
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('user_favorites')
        .select(`
          demo_id,
          folder_id,
          created_at,
          demos!inner(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (favoritesError) throw favoritesError;

      // Load user's folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('favorite_folders')
        .select('*')
        .eq('user_id', user?.id) 
        .eq('is_global', false)
        .order('sort_order', { ascending: true });

      if (foldersError) throw foldersError;

      // Load global folders (created by super admins)
      const { data: globalFoldersData, error: globalFoldersError } = await supabase
        .from('favorite_folders')
        .select('*')
        .eq('is_global', true)
        .order('sort_order', { ascending: true });

      if (globalFoldersError) throw globalFoldersError;

      // Load ALL demos in global folders (from all users)
      const { data: globalFolderDemos, error: globalFolderDemosError } = await supabase
        .from('user_favorites')
        .select(`
          demo_id,
          folder_id,
          created_at,
          demos!inner(*)
        `)
        .not('folder_id', 'is', null)
        .in('folder_id', (globalFoldersData || []).map(f => f.id))
        .order('created_at', { ascending: false });

      if (globalFolderDemosError) throw globalFolderDemosError;
      
      // Organize favorites by folder
      const favoriteDemos = (favoritesData || []).map(f => f.demos);
      const folderMap = new Map<string, Demo[]>();
      
      // Group demos by folder
      (favoritesData || []).forEach(fav => {
        const folderId = fav.folder_id || 'unorganized';
        if (!folderMap.has(folderId)) {
          folderMap.set(folderId, []);
        }
        folderMap.get(folderId)?.push(fav.demos);
      });

      // Group global folder demos
      const globalFolderMap = new Map<string, Demo[]>();
      (globalFolderDemos || []).forEach(fav => {
        const folderId = fav.folder_id;
        if (folderId) {
          if (!globalFolderMap.has(folderId)) {
            globalFolderMap.set(folderId, []);
          }
          globalFolderMap.get(folderId)?.push(fav.demos);
        }
      });
      // Create folder objects with demos
      const foldersWithDemos = (foldersData || []).map(folder => ({
        ...folder,
        demos: folderMap.get(folder.id) || []
      }));

      // Add unorganized demos
      const unorganizedDemos = folderMap.get('unorganized') || [];
      
      setFavorites(favoriteDemos);
      setFolders(foldersWithDemos);
      setGlobalFolders((globalFoldersData || []).map(folder => ({
        ...folder,
        demos: globalFolderMap.get(folder.id) || []
      })));
      
      // If we have unorganized demos, add them to the list
      if (unorganizedDemos.length > 0) {
        setFolders(prev => [...prev, {
          id: 'unorganized',
          name: 'Unorganized',
          description: 'Demos not yet organized into folders',
          color: '#6b7280',
          created_at: new Date().toISOString(),
          demos: unorganizedDemos
        }]);
      }
      
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setIsCreatingFolder(true);
    try {
      const { data, error } = await supabase
        .from('favorite_folders')
        .insert([{
          user_id: user?.id,
          created_by: user?.id,
          name: newFolderName,
          description: newFolderDescription,
          color: '#6366f1',
          is_global: false,
          sort_order: folders.length
        }])
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, { ...data, demos: [] }]);
      setNewFolderName('');
      setNewFolderDescription('');
      setShowCreateFolder(false);
      
      toast.success('Folder created successfully!');
    } catch (err) {
      console.error('Error creating folder:', err);
      toast.error('Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const createGlobalFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setIsCreatingFolder(true);
    try {
      const { data, error } = await supabase
        .from('favorite_folders')
        .insert([{
          user_id: user?.id,
          created_by: user?.id,
          name: newFolderName,
          description: newFolderDescription,
          color: '#1f2937',
          icon: 'globe',
          is_global: true,
          sort_order: globalFolders.length
        }])
        .select()
        .single();

      if (error) throw error;

      setGlobalFolders(prev => [...prev, { ...data, demos: [] }]);
      setNewFolderName('');
      setNewFolderDescription('');
      setShowCreateGlobalFolder(false);
      
      toast.success('Global folder created successfully!');
    } catch (err) {
      console.error('Error creating global folder:', err);
      toast.error('Failed to create global folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const moveToFolder = async (demoId: string, folderId: string | null) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .update({ folder_id: folderId === 'unorganized' ? null : folderId })
        .eq('user_id', user?.id)
        .eq('demo_id', demoId);

      if (error) throw error;

      await loadFavoritesAndFolders();
      toast.success('Demo moved to folder!');
    } catch (err) {
      console.error('Error moving demo:', err);
      toast.error('Failed to move demo');
    }
  };

  const deleteFolder = async (folderId: string) => {
    // Check if it's a global folder
    const isGlobalFolder = globalFolders.some(f => f.id === folderId);
    
    if (isGlobalFolder) {
      // Only super admins can delete global folders
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();
      
      if (profile?.role !== 'super_admin') {
        toast.error('Only Super Admins can delete global folders');
        return;
      }
    }
    
    try {
      // Move all demos in this folder to unorganized
      await supabase
        .from('user_favorites')
        .update({ folder_id: null })
        .eq('folder_id', folderId);

      // Delete the folder
      const { error } = await supabase
        .from('favorite_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      await loadFavoritesAndFolders();
      toast.success(`${isGlobalFolder ? 'Global folder' : 'Folder'} deleted successfully!`);
    } catch (err) {
      console.error('Error deleting folder:', err);
      toast.error(`Failed to delete ${isGlobalFolder ? 'global folder' : 'folder'}`);
    }
  };

  // Filter and sort logic
  const getDisplayedDemos = () => {
    let demosToShow: Demo[] = [];
    
    if (selectedFolder) {
      const folder = folders.find(f => f.id === selectedFolder) || 
                    globalFolders.find(f => f.id === selectedFolder);
      demosToShow = folder?.demos || [];
    } else {
      demosToShow = favorites;
    }

    // Apply search filter
    if (searchTerm) {
      demosToShow = demosToShow.filter(demo =>
        demo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demo.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        return demosToShow.sort((a, b) => b.page_views - a.page_views);
      case 'name':
        return demosToShow.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return demosToShow.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  };

  const displayedDemos = getDisplayedDemos();

  // Check if user is super admin
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.role === 'super_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load favorites"
        message={error}
        onRetry={loadFavoritesAndFolders}
        className="max-w-md mx-auto"
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Your Favorites</h2>
          <p className="text-gray-600">Organize and manage your favorite demos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCreateFolder(true)}
            className="bg-white hover:bg-gray-50 text-black border border-gray-300"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          {isSuperAdmin && (
            <Button
              onClick={() => setShowCreateGlobalFolder(true)}
              className="bg-gray-800 hover:bg-gray-900 text-white"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Global Folder
            </Button>
          )}
        </div>
      </div>

      {/* Folders Grid */}
      <div className="space-y-6">
        {/* Global Folders Section */}
        {globalFolders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowGlobalFolders(!showGlobalFolders)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg p-2 -ml-2 transition-colors"
              >
                <div className={`transition-transform duration-200 ${showGlobalFolders ? 'rotate-90' : ''}`}>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <Globe className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-black">Global Folders</h3>
                <Badge className="bg-gray-800 text-white text-xs">
                  {globalFolders.length}
                </Badge>
                <Badge className="bg-gray-200 text-gray-700 text-xs">
                  Available to Everyone
                </Badge>
              </button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFolderViewMode(folderViewMode === 'compact' ? 'detailed' : 'compact')}
                  className="h-8 px-2 text-xs bg-white hover:bg-gray-50 border border-gray-200"
                >
                  {folderViewMode === 'compact' ? 'Detailed' : 'Compact'}
                </Button>
              </div>
            </div>
            
            {showGlobalFolders && (
              <>
                <div className={`grid gap-3 ${
                  folderViewMode === 'compact' 
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}>
                  {globalFolders
                    .slice(0, showAllGlobalFolders ? globalFolders.length : maxFoldersToShow)
                    .map((folder) => (
                    <Card
                      key={folder.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                        selectedFolder === folder.id 
                          ? 'ring-2 ring-gray-800 bg-gray-50 border-gray-800' 
                          : 'hover:bg-gray-50 border-gray-200 hover:border-gray-400'
                      } ${folderViewMode === 'compact' ? 'h-20' : 'h-24'}`}
                      onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
                    >
                      <CardHeader className={`${folderViewMode === 'compact' ? 'pb-1 px-3 pt-2' : 'pb-2'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {selectedFolder === folder.id ? (
                              <FolderOpen className="w-4 h-4 text-gray-800 flex-shrink-0" />
                            ) : (
                              <Folder className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            )}
                            <CardTitle className={`${folderViewMode === 'compact' ? 'text-sm' : 'text-base'} truncate`}>
                              {folder.name}
                            </CardTitle>
                            <Badge className="bg-gray-800 text-white text-xs flex-shrink-0">
                              Global
                            </Badge>
                          </div>
                          {isSuperAdmin && folderViewMode === 'detailed' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white hover:bg-gray-100">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => deleteFolder(folder.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Global Folder
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>
                      {folderViewMode === 'detailed' && (
                        <CardContent className="pt-0 px-3 pb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              {folder.demos.length} demo{folder.demos.length !== 1 ? 's' : ''}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {folder.demos.reduce((sum, demo) => sum + demo.page_views, 0)} views
                            </Badge>
                          </div>
                          {folder.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{folder.description}</p>
                          )}
                        </CardContent>
                      )}
                      {folderViewMode === 'compact' && (
                        <CardContent className="pt-0 px-3 pb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              {folder.demos.length} demos
                            </span>
                            <span className="text-xs text-gray-500">
                              {folder.demos.reduce((sum, demo) => sum + demo.page_views, 0)} views
                            </span>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
                
                {/* Show More/Less for Global Folders */}
                {globalFolders.length > maxFoldersToShow && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllGlobalFolders(!showAllGlobalFolders)}
                      className="bg-white hover:bg-gray-50 text-gray-600"
                    >
                      {showAllGlobalFolders ? (
                        <>Show Less ({maxFoldersToShow} of {globalFolders.length})</>
                      ) : (
                        <>Show All {globalFolders.length} Global Folders</>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Personal Folders Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowPersonalFolders(!showPersonalFolders)}
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg p-2 -ml-2 transition-colors"
            >
              <div className={`transition-transform duration-200 ${showPersonalFolders ? 'rotate-90' : ''}`}>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-black">Your Personal Folders</h3>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                {folders.length}
              </Badge>
            </button>
          </div>
          
          {showPersonalFolders && (
            <>
              <div className={`grid gap-3 ${
                folderViewMode === 'compact' 
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {folders
                  .slice(0, showAllPersonalFolders ? folders.length : maxFoldersToShow)
                  .map((folder) => (
                <Card
                  key={folder.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedFolder === folder.id 
                      ? 'ring-2 ring-black bg-gray-50' 
                      : 'hover:bg-gray-50'
                  } ${folderViewMode === 'compact' ? 'h-20' : 'h-24'}`}
                  onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
                >
                  <CardHeader className={`${folderViewMode === 'compact' ? 'pb-1 px-3 pt-2' : 'pb-2'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {selectedFolder === folder.id ? (
                          <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Folder className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        )}
                        <CardTitle className={`${folderViewMode === 'compact' ? 'text-sm' : 'text-base'} truncate`}>
                          {folder.name}
                        </CardTitle>
                      </div>
                      {folder.id !== 'unorganized' && folderViewMode === 'detailed' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white hover:bg-gray-100">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => deleteFolder(folder.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Folder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  {folderViewMode === 'detailed' && (
                    <CardContent className="pt-0 px-3 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          {folder.demos.length} demo{folder.demos.length !== 1 ? 's' : ''}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {folder.demos.reduce((sum, demo) => sum + demo.page_views, 0)} views
                        </Badge>
                      </div>
                      {folder.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{folder.description}</p>
                      )}
                    </CardContent>
                  )}
                  {folderViewMode === 'compact' && (
                    <CardContent className="pt-0 px-3 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          {folder.demos.length} demos
                        </span>
                        <span className="text-xs text-gray-500">
                          {folder.demos.reduce((sum, demo) => sum + demo.page_views, 0)} views
                        </span>
                      </div>
                    </CardContent>
                  )}
                </Card>
                ))}
              </div>
              
              {/* Show More/Less for Personal Folders */}
              {folders.length > maxFoldersToShow && (
                <div className="text-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllPersonalFolders(!showAllPersonalFolders)}
                    className="bg-white hover:bg-gray-50 text-gray-600"
                  >
                    {showAllPersonalFolders ? (
                      <>Show Less ({maxFoldersToShow} of {folders.length})</>
                    ) : (
                      <>Show All {folders.length} Personal Folders</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {selectedFolder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFolder(null)}
              className="whitespace-nowrap bg-white"
            >
              Show All
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="name">Alphabetical</option>
          </select>
          
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`p-2 bg-white hover:bg-gray-50 ${viewMode === 'grid' ? 'bg-gray-50' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`p-2 bg-white hover:bg-gray-50 ${viewMode === 'list' ? 'bg-gray-50' : ''}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Current View Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedFolder ? (
            <>
              <FolderOpen className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                Showing demos in "{folders.find(f => f.id === selectedFolder)?.name}"
              </span>
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                Showing all favorites
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {displayedDemos.length} demo{displayedDemos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Demos Display */}
      {displayedDemos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Heart className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {selectedFolder ? 'No demos in this folder' : 'No favorites yet'}
          </h3>
          <p className="text-gray-500">
            {selectedFolder 
              ? 'This folder is empty. Move some demos here to organize them.'
              : 'Start favoriting demos to build your personal collection'
            }
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {displayedDemos.map((demo) => (
            <div key={demo.id} className="relative group">
              <DemoCard
                demo={demo}
                onViewIncrement={onViewIncrement}
                onUpdate={onDemoUpdate}
                onDelete={onDemoDelete}
                onToggleFavorite={onToggleFavorite}
                isFavorited={isFavorited ? isFavorited(demo.id) : true}
                onPromptOrganize={(demoId) => {
                  // Show folder selection for organizing
                  const folder = folders.find(f => f.id !== 'unorganized');
                  if (folder) {
                    moveToFolder(demoId, folder.id);
                  }
                }}
              />
              
              {/* Folder Move Menu */}
              {folders.length > 1 && (
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
                      >
                        <FolderOpen className="h-4 w-4 text-blue-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => moveToFolder(demo.id, null)}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        Move to Unorganized
                      </DropdownMenuItem>
                      {folders.filter(f => f.id !== 'unorganized').map(folder => (
                        <DropdownMenuItem 
                          key={folder.id}
                          onClick={() => moveToFolder(demo.id, folder.id)}
                        >
                          <Folder className="mr-2 h-4 w-4" />
                          Move to {folder.name}
                        </DropdownMenuItem>
                      ))}
                      {globalFolders.map(folder => (
                        <DropdownMenuItem 
                          key={folder.id}
                          onClick={() => moveToFolder(demo.id, folder.id)}
                        >
                          <Folder className="mr-2 h-4 w-4" />
                          Move to {folder.name} (Global)
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="[&>button.absolute]:bg-white [&>button.absolute]:text-black [&>button.absolute:hover]:bg-gray-100 [&>button.absolute]:rounded-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Organize your favorite demos into folders
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
            
            <div>
              <Label htmlFor="folderDescription">Description (optional)</Label>
              <Input
                id="folderDescription"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Enter folder description"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateFolder(false)}
                className="bg-white"
              >
                Cancel
              </Button>
              <Button
                onClick={createFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
                className="bg-white hover:bg-gray-50 text-black"
              >
                {isCreatingFolder ? 'Creating...' : 'Create Folder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Global Folder Dialog */}
      <Dialog open={showCreateGlobalFolder} onOpenChange={setShowCreateGlobalFolder}>
        <DialogContent className="[&>button.absolute]:bg-white [&>button.absolute]:text-black [&>button.absolute:hover]:bg-gray-100 [&>button.absolute]:rounded-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Create Global Folder
            </DialogTitle>
            <DialogDescription>
              Create a folder that all users can see and use to organize demos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medium">Super Admin Feature</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                This folder will be visible to all users and can be used by anyone to organize their favorites.
              </p>
            </div>
            
            <div>
              <Label htmlFor="globalFolderName">Folder Name</Label>
              <Input
                id="globalFolderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Enterprise Demos, Quick Wins"
              />
            </div>
            
            <div>
              <Label htmlFor="globalFolderDescription">Description</Label>
              <Input
                id="globalFolderDescription"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="e.g., High-impact demos for enterprise presentations"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateGlobalFolder(false)}
                className="bg-white"
              >
                Cancel
              </Button>
              <Button
                onClick={createGlobalFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
                className="bg-gray-800 hover:bg-gray-900 text-white"
              >
                {isCreatingFolder ? 'Creating...' : 'Create Global Folder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}