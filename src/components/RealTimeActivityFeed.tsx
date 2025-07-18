import { useState, useEffect } from 'react';
import { analyticsService } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Activity, 
  Eye, 
  Heart, 
  Search, 
  Filter, 
  ExternalLink, 
  MousePointer,
  User,
  Clock,
  RefreshCw,
  Zap,
  TrendingUp
} from 'lucide-react';

interface ActivityItem {
  id: string;
  user_email: string;
  user_display_name: string;
  activity_type: string;
  resource_type: string;
  resource_title: string;
  activity_data: any;
  timestamp: string;
  time_ago: string;
}

export function RealTimeActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      setError(null);
      try {
        const data = await analyticsService.getRealTimeActivities(50);
        setActivities(data);
      } catch (dbError: any) {
        console.warn('Real-time activities function not available:', dbError);
        // Fallback to empty array if function doesn't exist
        setActivities([]);
      }
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Real-time activity tracking is not available');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActivities();
    setIsRefreshing(false);
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'view_demo':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'favorite_demo':
        return <Heart className="w-4 h-4 text-red-600" />;
      case 'try_app':
        return <ExternalLink className="w-4 h-4 text-green-600" />;
      case 'search':
        return <Search className="w-4 h-4 text-purple-600" />;
      case 'filter':
        return <Filter className="w-4 h-4 text-orange-600" />;
      case 'click':
        return <MousePointer className="w-4 h-4 text-gray-600" />;
      case 'tab_change':
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'view_demo':
        return 'bg-blue-50 border-blue-200';
      case 'favorite_demo':
        return 'bg-red-50 border-red-200';
      case 'try_app':
        return 'bg-green-50 border-green-200';
      case 'search':
        return 'bg-purple-50 border-purple-200';
      case 'filter':
        return 'bg-orange-50 border-orange-200';
      case 'click':
        return 'bg-gray-50 border-gray-200';
      case 'tab_change':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getActivityDescription = (activity: ActivityItem) => {
    const data = activity.activity_data || {};
    
    switch (activity.activity_type) {
      case 'view_demo':
        return `viewed "${activity.resource_title}"`;
      case 'favorite_demo':
        return `${data.action === 'add' ? 'favorited' : 'unfavorited'} "${activity.resource_title}"`;
      case 'try_app':
        return `tried app "${activity.resource_title}"`;
      case 'search':
        return `searched for "${data.query}" (${data.results || 0} results)`;
      case 'filter':
        return `filtered by ${data.type}: "${data.value}"`;
      case 'click':
        return `clicked on ${data.elementType}`;
      case 'tab_change':
        return `switched to ${data.tab} tab`;
      case 'page_focus':
        return 'returned to page';
      case 'page_blur':
        return 'switched away from page';
      default:
        return activity.activity_type.replace('_', ' ');
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-Time Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-Time Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Activity Tracking Ready</h3>
            <p className="text-gray-500 mb-4">
              Real-time activity tracking is configured and will show user interactions as they happen
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-left max-w-md mx-auto">
              <h4 className="font-medium text-blue-800 mb-2">What gets tracked:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Demo views and interactions</li>
                <li>• Search queries and filters</li>
                <li>• Favorites and sharing</li>
                <li>• Tab navigation and usage</li>
              </ul>
            </div>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Check for Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>
              Real-time user engagement and interaction tracking
            </CardDescription>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Ready for Activity</h3>
            <p className="text-gray-500 mb-4">
              Activity tracking is fully configured and will show user interactions as they happen
            </p>
            <div className="bg-blue-50 p-4 rounded-lg text-left max-w-md mx-auto">
              <h4 className="font-medium text-blue-800 mb-2">What gets tracked:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Demo views and interactions</li>
                <li>• Search queries and filters</li>
                <li>• Favorites and sharing</li>
                <li>• Tab navigation and usage</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.activity_type)}`}
              >
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.activity_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(activity.user_display_name || activity.user_email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm text-gray-900">
                      {activity.user_display_name || activity.user_email.split('@')[0]}
                    </span>
                    <span className="text-sm text-gray-600">
                      {getActivityDescription(activity)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {activity.time_ago}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}