import React, { useState } from 'react';
import { Calendar, Users, Briefcase, Building2, TrendingUp, TrendingDown, Eye, MousePointer, Clock, DollarSign, MapPin, Star } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock analytics data
const ANALYTICS_DATA = {
  overview: {
    totalProviders: 247,
    totalJobs: 89,
    totalApplications: 1250,
    totalUsers: 3421,
    providersGrowth: 12.5,
    jobsGrowth: -5.2,
    applicationsGrowth: 23.1,
    usersGrowth: 8.7
  },
  jobMetrics: {
    activeJobs: 67,
    expiringSoon: 12,
    averageApplications: 14.2,
    averageSalary: 75000,
    topCategories: [
      { name: 'Marine Equipment', jobs: 25, applications: 340 },
      { name: 'Boat Maintenance', jobs: 18, applications: 256 },
      { name: 'Electronics & Navigation', jobs: 15, applications: 198 },
      { name: 'Repair Services', jobs: 12, applications: 167 },
      { name: 'Marina Services', jobs: 8, applications: 89 }
    ]
  },
  providerMetrics: {
    pendingApprovals: 15,
    featuredProviders: 23,
    averageRating: 4.6,
    topPerformers: [
      { name: 'Marine Solutions Ltd', rating: 4.9, jobs: 12, applications: 156 },
      { name: 'Ocean Tech Services', rating: 4.8, jobs: 8, applications: 98 },
      { name: 'Coastal Marine Works', rating: 4.7, jobs: 6, applications: 87 },
      { name: 'Pacific Marine', rating: 4.6, jobs: 9, applications: 112 },
      { name: 'Atlantic Services', rating: 4.5, jobs: 5, applications: 67 }
    ]
  },
  engagement: {
    pageViews: 45623,
    uniqueVisitors: 12456,
    averageSessionTime: '4m 32s',
    bounceRate: 23.4,
    topPages: [
      { page: '/jobs', views: 15420, engagement: '6m 21s' },
      { page: '/providers', views: 12340, engagement: '4m 15s' },
      { page: '/categories', views: 8765, engagement: '3m 42s' },
      { page: '/jobs/marine-engineer', views: 6543, engagement: '7m 18s' },
      { page: '/providers/marine-solutions', views: 4567, engagement: '5m 33s' }
    ]
  },
  regionData: [
    { region: 'Florida', providers: 45, jobs: 23, percentage: 18.2 },
    { region: 'California', providers: 38, jobs: 19, percentage: 15.4 },
    { region: 'Texas', providers: 32, jobs: 16, percentage: 13.0 },
    { region: 'New York', providers: 28, jobs: 12, percentage: 11.3 },
    { region: 'Massachusetts', providers: 25, jobs: 9, percentage: 10.1 },
    { region: 'Others', providers: 79, jobs: 10, percentage: 32.0 }
  ]
};

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30');

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
            <div className="text-2xl font-bold">{formatNumber(ANALYTICS_DATA.overview.totalProviders)}</div>
            <div className={`text-xs flex items-center gap-1 ${getGrowthColor(ANALYTICS_DATA.overview.providersGrowth)}`}>
              {React.createElement(getGrowthIcon(ANALYTICS_DATA.overview.providersGrowth), { className: "h-3 w-3" })}
              {Math.abs(ANALYTICS_DATA.overview.providersGrowth)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(ANALYTICS_DATA.overview.totalJobs)}</div>
            <div className={`text-xs flex items-center gap-1 ${getGrowthColor(ANALYTICS_DATA.overview.jobsGrowth)}`}>
              {React.createElement(getGrowthIcon(ANALYTICS_DATA.overview.jobsGrowth), { className: "h-3 w-3" })}
              {Math.abs(ANALYTICS_DATA.overview.jobsGrowth)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(ANALYTICS_DATA.overview.totalApplications)}</div>
            <div className={`text-xs flex items-center gap-1 ${getGrowthColor(ANALYTICS_DATA.overview.applicationsGrowth)}`}>
              {React.createElement(getGrowthIcon(ANALYTICS_DATA.overview.applicationsGrowth), { className: "h-3 w-3" })}
              {Math.abs(ANALYTICS_DATA.overview.applicationsGrowth)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(ANALYTICS_DATA.overview.totalUsers)}</div>
            <div className={`text-xs flex items-center gap-1 ${getGrowthColor(ANALYTICS_DATA.overview.usersGrowth)}`}>
              {React.createElement(getGrowthIcon(ANALYTICS_DATA.overview.usersGrowth), { className: "h-3 w-3" })}
              {Math.abs(ANALYTICS_DATA.overview.usersGrowth)}% from last month
            </div>
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
                <div className="text-2xl font-bold text-green-600">{ANALYTICS_DATA.jobMetrics.activeJobs}</div>
                <p className="text-xs text-muted-foreground">Currently accepting applications</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{ANALYTICS_DATA.jobMetrics.expiringSoon}</div>
                <p className="text-xs text-muted-foreground">Expiring within 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ANALYTICS_DATA.jobMetrics.averageApplications}</div>
                <p className="text-xs text-muted-foreground">Per job posting</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(ANALYTICS_DATA.jobMetrics.averageSalary)}</div>
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
              <div className="space-y-4">
                {ANALYTICS_DATA.jobMetrics.topCategories.map((category, index) => (
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
                <div className="text-2xl font-bold text-orange-600">{ANALYTICS_DATA.providerMetrics.pendingApprovals}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Featured Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{ANALYTICS_DATA.providerMetrics.featuredProviders}</div>
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
                  {ANALYTICS_DATA.providerMetrics.averageRating}
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
              <div className="space-y-4">
                {ANALYTICS_DATA.providerMetrics.topPerformers.map((provider, index) => (
                  <div key={provider.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{provider.name}</div>
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
                <div className="text-2xl font-bold">{formatNumber(ANALYTICS_DATA.engagement.pageViews)}</div>
                <p className="text-xs text-muted-foreground">Total views this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(ANALYTICS_DATA.engagement.uniqueVisitors)}</div>
                <p className="text-xs text-muted-foreground">Individual users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Session Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ANALYTICS_DATA.engagement.averageSessionTime}</div>
                <p className="text-xs text-muted-foreground">Average duration</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ANALYTICS_DATA.engagement.bounceRate}%</div>
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
              <div className="space-y-4">
                {ANALYTICS_DATA.engagement.topPages.map((page, index) => (
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
              <div className="space-y-6">
                {ANALYTICS_DATA.regionData.map((region) => (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsPage;