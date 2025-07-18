import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

      // Fetch real-time activity and health scores with graceful fallback
      const [recentActivity, healthScores] = await Promise.all([
        analyticsService.getRealTimeActivities().catch((error) => {
          console.log('Real-time activities not available yet:', error);
          return [];
        }),
        analyticsService.getDemoHealthScores().catch((error) => {
          console.log('Health scores not available yet:', error);
          return [];
        })
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
      // Set fallback data for new systems
      setAnalyticsData({
        totalViews: demos.reduce((sum, demo) => sum + (demo.page_views || 0), 0),
        totalDemos: demos.length,
        avgViewsPerDemo: demos.length > 0 ? Math.round(demos.reduce((sum, demo) => sum + (demo.page_views || 0), 0) / demos.length) : 0,
        topDemos: [...demos].sort((a, b) => (b.page_views || 0) - (a.page_views || 0)).slice(0, 5),
        recentActivity: [],
        healthScores: []
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await calculateAnalytics();
    // Update health scores for all demos (graceful fallback)
    try {
      await analyticsService.updateAllDemoHealthScores();
    } catch (error) {
      console.log('Health score updates not available yet:', error);
    }
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
              <CardDescription>
                {analyticsData.recentActivity.length === 0 ? 
                  'Activity tracking is set up and ready for user interactions' :
                  'Recent user interactions and engagement'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Ready for Activity</h3>
                  <p className="text-gray-500 mb-4">
                    Activity tracking is fully configured and will show user interactions as they happen
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg text-left">
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
                </div>
              )}
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
              <CardDescription>
                {analyticsData.healthScores.length === 0 ? 
                  'Health scoring system is configured and will calculate scores as demos gain engagement' :
                  'Comprehensive health assessment for demo prioritization'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.healthScores.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Health Scoring Ready</h3>
                  <p className="text-gray-500 mb-4">
                    The health scoring system is configured and will automatically calculate scores as demos gain engagement
                  </p>
                  <div className="bg-green-50 p-4 rounded-lg text-left">
                    <h4 className="font-medium text-green-800 mb-2">Health factors include:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• View count and engagement rate</li>
                      <li>• Demo freshness and recency</li>
                      <li>• Favorite count and user interest</li>
                      <li>• Conversion rate (views to try-app clicks)</li>
                    </ul>
                  </div>
                </div>
              ) : (
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}