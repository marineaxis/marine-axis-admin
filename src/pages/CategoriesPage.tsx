import React, { useState, useEffect } from 'react';
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

import { Category, CreateCategoryForm, TableFilters, ApiResponse, PaginatedResponse } from '../types';
import useCRUD from '../hooks/useCRUD';
import api from '../lib/api';

const ICON_OPTIONS = [
  'anchor', 'wrench', 'radar', 'settings', 'ship', 'compass', 'waves', 'gear', 'tool', 'chart'
];

export function CategoriesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const [createForm, setCreateForm] = useState<CreateCategoryForm>({
    name: '',
    description: '',
    icon: 'anchor',
    parentId: undefined,
    order: undefined,
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', icon: '', parentId: undefined, order: undefined, active: true });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Adapter to normalize api.categories to the shapes expected by useCRUD
  const categoriesApi = {
    list: async (params?: TableFilters): Promise<PaginatedResponse<Category>> => {
      const res = await api.categories.list(params) as unknown;
      // If already a paginated response, return directly
      if (res && typeof res === 'object' && (res as any).pagination && Array.isArray((res as any).data)) {
        return res as PaginatedResponse<Category>;
      }

      // If wrapped as ApiResponse with data array and optional pagination
      if (res && typeof res === 'object' && (res as any).data && Array.isArray((res as any).data)) {
        const r = res as unknown as ApiResponse<{ data: Category[]; pagination?: PaginatedResponse<Category>['pagination'] }>;
        return {
          success: true,
          data: r.data.data,
          pagination: r.data.pagination ?? { page: 1, limit: 25, total: r.data.data.length, totalPages: 1, hasNext: false, hasPrev: false },
          message: r.message,
        } as PaginatedResponse<Category>;
      }

      // Fallback: attempt to cast (low-risk for dev)
      return res as PaginatedResponse<Category>;
    },
    get: async (id: string): Promise<ApiResponse<Category>> => {
      return (await api.categories.get(id)) as ApiResponse<Category>;
    },
    create: async (data?: unknown): Promise<ApiResponse<Category>> => {
      return (await api.categories.create(data as Record<string, unknown>)) as ApiResponse<Category>;
    },
    update: async (id: string, data?: unknown): Promise<ApiResponse<Category>> => {
      return (await api.categories.update(id, data as Record<string, unknown>)) as ApiResponse<Category>;
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return (await api.categories.delete(id)) as unknown as ApiResponse<void>;
    },
  };

  // Use CRUD hook for category management
  const {
    items: categories,
    loading,
    creating,
    updating,
    deleting,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    setFilters,
    // pull current filters from hook state so we can react to changes
    filters,
  } = useCRUD<Category>({
    resource: 'categories',
    api: categoriesApi,
    messages: {
      created: 'Category created successfully',
      updated: 'Category updated successfully',
      deleted: 'Category deleted successfully',
    },
  });

  // Debounced fetch that reacts to the hook filters (prevents refresh storms)
  const fetchDebounceTimer = React.useRef<number | null>(null);
  const lastFetchedFiltersKeyRef = React.useRef<string | null>(null);

  const filtersKey = React.useMemo(() => {
    try { return JSON.stringify(filters || {}); } catch { return String(filters || ''); }
  }, [filters]);

  React.useEffect(() => {
    if (!filtersKey) return;
    if (lastFetchedFiltersKeyRef.current === filtersKey) return;

    if (fetchDebounceTimer.current) {
      clearTimeout(fetchDebounceTimer.current);
      fetchDebounceTimer.current = null;
    }

    fetchDebounceTimer.current = window.setTimeout(async () => {
      let parsedFilters: TableFilters | undefined;
      try { parsedFilters = JSON.parse(filtersKey) as TableFilters; } catch { parsedFilters = undefined; }
      if (!parsedFilters) return;

      try {
        const result = await fetchItems(parsedFilters);
        if (result) {
          lastFetchedFiltersKeyRef.current = filtersKey;
        }
      } catch (error) {
        // fetchItems handles toasts; swallow here
      }
    }, 200);

    return () => {
      if (fetchDebounceTimer.current) {
        clearTimeout(fetchDebounceTimer.current);
        fetchDebounceTimer.current = null;
      }
    };
  }, [filtersKey, fetchItems]);

  // Wire search box to hook filters so UI controls drive the fetches
  React.useEffect(() => {
    const next: Partial<TableFilters> = {};
    if (searchQuery.trim()) next.search = searchQuery.trim();
    setFilters(next);
  }, [searchQuery, setFilters]);

  // Filter categories
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = async (categoryId: string) => {
    const categoryToToggle = categories.find(c => c.id === categoryId);
    if (!categoryToToggle) return;

    await updateItem(categoryId, { active: !categoryToToggle.active });
  };

  const handleDelete = async (categoryId: string) => {
    await deleteItem(categoryId);
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

    if (validateCreateForm()) {
      const newCategoryData = {
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
      };
      const result = await createItem(newCategoryData);
      if (result) {
        setIsCreateDialogOpen(false);
        setCreateForm({
          name: '',
          description: '',
          icon: 'anchor',
          parentId: undefined,
          order: undefined,
        });
        setCreateErrors({});
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      description: category.description,
      icon: category.icon,
      parentId: category.parentId,
      order: category.order,
      active: category.active,
    });
    setEditErrors({});
    setIsEditDialogOpen(true);
  };

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!editForm.name.trim()) newErrors.name = 'Category name is required';
    if (!editForm.description.trim()) newErrors.description = 'Description is required';
    if (!editForm.icon) newErrors.icon = 'Icon is required';

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateCategory = async () => {
    if (!validateEditForm() || !editingCategory) return;

    const updateData = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      icon: editForm.icon,
      parentId: editForm.parentId,
      order: editForm.order,
      active: editForm.active,
    };
    const result = await updateItem(editingCategory.id, updateData);
    if (result) {
      setIsEditDialogOpen(false);
      setEditingCategory(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="text-muted-foreground">Manage service categories and classifications</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <>
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
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCategory} disabled={creating}>
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
                              <Edit className="mr-2 h-4 w-4" onClick={() => handleEditCategory(category)} />
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
                                    disabled={deleting}
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
      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                placeholder="Enter category name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className={editErrors.name ? 'border-destructive' : ''}
              />
              {editErrors.name && <p className="text-sm text-destructive">{editErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe this category"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className={editErrors.description ? 'border-destructive' : ''}
              />
              {editErrors.description && <p className="text-sm text-destructive">{editErrors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon *</Label>
              <Select value={editForm.icon} onValueChange={(value) => setEditForm(prev => ({ ...prev, icon: value }))}>
                <SelectTrigger className={editErrors.icon ? 'border-destructive' : ''}>
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
              {editErrors.icon && <p className="text-sm text-destructive">{editErrors.icon}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-parent">Parent Category (optional)</Label>
              <Select value={editForm.parentId || 'none'} onValueChange={(value) => setEditForm(prev => ({ ...prev, parentId: value === 'none' ? undefined : value }))}>
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
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCategory} disabled={updating}>Update Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CategoriesPage;