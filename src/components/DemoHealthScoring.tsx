import { useState, useEffect } from 'react';
import { analyticsService } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  TrendingUp, 
  Eye, 
  Heart, 
  Clock, 
  ExternalLink,
  Star,
  RefreshCw,
  Target,
  Activity,
  Zap
} from 'lucide-react';

interface DemoHealthScore {
  id: string;
  demo_id: string;
  health_score: number;
  view_score: number;
  engagement_score: number;
  recency_score: number;
  favorite_score: number;
  conversion_score: number;
  last_calculated: string;
  demos: {
    id: string;
    title: string;
    owner: string;
    page_views: number;
    is_featured: boolean;
    created_at: string;
  };
}

export function DemoHealthScoring() {
  const [healthScores, setHealthScores] = useState<DemoHealthScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadHealthScores();
  }, []);

  const loadHealthScores = async () => {
    try {
      setError(null);
      try {
        const data = await analyticsService.getDemoHealthScores();
        setHealthScores(data);
      } catch (dbError: any) {
        console.warn('Demo health scores table not available:', dbError);
        // Fallback to empty array if table doesn't exist
        setHealthScores([]);
      }
    } catch (err) {
      console.error('Error loading health scores:', err);
      setError('Demo health scoring is not available');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      try {
        await analyticsService.updateAllDemoHealthScores();
        await loadHealthScores();
      } catch (dbError: any) {
        console.warn('Health score update function not available:', dbError);
        // Just reload existing data
        await loadHealthScores();
      }
    } catch (err) {
      console.error('Error refreshing health scores:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Demo Health Scoring
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
            <Target className="w-5 h-5" />
            Demo Health Scoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-yellow-600 mb-4">
              <Trophy className="w-12 h-12 mx-auto mb-2" />
              <p>{error}</p>
              <p className="text-sm text-gray-500 mt-2">
                This feature requires additional database setup
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
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
              <Trophy className="w-5 h-5 text-yellow-600" />
              Demo Health Scoring
            </CardTitle>
            <CardDescription>
              Comprehensive health assessment for demo prioritization
            </CardDescription>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {healthScores.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No health scores available</p>
            <p className="text-sm text-gray-500 mt-1">
              Demo health scoring is not yet configured
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Health Score Legend */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-green-600 font-semibold">80-100</div>
                <div className="text-xs text-green-700">Excellent</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-yellow-600 font-semibold">60-79</div>
                <div className="text-xs text-yellow-700">Good</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-orange-600 font-semibold">40-59</div>
                <div className="text-xs text-orange-700">Fair</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-red-600 font-semibold">0-39</div>
                <div className="text-xs text-red-700">Needs Attention</div>
              </div>
            </div>

            {/* Health Scores List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {healthScores.map((score) => (
                <div
                  key={score.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {score.demos.title}
                        </h3>
                        {score.demos.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{score.demos.owner}</span>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{score.demos.page_views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(score.demos.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(score.health_score)}`}>
                        {Math.round(score.health_score)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getHealthLabel(score.health_score)}
                      </div>
                    </div>
                  </div>

                  {/* Health Score Breakdown */}
                  <div className="grid grid-cols-5 gap-3 mb-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(score.view_score)}
                      </div>
                      <div className="text-xs text-gray-500">Views</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Activity className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(score.engagement_score)}
                      </div>
                      <div className="text-xs text-gray-500">Engagement</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(score.recency_score)}
                      </div>
                      <div className="text-xs text-gray-500">Recency</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Heart className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(score.favorite_score)}
                      </div>
                      <div className="text-xs text-gray-500">Favorites</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <ExternalLink className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(score.conversion_score)}
                      </div>
                      <div className="text-xs text-gray-500">Conversions</div>
                    </div>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Overall Health</span>
                      <span className="text-sm text-gray-600">{Math.round(score.health_score)}/100</span>
                    </div>
                    <Progress 
                      value={score.health_score} 
                      className="h-2"
                    />
                  </div>

                  <div className="text-xs text-gray-500 text-right">
                    Last calculated: {formatDate(score.last_calculated)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}