// Dashboard page for Marine-Axis Admin Panel
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Briefcase,
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAuth } from '../context/AuthContext';
import { Analytics, Provider, Job, Blog, Approval } from '../types';
import api from '../lib/api';
import { useToast } from '@/hooks/use-toast';

// Helper function to format location for display
const formatLocation = (item: any): string => {
  if (!item) return 'N/A';
  
  // If location is a string, use it directly
  if (typeof item.location === 'string' && item.location.trim()) {
    return item.location;
  }
  
  // If location is a GeoJSON object, extract coordinates or use address
  if (item.location && typeof item.location === 'object') {
    // Check if it's a GeoJSON object with coordinates
    if (item.location.coordinates && Array.isArray(item.location.coordinates)) {
      // For Point type, coordinates are [longitude, latitude]
      const [lng, lat] = item.location.coordinates;
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
  
  // If address object exists, use city and state
  if (item.address && typeof item.address === 'object') {
    const parts = [];
    if (item.address.city && typeof item.address.city === 'string') {
      parts.push(item.address.city);
    }
    if (item.address.state && typeof item.address.state === 'string') {
      parts.push(item.address.state);
    }
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }
  
  // Fallback
  return 'N/A';
};

// Default analytics state to prevent undefined errors
const DEFAULT_ANALYTICS_STATE: Analytics = {
  totalProviders: 0,
  totalJobs: 0,
  totalBlogs: 0,
  totalUsers: 0,
  pendingApprovals: 0,
  activeJobs: 0,
  featuredProviders: 0,
  publishedBlogs: 0,
  monthlyStats: {
    providers: 0,
    jobs: 0,
    blogs: 0,
    applications: 0,
  },
  categoryStats: [],
  topLocations: [],
  recentActivity: [],
};

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analytics, setAnalytics] = useState<Analytics>(DEFAULT_ANALYTICS_STATE);
  const [recentProviders, setRecentProviders] = useState<Provider[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin dashboard data
      const analyticsResponse = await api.analytics.adminDashboard();
      if (analyticsResponse.success) {
        setAnalytics(prev => ({
          ...prev,
          ...analyticsResponse.data,
          // Explicitly merge nested objects to prevent them from being overwritten by undefined
          monthlyStats: {
            ...prev.monthlyStats,
            ...(analyticsResponse.data.monthlyStats || {}),
          },
          // Ensure arrays are defaulted to empty if API returns null/undefined
          categoryStats: analyticsResponse.data.categoryStats || [],
          topLocations: analyticsResponse.data.topLocations || [],
          recentActivity: analyticsResponse.data.recentActivity || [],
        }));
      }

      // Fetch recent providers
      const providersResponse = await api.providers.list({ 
        limit: 5, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      if (providersResponse.success) {
        // PaginatedResponse has data as array directly
        const providers = Array.isArray(providersResponse.data) 
          ? providersResponse.data 
          : (providersResponse.data?.data || []);
        setRecentProviders(providers);
      }

      // Fetch recent jobs
      const jobsResponse = await api.jobs.list({ 
        limit: 5, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      });
      if (jobsResponse.success) {
        // PaginatedResponse has data as array directly
        const jobs = Array.isArray(jobsResponse.data) 
          ? jobsResponse.data 
          : (jobsResponse.data?.data || []);
        setRecentJobs(jobs);
      }

      // Fetch pending approvals
      const approvalsResponse = await api.approvals.list({ 
        status: 'pending',
        limit: 10 
      });
      if (approvalsResponse.success) {
        // PaginatedResponse has data as array directly
        const approvals = Array.isArray(approvalsResponse.data) 
          ? approvalsResponse.data 
          : (approvalsResponse.data?.data || []);
        setPendingApprovals(approvals);
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.analytics.export('dashboard');
      if (response.success) {
        toast({
          title: 'Export Started',
          description: 'Your data export has been queued for download.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Export Error',
        description: error.message || 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const getStatCards = (): StatCard[] => {

    return [
      {
        title: 'Total Providers',
        value: analytics.totalProviders ?? 0,
        change: `+${analytics.monthlyStats?.providers ?? 0} this month`,
        trend: 'up',
        icon: Building2,
        color: 'text-primary',
      },
      {
        title: 'Active Jobs',
        value: analytics.activeJobs ?? 0,
        change: `+${analytics.monthlyStats?.jobs ?? 0} this month`,
        trend: 'up',
        icon: Briefcase,
        color: 'text-success',
      },
      {
        title: 'Published Blogs',
        value: analytics.publishedBlogs ?? 0,
        change: `+${analytics.monthlyStats?.blogs ?? 0} this month`,
        trend: 'up',
        icon: FileText,
        color: 'text-accent',
      },
      {
        title: 'Pending Approvals',
        value: analytics.pendingApprovals ?? 0,
        change: 'Require attention',
        trend: (analytics.pendingApprovals ?? 0) > 10 ? 'up' : 'neutral',
        icon: Clock,
        color: (analytics.pendingApprovals ?? 0) > 10 ? 'text-warning' : 'text-muted-foreground',
      },
    ];
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend === 'down') return <TrendingUp className="h-4 w-4 rotate-180" />;
    return null;
  };

  const getApprovalTypeLabel = (type: string) => {
    switch (type) {
      case 'provider_registration': return 'Provider Registration';
      case 'provider_edit': return 'Provider Edit';
      case 'job_posting': return 'Job Posting';
      case 'blog_post': return 'Blog Post';
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your marine services platform</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = getStatCards();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your marine services platform today.
          </p>
        </div>
        <Button onClick={handleExportData} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(stat.trend)}
                <span className="ml-1">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Providers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Providers</CardTitle>
            <CardDescription>
              Latest provider registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProviders.map((provider) => (
                <div key={provider.id} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{provider.name}</p>
                    <p className="text-xs text-muted-foreground">{formatLocation(provider)}</p>
                  </div>
                  <Badge variant={provider.status === 'approved' ? 'default' : 'secondary'}>
                    {provider.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>
              Latest job postings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{formatLocation(job)}</p>
                  </div>
                  <Badge variant={job.status === 'published' ? 'default' : 'secondary'}>
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-warning" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              Items that require your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      {getApprovalTypeLabel(approval.type)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(approval.entity as any)?.name || (approval.entity as any)?.title || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(approval.priority) as any}>
                        {approval.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(approval.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DashboardPage;