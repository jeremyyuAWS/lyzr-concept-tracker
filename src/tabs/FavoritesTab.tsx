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
import { Checkbox } from '@/components/ui/checkbox';
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
  GripVertical,
  ArrowRight,
  CheckSquare,
  Square,
  FolderInput,
  Zap,
  Target,
  Users
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

// Quick Move Modal Component
function QuickMoveModal({ 
  isOpen, 
  onClose, 
  selectedDemos, 
  folders, 
  onMoveToFolder,
  onCreateNewFolder
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDemos: Demo[];
  folders: FavoriteFolder[];
  onMoveToFolder: (folderId?: string) => void;
  onCreateNewFolder: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="[&>button.absolute]:bg-white [&>button.absolute]:text-black [&>button.absolute:hover]:bg-gray-100 [&>button.absolute]:rounded-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="w-5 h-5" />
            Move {selectedDemos.length} Demo{selectedDemos.length > 1 ? 's' : ''} to Folder
          </DialogTitle>
          <DialogDescription>
            Choose a destination folder for the selected demos
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {/* Create New Folder Button */}
          <button
            onClick={onCreateNewFolder}
            className="w-full p-4 text-left rounded-lg border-2 border-dashed border-gray-400 hover:border-gray-500 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Create New Folder</p>
                <p className="text-sm text-gray-500">Organize your favorites</p>
              </div>
            </div>
          </button>
          
          {/* Existing Folders */}
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onMoveToFolder(folder.id)}
              className="w-full p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{folder.name}</p>
                  <p className="text-sm text-gray-500">{folder.demos.length} demos</p>
                </div>
              </div>
            </button>
          ))}
          
          {/* No Folder Option */}
          <button
            onClick={() => onMoveToFolder(undefined)}
            className="w-full p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">All Favorites</p>
                <p className="text-sm text-gray-500">Move to main favorites</p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Sortable Demo Component
function SortableDemo({ demo, onViewIncrement, onToggleFavorite, isFavorited }: {
  demo: Demo;
  onViewIncrement?: (id: string) => void;
  onToggleFavorite?: (demoId: string) => void;
  isFavorited?: (demoId: string) => boolean;
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
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="pl-8">
        <DemoCard
          demo={demo}
          onViewIncrement={onViewIncrement}
          onToggleFavorite={onToggleFavorite}
          isFavorited={isFavorited}
        />
      </div>
    </div>
  );
}

// Draggable Demo Component
function DraggableDemo({ demo, onViewIncrement, onToggleFavorite, isFavorited, onSelect, isSelected }: {
  demo: Demo;
  onViewIncrement?: (id: string) => void;
  onToggleFavorite?: (demoId: string) => void;
  isFavorited?: (demoId: string) => boolean;
  onSelect?: (demoId: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div className="relative group">
      <div className="absolute left-2 top-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect?.(demo.id)}
          className="bg-white border-gray-300"
        />
      </div>
      <div className="pl-8">
        <DemoCard
          demo={demo}
          onViewIncrement={onViewIncrement}
          onToggleFavorite={onToggleFavorite}
          isFavorited={isFavorited}
        />
      </div>
    </div>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [selectedDemos, setSelectedDemos] = useState<string[]>([]);
  const [showQuickMove, setShowQuickMove] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

}