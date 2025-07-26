import React, { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Mail, Send, Copy, Download } from 'lucide-react';

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

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'provider' | 'job' | 'user' | 'system';
  content: string;
  variables: string[];
  isActive: boolean;
  lastUsed?: string;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

// Mock email templates data
const MOCK_TEMPLATES: EmailTemplate[] = [
  {
    id: '1',
    name: 'Provider Welcome',
    subject: 'Welcome to Marine-Axis!',
    category: 'provider',
    content: `Dear {{providerName}},

Welcome to Marine-Axis! We're excited to have you join our platform.

Your account has been successfully created and is now under review. Our team will review your application within 2-3 business days.

Here's what happens next:
• Account verification and approval
• Access to your provider dashboard
• Ability to post job listings
• Connect with marine professionals

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The Marine-Axis Team`,
    variables: ['providerName', 'supportEmail'],
    isActive: true,
    lastUsed: '2024-01-25T10:30:00Z',
    useCount: 156,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '2',
    name: 'Provider Approval',
    subject: 'Your account has been approved!',
    category: 'provider',
    content: `Dear {{providerName}},

Great news! Your Marine-Axis provider account has been approved.

You can now:
• Access your full provider dashboard
• Post unlimited job listings
• Manage your company profile
• Connect with qualified candidates

Login to your dashboard: {{dashboardUrl}}

Welcome aboard!

Best regards,
The Marine-Axis Team`,
    variables: ['providerName', 'dashboardUrl'],
    isActive: true,
    lastUsed: '2024-01-24T14:20:00Z',
    useCount: 89,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    name: 'Job Application Received',
    subject: 'New application for {{jobTitle}}',
    category: 'job',
    content: `Hello {{providerName}},

You've received a new application for your job posting: {{jobTitle}}

Candidate Details:
• Name: {{candidateName}}
• Email: {{candidateEmail}}
• Application Date: {{applicationDate}}

To review the application and candidate profile, please visit your dashboard.

Review Application: {{applicationUrl}}

Best regards,
The Marine-Axis Team`,
    variables: ['providerName', 'jobTitle', 'candidateName', 'candidateEmail', 'applicationDate', 'applicationUrl'],
    isActive: true,
    lastUsed: '2024-01-25T16:45:00Z',
    useCount: 342,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
  },
  {
    id: '4',
    name: 'Password Reset',
    subject: 'Reset your Marine-Axis password',
    category: 'user',
    content: `Hello {{userName}},

We received a request to reset your Marine-Axis password.

Click the link below to reset your password:
{{resetUrl}}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
The Marine-Axis Team`,
    variables: ['userName', 'resetUrl'],
    isActive: true,
    lastUsed: '2024-01-25T09:15:00Z',
    useCount: 67,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '5',
    name: 'System Maintenance',
    subject: 'Scheduled maintenance notification',
    category: 'system',
    content: `Dear Marine-Axis Users,

We will be performing scheduled maintenance on our platform:

Date: {{maintenanceDate}}
Time: {{maintenanceTime}}
Duration: {{maintenanceDuration}}

During this time, the platform may be temporarily unavailable. We apologize for any inconvenience.

If you have any urgent matters, please contact our support team.

Thank you for your understanding.

Best regards,
The Marine-Axis Team`,
    variables: ['maintenanceDate', 'maintenanceTime', 'maintenanceDuration'],
    isActive: false,
    lastUsed: '2024-01-20T00:00:00Z',
    useCount: 12,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

export function EmailTemplatesPage() {
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>(MOCK_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    category: 'provider' as EmailTemplate['category'],
    content: '',
    variables: [] as string[],
    isActive: true
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleViewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      category: template.category,
      content: template.content,
      variables: template.variables,
      isActive: template.isActive
    });
    setEditErrors({});
    setEditDialogOpen(true);
  };

  const handleCreateTemplate = () => {
    setEditForm({
      name: '',
      subject: '',
      category: 'provider',
      content: '',
      variables: [],
      isActive: true
    });
    setEditErrors({});
    setCreateDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!editForm.name.trim()) newErrors.name = 'Template name is required';
    if (!editForm.subject.trim()) newErrors.subject = 'Subject is required';
    if (!editForm.content.trim()) newErrors.content = 'Content is required';
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveTemplate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (selectedTemplate) {
        // Update existing template
        setTemplates(prev => prev.map(template => 
          template.id === selectedTemplate.id 
            ? { 
                ...template, 
                ...editForm,
                updatedAt: new Date().toISOString() 
              }
            : template
        ));
        
        toast({
          title: 'Template updated',
          description: `${editForm.name} has been updated successfully`,
        });
        
        setEditDialogOpen(false);
      } else {
        // Create new template
        const newTemplate: EmailTemplate = {
          id: String(templates.length + 1),
          ...editForm,
          useCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setTemplates(prev => [...prev, newTemplate]);
        
        toast({
          title: 'Template created',
          description: `${editForm.name} has been created successfully`,
        });
        
        setCreateDialogOpen(false);
      }
      
      setSelectedTemplate(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (templateId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { ...template, isActive: !template.isActive, updatedAt: new Date().toISOString() }
          : template
      ));
      
      const template = templates.find(t => t.id === templateId);
      toast({
        title: template?.isActive ? 'Template deactivated' : 'Template activated',
        description: `${template?.name} is now ${template?.isActive ? 'inactive' : 'active'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const template = templates.find(t => t.id === templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: 'Template deleted',
        description: `${template?.name} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newTemplate: EmailTemplate = {
        ...template,
        id: String(templates.length + 1),
        name: `${template.name} (Copy)`,
        useCount: 0,
        lastUsed: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setTemplates(prev => [...prev, newTemplate]);
      
      toast({
        title: 'Template duplicated',
        description: `Created a copy of ${template.name}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {filteredTemplates.length} of {templates.length} templates
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
                {filteredTemplates.length === 0 ? (
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
                            {template.lastUsed ? `Last: ${formatDate(template.lastUsed)}` : 'Never used'}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview of the email template content
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <Tabs defaultValue="preview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
                <TabsTrigger value="stats">Usage Stats</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Subject</Label>
                    <div className="p-3 bg-muted rounded-md">{selectedTemplate.subject}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Content</Label>
                    <div className="p-4 bg-muted rounded-md whitespace-pre-wrap text-sm">
                      {selectedTemplate.content}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="variables" className="space-y-4">
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
              
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Total Uses</Label>
                    <div className="text-2xl font-bold">{selectedTemplate.useCount}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Used</Label>
                    <div className="text-sm">
                      {selectedTemplate.lastUsed ? formatDate(selectedTemplate.lastUsed) : 'Never'}
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
          )}
          <DialogFooter>
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {selectedTemplate ? 'Update template details' : 'Create a new email template'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                <Label htmlFor="template-category">Category *</Label>
                <Select value={editForm.category} onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value as EmailTemplate['category'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="system">System</SelectItem>
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
              <Label htmlFor="template-content">Content *</Label>
              <Textarea
                id="template-content"
                rows={12}
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                className={editErrors.content ? 'border-destructive' : ''}
                placeholder="Enter the email template content. Use {{variableName}} for dynamic content."
              />
              {editErrors.content && <p className="text-sm text-destructive">{editErrors.content}</p>}
            </div>

            <div className="text-xs text-muted-foreground">
              Tip: Use double curly braces for variables like {`{{userName}}`}, {`{{companyName}}`}, etc.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setCreateDialogOpen(false);
              setSelectedTemplate(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isLoading}>
              {selectedTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmailTemplatesPage;