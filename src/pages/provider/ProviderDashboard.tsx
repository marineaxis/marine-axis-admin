// Provider dashboard overview page
import React from 'react';
import { Plus, TrendingUp, Package, Image, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useProviderAuth } from '../../context/ProviderAuthContext';

// Mock data
const STATS = {
  totalListings: 12,
  activeListings: 8,
  totalViews: 1247,
  totalInquiries: 34,
  averageRating: 4.8,
  totalReviews: 124,
};

const RECENT_ACTIVITY = [
  { id: 1, type: 'inquiry', message: 'New inquiry for Marine Engine Repair', time: '2 hours ago' },
  { id: 2, type: 'review', message: 'New 5-star review received', time: '1 day ago' },
  { id: 3, type: 'listing', message: 'Boat Maintenance listing approved', time: '2 days ago' },
  { id: 4, type: 'photo', message: 'Photos updated for Electronics Service', time: '3 days ago' },
];

const QUICK_ACTIONS = [
  { label: 'Add New Listing', href: '/provider/listings/create', icon: Plus },
  { label: 'Upload Photos', href: '/provider/photos', icon: Image },
  { label: 'View Analytics', href: '/provider/analytics', icon: TrendingUp },
];

export function ProviderDashboard() {
  const navigate = useNavigate();
  const { provider } = useProviderAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {provider?.name}!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your marine services
        </p>
      </div>

      {/* Status Alert */}
      {provider?.status === 'pending' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Pending Approval</Badge>
              <span className="text-sm text-muted-foreground">
                Your account is under review. You'll be notified once approved.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => navigate(action.href)}
              >
                <action.icon className="h-6 w-6" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Listings</p>
                <p className="text-2xl font-bold">{STATS.totalListings}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {STATS.activeListings} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{STATS.totalViews.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-green-600 mt-2">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inquiries</p>
                <p className="text-2xl font-bold">{STATS.totalInquiries}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">?</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold">{STATS.averageRating}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 fill-current" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {STATS.totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates on your account and listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProviderDashboard;