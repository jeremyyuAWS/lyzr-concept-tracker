import { useState } from 'react';
import { Demo } from '@/types/demo';
import { DemoCard } from '@/components/DemoCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Search, Filter, Grid, List, Star, Clock, TrendingUp } from 'lucide-react';

interface FavoritesTabProps {
  favoritesDemos: Demo[];
  loading: boolean;
  error: string | null;
  onViewIncrement?: (id: string) => void;
  onDemoUpdate?: (updatedDemo: Demo) => void;
  onDemoDelete?: (demoId: string) => void;
  onRetry?: () => void;
  onToggleFavorite?: (demoId: string) => void;
}

export function FavoritesTab({ 
  favoritesDemos, 
  loading, 
  error, 
  onViewIncrement, 
  onDemoUpdate, 
  onDemoDelete, 
  onRetry,
  onToggleFavorite 
}: FavoritesTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent');

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
        onRetry={onRetry}
        className="max-w-md mx-auto"
      />
    );
  }

  // Sort demos based on selected option
  const sortedDemos = [...favoritesDemos].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.page_views - a.page_views;
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalViews = favoritesDemos.reduce((sum, demo) => sum + demo.page_views, 0);
  const averageViews = favoritesDemos.length > 0 ? Math.round(totalViews / favoritesDemos.length) : 0;

  return (
    <div className="w-full space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-pink-50 to-red-50 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-800">
            <Heart className="w-6 h-6" />
            Your Favorite Demos
          </CardTitle>
          <CardDescription className="text-pink-700">
            Demos you've marked as favorites for quick access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-600" />
              <span className="font-medium">{favoritesDemos.length} favorites</span>
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortBy('recent')}
                className={`text-xs px-3 py-1 ${sortBy === 'recent' ? 'bg-pink-100 text-pink-800' : 'text-gray-600'}`}
              >
                <Clock className="w-3 h-3 mr-1" />
                Recent
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortBy('popular')}
                className={`text-xs px-3 py-1 ${sortBy === 'popular' ? 'bg-pink-100 text-pink-800' : 'text-gray-600'}`}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Popular
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortBy('alphabetical')}
                className={`text-xs px-3 py-1 ${sortBy === 'alphabetical' ? 'bg-pink-100 text-pink-800' : 'text-gray-600'}`}
              >
                A-Z
              </Button>
            </div>
          </div>
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

      {/* Demos Grid/List */}
      {favoritesDemos.length === 0 ? (
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
            <span>Tip: Use favorites to bookmark demos for client presentations</span>
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {sortedDemos.map((demo) => (
            <DemoCard
              key={demo.id}
              demo={demo}
              onViewIncrement={onViewIncrement}
              onUpdate={onDemoUpdate}
              onDelete={onDemoDelete}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}