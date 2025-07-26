import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Trash2, Edit, Shield, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { User } from '../types';
import { useAuth } from '../context/AuthContext';

// Mock admin data - in real app this would come from API
const MOCK_ADMINS: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@marine-axis.com',
    role: 'admin',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    lastLogin: '2024-01-25T10:30:00Z',
  },
  {
    id: '2',
    name: 'Super Admin',
    email: 'superadmin@marine-axis.com',
    role: 'super_admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-25T08:15:00Z',
  },
  {
    id: '3',
    name: 'John Smith',
    email: 'john.smith@marine-axis.com',
    role: 'admin',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
    lastLogin: '2024-01-24T14:20:00Z',
  },
];

export function AdminsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  
  const [admins, setAdmins] = useState<User[]>(MOCK_ADMINS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'admin' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Filter admins based on search query
  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteAdmin = async (adminId: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const adminToDelete = admins.find(a => a.id === adminId);
      
      // Prevent deleting self
      if (adminToDelete?.email === user?.email) {
        toast({
          title: 'Cannot delete yourself',
          description: 'You cannot delete your own admin account',
          variant: 'destructive',
        });
        return;
      }

      setAdmins(prev => prev.filter(admin => admin.id !== adminId));
      
      toast({
        title: 'Admin deleted',
        description: `${adminToDelete?.name} has been removed from the system`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete admin. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAdmin = (admin: User) => {
    setEditingAdmin(admin);
    setEditForm({ name: admin.name, email: admin.email, role: admin.role });
    setEditErrors({});
    setIsEditDialogOpen(true);
  };

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!editForm.name.trim()) newErrors.name = 'Name is required';
    if (!editForm.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) newErrors.email = 'Invalid email format';
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateAdmin = async () => {
    if (!validateEditForm() || !editingAdmin) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAdmins(prev => prev.map(admin => 
        admin.id === editingAdmin.id 
          ? { ...admin, name: editForm.name.trim(), email: editForm.email.trim(), role: editForm.role as 'admin' | 'super_admin', updatedAt: new Date().toISOString() }
          : admin
      ));
      
      toast({
        title: 'Admin updated',
        description: `${editForm.name} has been updated successfully`,
      });
      
      setIsEditDialogOpen(false);
      setEditingAdmin(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update admin. Please try again.',
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'super_admin') {
      return (
        <Badge variant="default" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          Super Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Shield className="h-3 w-3" />
        Admin
      </Badge>
    );
  };

  // Only super admins can access this page
  if (!hasRole('super_admin')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admins</h1>
          <p className="text-muted-foreground">Manage admin users and their permissions</p>
        </div>
        <Button onClick={() => navigate('/admins/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Management</CardTitle>
          <CardDescription>
            View and manage all admin users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAdmins.length} of {admins.length} admins
            </div>
          </div>

          {/* Admins Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery ? 'No admins found matching your search' : 'No admins found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{getRoleBadge(admin.role)}</TableCell>
                      <TableCell>
                        {admin.lastLogin ? formatDate(admin.lastLogin) : 'Never'}
                      </TableCell>
                      <TableCell>{formatDate(admin.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditAdmin(admin)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                  disabled={admin.email === user?.email}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{admin.name}</strong>? 
                                    This action cannot be undone and will remove all admin privileges.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={isLoading}
                                  >
                                    Delete Admin
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

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update admin details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className={editErrors.name ? 'border-destructive' : ''}
              />
              {editErrors.name && <p className="text-sm text-destructive">{editErrors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className={editErrors.email ? 'border-destructive' : ''}
              />
              {editErrors.email && <p className="text-sm text-destructive">{editErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmin} disabled={isLoading}>
              Update Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminsPage;