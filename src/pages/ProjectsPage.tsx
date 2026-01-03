import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, CheckCircle, XCircle, Clock, Plus, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  createdAt: string;
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: async () => {
      const params: any = { page: 1, limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await api.projects.list(params);
      return response;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['projects-stats'],
    queryFn: async () => {
      const response = await api.projects.getStats();
      return response;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await api.projects.updateStatus(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Status updated', description: 'Project status updated successfully' });
    },
  });

  const projects = projectsData?.data || [];
  const stats = statsData?.data || { total: 0, active: 0, completed: 0, cancelled: 0 };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: <Badge variant="default"><Clock className="h-3 w-3 mr-1" />Active</Badge>,
      completed: <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>,
      cancelled: <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>,
    };
    return variants[status] || <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage projects</p>
        </div>
        <Button onClick={() => navigate('/projects/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Cancelled</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.cancelled}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Projects Management</CardTitle><CardDescription>View and manage all projects</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : projects.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">No projects found</TableCell></TableRow>
                ) : (
                  projects.map((project: Project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.title}</TableCell>
                      <TableCell>{project.currency} {project.budget.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${project.id}`)}>
                            <Eye className="h-3 w-3 mr-1" />View
                          </Button>
                          {project.status === 'active' && (
                            <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: project.id, status: 'completed' })}>
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProjectsPage;

