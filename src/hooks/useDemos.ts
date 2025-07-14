import { useState, useEffect } from 'react';
import { demoService } from '@/lib/supabase';
import { Demo } from '@/types/demo';

export function useDemos() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDemos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await demoService.getDemos();
      setDemos(data);
    } catch (err) {
      setError('Failed to load demos');
      console.error('Error fetching demos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemos();
  }, []);

  const addDemo = async (demoData: Omit<Demo, 'id' | 'created_at' | 'page_views'>) => {
    try {
      const newDemo = await demoService.addDemo(demoData);
      setDemos(prev => [newDemo, ...prev]);
      return newDemo;
    } catch (err) {
      console.error('Error adding demo:', err);
      throw err;
    }
  };

  const incrementPageViews = (demoId: string) => {
    setDemos(prev =>
      prev.map(demo =>
        demo.id === demoId
          ? { ...demo, page_views: demo.page_views + 1 }
          : demo
      )
    );
  };

  const refetch = () => {
    fetchDemos();
  };

  const updateDemo = (updatedDemo: Demo) => {
    setDemos(prev =>
      prev.map(demo =>
        demo.id === updatedDemo.id ? updatedDemo : demo
      )
    );
  };

  const deleteDemo = (demoId: string) => {
    setDemos(prev => prev.filter(demo => demo.id !== demoId));
  };

  return {
    demos,
    loading,
    error,
    addDemo,
    incrementPageViews,
    updateDemo,
    deleteDemo,
    refetch
  };
}