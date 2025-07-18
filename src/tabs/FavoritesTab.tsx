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
  Filter, 
  Grid, 
  List, 
  Star, 
  Clock, 
  TrendingUp, 
  FolderPlus,
  Folder,
  FolderOpen,
  Plus,
  Edit3,
  Trash2,
  MoreHorizontal,
  Move,
  GripVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { favoritesService } from '@/lib/supabase';
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
  icon: string;
  demos: Demo[];
  sort_order: number;
}

// Draggable Demo Card Component
function DraggableDemo({ demo, onViewIncrement, onDemoUpdate, onDemoDelete, onToggleFavorite, isFavorited }: {
  demo: Demo;
  onViewIncrement?: (id: string) => void;
  onDemoUpdate?: (updatedDemo: Demo) => void;
  onDemoDelete?: (demoId: string) => void;
  onToggleFavorite?: (demoId: string) => void;
  isFavorited?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: demo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <div className="p-1 bg-white/90 rounded border border-gray-200 shadow-sm">
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      <DemoCard
        demo={demo}
        onViewIncrement={onViewIncrement}
        onUpdate={onDemoUpdate}
        onDelete={onDemoDelete}
        onToggleFavorite={onToggleFavorite}
        isFavorited={isFavorited}
      />
    </div>
  );
}

// Folder Component
function FavoriteFolder({ 
  folder, 
  onViewIncrement, 
  onDemoUpdate, 
  onDemoDelete, 
  onToggleFavorite, 
  isFavorited,
  onEditFolder,
  onDeleteFolder
}: {
  folder: FavoriteFolder;
  onViewIncrement?: (id: string) => void;
  onDemoUpdate?: (updatedDemo: Demo) => void;
  onDemoDelete?: (demoId: string) => void;
  onToggleFavorite?: (demoId: string) => void;
  isFavorited?: (demoId: string) => boolean;
  onEditFolder: (folder: FavoriteFolder) => void;
  onDeleteFolder: (folderId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    setNodeRef,
    isOver,
  } = useSortable({ 
    id: `folder-${folder.id}`,
    data: { type: 'folder', folder }
  });

  const totalViews = folder.demos.reduce((sum, demo) => sum + demo.page_views, 0);

  return (
    <Card 
      ref={setNodeRef}
      className={`transition-all duration-200 ${
        isOver ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
      }`}
    >
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: folder.color + '20', color: folder.color }}
            >
              {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
                {folder.name}
                <Badge variant="outline" className="text-xs">
                  {folder.demos.length}
                </Badge>
              </CardTitle>
              {folder.description && (
                <CardDescription className="text-sm text-gray-600">
                  {folder.description}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right text-sm text-gray-500">
              <div>{totalViews.toLocaleString()} views</div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEditFolder(folder);
                }}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder.id);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {folder.demos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Drag demos here to organize them</p>
            </div>
          ) : (
            <SortableContext items={folder.demos.map(d => d.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {folder.demos.map((demo) => (
                  <DraggableDemo
                    key={demo.id}
                    demo={demo}
                    onViewIncrement={onViewIncrement}
                    onDemoUpdate={onDemoUpdate}
                    onDemoDelete={onDemoDelete}
                    onToggleFavorite={onToggleFavorite}
                    isFavorited={isFavorited ? isFavorited(demo.id) : true}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function FavoritesTab({ 
  favoritesDemos, 
  loading, 
  error, 
  onViewIncrement, 
  onDemoUpdate, 
  onDemoDelete, 
  onRetry,
  onToggleFavorite,
  isFavorited
}: FavoritesTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [unorganizedDemos, setUnorganizedDemos] = useState<Demo[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FavoriteFolder | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedDemo, setDraggedDemo] = useState<Demo | null>(null);
  
  // Create folder form
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: 'folder'
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load folders and organized favorites
  const loadFoldersAndFavorites = async () => {
    setFoldersLoading(true);
    try {
      const { folders: foldersData, unorganized } = await favoritesService.getFavoritesWithFolders();
      setFolders(foldersData);
      setUnorganizedDemos(unorganized);
    } catch (error) {
      console.error('Error loading folders:', error);
      // Fallback to showing all favorites as unorganized
      setFolders([]);
      setUnorganizedDemos(favoritesDemos);
    } finally {
      setFoldersLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && favoritesDemos.length > 0) {
      loadFoldersAndFavorites();
    }
  }, [loading, favoritesDemos]);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the demo being dragged
    const demo = [...unorganizedDemos, ...folders.flatMap(f => f.demos)]
      .find(d => d.id === active.id);
    setDraggedDemo(demo || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedDemo(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    try {
      if (overId.startsWith('folder-')) {
        // Dropped on a folder
        const folderId = overId.replace('folder-', '');
        await favoritesService.moveFavoriteToFolder(activeId, folderId);
        toast.success('Demo moved to folder');
      } else if (overId === 'unorganized') {
        // Dropped on unorganized area
        await favoritesService.moveFavoriteToFolder(activeId, undefined);
        toast.success('Demo moved to unorganized');
      }
      
      // Reload folders
      await loadFoldersAndFavorites();
    } catch (error) {
      console.error('Error moving demo:', error);
      toast.error('Failed to move demo');
    }
  };

  // Folder management
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderForm.name.trim()) return;
    
    try {
      await favoritesService.createFolder(
        folderForm.name,
        folderForm.description || undefined,
        folderForm.color,
        folderForm.icon
      );
      
      toast.success('Folder created successfully');
      setShowCreateFolder(false);
      setFolderForm({ name: '', description: '', color: '#6366f1', icon: 'folder' });
      await loadFoldersAndFavorites();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleEditFolder = (folder: FavoriteFolder) => {
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name,
      description: folder.description || '',
      color: folder.color,
      icon: folder.icon
    });
  };

  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingFolder || !folderForm.name.trim()) return;
    
    try {
      await favoritesService.updateFolder(editingFolder.id, {
        name: folderForm.name,
        description: folderForm.description || null,
        color: folderForm.color,
        icon: folderForm.icon
      });
      
      toast.success('Folder updated successfully');
      setEditingFolder(null);
      setFolderForm({ name: '', description: '', color: '#6366f1', icon: 'folder' });
      await loadFoldersAndFavorites();
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await favoritesService.deleteFolder(folderId);
      toast.success('Folder deleted successfully');
      await loadFoldersAndFavorites();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  if (loading || foldersLoading) {
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
        onRetry={onRetry}
        className="max-w-md mx-auto"
      />
    );
  }

  const totalFavorites = folders.reduce((sum, folder) => sum + folder.demos.length, 0) + unorganizedDemos.length;
  const totalViews = [...folders.flatMap(f => f.demos), ...unorganizedDemos].reduce((sum, demo) => sum + demo.page_views, 0);
  const averageViews = totalFavorites > 0 ? Math.round(totalViews / totalFavorites) : 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full space-y-6">
        {/* Header Card */}
        <Card className="bg-gradient-to-r from-pink-50 to-red-50 border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-800">
              <Heart className="w-6 h-6" />
              Your Favorite Demos
            </CardTitle>
            <CardDescription className="text-pink-700">
              Organize your favorites into custom folders and collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-600" />
                <span className="font-medium">{totalFavorites} favorites</span>
              </div>
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-pink-600" />
                <span>{folders.length} folders</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-600" />
                <span>{totalViews.toLocaleString()} total views</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-pink-600" />
                <span>{averageViews.toLocaleString()} avg views</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowCreateFolder(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white"
              size="sm"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Folders */}
        {folders.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Your Folders
            </h3>
            <SortableContext items={folders.map(f => `folder-${f.id}`)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {folders.map((folder) => (
                  <FavoriteFolder
                    key={folder.id}
                    folder={folder}
                    onViewIncrement={onViewIncrement}
                    onDemoUpdate={onDemoUpdate}
                    onDemoDelete={onDemoDelete}
                    onToggleFavorite={onToggleFavorite}
                    isFavorited={isFavorited}
                    onEditFolder={handleEditFolder}
                    onDeleteFolder={handleDeleteFolder}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        )}

        {/* Unorganized Demos */}
        {unorganizedDemos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Heart className="w-5 h-5" />
              {folders.length > 0 ? 'Unorganized Favorites' : 'All Favorites'}
            </h3>
            
            <Card className="border-dashed border-2 border-gray-300 hover:border-pink-400 transition-colors">
              <CardContent className="p-6">
                <SortableContext items={unorganizedDemos.map(d => d.id)} strategy={verticalListSortingStrategy}>
                  <div className={
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                      : 'space-y-4'
                  }>
                    {unorganizedDemos.map((demo) => (
                      <DraggableDemo
                        key={demo.id}
                        demo={demo}
                        onViewIncrement={onViewIncrement}
                        onDemoUpdate={onDemoUpdate}
                        onDemoDelete={onDemoDelete}
                        onToggleFavorite={onToggleFavorite}
                        isFavorited={isFavorited ? isFavorited(demo.id) : true}
                      />
                    ))}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {totalFavorites === 0 && (
          <div className="text-center py-16">
            <div className="text-pink-300 mb-6">
              <Heart className="w-20 h-20 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-medium text-gray-600 mb-3">No favorites yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Browse the catalog and click the heart icon on demos you want to save for quick access.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Heart className="w-4 h-4" />
              <span>Tip: Use folders to organize demos by client, technology, or use case</span>
            </div>
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && draggedDemo ? (
            <div className="transform rotate-3 scale-105 opacity-80">
              <DemoCard
                demo={draggedDemo}
                onViewIncrement={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
                onToggleFavorite={() => {}}
                isFavorited={true}
              />
            </div>
          ) : null}
        </DragOverlay>

        {/* Create/Edit Folder Dialog */}
        <Dialog open={showCreateFolder || !!editingFolder} onOpenChange={(open) => {
          if (!open) {
            setShowCreateFolder(false);
            setEditingFolder(null);
            setFolderForm({ name: '', description: '', color: '#6366f1', icon: 'folder' });
          }
        }}>
          <DialogContent className="[&>button.absolute]:bg-white [&>button.absolute]:text-black [&>button.absolute:hover]:bg-gray-100 [&>button.absolute]:rounded-md">
            <DialogHeader>
              <DialogTitle>{editingFolder ? 'Edit Folder' : 'Create New Folder'}</DialogTitle>
              <DialogDescription>
                {editingFolder ? 'Update your folder details' : 'Organize your favorites into a custom folder'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folderName">Folder Name *</Label>
                <Input
                  id="folderName"
                  value={folderForm.name}
                  onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Client Demos, AI Tools, etc."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="folderDescription">Description</Label>
                <Input
                  id="folderDescription"
                  value={folderForm.description}
                  onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="folderColor">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="folderColor"
                      value={folderForm.color}
                      onChange={(e) => setFolderForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 rounded border border-gray-300"
                    />
                    <Input
                      value={folderForm.color}
                      onChange={(e) => setFolderForm(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="folderIcon">Icon</Label>
                  <Input
                    id="folderIcon"
                    value={folderForm.icon}
                    onChange={(e) => setFolderForm(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="folder"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="bg-white hover:bg-gray-50 text-black border-gray-300"
                  onClick={() => {
                    setShowCreateFolder(false);
                    setEditingFolder(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-white hover:bg-gray-50 text-black border border-gray-300"
                >
                  {editingFolder ? 'Update Folder' : 'Create Folder'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
}