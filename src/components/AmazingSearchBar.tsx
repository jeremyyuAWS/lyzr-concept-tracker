import { useState, useEffect, useRef } from 'react';
import { Demo } from '@/types/demo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  X, 
  Filter, 
  Clock, 
  TrendingUp, 
  Star, 
  Zap,
  ArrowRight,
  Command
} from 'lucide-react';

interface AmazingSearchBarProps {
  demos: Demo[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  onClearFilters: () => void;
}

export function AmazingSearchBar({ 
  demos, 
  searchTerm, 
  onSearchChange, 
  selectedTag, 
  onTagSelect,
  onClearFilters 
}: AmazingSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lyzr-search-history');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Save search to history
  const saveSearchToHistory = (term: string) => {
    if (term.trim() && !searchHistory.includes(term)) {
      const newHistory = [term, ...searchHistory.slice(0, 4)]; // Keep last 5 searches
      setSearchHistory(newHistory);
      localStorage.setItem('lyzr-search-history', JSON.stringify(newHistory));
    }
  };

  // Get search suggestions
  const getSearchSuggestions = () => {
    if (!searchTerm) return [];
    
    const suggestions = new Set<string>();
    const term = searchTerm.toLowerCase();
    
    demos.forEach(demo => {
      // Title suggestions
      if (demo.title.toLowerCase().includes(term)) {
        suggestions.add(demo.title);
      }
      
      // Tag suggestions
      demo.tags.forEach(tag => {
        if (tag.toLowerCase().includes(term)) {
          suggestions.add(tag);
        }
      });
      
      // Owner suggestions
      if (demo.owner.toLowerCase().includes(term)) {
        suggestions.add(`by ${demo.owner}`);
      }
    });
    
    return Array.from(suggestions).slice(0, 6);
  };

  // Get popular tags
  const getPopularTags = () => {
    const tagCounts = demos.reduce((acc, demo) => {
      demo.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([tag]) => tag);
  };

  // Get trending demos (high views)
  const getTrendingDemos = () => {
    return demos
      .filter(demo => demo.page_views > 10)
      .sort((a, b) => b.page_views - a.page_views)
      .slice(0, 4);
  };

  // Handle search submission
  const handleSearchSubmit = (term: string) => {
    onSearchChange(term);
    saveSearchToHistory(term);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Escape to close suggestions
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const suggestions = getSearchSuggestions();
  const popularTags = getPopularTags();
  const trendingDemos = getTrendingDemos();
  const hasActiveFilters = searchTerm || selectedTag;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Main Search Input */}
      <div className={`relative transition-all duration-300 ${
        isFocused 
          ? 'transform scale-[1.02] shadow-2xl' 
          : 'shadow-lg hover:shadow-xl'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-xl opacity-30" />
        
        <div className="relative bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="flex items-center p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className={`transition-colors duration-200 ${
                isFocused ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <Search className="w-6 h-6" />
              </div>
              
              <Input
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => {
                  setIsFocused(true);
                  setShowSuggestions(true);
                }}
                onBlur={() => {
                  setIsFocused(false);
                  // Delay hiding suggestions to allow clicks
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit(searchTerm);
                  }
                }}
                placeholder="Search demos, technologies, or creators..."
                className="border-0 text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              />
              
              <div className="flex items-center gap-2">
                {/* Keyboard shortcut hint */}
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
                
                {/* Clear button */}
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSearchChange('')}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <div className="px-4 pb-3 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Active filters:</span>
                
                {searchTerm && (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    <Search className="w-3 h-3 mr-1" />
                    "{searchTerm}"
                    <button
                      onClick={() => onSearchChange('')}
                      className="ml-1 hover:text-blue-900 bg-white rounded-full p-0.5 hover:bg-blue-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                
                {selectedTag && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    <Filter className="w-3 h-3 mr-1" />
                    {selectedTag}
                    <button
                      onClick={() => onTagSelect(null)}
                      className="ml-1 hover:text-green-900 bg-white rounded-full p-0.5 hover:bg-green-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && isFocused && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-2xl border-0 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              
              {/* Live Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Suggestions</span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchSubmit(suggestion)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 group"
                      >
                        <Search className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                        <span className="text-sm">{suggestion}</span>
                        <ArrowRight className="w-3 h-3 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Search History */}
              {!searchTerm && searchHistory.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Recent searches</span>
                  </div>
                  <div className="space-y-1">
                    {searchHistory.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchSubmit(term)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 group"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{term}</span>
                        <ArrowRight className="w-3 h-3 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Popular Tags */}
              {!searchTerm && (
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Popular technologies</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                        onClick={() => {
                          onTagSelect(tag);
                          setShowSuggestions(false);
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Trending Demos */}
              {!searchTerm && trendingDemos.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Trending demos</span>
                  </div>
                  <div className="space-y-2">
                    {trendingDemos.map((demo) => (
                      <button
                        key={demo.id}
                        onClick={() => handleSearchSubmit(demo.title)}
                        className="w-full text-left p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {demo.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {demo.page_views.toLocaleString()} views • {demo.owner}
                            </p>
                          </div>
                          <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty State */}
              {searchTerm && suggestions.length === 0 && (
                <div className="p-8 text-center">
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No suggestions found</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}