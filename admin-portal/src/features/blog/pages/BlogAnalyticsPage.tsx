import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Users,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface OverviewStats {
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  uniqueViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalWriters: number;
  activeWriters: number;
  avgViewsPerPost: number;
  avgEngagementRate: number;
  trends: {
    views: { value: number; change: number };
    likes: { value: number; change: number };
    comments: { value: number; change: number };
  };
  // Chart data
  viewsTrend: { date: string; views: number; likes: number }[];
  postsByStatus: { status: string; count: number }[];
  postsByCategory: { category: string; count: number; views: number }[];
}

// Chart colors
const STATUS_COLORS: Record<string, string> = {
  published: '#22c55e',
  draft: '#94a3b8',
  submitted: '#3b82f6',
  in_review: '#a855f7',
  revision_requested: '#f97316',
  approved: '#14b8a6',
  rejected: '#ef4444',
};

const CHART_COLORS = ['#C4A484', '#8B7355', '#D4B896', '#A0522D', '#DEB887', '#CD853F'];

// Format status for display
const formatStatus = (status: string) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

interface PostPerformance {
  _id: string;
  title: string;
  slug: string;
  views: number;
  uniqueViews: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  publishedAt: string;
  category: string;
  writer: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface WriterPerformance {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgEngagement: number;
}

interface CategoryPerformance {
  category: string;
  postCount: number;
  totalViews: number;
  totalLikes: number;
  avgEngagement: number;
}

const fetchBlogAnalytics = async (period: string) => {
  const response = await api.get(`/admin/blog/analytics/overview?period=${period}`);
  return response.data.data;
};

const fetchPostPerformance = async (period: string, sort: string) => {
  const response = await api.get(`/admin/blog/analytics/posts?period=${period}&sort=${sort}`);
  return response.data.data;
};

const fetchWriterPerformance = async (period: string) => {
  const response = await api.get(`/admin/blog/analytics/writers?period=${period}`);
  return response.data.data;
};

const fetchCategoryPerformance = async (period: string) => {
  const response = await api.get(`/admin/blog/analytics/categories?period=${period}`);
  return response.data.data;
};

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={`flex items-center text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {Math.abs(trend.value)}% from last period
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function OverviewTab({ period }: { period: string }) {
  const { data: stats, isLoading } = useQuery<OverviewStats>({
    queryKey: ['blog-analytics-overview', period],
    queryFn: () => fetchBlogAnalytics(period),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Views"
          value={stats.totalViews.toLocaleString()}
          icon={Eye}
          trend={{
            value: stats.trends.views.change,
            isPositive: stats.trends.views.change >= 0,
          }}
          description={`${stats.uniqueViews.toLocaleString()} unique`}
        />
        <StatCard
          title="Total Likes"
          value={stats.totalLikes.toLocaleString()}
          icon={Heart}
          trend={{
            value: stats.trends.likes.change,
            isPositive: stats.trends.likes.change >= 0,
          }}
        />
        <StatCard
          title="Total Comments"
          value={stats.totalComments.toLocaleString()}
          icon={MessageCircle}
          trend={{
            value: stats.trends.comments.change,
            isPositive: stats.trends.comments.change >= 0,
          }}
        />
        <StatCard
          title="Total Shares"
          value={stats.totalShares.toLocaleString()}
          icon={Share2}
        />
      </div>

      {/* Content & Writer Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Published Posts"
          value={stats.publishedPosts}
          icon={FileText}
          description={`${stats.totalPosts} total posts`}
        />
        <StatCard
          title="Active Writers"
          value={stats.activeWriters}
          icon={Users}
          description={`${stats.totalWriters} total writers`}
        />
        <StatCard
          title="Avg. Views/Post"
          value={Math.round(stats.avgViewsPerPost).toLocaleString()}
          icon={BarChart3}
        />
        <StatCard
          title="Engagement Rate"
          value={`${stats.avgEngagementRate.toFixed(1)}%`}
          icon={TrendingUp}
          description="Likes + comments / views"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Views & Likes Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#C4A484]" />
              Performance Trend
            </CardTitle>
            <CardDescription>Views and likes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {stats.viewsTrend && stats.viewsTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.viewsTrend.map((item) => ({
                      ...item,
                      date: new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      }),
                    }))}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e5e5' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e5e5' }}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                    <Line
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="likes"
                      name="Likes"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No trend data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Posts by Status - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#C4A484]" />
              Posts by Status
            </CardTitle>
            <CardDescription>Distribution of post statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {stats.postsByStatus && stats.postsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={stats.postsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="status"
                      label={(props) => {
                        const { name, percent } = props;
                        if (!name || percent === undefined) return '';
                        return `${formatStatus(name)} (${(percent * 100).toFixed(0)}%)`;
                      }}
                      labelLine={false}
                    >
                      {stats.postsByStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value ?? 0, formatStatus(String(name ?? ''))]}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No status data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts by Category - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#C4A484]" />
            Posts by Category
          </CardTitle>
          <CardDescription>Post count and views by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {stats.postsByCategory && stats.postsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.postsByCategory}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e5e5' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e5e5' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e5e5' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar yAxisId="left" dataKey="count" name="Posts" fill="#C4A484" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="views" name="Views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No category data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PostsTab({ period }: { period: string }) {
  const navigate = useNavigate();
  const [sort, setSort] = useState('views');

  const { data: posts, isLoading } = useQuery<PostPerformance[]>({
    queryKey: ['blog-analytics-posts', period, sort],
    queryFn: () => fetchPostPerformance(period, sort),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Top Performing Posts</h3>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="views">By Views</SelectItem>
            <SelectItem value="likes">By Likes</SelectItem>
            <SelectItem value="comments">By Comments</SelectItem>
            <SelectItem value="shares">By Shares</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {posts?.map((post, index) => (
          <Card
            key={post._id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/blog/${post._id}/edit`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <h4 className="font-medium line-clamp-1 hover:underline">{post.title}</h4>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.commentCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      {post.shareCount}
                    </span>
                    <Badge variant="outline">{post.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    By{' '}
                    <button
                      type="button"
                      className="hover:underline hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/blog/writers/${post.writer._id}`);
                      }}
                    >
                      {post.writer.firstName} {post.writer.lastName}
                    </button>
                    {' '}· Published{' '}
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!posts || posts.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No post data available for this period
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function WritersTab({ period }: { period: string }) {
  const navigate = useNavigate();
  const { data: writers, isLoading } = useQuery<WriterPerformance[]>({
    queryKey: ['blog-analytics-writers', period],
    queryFn: () => fetchWriterPerformance(period),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Writer Performance</h3>

      <div className="grid gap-4">
        {writers?.map((writer) => (
          <Card
            key={writer._id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/blog/writers/${writer._id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {writer.firstName.charAt(0)}
                    {writer.lastName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium hover:underline">
                      {writer.firstName} {writer.lastName}
                    </h4>
                    <p className="text-sm text-muted-foreground">{writer.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{writer.publishedPosts}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{writer.totalViews.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{writer.totalLikes}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{writer.avgEngagement.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!writers || writers.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No writer data available
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CategoriesTab({ period }: { period: string }) {
  const navigate = useNavigate();
  const { data: categories, isLoading } = useQuery<CategoryPerformance[]>({
    queryKey: ['blog-analytics-categories', period],
    queryFn: () => fetchCategoryPerformance(period),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Category Performance</h3>

      <div className="grid gap-3">
        {categories?.map((category) => (
          <Card
            key={category.category}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/blog?category=${encodeURIComponent(category.category)}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium capitalize hover:underline">{category.category}</h4>
                  <p className="text-sm text-muted-foreground">
                    {category.postCount} posts
                  </p>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{category.totalViews.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{category.totalLikes}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{category.avgEngagement.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!categories || categories.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No category data available
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function BlogAnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Analytics</h1>
          <p className="text-muted-foreground">
            Track your blog's performance and engagement metrics
          </p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="writers">Writers</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab period={period} />
        </TabsContent>

        <TabsContent value="posts">
          <PostsTab period={period} />
        </TabsContent>

        <TabsContent value="writers">
          <WritersTab period={period} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab period={period} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BlogAnalyticsPage;
