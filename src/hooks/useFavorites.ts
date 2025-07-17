import { useState, useEffect } from 'react';
import { favoritesService } from '@/lib/supabase';
import { Demo } from '@/types/demo';

export function useFavorites() {
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [favoritesDemos, setFavoritesDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's favorites on mount
  useEffect(() => {
    loadUserFavorites();
    loadFavoritesDemos();
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

  const loadFavoritesDemos = async () => {
    try {
      const demos = await favoritesService.getFavoritesDemos();
      setFavoritesDemos(demos);
    } catch (err) {
      console.error('Error loading favorite demos:', err);
      setError('Failed to load favorite demos');
    }
  };

  const toggleFavorite = async (demoId: string): Promise<boolean> => {
    try {
      const isFavorited = await favoritesService.toggleFavorite(demoId);
      
      if (isFavorited) {
        // Add to favorites
        setUserFavorites(prev => [...prev, demoId]);
      } else {
        // Remove from favorites
        setUserFavorites(prev => prev.filter(id => id !== demoId));
        setFavoritesDemos(prev => prev.filter(demo => demo.id !== demoId));
      }
      
      // Refresh favorites demos list
      await loadFavoritesDemos();
      
      return isFavorited;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      throw err;
    }
  };

  const isFavorited = (demoId: string): boolean => {
    return userFavorites.includes(demoId);
  };

  const refetch = () => {
    loadUserFavorites();
    loadFavoritesDemos();
  };

  return {
    userFavorites,
    favoritesDemos,
    loading,
    error,
    toggleFavorite,
    isFavorited,
    refetch
  };
}