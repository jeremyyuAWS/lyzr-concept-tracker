import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Demo } from '@/types/demo';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Calendar, Eye, Target, Clock, Award, Activity } from 'lucide-react';

interface AnalyticsPanelProps {
  demos: Demo[];
}

export function AnalyticsPanel({ demos }: AnalyticsPanelProps) {
  const totalViews = demos.reduce((sum, demo) => sum + demo.page_views, 0);
  const averageViews = demos.length > 0 ? Math.round(totalViews / demos.length) : 0;
  
  const topDemos = demos
    .sort((a, b) => b.page_views - a.page_views)
    .slice(0, 8)
    .map(demo => ({
      name: demo.title.length > 20 ? 
        demo.title.substring(0, 20) + '\n' + 
        (demo.title.substring(20).length > 15 ? 
          demo.title.substring(20, 35) + '...' : 
          demo.title.substring(20)
        ) : 
        demo.title,
      views: demo.page_views,
      owner: demo.owner
    }));

  const recentDemos = demos
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const tagCounts = demos.reduce((acc, demo) => {
    demo.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const tagData = Object.entries(tagCounts)
    .map(([tag, count]) => ({ name: tag, value: count, demos: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Create monthly data for trend analysis
  const monthlyData = demos.reduce((acc, demo) => {
    const date = new Date(demo.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, demos: 0, views: 0 };
    }
    acc[monthKey].demos += 1;
    acc[monthKey].views += demo.page_views;
    return acc;
  }, {} as Record<string, { month: string; demos: number; views: number }>);

  const trendData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map(item => ({
      month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      demos: item.demos,
      views: item.views
    }));

  // Owner performance data
  const ownerData = demos.reduce((acc, demo) => {
    if (!acc[demo.owner]) {
      acc[demo.owner] = { owner: demo.owner, demos: 0, totalViews: 0 };
    }
    acc[demo.owner].demos += 1;
    acc[demo.owner].totalViews += demo.page_views;
    return acc;
  }, {} as Record<string, { owner: string; demos: number; totalViews: number }>);

  const ownerPerformance = Object.values(ownerData)
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 6);

  // View distribution data
  const viewRanges = [
    { range: '0-10', count: 0 },
    { range: '11-50', count: 0 },
    { range: '51-100', count: 0 },
    { range: '101-500', count: 0 },
    { range: '501-1000', count: 0 },
    { range: '1000+', count: 0 }
  ];

  demos.forEach(demo => {
    const views = demo.page_views;
    if (views <= 10) viewRanges[0].count++;
    else if (views <= 50) viewRanges[1].count++;
    else if (views <= 100) viewRanges[2].count++;
    else if (views <= 500) viewRanges[3].count++;
    else if (views <= 1000) viewRanges[4].count++;
    else viewRanges[5].count++;
  });

  const COLORS = ['#000000', '#2d2d2d', '#4a4a4a', '#666666', '#808080', '#999999', '#b3b3b3', '#cccccc', '#e6e6e6', '#f5f5f5'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const highestViews = Math.max(...demos.map(d => d.page_views));
  const topPerformer = demos.find(d => d.page_views === highestViews);

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Demos</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{demos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Views</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{averageViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {demos.filter(demo => 
                new Date(demo.created_at).getMonth() === new Date().getMonth() &&
                new Date(demo.created_at).getFullYear() === new Date().getFullYear()
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{highestViews.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{topPerformer?.title.substring(0, 20)}...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tags</CardTitle>
            <Target className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{Object.keys(tagCounts).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Full-width Top Performing Demos Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">Top Performing Demos</CardTitle>
          <CardDescription className="text-gray-600">Demos with highest page views</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDemos} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12} 
                  stroke="#666"
                  angle={0}
                  textAnchor="middle"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis fontSize={12} stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}
                  formatter={(value, name, props) => [
                    value.toLocaleString(),
                    'Views',
                    `Owner: ${props.payload.owner}`
                  ]}
                />
                <Bar dataKey="views" fill="#000000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Trends and Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">Growth Trends</CardTitle>
            <CardDescription className="text-gray-600">Demo creation and view trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" fontSize={12} stroke="#666" />
                  <YAxis fontSize={12} stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="demos" 
                    stroke="#000000" 
                    fill="#000000" 
                    fillOpacity={0.1}
                    name="New Demos"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#666666" 
                    fill="#666666" 
                    fillOpacity={0.1}
                    name="Total Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">Owner Performance</CardTitle>
            <CardDescription className="text-gray-600">Performance by demo owner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ownerPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={12} stroke="#666" />
                  <YAxis type="category" dataKey="owner" fontSize={12} stroke="#666" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }}
                    formatter={(value, name) => [
                      name === 'totalViews' ? value.toLocaleString() + ' views' : value + ' demos',
                      name === 'totalViews' ? 'Total Views' : 'Total Demos'
                    ]}
                  />
                  <Bar dataKey="totalViews" fill="#000000" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full-width Tag Distribution and View Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">Popular Tags</CardTitle>
            <CardDescription className="text-gray-600">Most commonly used technology tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tagData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {tagData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black">View Distribution</CardTitle>
            <CardDescription className="text-gray-600">How demos are distributed across view ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewRanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" fontSize={12} stroke="#666" />
                  <YAxis fontSize={12} stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }}
                    formatter={(value) => [value + ' demos', 'Count']}
                  />
                  <Bar dataKey="count" fill="#000000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">Recent Activity</CardTitle>
          <CardDescription className="text-gray-600">Latest demos added to the catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDemos.map((demo) => (
              <div key={demo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-black text-sm">{demo.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{demo.owner}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{demo.page_views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{formatDate(demo.created_at)}</span>
                    </div>
                  </div>
                </div>
                {demo.screenshot_url && (
                  <img 
                    src={demo.screenshot_url} 
                    alt={demo.title}
                    className="w-12 h-12 object-cover rounded border border-gray-200 ml-3"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}