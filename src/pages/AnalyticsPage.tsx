import React, { useState, useEffect } from 'react';
import { Calendar, Users, Briefcase, Building2, TrendingUp, TrendingDown, Eye, MousePointer, Clock, DollarSign, MapPin, Star } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

// Default/fallback analytics data
const DEFAULT_ANALYTICS_DATA = {
  overview: {
    totalProviders: 0,
    totalJobs: 0,
    totalApplications: 0,
    totalUsers: 0,
    providersGrowth: 0,
    jobsGrowth: 0,
    applicationsGrowth: 0,
    usersGrowth: 0
  },
  jobMetrics: {
    activeJobs: 0,
    expiringSoon: 0,
    averageApplications: 0,
    averageSalary: 0,
    topCategories: []
  },
  providerMetrics: {
    pendingApprovals: 0,
    featuredProviders: 0,
    averageRating: 0,
    topPerformers: []
  },
  engagement: {
    pageViews: 0,
    uniqueVisitors: 0,
    averageSessionTime: '0m 0s',
    bounceRate: 0,
    topPages: []
  },
  regionData: []
};

export function AnalyticsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(DEFAULT_ANALYTICS_DATA);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all analytics data in parallel
      const [overviewRes, providersRes, jobsRes] = await Promise.all([
        api.analytics.dashboard(),
        api.analytics.providers(),
        api.analytics.jobs(),
      ]);

      // Combine the data
      const overview = overviewRes.success ? overviewRes.data : DEFAULT_ANALYTICS_DATA.overview;
      const providerMetrics = providersRes.success ? providersRes.data : DEFAULT_ANALYTICS_DATA.providerMetrics;
      const jobMetrics = jobsRes.success ? jobsRes.data : DEFAULT_ANALYTICS_DATA.jobMetrics;

      setAnalyticsData({
        overview: {
          totalProviders: overview.totalProviders ?? 0,
          totalJobs: overview.totalJobs ?? 0,
          totalApplications: overview.totalApplications ?? 0,
          totalUsers: overview.totalUsers ?? 0,
          providersGrowth: overview.providersGrowth ?? 0,
          jobsGrowth: overview.jobsGrowth ?? 0,
          applicationsGrowth: overview.applicationsGrowth ?? 0,
          usersGrowth: overview.usersGrowth ?? 0,
        },
        jobMetrics: {
          activeJobs: jobMetrics.activeJobs ?? 0,
          expiringSoon: jobMetrics.expiringSoon ?? 0,
          averageApplications: jobMetrics.averageApplications ?? 0,
          averageSalary: jobMetrics.averageSalary ?? 0,
          topCategories: jobMetrics.topCategories ?? [],
        },
        providerMetrics: {
          pendingApprovals: providerMetrics.pendingApprovals ?? 0,
          featuredProviders: providerMetrics.featuredProviders ?? 0,
          averageRating: providerMetrics.averageRating ?? 0,
          topPerformers: providerMetrics.topPerformers ?? [],
        },
        engagement: DEFAULT_ANALYTICS_DATA.engagement, // Not available in API yet
        regionData: DEFAULT_ANALYTICS_DATA.regionData, // Not available in API yet
      });
    } catch (error: any) {
      console.error('Failed to fetch analytics data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive insights into platform performance</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights into platform performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalProviders)}</div>
            {analyticsData.overview.providersGrowth !== 0 && (
              <div className={`text-xs flex items-center gap-1 ${getGrowthColor(analyticsData.overview.providersGrowth)}`}>
                {React.createElement(getGrowthIcon(analyticsData.overview.providersGrowth), { className: "h-3 w-3" })}
                {Math.abs(analyticsData.overview.providersGrowth)}% from last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalJobs)}</div>
            {analyticsData.overview.jobsGrowth !== 0 && (
              <div className={`text-xs flex items-center gap-1 ${getGrowthColor(analyticsData.overview.jobsGrowth)}`}>
                {React.createElement(getGrowthIcon(analyticsData.overview.jobsGrowth), { className: "h-3 w-3" })}
                {Math.abs(analyticsData.overview.jobsGrowth)}% from last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalApplications)}</div>
            {analyticsData.overview.applicationsGrowth !== 0 && (
              <div className={`text-xs flex items-center gap-1 ${getGrowthColor(analyticsData.overview.applicationsGrowth)}`}>
                {React.createElement(getGrowthIcon(analyticsData.overview.applicationsGrowth), { className: "h-3 w-3" })}
                {Math.abs(analyticsData.overview.applicationsGrowth)}% from last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalUsers)}</div>
            {analyticsData.overview.usersGrowth !== 0 && (
              <div className={`text-xs flex items-center gap-1 ${getGrowthColor(analyticsData.overview.usersGrowth)}`}>
                {React.createElement(getGrowthIcon(analyticsData.overview.usersGrowth), { className: "h-3 w-3" })}
                {Math.abs(analyticsData.overview.usersGrowth)}% from last month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Job Analytics</TabsTrigger>
          <TabsTrigger value="providers">Provider Analytics</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="geography">Geographic Data</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analyticsData.jobMetrics.activeJobs}</div>
                <p className="text-xs text-muted-foreground">Currently accepting applications</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{analyticsData.jobMetrics.expiringSoon}</div>
                <p className="text-xs text-muted-foreground">Expiring within 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.jobMetrics.averageApplications.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Per job posting</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.jobMetrics.averageSalary)}</div>
                <p className="text-xs text-muted-foreground">Across all positions</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Job Categories</CardTitle>
              <CardDescription>Most popular categories by jobs posted and applications received</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.jobMetrics.topCategories.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.jobMetrics.topCategories.map((category: any, index: number) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-muted-foreground">{category.jobs} jobs posted</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(category.applications)}</div>
                      <div className="text-sm text-muted-foreground">applications</div>
                    </div>
                  </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No category data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{analyticsData.providerMetrics.pendingApprovals}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Featured Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analyticsData.providerMetrics.featuredProviders}</div>
                <p className="text-xs text-muted-foreground">Currently featured</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  {analyticsData.providerMetrics.averageRating.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Platform average</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Providers</CardTitle>
              <CardDescription>Highest rated providers with most job postings</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.providerMetrics.topPerformers.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.providerMetrics.topPerformers.map((provider: any, index: number) => (
                  <div key={provider.name || provider.id || index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{provider.name || provider.companyName || provider.contactName || 'Unknown'}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          {provider.rating} • {provider.jobs} jobs
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(provider.applications)}</div>
                      <div className="text-sm text-muted-foreground">applications</div>
                    </div>
                  </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No provider performance data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData.engagement.pageViews)}</div>
                <p className="text-xs text-muted-foreground">Total views this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData.engagement.uniqueVisitors)}</div>
                <p className="text-xs text-muted-foreground">Individual users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Session Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.engagement.averageSessionTime}</div>
                <p className="text-xs text-muted-foreground">Average duration</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.engagement.bounceRate}%</div>
                <p className="text-xs text-muted-foreground">Single page visits</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Most Visited Pages</CardTitle>
              <CardDescription>Top performing pages by traffic and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.engagement.topPages.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.engagement.topPages.map((page: any, index: number) => (
                  <div key={page.page} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{page.page}</div>
                        <div className="text-sm text-muted-foreground">Avg. time: {page.engagement}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(page.views)}</div>
                      <div className="text-sm text-muted-foreground">views</div>
                    </div>
                  </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Engagement data not available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Provider and job distribution by region</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.regionData.length > 0 ? (
                <div className="space-y-6">
                  {analyticsData.regionData.map((region: any) => (
                  <div key={region.region} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{region.region}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {region.providers} providers • {region.jobs} jobs
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={region.percentage} className="flex-1" />
                      <span className="text-sm font-medium">{region.percentage}%</span>
                    </div>
                  </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Geographic data not available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsPage;