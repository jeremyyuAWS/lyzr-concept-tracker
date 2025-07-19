import { useState, useMemo, useCallback } from 'react';
import { Demo } from '@/types/demo';
import { DemoCard } from '@/components/DemoCard';
import { AmazingSearchBar } from '@/components/AmazingSearchBar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Grid, List, Filter, Search } from 'lucide-react';
import React from 'react';

interface CatalogTabProps {
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

const MemoizedDemoCard = React.memo(DemoCard);

export const CatalogTab = React.memo(({ demos, loading, error, onViewIncrement, onDemoUpdate, onDemoDelete, onRetry, onToggleFavorite, isFavorited }: CatalogTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Memoized calculations for performance
  const allTags = useMemo(() => 
    Array.from(new Set(demos.flatMap(demo => demo.tags))).sort(),
    [demos]
  );

  const filteredDemos = useMemo(() => demos.filter(demo => {
    const matchesSearch = demo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         demo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         demo.owner.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || demo.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  }), [demos, searchTerm, selectedTag]);

  const handleTagFilter = useCallback((tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  }, [selectedTag]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedTag(null);
  }, []);

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

  if (demos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Grid className="w-16 h-16 mx-auto mb-4" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">No demo apps yet</h3>
        <p className="text-gray-500 mb-4">Add your first concept demo to get started</p>
        <p className="text-sm text-gray-400">Switch to the "Add Demo" tab to create your first entry</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Amazing Search Bar */}
      <AmazingSearchBar
        demos={demos}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedTag={selectedTag}
        onTagSelect={setSelectedTag}
        onClearFilters={clearFilters}
      />
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`p-2 !bg-gray-50 hover:!bg-gray-100 ${viewMode === 'grid' ? '!bg-gray-100 hover:!bg-gray-200' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`p-2 !bg-gray-50 hover:!bg-gray-100 ${viewMode === 'list' ? '!bg-gray-100 hover:!bg-gray-200' : ''}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          {(searchTerm || selectedTag) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>Filter by tag:</span>
          </div>
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              className={`cursor-pointer hover:bg-blue-50 ${
                selectedTag === tag ? 'bg-black text-white' : 'text-gray-700'
              }`}
              onClick={() => handleTagFilter(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredDemos.length} {filteredDemos.length === 1 ? 'demo' : 'demos'} found
        </p>
        <p className="text-sm text-gray-500">
          Total views: {filteredDemos.reduce((sum, demo) => sum + demo.page_views, 0).toLocaleString()}
        </p>
      </div>

      {filteredDemos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No demos match your filters</h3>
          <p className="text-gray-500">Try adjusting your search or removing filters</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredDemos.map((demo) => (
            <MemoizedDemoCard
              key={demo.id}
              demo={demo}
              onViewIncrement={onViewIncrement}
              onUpdate={onDemoUpdate}
              onDelete={onDemoDelete}
              onToggleFavorite={onToggleFavorite}
              isFavorited={isFavorited ? isFavorited(demo.id) : false}
              onPromptOrganize={undefined}
            />
          ))}
        </div>
      )}
    </div>
  );