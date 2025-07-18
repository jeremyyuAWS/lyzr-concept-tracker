import { useState, useEffect } from 'react';
import { favoritesService } from '@/lib/supabase';
import { Demo } from '@/types/demo';

export function useFavorites() {
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [favoritesDemos, setFavoritesDemos] = useState<Demo[]>([]);
  const [favoriteFolders, setFavoriteFolders] = useState<any[]>([]);
  const [unorganizedFavorites, setUnorganizedFavorites] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's favorites on mount
  useEffect(() => {
    loadUserFavorites();
    loadFavoritesWithFolders();
  }, []);

  const loadUserFavorites = async () => {
    try {
      setLoading(true);
      const favorites = await favoritesService.getUserFavorites();
      setUserFavorites(favorites);
    } catch (err) {
      console.error('Error loading user favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const loadFavoritesWithFolders = async () => {
    try {
      console.log('🔍 Loading favorites with folders...');
      const { folders, unorganized } = await favoritesService.getFavoritesWithFolders();
      console.log('✅ Folders loaded:', folders?.length || 0);
      console.log('✅ Unorganized loaded:', unorganized?.length || 0);
      
      setFavoriteFolders(folders);
      setUnorganizedFavorites(unorganized);
      
      // Also set the combined demos for backward compatibility
      const allDemos = [
        ...(folders?.flatMap((f: any) => f.demos || []) || []),
        ...(unorganized || [])
      ];
      console.log('✅ Combined demos:', allDemos.length);
      setFavoritesDemos(allDemos);
    } catch (err) {
      console.error('Error loading favorite demos:', err);
      setError(`Failed to load favorite demos: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // Set empty arrays on error to prevent undefined issues
      setFavoriteFolders([]);
      setUnorganizedFavorites([]);
      setFavoritesDemos([]);
    }
  };

  const toggleFavorite = async (demoId: string): Promise<boolean> => {
    try {
      console.log('🔍 Toggling favorite for demo:', demoId);
      const isFavorited = await favoritesService.toggleFavorite(demoId);
      console.log('✅ Favorite toggled, result:', isFavorited);
      
      if (isFavorited) {
        // Add to favorites
        setUserFavorites(prev => [...prev, demoId]);
      } else {
        // Remove from favorites
        setUserFavorites(prev => prev.filter(id => id !== demoId));
        setFavoritesDemos(prev => prev.filter(demo => demo.id !== demoId));
        setUnorganizedFavorites(prev => prev.filter(demo => demo.id !== demoId));
        // Also remove from folders
        setFavoriteFolders(prev => prev.map(folder => ({
          ...folder,
          demos: folder.demos.filter((demo: Demo) => demo.id !== demoId)
        })));
      }
      
      // Refresh favorites demos list
      setTimeout(() => loadFavoritesWithFolders(), 100); // Small delay to ensure DB is updated
      
      return isFavorited;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      throw err;
    }
  };

  const isFavorited = (demoId: string): boolean => {
    const result = userFavorites.includes(demoId);
    console.log('🔍 Checking if favorited:', demoId, 'Result:', result);
    return result;
  };

  const refetch = () => {
    console.log('🔍 Refetching favorites data...');
    loadUserFavorites();
    loadFavoritesWithFolders();
  };

  return {
    userFavorites,
    favoritesDemos,
    favoriteFolders,
    unorganizedFavorites,
    loading,
    error,
    toggleFavorite,
    isFavorited,
    refetch
  };
}