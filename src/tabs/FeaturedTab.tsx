import { useState } from 'react';
import { Demo } from '@/types/demo';
import { DemoCard } from '@/components/DemoCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, Star, TrendingUp, Calendar } from 'lucide-react';

interface FeaturedTabProps {
  demos: Demo[];
  loading: boolean;
  error: string | null;
  onViewIncrement?: (id: string) => void;
  onDemoUpdate?: (updatedDemo: Demo) => void;
  onDemoDelete?: (demoId: string) => void;
  onRetry?: () => void;
  onToggleFavorite?: (demoId: string) => void;
  isFavorited?: (demoId: string) => boolean;
}

export function FeaturedTab({ demos, loading, error, onViewIncrement, onDemoUpdate, onDemoDelete, onRetry, onToggleFavorite, isFavorited }: FeaturedTabProps) {
  const [activeFilter, setActiveFilter] = useState<'featured' | 'recent' | 'trending'>('featured');

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
        title="Failed to load demos"
        message={error}
        onRetry={onRetry}
        className="max-w-md mx-auto"
      />
    );
  }

  // Get demos from the last week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentDemos = demos.filter(demo => 
    new Date(demo.created_at) > oneWeekAgo
  );

  // Get featured demos (admin curated)
  const featuredDemos = demos.filter(demo => demo.is_featured === true);

  // Get trending demos (high views, recent activity)
  const trendingDemos = demos
    .filter(demo => demo.page_views > 10)
    .sort((a, b) => {
      const aScore = a.page_views + (new Date(a.created_at).getTime() / 1000000);
      const bScore = b.page_views + (new Date(b.created_at).getTime() / 1000000);
      return bScore - aScore;
    })
    .slice(0, 6);

  const getFilteredDemos = () => {
    switch (activeFilter) {
      case 'featured':
        return featuredDemos;
      case 'recent':
        return recentDemos;
      case 'trending':
        return trendingDemos;
      default:
        return featuredDemos;
    }
  };

  const filteredDemos = getFilteredDemos();

  const getFilterInfo = () => {
    switch (activeFilter) {
      case 'featured':
        return {
          title: 'Featured Demos',
          description: 'Hand-picked demos showcasing our best work',
          icon: <Star className="w-5 h-5" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'recent':
        return {
          title: 'Recent Demos',
          description: 'New demos published in the last 7 days',
          icon: <Clock className="w-5 h-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'trending':
        return {
          title: 'Trending Demos',
          description: 'Popular demos with high engagement',
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      default:
        return {
          title: 'Featured Demos',
          description: 'Hand-picked demos showcasing our best work',
          icon: <Star className="w-5 h-5" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
    }
  };

  const filterInfo = getFilterInfo();

  return (
    <div className="w-screen max-w-none space-y-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Filter Buttons */}
      <div className="w-full flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveFilter('featured')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
            activeFilter === 'featured' 
              ? 'bg-yellow-50 border-yellow-400 text-yellow-800' 
              : 'bg-white border-gray-200 text-gray-600 hover:border-yellow-500 hover:shadow-md'
          }`}
        >
          <Star className="w-4 h-4" />
          Featured
          <Badge variant="outline" className="ml-1">
            {featuredDemos.length}
          </Badge>
        </button>
        
        <button
          onClick={() => setActiveFilter('recent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
            activeFilter === 'recent' 
              ? 'bg-blue-50 border-blue-400 text-blue-800' 
              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-500 hover:shadow-md'
          }`}
        >
          <Clock className="w-4 h-4" />
          Recent
          <Badge variant="outline" className="ml-1">
            {recentDemos.length}
          </Badge>
        </button>
        
        <button
          onClick={() => setActiveFilter('trending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
            activeFilter === 'trending' 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-white border-gray-200 text-gray-600 hover:border-green-500 hover:shadow-md'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Trending
          <Badge variant="outline" className="ml-1">
            {trendingDemos.length}
          </Badge>
        </button>
      </div>

      {/* Header Card */}
      <Card className={`w-full ${filterInfo.bgColor} ${filterInfo.borderColor}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${filterInfo.color}`}>
            {filterInfo.icon}
            {filterInfo.title}
          </CardTitle>
          <CardDescription className={filterInfo.color.replace('600', '700')}>
            {filterInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{filteredDemos.length} demos</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{filteredDemos.reduce((sum, demo) => sum + demo.page_views, 0)} total views</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demos Grid */}
      {filteredDemos.length === 0 ? (
        <div className="w-full text-center py-12">
          <div className={`${filterInfo.color} mb-4`}>
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No {activeFilter} demos yet
          </h3>
          <p className="text-gray-500 mb-4">
            {activeFilter === 'featured' && 'Admins can feature demos to showcase the best work'}
            {activeFilter === 'recent' && 'New demos will appear here when published'}
            {activeFilter === 'trending' && 'Demos with high engagement will appear here'}
          </p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDemos.map((demo) => (
            <div className="aspect-square">
              <DemoCard
                key={demo.id}
                demo={demo}
                onViewIncrement={onViewIncrement}
                onUpdate={onDemoUpdate}
                onDelete={onDemoDelete}
                onToggleFavorite={onToggleFavorite}
                isFavorited={isFavorited ? isFavorited(demo.id) : false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}