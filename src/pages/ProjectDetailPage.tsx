import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FolderKanban, DollarSign, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

export function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.projects.get(id!);
      return response;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await api.projects.updateStatus(id!, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Status updated', description: 'Project status updated successfully' });
    },
  });

  const project = projectData?.data;

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, any> = {
      active: <Badge variant="default"><Clock className="h-3 w-3 mr-1" />Active</Badge>,
      completed: <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>,
      cancelled: <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>,
    };
    return variants[status] || <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/projects')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Project not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/projects')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <p className="text-muted-foreground">View complete project information</p>
          </div>
        </div>
        {project.status === 'active' && (
          <Button onClick={() => updateStatusMutation.mutate('completed')} disabled={updateStatusMutation.isPending}>
            Complete Project
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Primary project details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Project ID</span>
              <span className="font-mono text-sm">{project.id}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(project.status)}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget
              </span>
              <span className="font-semibold">{project.currency} {project.budget?.toLocaleString()}</span>
            </div>
            <Separator />
            <div>
              <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Project Dates
              </span>
              <div className="space-y-1">
                <div><strong>Start:</strong> {formatDate(project.startDate)}</div>
                <div><strong>End:</strong> {formatDate(project.endDate)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timestamps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Created At</span>
            <span className="text-sm">{formatDate(project.createdAt)}</span>
          </div>
          {project.updatedAt && (
            <>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{formatDate(project.updatedAt)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProjectDetailPage;

