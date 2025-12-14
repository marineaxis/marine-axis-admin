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
import { Analytics, Provider, Job, Blog, Approval, User } from '../types';
import api from '../lib/api';
import { useToast } from '@/hooks/use-toast';

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
  error: '',
};

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

const formatLocation = (loc: unknown): string => {
  if (!loc) return 'N/A';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    const obj = loc as { coordinates?: unknown; city?: unknown };
    if (Array.isArray(obj.coordinates)) return obj.coordinates.join(', ');
    if (typeof obj.city === 'string') return obj.city;
  }
  return 'N/A';
};

export function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [analytics, setAnalytics] = useState<Analytics>(DEFAULT_ANALYTICS_STATE);
  const [recentProviders, setRecentProviders] = useState<Provider[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    const asProvider = (raw: unknown): Provider => {
      const obj = raw as Record<string, unknown>;
      return {
        id: String(obj.id || obj._id || ''),
        name: typeof obj.name === 'string' ? obj.name : 'Unnamed',
        email: typeof obj.email === 'string' ? obj.email : '',
        phone: typeof obj.phone === 'string' ? obj.phone : '',
        location: formatLocation(obj.location),
        description: typeof obj.description === 'string' ? obj.description : '',
        services: Array.isArray(obj.services) ? obj.services as string[] : [],
        categoryIds: Array.isArray(obj.categoryIds) ? obj.categoryIds as string[] : [],
        status: (['pending','approved','rejected','suspended'].includes(String(obj.status))) ? obj.status as Provider['status'] : 'pending',
        featured: Boolean(obj.featured),
        logo: typeof obj.logo === 'string' ? obj.logo : undefined,
        images: Array.isArray(obj.images) ? obj.images as string[] : [],
        website: typeof obj.website === 'string' ? obj.website : undefined,
        socialLinks: (typeof obj.socialLinks === 'object' && obj.socialLinks) ? obj.socialLinks as { linkedin?: string; facebook?: string; twitter?: string; } : {},
        verificationDocuments: Array.isArray(obj.verificationDocuments) ? obj.verificationDocuments as string[] : [],
        rating: typeof obj.rating === 'number' ? obj.rating : 0,
        reviewCount: typeof obj.reviewCount === 'number' ? obj.reviewCount : 0,
        createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
        updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : (typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString()),
      };
    };
    const asJob = (raw: unknown): Job => {
      const obj = raw as Record<string, unknown>;
      return {
        id: String(obj.id || obj._id || ''),
        title: typeof obj.title === 'string' ? obj.title : 'Untitled Job',
        description: typeof obj.description === 'string' ? obj.description : '',
        providerId: typeof obj.providerId === 'string' ? obj.providerId : '',
        provider: obj.provider as Provider | undefined,
        categoryIds: Array.isArray(obj.categoryIds) ? obj.categoryIds as string[] : [],
        location: formatLocation(obj.location),
        salaryRange: (typeof obj.salaryRange === 'object' && obj.salaryRange) ? obj.salaryRange as Job['salaryRange'] : { min: 0, max: 0, currency: 'USD' },
        requirements: Array.isArray(obj.requirements) ? obj.requirements as string[] : [],
        benefits: Array.isArray(obj.benefits) ? obj.benefits as string[] : [],
        type: (['full-time','part-time','contract','internship'].includes(String(obj.type))) ? obj.type as Job['type'] : 'full-time',
        remote: Boolean(obj.remote),
        urgency: (['low','medium','high'].includes(String(obj.urgency))) ? obj.urgency as Job['urgency'] : 'low',
        status: (['draft','published','closed','paused'].includes(String(obj.status))) ? obj.status as Job['status'] : 'draft',
        expiresAt: typeof obj.expiresAt === 'string' ? obj.expiresAt : new Date().toISOString(),
        applications: typeof obj.applications === 'number' ? obj.applications : 0,
        createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
        updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : (typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString()),
      };
    };
    const asApproval = (raw: unknown): Approval => {
      const obj = raw as Record<string, unknown>;
      return {
        id: String(obj.id || obj._id || ''),
        type: (['provider_registration','provider_edit','job_posting','blog_post'].includes(String(obj.type))) ? obj.type as Approval['type'] : 'provider_registration',
        entityId: typeof obj.entityId === 'string' ? obj.entityId : '',
        entity: obj.entity as Provider | Job | Blog | undefined,
        changes: (typeof obj.changes === 'object' && obj.changes) ? obj.changes as Record<string, unknown> : {},
        requestedBy: typeof obj.requestedBy === 'string' ? obj.requestedBy : '',
        requester: obj.requester as User | Provider | undefined,
        status: (['pending','approved','rejected'].includes(String(obj.status))) ? obj.status as Approval['status'] : 'pending',
        priority: (['low','medium','high'].includes(String(obj.priority))) ? obj.priority as Approval['priority'] : 'low',
        reviewerId: typeof obj.reviewerId === 'string' ? obj.reviewerId : undefined,
        reviewer: obj.reviewer as User | undefined,
        reviewNotes: typeof obj.reviewNotes === 'string' ? obj.reviewNotes : undefined,
        metadata: (typeof obj.metadata === 'object' && obj.metadata) ? obj.metadata as Record<string, unknown> : {},
        createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
        updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : (typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString()),
      };
    };
    // Type for admin dashboard response
    interface AdminDashboardData {
      providers?: { total?: number };
      customers?: { total?: number };
      admins?: { total?: number };
      pendingProviders?: unknown[];
      jobs?: { total?: number; published?: number };
      blogs?: { total?: number; published?: number };
    }
    const run = async () => {
      setLoading(true);
      try {
        const adminDash = await api.analytics.adminDashboard();
        if (adminDash.success) {
          const dashData = adminDash.data as AdminDashboardData;
          setAnalytics(prev => ({
            ...prev,
            totalProviders: dashData.providers?.total ?? prev.totalProviders,
            totalUsers: (dashData.customers?.total ?? 0) + (dashData.providers?.total ?? 0) + (dashData.admins?.total ?? 0),
            pendingApprovals: Array.isArray(dashData.pendingProviders) ? dashData.pendingProviders.length : prev.pendingApprovals,
            totalJobs: dashData.jobs?.published ?? prev.totalJobs,
            totalBlogs: dashData.blogs?.published ?? prev.totalBlogs,
            activeJobs: dashData.jobs?.published ?? prev.activeJobs,
            publishedBlogs: dashData.blogs?.published ?? prev.publishedBlogs,
          }));
          if (Array.isArray(dashData.pendingProviders)) {
            const normalized = (dashData.pendingProviders as unknown[]).map(asProvider) as Provider[];
            setRecentProviders(normalized.slice(0,5));
          }
        }
        const providersResponse = await api.providers.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
        if (providersResponse.success) {
          const rawArr = Array.isArray((providersResponse as unknown as { data?: { data: unknown[] } }).data?.data)
            ? (providersResponse as unknown as { data?: { data: unknown[] } }).data!.data
            : (Array.isArray((providersResponse as { data: unknown }).data) ? (providersResponse as { data: unknown[] }).data : []);
          const normalized = (rawArr as unknown[]).map(asProvider) as Provider[];
          setRecentProviders(normalized);
        }
        const jobsResponse = await api.jobs.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
        if (jobsResponse.success) {
          const rawArr = Array.isArray((jobsResponse as unknown as { data?: { data: unknown[] } }).data?.data)
            ? (jobsResponse as unknown as { data?: { data: unknown[] } }).data!.data
            : (Array.isArray((jobsResponse as { data: unknown }).data) ? (jobsResponse as { data: unknown[] }).data : []);
          const normalized = (rawArr as unknown[]).map(asJob) as Job[];
          setRecentJobs(normalized);
        }
        if (api.approvals?.getPending) {
          // Approvals endpoint not implemented in backend; skipping fetch to avoid 404 spam.
          // const approvalsResponse = await api.approvals.getPending({ limit: 10 });
          // if (approvalsResponse.success) { /* normalization removed */ }
          setPendingApprovals([]);
        }
      } catch (error: unknown) {
        let message = 'Failed to load dashboard data';
        let status = '';
        if (error instanceof Error) {
          message = error.message;
        }
        if (typeof error === 'object' && error && 'response' in error) {
          // @ts-expect-error
          status = error.response?.status;
        }
        toast({ title: 'Dashboard Error', description: `${message}${status ? ` (Status: ${status})` : ''}`, variant: 'destructive' });
        setAnalytics(prev => ({ ...prev, error: `${message}${status ? ` (Status: ${status})` : ''}` }));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isAuthenticated, user, toast]);

  // Show error in UI if present
  if (analytics.error) {
    return <div className="p-8 text-center text-destructive">{analytics.error}</div>;
  }

  const handleExportData = async () => {
    try {
      const response = await api.analytics.export('dashboard');
      if (response.success) {
        toast({
          title: 'Export Started',
          description: 'Your data export has been queued for download.',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to export data';
      toast({
        title: 'Export Error',
        description: message,
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

  if (!isAuthenticated && !isLoading) {
    return <div className="p-8 text-center text-destructive">You must be logged in as an admin to view the dashboard.</div>;
  }
  if (user && user.role !== 'admin') {
    return <div className="p-8 text-center text-destructive">Access denied. Admins only.</div>;
  }

  const statCards = [
    {
      title: 'Total Providers',
      value: analytics.totalProviders ?? recentProviders.length,
      change: `+${analytics.monthlyStats.providers ?? 0} this month`,
      trend: 'up',
      icon: Building2,
      color: 'text-primary',
    },
    {
      title: 'Active Jobs',
      value: analytics.activeJobs ?? recentJobs.filter(j => j.status === 'published').length,
      change: `+${analytics.monthlyStats.jobs ?? 0} this month`,
      trend: 'up',
      icon: Briefcase,
      color: 'text-success',
    },
    {
      title: 'Published Blogs',
      value: analytics.publishedBlogs ?? 0,
      change: `+${analytics.monthlyStats.blogs ?? 0} this month`,
      trend: 'up',
      icon: FileText,
      color: 'text-accent',
    },
    {
      title: 'Pending Approvals',
      value: analytics.pendingApprovals ?? pendingApprovals.length,
      change: 'Require attention',
      trend: (analytics.pendingApprovals ?? pendingApprovals.length) > 10 ? 'up' : 'neutral',
      icon: Clock,
      color: (analytics.pendingApprovals ?? pendingApprovals.length) > 10 ? 'text-warning' : 'text-muted-foreground',
    },
  ] as StatCard[];

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
              {recentProviders.length > 0 ? recentProviders.map(provider => (
                <div key={provider.id} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{provider.name || 'Unnamed Provider'}</p>
                    <p className="text-xs text-muted-foreground">{provider.location}</p>
                  </div>
                  <Badge variant={provider.status === 'approved' ? 'default' : 'secondary'}>
                    {provider.status || 'pending'}
                  </Badge>
                </div>
              )) : <p className="text-sm text-muted-foreground">No providers found</p>}
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
              {recentJobs.length > 0 ? recentJobs.map(job => (
                <div key={job.id} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{job.title || 'Untitled Job'}</p>
                    <p className="text-xs text-muted-foreground">{job.location}</p>
                  </div>
                  <Badge variant={job.status === 'published' ? 'default' : 'secondary'}>
                    {job.status || 'draft'}
                  </Badge>
                </div>
              )) : <p className="text-sm text-muted-foreground">No jobs found</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals disabled until backend endpoint exists */}
      {/* {pendingApprovals.length > 0 && (
        <Card>
          ...approvals table...
        </Card>
      )} */}
    </div>
  );
}

export default DashboardPage;