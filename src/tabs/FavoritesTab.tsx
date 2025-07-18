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
            className="w-full p-4 text-left rounded-lg border-2 border-dashed border-