import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/lib/supabase';

export function useSessionTracking() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const activityTimeRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());

  // Start session when user is authenticated
  useEffect(() => {
    if (user && !sessionId) {
      startSession();
    }
    
    // Cleanup on unmount
    return () => {
      if (sessionId) {
        endSession();
      }
    };
  }, [user]);

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from tab
        if (sessionId) {
          logActivity('page_blur', 'page', undefined, { 
            timeSpent: Date.now() - activityTimeRef.current 
          });
        }
      } else {
        // User returned to tab
        activityTimeRef.current = Date.now();
        if (sessionId) {
          logActivity('page_focus', 'page');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionId]);

  // Track mouse movement and clicks
  useEffect(() => {
    if (!sessionId) return;

    let mouseIdleTimer: NodeJS.Timeout;
    let lastMouseMove = Date.now();

    const handleMouseMove = () => {
      lastMouseMove = Date.now();
      clearTimeout(mouseIdleTimer);
      
      // Set idle timer for 30 seconds
      mouseIdleTimer = setTimeout(() => {
        logActivity('mouse_idle', 'interaction', undefined, {
          idleDuration: Date.now() - lastMouseMove
        });
      }, 30000);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const elementType = target.tagName.toLowerCase();
      const elementId = target.id;
      const elementClass = target.className;
      
      logActivity('click', 'interaction', undefined, {
        elementType,
        elementId,
        elementClass,
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      clearTimeout(mouseIdleTimer);
    };
  }, [sessionId]);

  const startSession = async () => {
    if (!user || isTracking) return;

    try {
      setIsTracking(true);
      const userAgent = navigator.userAgent;
      const referrer = document.referrer;
      
      const newSessionId = await analyticsService.startSession(userAgent, undefined, referrer);
      setSessionId(newSessionId);
      sessionStartRef.current = Date.now();
      
      console.log('🎯 Session started:', newSessionId);
    } catch (error) {
      console.error('Failed to start session:', error);
      setIsTracking(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      // Log final session activity
      const sessionDuration = Date.now() - sessionStartRef.current;
      await logActivity('session_end', 'session', undefined, {
        duration: sessionDuration,
        endTime: Date.now()
      });

      await analyticsService.endSession(sessionId);
      console.log('🏁 Session ended:', sessionId);
      
      setSessionId(null);
      setIsTracking(false);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const logActivity = async (
    activityType: string,
    resourceType: string,
    resourceId?: string,
    activityData?: any,
    durationMs?: number
  ) => {
    if (!sessionId) return;

    try {
      await analyticsService.logActivity(
        sessionId,
        activityType,
        resourceType,
        resourceId,
        activityData,
        durationMs
      );
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const trackDemoView = (demoId: string, demoTitle: string) => {
    logActivity('view_demo', 'demo', demoId, {
      title: demoTitle,
      timestamp: Date.now()
    });
  };

  const trackDemoFavorite = (demoId: string, demoTitle: string, isFavorited: boolean) => {
    logActivity('favorite_demo', 'demo', demoId, {
      title: demoTitle,
      action: isFavorited ? 'add' : 'remove',
      timestamp: Date.now()
    });
  };

  const trackDemoTryApp = (demoId: string, demoTitle: string, url: string) => {
    logActivity('try_app', 'demo', demoId, {
      title: demoTitle,
      url,
      timestamp: Date.now()
    });
  };

  const trackSearch = (searchTerm: string, resultsCount: number) => {
    logActivity('search', 'search', undefined, {
      query: searchTerm,
      results: resultsCount,
      timestamp: Date.now()
    });
  };

  const trackFilter = (filterType: string, filterValue: string) => {
    logActivity('filter', 'filter', undefined, {
      type: filterType,
      value: filterValue,
      timestamp: Date.now()
    });
  };

  const trackTabChange = (tabName: string) => {
    logActivity('tab_change', 'navigation', undefined, {
      tab: tabName,
      timestamp: Date.now()
    });
  };

  return {
    sessionId,
    isTracking,
    logActivity,
    trackDemoView,
    trackDemoFavorite,
    trackDemoTryApp,
    trackSearch,
    trackFilter,
    trackTabChange
  };
}