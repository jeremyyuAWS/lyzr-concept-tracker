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
  TrendingUp
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
  
  // Folder management
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

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
        .order('sort_order', { ascending: true });

      if (foldersError) throw foldersError;

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

      // Create folder objects with demos
      const foldersWithDemos = (foldersData || []).map(folder => ({
        ...folder,
        demos: folderMap.get(folder.id) || []
      }));

      // Add unorganized demos
      const unorganizedDemos = folderMap.get('unorganized') || [];
      
      setFavorites(favoriteDemos);
      setFolders(foldersWithDemos);
      
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
          name: newFolderName,
          description: newFolderDescription,
          color: '#6366f1',
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
    try {
      // Move all demos in this folder to unorganized
      await supabase
        .from('user_favorites')
        .update({ folder_id: null })
        .eq('user_id', user?.id)
        .eq('folder_id', folderId);

      // Delete the folder
      const { error } = await supabase
        .from('favorite_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      await loadFavoritesAndFolders();
      toast.success('Folder deleted successfully!');
    } catch (err) {
      console.error('Error deleting folder:', err);
      toast.error('Failed to delete folder');
    }
  };

  // Filter and sort logic
  const getDisplayedDemos = () => {
    let demosToShow: Demo[] = [];
    
    if (selectedFolder) {
      const folder = folders.find(f => f.id === selectedFolder);
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
        <Button
          onClick={() => setShowCreateFolder(true)}
          className="bg-black hover:bg-gray-800 text-white"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          New Folder
        </Button>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {folders.map((folder) => (
          <Card
            key={folder.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedFolder === folder.id 
                ? 'ring-2 ring-black bg-gray-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedFolder === folder.id ? (
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Folder className="w-5 h-5 text-gray-600" />
                  )}
                  <CardTitle className="text-lg">{folder.name}</CardTitle>
                </div>
                {folder.id !== 'unorganized' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
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
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {folder.demos.length} demo{folder.demos.length !== 1 ? 's' : ''}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {folder.demos.reduce((sum, demo) => sum + demo.page_views, 0)} views
                </Badge>
              </div>
              {folder.description && (
                <p className="text-xs text-gray-500 mt-2">{folder.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
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
              className="whitespace-nowrap"
            >
              Show All
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
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
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
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
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => moveToFolder(demo.id, null)}
                      >
                        Move to Unorganized
                      </DropdownMenuItem>
                      {folders.filter(f => f.id !== 'unorganized').map(folder => (
                        <DropdownMenuItem 
                          key={folder.id}
                          onClick={() => moveToFolder(demo.id, folder.id)}
                        >
                          Move to {folder.name}
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
              >
                Cancel
              </Button>
              <Button
                onClick={createFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
              >
                {isCreatingFolder ? 'Creating...' : 'Create Folder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}