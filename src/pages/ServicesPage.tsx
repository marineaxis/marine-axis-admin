import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight,
  Wrench, Anchor, Users, Package, Truck, GraduationCap, Palette, Ship, Globe, BarChart3
} from 'lucide-react';

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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

import { Service, CreateServiceForm } from '../types';
import useCRUD from '../hooks/useCRUD';
import api from '../lib/api';

const ICON_OPTIONS = [
  { value: 'Wrench', label: 'Wrench', icon: Wrench },
  { value: 'Anchor', label: 'Anchor', icon: Anchor },
  { value: 'Users', label: 'Users', icon: Users },
  { value: 'Package', label: 'Package', icon: Package },
  { value: 'Truck', label: 'Truck', icon: Truck },
  { value: 'GraduationCap', label: 'Graduation Cap', icon: GraduationCap },
  { value: 'Palette', label: 'Palette', icon: Palette },
  { value: 'Ship', label: 'Ship', icon: Ship },
  { value: 'Globe', label: 'Globe', icon: Globe },
  { value: 'BarChart3', label: 'Bar Chart', icon: BarChart3 },
];

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Anchor,
  Users,
  Package,
  Truck,
  GraduationCap,
  Palette,
  Ship,
  Globe,
  BarChart3,
};

export function ServicesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const [createForm, setCreateForm] = useState<CreateServiceForm>({
    name: '',
    description: '',
    icon: 'Anchor',
    features: [],
    isActive: true,
    order: 0,
  });
  const [createFeatureInput, setCreateFeatureInput] = useState('');
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    description: '', 
    icon: 'Anchor', 
    features: [] as string[],
    isActive: true,
    order: 0 
  });
  const [editFeatureInput, setEditFeatureInput] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Use CRUD hook for service management
  const {
    items: services,
    loading,
    creating,
    updating,
    deleting,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    setFilters,
  } = useCRUD<Service>({
    resource: 'services',
    api: api.services,
    messages: {
      created: 'Service created successfully',
      updated: 'Service updated successfully',
      deleted: 'Service deleted successfully',
    },
  });

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Transform backend services to match frontend type
  const transformedServices = services.map(service => ({
    ...service,
    active: (service as any).isActive !== undefined ? (service as any).isActive : service.active !== undefined ? service.active : true,
    features: service.features || [],
    order: service.order || 0,
  }));

  // Filter services
  const filteredServices = transformedServices.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = async (serviceId: string) => {
    const serviceToToggle = transformedServices.find(s => s.id === serviceId);
    if (!serviceToToggle) return;

    try {
      const result = await updateItem(serviceId, { isActive: !serviceToToggle.active });
      if (result) {
        await fetchItems();
      }
    } catch (error) {
      console.error('Failed to toggle service active status:', error);
    }
  };

  const handleDelete = async (serviceId: string) => {
    await deleteItem(serviceId);
  };

  const validateCreateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!createForm.name.trim()) newErrors.name = 'Service name is required';
    if (!createForm.description.trim()) newErrors.description = 'Description is required';
    if (!createForm.icon) newErrors.icon = 'Icon is required';
    if (createForm.features.length === 0) newErrors.features = 'At least one feature is required';

    setCreateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCreateFeature = () => {
    if (createFeatureInput.trim()) {
      setCreateForm(prev => ({
        ...prev,
        features: [...prev.features, createFeatureInput.trim()],
      }));
      setCreateFeatureInput('');
    }
  };

  const handleRemoveCreateFeature = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleCreateService = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (validateCreateForm()) {
      const newServiceData: any = {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        icon: createForm.icon,
        features: createForm.features,
        isActive: createForm.isActive ?? true,
        order: createForm.order || 0,
      };
      
      const result = await createItem(newServiceData);
      if (result) {
        setIsCreateDialogOpen(false);
        setCreateForm({
          name: '',
          description: '',
          icon: 'Anchor',
          features: [],
          isActive: true,
          order: 0,
        });
        setCreateFeatureInput('');
        setCreateErrors({});
      }
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setEditForm({
      name: service.name,
      description: service.description || '',
      icon: service.icon || 'Anchor',
      features: service.features || [],
      isActive: service.active !== undefined ? service.active : (service as any).isActive !== undefined ? (service as any).isActive : true,
      order: service.order || 0,
    });
    setEditFeatureInput('');
    setEditErrors({});
    setIsEditDialogOpen(true);
  };

  const handleAddEditFeature = () => {
    if (editFeatureInput.trim()) {
      setEditForm(prev => ({
        ...prev,
        features: [...prev.features, editFeatureInput.trim()],
      }));
      setEditFeatureInput('');
    }
  };

  const handleRemoveEditFeature = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!editForm.name.trim()) newErrors.name = 'Service name is required';
    if (!editForm.description.trim()) newErrors.description = 'Description is required';
    if (!editForm.icon) newErrors.icon = 'Icon is required';
    if (editForm.features.length === 0) newErrors.features = 'At least one feature is required';

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateService = async () => {
    if (!validateEditForm() || !editingService) return;

    const updateData: any = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      icon: editForm.icon,
      features: editForm.features,
      isActive: editForm.isActive,
      order: editForm.order,
    };
    
    const result = await updateItem(editingService.id, updateData);
    if (result) {
      setIsEditDialogOpen(false);
      setEditingService(null);
    }
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage Marine Axis services</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Service
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">
              {transformedServices.filter(s => s.active).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transformedServices.filter(s => s.active).length}</div>
            <p className="text-xs text-muted-foreground">
              {transformedServices.filter(s => !s.active).length} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transformedServices.reduce((sum, s) => sum + (s.features?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all services</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>
            View and manage all Marine Axis services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredServices.length} of {services.length} services
            </div>
          </div>

          {/* Services Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No services found matching your search' : 'No services found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => {
                    const IconComponent = iconMap[service.icon] || Anchor;
                    return (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <IconComponent className="h-4 w-4 text-primary" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="max-w-md truncate">{service.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{service.features?.length || 0} features</Badge>
                        </TableCell>
                        <TableCell>{service.order || 0}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(service.id)}
                            className="gap-2"
                          >
                            {service.active ? (
                              <>
                                <ToggleRight className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Inactive</span>
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditService(service)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Service</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{service.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(service.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Service Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>
              Add a new Marine Axis service to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Service Name *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                className={createErrors.name ? 'border-destructive' : ''}
                placeholder="e.g., Ship Building"
              />
              {createErrors.name && <p className="text-sm text-destructive">{createErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description *</Label>
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                className={createErrors.description ? 'border-destructive' : ''}
                placeholder="Describe the service..."
                rows={3}
              />
              {createErrors.description && <p className="text-sm text-destructive">{createErrors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-icon">Icon *</Label>
                <Select value={createForm.icon} onValueChange={(value) => setCreateForm(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger className={createErrors.icon ? 'border-destructive' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {createErrors.icon && <p className="text-sm text-destructive">{createErrors.icon}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-order">Display Order</Label>
                <Input
                  id="create-order"
                  type="number"
                  value={createForm.order}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-features">Features *</Label>
              <div className="flex gap-2">
                <Input
                  id="create-features"
                  value={createFeatureInput}
                  onChange={(e) => setCreateFeatureInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCreateFeature();
                    }
                  }}
                  placeholder="Add a feature and press Enter"
                />
                <Button type="button" onClick={handleAddCreateFeature} variant="outline">
                  Add
                </Button>
              </div>
              {createForm.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {createForm.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveCreateFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {createErrors.features && <p className="text-sm text-destructive">{createErrors.features}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="create-active"
                checked={createForm.isActive}
                onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="create-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateService} disabled={creating}>
              {creating ? 'Creating...' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Service Name *</Label>
              <Input
                id="edit-name"
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
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className={editErrors.description ? 'border-destructive' : ''}
                rows={3}
              />
              {editErrors.description && <p className="text-sm text-destructive">{editErrors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon *</Label>
                <Select value={editForm.icon} onValueChange={(value) => setEditForm(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger className={editErrors.icon ? 'border-destructive' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {editErrors.icon && <p className="text-sm text-destructive">{editErrors.icon}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-order">Display Order</Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={editForm.order}
                  onChange={(e) => setEditForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-features">Features *</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-features"
                  value={editFeatureInput}
                  onChange={(e) => setEditFeatureInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEditFeature();
                    }
                  }}
                  placeholder="Add a feature and press Enter"
                />
                <Button type="button" onClick={handleAddEditFeature} variant="outline">
                  Add
                </Button>
              </div>
              {editForm.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editForm.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {editErrors.features && <p className="text-sm text-destructive">{editErrors.features}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateService} disabled={updating}>
              {updating ? 'Updating...' : 'Update Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ServicesPage;

