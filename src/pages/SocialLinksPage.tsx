import React, { useState } from 'react';
import { Plus, Share2, Edit, Trash2, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export function SocialLinksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [formData, setFormData] = useState({ platform: '', url: '' });

  const { data: linksData, isLoading } = useQuery({
    queryKey: ['social-links'],
    queryFn: async () => {
      const response = await api.socialLinks.list();
      return response;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { platform: string; url: string }) => {
      return await api.socialLinks.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      toast({ title: 'Social link created', description: 'Social media link added successfully' });
      setDialogOpen(false);
      setFormData({ platform: '', url: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { platform?: string; url?: string } }) => {
      return await api.socialLinks.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      toast({ title: 'Social link updated', description: 'Social media link updated successfully' });
      setDialogOpen(false);
      setEditingLink(null);
      setFormData({ platform: '', url: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.socialLinks.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      toast({ title: 'Social link deleted', description: 'Social media link removed successfully' });
    },
  });

  const links = linksData?.data || [];

  const handleOpenDialog = (link?: SocialLink) => {
    if (link) {
      setEditingLink(link);
      setFormData({ platform: link.platform, url: link.url });
    } else {
      setEditingLink(null);
      setFormData({ platform: '', url: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.platform || !formData.url) {
      toast({ title: 'Validation error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (editingLink) {
      updateMutation.mutate({ id: editingLink.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Links</h1>
          <p className="text-muted-foreground">Manage social media links</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Social Link
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>Configure social media links for the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : links.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">No social links found. Add one to get started.</TableCell></TableRow>
                ) : (
                  links.map((link: SocialLink) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.platform}</TableCell>
                      <TableCell>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {link.url}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenDialog(link)}>
                            <Edit className="h-3 w-3 mr-1" />Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-3 w-3 mr-1" />Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Social Link</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the {link.platform} link? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(link.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Edit Social Link' : 'Add Social Link'}</DialogTitle>
            <DialogDescription>
              {editingLink ? 'Update the social media link information' : 'Add a new social media link to the platform'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Input
                id="platform"
                placeholder="e.g., Facebook, Twitter, LinkedIn"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingLink ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SocialLinksPage;

