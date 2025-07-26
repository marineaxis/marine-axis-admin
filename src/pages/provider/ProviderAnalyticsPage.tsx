// Provider analytics page
import React from 'react';
import { TrendingUp, Eye, Users, MessageSquare, Calendar, BarChart3 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock analytics data
const ANALYTICS_DATA = {
  overview: {
    totalViews: 2847,
    totalInquiries: 67,
    conversionRate: 2.4,
    averageResponse: '2.3 hours',
  },
  monthlyStats: [
    { month: 'Jan', views: 324, inquiries: 8 },
    { month: 'Feb', views: 456, inquiries: 12 },
    { month: 'Mar', views: 532, inquiries: 15 },
    { month: 'Apr', views: 687, inquiries: 18 },
    { month: 'May', views: 734, inquiries: 22 },
    { month: 'Jun', views: 891, inquiries: 25 },
  ],
  topListings: [
    { title: 'Marine Engine Repair Service', views: 1247, inquiries: 34, rating: 4.9 },
    { title: 'Boat Electronics Installation', views: 892, inquiries: 21, rating: 4.7 },
    { title: 'Hull Cleaning Service', views: 456, inquiries: 8, rating: 4.5 },
  ],
  recentInquiries: [
    { id: '1', listing: 'Marine Engine Repair Service', customer: 'John D.', message: 'Interested in engine maintenance for my yacht', date: '2 hours ago', status: 'pending' },
    { id: '2', listing: 'Electronics Installation', customer: 'Sarah M.', message: 'Need GPS system installation', date: '1 day ago', status: 'responded' },
    { id: '3', listing: 'Hull Cleaning Service', customer: 'Mike R.', message: 'Looking for regular cleaning service', date: '2 days ago', status: 'pending' },
  ],
};

export function ProviderAnalyticsPage() {
  const { overview, monthlyStats, topListings, recentInquiries } = ANALYTICS_DATA;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your performance and customer engagement
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{overview.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-green-600 mt-2">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inquiries</p>
                <p className="text-2xl font-bold">{overview.totalInquiries}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-green-600 mt-2">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{overview.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-green-600 mt-2">+0.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{overview.averageResponse}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-green-600 mt-2">-0.5h from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Performance
            </CardTitle>
            <CardDescription>
              Views and inquiries over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyStats.map((stat, index) => (
                <div key={stat.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span className="font-medium">{stat.month}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{stat.views}</div>
                      <div className="text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{stat.inquiries}</div>
                      <div className="text-muted-foreground">Inquiries</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Listings</CardTitle>
            <CardDescription>
              Your most popular services this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topListings.map((listing, index) => (
                <div key={listing.title} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium line-clamp-1">{listing.title}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{listing.views} views</span>
                          <span>{listing.inquiries} inquiries</span>
                          <div className="flex items-center gap-1">
                            <span>★</span>
                            <span>{listing.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Inquiries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inquiries</CardTitle>
          <CardDescription>
            Latest customer inquiries for your services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentInquiries.map((inquiry) => (
              <div key={inquiry.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-medium">
                  {inquiry.customer.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{inquiry.customer}</span>
                    <Badge 
                      variant={inquiry.status === 'responded' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {inquiry.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{inquiry.listing}</p>
                  <p className="text-sm">{inquiry.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{inquiry.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProviderAnalyticsPage;