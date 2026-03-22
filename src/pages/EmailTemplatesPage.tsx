import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Mail, Send, Copy, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import api from '../lib/api';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  category: 'provider' | 'customer' | 'admin' | 'system' | 'job' | 'booking' | 'contract';
  bodyHtml: string;
  bodyText?: string;
  variables: string[];
  isActive: boolean;
  description?: string;
  lastUsedAt?: string;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

export function EmailTemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  const [editForm, setEditForm] = useState({
    name: '',
    type: '',
    subject: '',
    category: 'provider' as EmailTemplate['category'],
    bodyHtml: '',
    bodyText: '',
    variables: [] as string[],
    isActive: true,
    description: ''
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['email-templates', categoryFilter, searchQuery],
    queryFn: async () => {
      const params: any = { page: 1, limit: 100 };
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      const response = await api.emailTemplates.list(params);
      return response;
    },
  });

  const templates = templatesData?.data?.data || [];
  const filteredTemplates = templates;

  const handleViewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      type: template.type,
      subject: template.subject,
      category: template.category,
      bodyHtml: template.bodyHtml,
      bodyText: template.bodyText || '',
      variables: template.variables,
      isActive: template.isActive,
      description: template.description || ''
    });
    setEditErrors({});
    setEditDialogOpen(true);
  };

  const handleCreateTemplate = () => {
    setEditForm({
      name: '',
      type: '',
      subject: '',
      category: 'provider',
      bodyHtml: '',
      bodyText: '',
      variables: [],
      isActive: true,
      description: ''
    });
    setEditErrors({});
    setCreateDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!editForm.name.trim()) newErrors.name = 'Template name is required';
    if (!editForm.type.trim()) newErrors.type = 'Template type is required';
    if (!editForm.subject.trim()) newErrors.subject = 'Subject is required';
    if (!editForm.bodyHtml.trim()) newErrors.bodyHtml = 'HTML content is required';
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedTemplate) {
        return await api.emailTemplates.update(selectedTemplate.id, data);
      } else {
        return await api.emailTemplates.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: selectedTemplate ? 'Template updated' : 'Template created',
        description: `${editForm.name} has been ${selectedTemplate ? 'updated' : 'created'} successfully`,
      });
      setEditDialogOpen(false);
      setCreateDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save template. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveTemplate = async () => {
    if (!validateForm()) return;
    saveMutation.mutate(editForm);
  };

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await api.emailTemplates.update(id, { isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: variables.isActive ? 'Template activated' : 'Template deactivated',
        description: `Template status updated successfully`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive',
      });
    },
  });

  const handleToggleActive = async (template: EmailTemplate) => {
    toggleActiveMutation.mutate({ id: template.id, isActive: !template.isActive });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.emailTemplates.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: 'Template deleted',
        description: 'Template has been removed',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteTemplate = async (templateId: string) => {
    deleteMutation.mutate(templateId);
  };

  const duplicateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.emailTemplates.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: 'Template duplicated',
        description: 'Created a copy of the template',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive',
      });
    },
  });

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    const { id, ...templateData } = template;
    duplicateMutation.mutate({
      ...templateData,
      name: `${template.name} (Copy)`,
      type: `${template.type}_copy_${Date.now()}`,
    });
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      provider: 'default',
      job: 'secondary',
      user: 'outline',
      system: 'destructive'
    } as const;
    
    return <Badge variant={variants[category as keyof typeof variants] || 'outline'}>{category}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Manage automated email templates and notifications</p>
        </div>
        <Button onClick={handleCreateTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Template Management</CardTitle>
          <CardDescription>
            Create and manage email templates for different platform events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Templates Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">Loading templates...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery || categoryFilter !== 'all' ? 'No templates found matching your criteria' : 'No templates found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {template.variables.length} variables
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(template.category)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{template.subject}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.useCount}</div>
                          <div className="text-sm text-muted-foreground">
                            {template.lastUsedAt ? `Last: ${formatDate(template.lastUsedAt)}` : 'Never used'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(template.updatedAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTemplate(template)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(template.id)}>
                              {template.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{template.name}</strong>? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={isLoading}
                                  >
                                    Delete Template
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Template Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview of the email template content
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden min-h-0">
                <TabsList className="flex-shrink-0">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                  <TabsTrigger value="stats">Usage Stats</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="flex-1 overflow-y-auto space-y-4 mt-4 min-h-0">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Subject</Label>
                    <div className="p-3 bg-muted rounded-md">{selectedTemplate.subject}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">HTML Content</Label>
                    <div className="p-4 bg-muted rounded-md whitespace-pre-wrap text-sm max-h-96 overflow-auto">
                      {selectedTemplate.bodyHtml}
                    </div>
                  </div>
                  {selectedTemplate.bodyText && (
                    <div>
                      <Label className="text-sm font-medium">Text Content</Label>
                      <div className="p-4 bg-muted rounded-md whitespace-pre-wrap text-sm max-h-96 overflow-auto">
                        {selectedTemplate.bodyText}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="variables" className="flex-1 overflow-y-auto space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-medium">Available Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="flex-1 overflow-y-auto space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Total Uses</Label>
                    <div className="text-2xl font-bold">{selectedTemplate.useCount}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Used</Label>
                    <div className="text-sm">
                      {selectedTemplate.lastUsedAt ? formatDate(selectedTemplate.lastUsedAt) : 'Never'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <div className="text-sm">{formatDate(selectedTemplate.createdAt)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="text-sm">
                      <Badge variant={selectedTemplate.isActive ? 'default' : 'secondary'}>
                        {selectedTemplate.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          )}
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Template Dialog */}
      <Dialog open={editDialogOpen || createDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditDialogOpen(false);
          setCreateDialogOpen(false);
          setSelectedTemplate(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {selectedTemplate ? 'Update template details' : 'Create a new email template'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className={editErrors.name ? 'border-destructive' : ''}
                />
                {editErrors.name && <p className="text-sm text-destructive">{editErrors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-type">Template Type *</Label>
                <Select 
                  value={editForm.type} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}
                  disabled={!!selectedTemplate}
                >
                  <SelectTrigger className={editErrors.type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="welcome_customer">Welcome Email - Customer</SelectItem>
                    <SelectItem value="welcome_provider">Welcome Email - Provider</SelectItem>
                    <SelectItem value="welcome_admin">Welcome Email - Admin</SelectItem>
                    <SelectItem value="account_created">Account Created Confirmation</SelectItem>
                    <SelectItem value="password_reset">Password Reset Request</SelectItem>
                    <SelectItem value="password_reset_success">Password Reset Success</SelectItem>
                    <SelectItem value="account_deleted">Account Deleted</SelectItem>
                    <SelectItem value="account_inactive">Account Inactive / Suspended</SelectItem>
                    <SelectItem value="account_reactivated">Account Reactivated</SelectItem>
                    <SelectItem value="provider_approved">Provider Approval</SelectItem>
                    <SelectItem value="provider_rejected">Provider Rejection</SelectItem>
                    <SelectItem value="job_application_received">Job Application Received</SelectItem>
                    <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                    <SelectItem value="system_maintenance">System Maintenance Notification</SelectItem>
                  </SelectContent>
                </Select>
                {editErrors.type && <p className="text-sm text-destructive">{editErrors.type}</p>}
                {!selectedTemplate && (
                  <p className="text-xs text-muted-foreground">
                    Select the template type. Each type must be unique.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-category">Category *</Label>
                <Select value={editForm.category} onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value as EmailTemplate['category'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject Line *</Label>
              <Input
                id="template-subject"
                value={editForm.subject}
                onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                className={editErrors.subject ? 'border-destructive' : ''}
              />
              {editErrors.subject && <p className="text-sm text-destructive">{editErrors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-bodyHtml">HTML Content *</Label>
              <Textarea
                id="template-bodyHtml"
                rows={12}
                value={editForm.bodyHtml}
                onChange={(e) => setEditForm(prev => ({ ...prev, bodyHtml: e.target.value }))}
                className={editErrors.bodyHtml ? 'border-destructive' : ''}
                placeholder="Enter the email template HTML content. Use {{variableName}} for dynamic content."
              />
              {editErrors.bodyHtml && <p className="text-sm text-destructive">{editErrors.bodyHtml}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-bodyText">Text Content (Optional)</Label>
              <Textarea
                id="template-bodyText"
                rows={6}
                value={editForm.bodyText}
                onChange={(e) => setEditForm(prev => ({ ...prev, bodyText: e.target.value }))}
                placeholder="Plain text version of the email (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description (Optional)</Label>
              <Input
                id="template-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of when this template is used"
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Tip: Use double curly braces for variables like {`{{userName}}`}, {`{{companyName}}`}, etc.
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setCreateDialogOpen(false);
              setSelectedTemplate(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : selectedTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmailTemplatesPage;