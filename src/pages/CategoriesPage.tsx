import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, FolderTree, ToggleLeft, ToggleRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { Category, CreateCategoryForm } from '../types';

// Mock category data
const MOCK_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Marine Equipment',
    description: 'Equipment and tools for marine operations',
    icon: 'anchor',
    parentId: undefined,
    children: [],
    providersCount: 25,
    jobsCount: 45,
    order: 1,
    active: true,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '2',
    name: 'Boat Maintenance',
    description: 'Maintenance and repair services for boats',
    icon: 'wrench',
    parentId: undefined,
    children: [],
    providersCount: 18,
    jobsCount: 32,
    order: 2,
    active: true,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '3',
    name: 'Electronics & Navigation',
    description: 'Marine electronics and navigation systems',
    icon: 'radar',
    parentId: undefined,
    children: [],
    providersCount: 12,
    jobsCount: 28,
    order: 3,
    active: true,
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
  {
    id: '4',
    name: 'Repair Services',
    description: 'Professional boat and marine equipment repair',
    icon: 'settings',
    parentId: undefined,
    children: [],
    providersCount: 22,
    jobsCount: 38,
    order: 4,
    active: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '5',
    name: 'Marina Services',
    description: 'Marina operations and boat berthing services',
    icon: 'anchor',
    parentId: undefined,
    children: [],
    providersCount: 8,
    jobsCount: 15,
    order: 5,
    active: false,
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

const ICON_OPTIONS = [
  'anchor', 'wrench', 'radar', 'settings', 'ship', 'compass', 'waves', 'gear', 'tool', 'chart'
];

export function CategoriesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const [createForm, setCreateForm] = useState<CreateCategoryForm>({
    name: '',
    description: '',
    icon: 'anchor',
    parentId: undefined,
    order: undefined,
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Filter categories
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = async (categoryId: string) => {
    if (!validateCreateForm()) return;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCategories(prev => 
        prev.map(category => 
          category.id === categoryId 
            ? { ...category, active: !category.active, updatedAt: new Date().toISOString() }
            : category
        )
      );
      
      const category = categories.find(c => c.id === categoryId);
      toast({
        title: `Category ${category?.active ? 'deactivated' : 'activated'}`,
        description: `${category?.name} is now ${category?.active ? 'inactive' : 'active'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const category = categories.find(c => c.id === categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      
      toast({
        title: 'Category deleted',
        description: `${category?.name} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateCreateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!createForm.name.trim()) newErrors.name = 'Category name is required';
    if (!createForm.description.trim()) newErrors.description = 'Description is required';
    if (!createForm.icon) newErrors.icon = 'Icon is required';

    setCreateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newCategory: Category = {
        id: String(categories.length + 1),
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        icon: createForm.icon,
        parentId: createForm.parentId || undefined,
        children: [],
        providersCount: 0,
        jobsCount: 0,
        order: createForm.order || categories.length + 1,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCategories(prev => [...prev, newCategory]);
      
      toast({
        title: 'Category created',
        description: `${newCategory.name} has been added`,
      });

      setIsCreateDialogOpen(false);
      setCreateForm({
        name: '',
        description: '',
        icon: 'anchor',
        parentId: undefined,
        order: undefined,
      });
      setCreateErrors({});
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage service categories and classifications</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
              <DialogDescription>
                Add a new service category to organize providers and jobs
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Category Name *</Label>
                <Input
                  id="create-name"
                  placeholder="Enter category name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className={createErrors.name ? 'border-destructive' : ''}
                />
                {createErrors.name && <p className="text-sm text-destructive">{createErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Description *</Label>
                <Textarea
                  id="create-description"
                  placeholder="Describe this category"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className={createErrors.description ? 'border-destructive' : ''}
                />
                {createErrors.description && <p className="text-sm text-destructive">{createErrors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-icon">Icon *</Label>
                <Select value={createForm.icon} onValueChange={(value) => setCreateForm(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger className={createErrors.icon ? 'border-destructive' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createErrors.icon && <p className="text-sm text-destructive">{createErrors.icon}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-parent">Parent Category (optional)</Label>
                <Select value={createForm.parentId || 'none'} onValueChange={(value) => setCreateForm(prev => ({ ...prev, parentId: value === 'none' ? undefined : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top level)</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCategory} disabled={isLoading}>
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
          <CardDescription>
            View and manage all service categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredCategories.length} of {categories.length} categories
            </div>
          </div>

          {/* Categories Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Providers</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery ? 'No categories found matching your search' : 'No categories found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-xs font-medium">{category.icon}</span>
                          </div>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-muted-foreground">Order: {category.order}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{category.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.providersCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.jobsCount}</Badge>
                      </TableCell>
                      <TableCell>
                        {category.active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(category.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(category.id)}>
                              {category.active ? (
                                <>
                                  <ToggleLeft className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
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
                                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{category.name}</strong>? 
                                    This will affect {category.providersCount} providers and {category.jobsCount} jobs.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(category.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={isLoading}
                                  >
                                    Delete Category
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
    </div>
  );
}

export default CategoriesPage;