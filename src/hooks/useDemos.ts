import { useState, useEffect } from 'react';
import { useCallback, useMemo } from 'react';
import { demoService } from '@/lib/supabase';
import { Demo } from '@/types/demo';

export function useDemos() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addDebugInfo = (message: string) => {
    console.log('🔍 DEMOS DEBUG:', message);
  };

  const fetchDemos = useCallback(async () => {
    try {
      addDebugInfo('Starting demo fetch');
      setLoading(true);
      setError(null);
      const data = await demoService.getAllDemos();
      addDebugInfo(`Demos fetched successfully: ${data.length} demos`);
      setDemos(data);
    } catch (err) {
      addDebugInfo(`Demo fetch failed: ${err}`);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load demos';
      
      // Provide specific guidance for common errors
      if (errorMessage.includes('Failed to fetch')) {
        setError(`Database connection failed. This usually means:
        
1. Missing environment variables (check .env file)
2. Supabase project is paused/inactive
3. Network connectivity issue
4. Invalid Supabase URL or API key

Original error: ${errorMessage}`);
      } else if (errorMessage.includes('Missing Supabase environment variables')) {
        setError(errorMessage);
      } else {
        setError(`Error loading demos: ${errorMessage}`);
      }
      console.error('Error fetching demos:', err);
    } finally {
      addDebugInfo('Demo fetch completed, setting loading to false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    addDebugInfo('useDemos hook initialized, starting fetch');
    fetchDemos();
  }, [fetchDemos]);

  const addDemo = useCallback(async (demoData: Omit<Demo, 'id' | 'created_at' | 'page_views'>) => {
    try {
      const newDemo = await demoService.addDemo(demoData);
      setDemos(prev => [newDemo, ...prev]);
      return newDemo;
    } catch (err) {
      console.error('Error adding demo:', err);
      throw err;
    }
  }, []);

  const incrementPageViews = useCallback((demoId: string) => {
    setDemos(prev =>
      prev.map(demo =>
        demo.id === demoId
          ? { ...demo, page_views: demo.page_views + 1 }
          : demo
      )
    );
  }, []);

  const refetch = useCallback(() => {
    fetchDemos();
  }, [fetchDemos]);

  const updateDemo = useCallback((updatedDemo: Demo) => {
    setDemos(prev =>
      prev.map(demo =>
        demo.id === updatedDemo.id ? updatedDemo : demo
      )
    );
  }, []);

  const deleteDemo = useCallback((demoId: string) => {
    setDemos(prev => prev.filter(demo => demo.id !== demoId));
  }, []);

  // Memoized computed values
  const memoizedStats = useMemo(() => {
    const totalViews = demos.reduce((sum, demo) => sum + demo.page_views, 0);
    const featuredCount = demos.filter(demo => demo.is_featured).length;
    const avgViews = demos.length > 0 ? Math.round(totalViews / demos.length) : 0;
    
    return {
      totalDemos: demos.length,
      totalViews,
      featuredCount,
      avgViews
    };
  }, [demos]);

  return {
    demos,
    loading,
    error,
    addDemo,
    incrementPageViews,
    updateDemo,
    deleteDemo,
    refetch,
    stats: memoizedStats
  };
}