import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, MoreHorizontal, Edit, Trash2, Eye, FolderTree, ToggleLeft, ToggleRight,
  Anchor, Wrench, Radio, Settings, Ship, Compass, Waves, Cog, Hammer, BarChart3
} from 'lucide-react';

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
import useCRUD from '../hooks/useCRUD';
import api from '../lib/api';

const ICON_OPTIONS = [
  'anchor', 'wrench', 'radio', 'settings', 'ship', 'compass', 'waves', 'cog', 'hammer', 'bar-chart'
];

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  anchor: Anchor,
  wrench: Wrench,
  radio: Radio,
  settings: Settings,
  ship: Ship,
  compass: Compass,
  waves: Waves,
  cog: Cog,
  hammer: Hammer,
  'bar-chart': BarChart3,
};

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
  } = useCRUD<Category>({
    resource: 'categories',
    api: api.categories,
    messages: {
      created: 'Category created successfully',
      updated: 'Category updated successfully',
      deleted: 'Category deleted successfully',
    },
  });

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Transform backend categories to match frontend type
  const transformedCategories = categories.map(cat => ({
    ...cat,
    // Backend uses isActive, frontend expects active
    active: (cat as any).isActive !== undefined ? (cat as any).isActive : cat.active !== undefined ? cat.active : true,
    // Backend uses parentCategory (ObjectId), map to parentId (string) if needed
    parentId: cat.parentId || ((cat as any).parentCategory ? String((cat as any).parentCategory) : undefined),
    // Provide defaults for missing fields - use icon from backend if available
    icon: (cat as any).icon || cat.icon || 'anchor',
    order: cat.order || 0,
    providersCount: cat.providersCount || 0,
    jobsCount: cat.jobsCount || 0,
    children: cat.children || [],
  }));

  // Filter categories
  const filteredCategories = transformedCategories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = async (categoryId: string) => {
    const categoryToToggle = transformedCategories.find(c => c.id === categoryId);
    if (!categoryToToggle) return;

    try {
      // Backend expects isActive, not active
      const result = await updateItem(categoryId, { isActive: !categoryToToggle.active });
      if (result) {
        // Force refresh to get the updated data from backend
        await fetchItems();
      }
    } catch (error) {
      console.error('Failed to toggle category active status:', error);
    }
  };

  const handleDelete = async (categoryId: string) => {
    await deleteItem(categoryId);
  };

  const validateCreateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!createForm.name.trim()) newErrors.name = 'Category name is required';
    if (!createForm.description.trim()) newErrors.description = 'Description is required';

    setCreateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (validateCreateForm()) {
      const newCategoryData: any = {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        icon: createForm.icon || 'anchor',
        isActive: true, // Backend expects isActive
      };
      
      // Only include parentId if provided
      if (createForm.parentId) {
        newCategoryData.parentId = createForm.parentId;
      }
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
      description: category.description || '',
      icon: category.icon || 'anchor',
      parentId: category.parentId,
      order: category.order || 0,
      active: category.active !== undefined ? category.active : true,
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

    const updateData: any = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      icon: editForm.icon || 'anchor',
      // Backend expects isActive, not active
      isActive: editForm.active,
    };
    
    // Only include parentId if it's provided (backend uses parentId in update schema)
    if (editForm.parentId) {
      updateData.parentId = editForm.parentId;
    }
    
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
                <Label htmlFor="create-icon">Icon</Label>
                <Select value={createForm.icon || 'anchor'} onValueChange={(value) => setCreateForm(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger className={createErrors.icon ? 'border-destructive' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => {
                      const IconComponent = iconMap[icon] || Anchor;
                      return (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="capitalize">{icon}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
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
                    {transformedCategories.map((category) => (
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
                            {(() => {
                              const IconComponent = iconMap[category.icon || 'anchor'] || Anchor;
                              return <IconComponent className="h-4 w-4" />;
                            })()}
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
                        {category.providersCount !== undefined ? (
                          <Badge variant="secondary">{category.providersCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {category.jobsCount !== undefined ? (
                          <Badge variant="secondary">{category.jobsCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(category.active !== undefined ? category.active : (category as any).isActive !== undefined ? (category as any).isActive : true) ? (
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
                            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(category.id)}>
                              {(category.active !== undefined ? category.active : (category as any).isActive !== undefined ? (category as any).isActive : true) ? (
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
              <Label htmlFor="edit-icon">Icon</Label>
              <Select value={editForm.icon || 'anchor'} onValueChange={(value) => setEditForm(prev => ({ ...prev, icon: value }))}>
                <SelectTrigger className={editErrors.icon ? 'border-destructive' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((icon) => {
                    const IconComponent = iconMap[icon] || Anchor;
                    return (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span className="capitalize">{icon}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
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
                  {transformedCategories.filter(cat => cat.id !== editingCategory?.id).map((category) => (
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