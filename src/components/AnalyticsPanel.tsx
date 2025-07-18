import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Eye, 
  TrendingUp, 
  Activity, 
  RefreshCw,
  Calendar,
  Target
} from 'lucide-react';
import { Demo } from '@/types/demo';
import { analyticsService } from '@/lib/supabase';

interface AnalyticsData {
  totalViews: number;
  totalDemos: number;
  avgViewsPerDemo: number;
  topDemos: Demo[];
  recentActivity: any[];
  healthScores: any[];
}

interface AnalyticsPanelProps {
  demos: Demo[];
}

export function AnalyticsPanel({ demos }: AnalyticsPanelProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalViews: 0,
    totalDemos: 0,
    avgViewsPerDemo: 0,
    topDemos: [],
    recentActivity: [],
    healthScores: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateAnalytics();
  }, [demos]);

  const calculateAnalytics = async () => {
    setLoading(true);
    try {
      const totalViews = demos.reduce((sum, demo) => sum + (demo.page_views || 0), 0);
      const totalDemos = demos.length;
      const avgViewsPerDemo = totalDemos > 0 ? Math.round(totalViews / totalDemos) : 0;
      
      const topDemos = [...demos]
        .sort((a, b) => (b.page_views || 0) - (a.page_views || 0))
        .slice(0, 5);

      // Fetch real-time activity and health scores
      const [recentActivity, healthScores] = await Promise.all([
        analyticsService.getRealTimeActivities().catch(() => []),
        analyticsService.getDemoHealthScores().catch(() => [])
      ]);

      setAnalyticsData({
        totalViews,
        totalDemos,
        avgViewsPerDemo,
        topDemos,
        recentActivity: recentActivity || [],
        healthScores: healthScores || []
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await calculateAnalytics();
    // Update health scores for all demos
    await analyticsService.updateAllDemoHealthScores().catch(console.error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-gray-600">Track demo performance and user engagement</p>
        </div>
        <Button onClick={refreshData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
            <p className="text-xs text-gray-600">Across all demos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Demos</CardTitle>
            <Target className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalDemos}</div>
            <p className="text-xs text-gray-600">Published demos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Views/Demo</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.avgViewsPerDemo}</div>
            <p className="text-xs text-gray-600">Average engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.recentActivity.length}</div>
            <p className="text-xs text-gray-600">Recent activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="health">Health Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Demos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topDemos.map((demo, index) => (
                  <div key={demo.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <div>
                        <h4 className="font-semibold">{demo.title}</h4>
                        <p className="text-sm text-gray-600">{demo.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{demo.page_views || 0} views</div>
                      <div className="text-sm text-gray-600">
                        {demo.tags?.length || 0} tags
                      </div>
                    </div>
                  </div>
                ))}
                {analyticsData.topDemos.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No demos available for analysis</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-600">
                          {activity.resource_type} • {activity.user_profiles?.display_name || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {analyticsData.recentActivity.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Demo Health Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.healthScores.map((score, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{score.title}</h4>
                      <p className="text-sm text-gray-600">
                        Views: {score.page_views} • Tags: {score.tags?.length || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={score.health_score >= 80 ? "default" : score.health_score >= 60 ? "secondary" : "destructive"}>
                        {score.health_score}% Health
                      </Badge>
                    </div>
                  </div>
                ))}
                {analyticsData.healthScores.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No health scores available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}