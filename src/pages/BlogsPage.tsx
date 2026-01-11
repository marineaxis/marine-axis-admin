import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, FileText, Calendar, Tag, Star, Archive, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { Blog } from '../types';
import useCRUD from '../hooks/useCRUD';
import api from '../lib/api';

export function BlogsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [blogStats, setBlogStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    archived: 0,
    featured: 0,
  });

  // Memoize the API object to prevent recreation on every render
  const blogApi = useMemo(() => ({
    ...api.blogs,
    list: api.blogs.listAdmin, // Use admin endpoint for full blog list
  }), []);

  // Use CRUD hook for blog management
  const {
    items: blogs,
    loading,
    updating,
    deleting,
    fetchItems,
    updateItem,
    deleteItem,
    setFilters,
  } = useCRUD<Blog>({
    resource: 'blogs',
    api: blogApi,
    messages: {
      updated: 'Blog updated successfully',
      deleted: 'Blog deleted successfully',
    },
  });

  // Apply filters when search or filter values change
  useEffect(() => {
    const filters: any = {
      page: 1,
      limit: 25,
      sortOrder: 'desc',
    };
    
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    
    // Use fetchItems directly instead of setFilters to avoid infinite loop
    // fetchItems is memoized and should be stable
    fetchItems(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter]); // Removed fetchItems from deps to prevent loop

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch blog statistics
        const statsResponse = await api.blogs.getStats();
        if (statsResponse.success) {
          setBlogStats(statsResponse.data);
        }
      } catch (error: any) {
        console.error('Failed to fetch blog stats:', error);
      }
    };
    loadInitialData();
  }, []);

  const handlePublish = async (blogId: string) => {
    try {
      const response = await api.blogs.publish(blogId);
      
      if (response.success) {
        toast({
          title: 'Blog published',
          description: 'Blog post is now live',
        });
        // Refresh data using fetchItems
        const filters: any = {
          page: 1,
          limit: 25,
          sortOrder: 'desc',
        };
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }
        await fetchItems(filters);
        
        // Refresh stats after publishing
        try {
          const statsResponse = await api.blogs.getStats();
          if (statsResponse.success) {
            setBlogStats(statsResponse.data);
          }
        } catch (error: any) {
          console.error('Failed to fetch blog stats:', error);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish blog',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (blogId: string) => {
    try {
      const response = await api.blogs.archive(blogId);
      
      if (response.success) {
        toast({
          title: 'Blog archived',
          description: 'Blog post has been archived',
        });
        // Refresh data using fetchItems
        const filters: any = {
          page: 1,
          limit: 25,
          sortOrder: 'desc',
        };
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }
        await fetchItems(filters);
        
        // Refresh stats after archiving
        try {
          const statsResponse = await api.blogs.getStats();
          if (statsResponse.success) {
            setBlogStats(statsResponse.data);
          }
        } catch (error: any) {
          console.error('Failed to fetch blog stats:', error);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive blog',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (blogId: string) => {
    try {
      const response = await api.blogs.toggleFeatured(blogId);
      
      if (response.success) {
        const blog = blogs.find(b => b.id === blogId);
        toast({
          title: blog?.featured ? 'Removed from featured' : 'Added to featured',
          description: blog?.featured ? 'Blog is no longer featured' : 'Blog is now featured',
        });
        // Refresh data using fetchItems
        const filters: any = {
          page: 1,
          limit: 25,
          sortOrder: 'desc',
        };
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }
        await fetchItems(filters);
        
        // Refresh stats after toggling featured
        try {
          const statsResponse = await api.blogs.getStats();
          if (statsResponse.success) {
            setBlogStats(statsResponse.data);
          }
        } catch (error: any) {
          console.error('Failed to fetch blog stats:', error);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update blog',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (blogId: string) => {
    await deleteItem(blogId);
    // Refresh data and stats after deletion
    const filters: any = {
      page: 1,
      limit: 25,
      sortOrder: 'desc',
    };
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    await fetchItems(filters);
    
    // Refresh stats
    try {
      const statsResponse = await api.blogs.getStats();
      if (statsResponse.success) {
        setBlogStats(statsResponse.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch blog stats:', error);
    }
  };

  const handleViewDetails = (blog: Blog) => {
    navigate(`/blogs/${blog.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="gap-1"><Play className="h-3 w-3" />Published</Badge>;
      case 'draft':
        return <Badge variant="secondary" className="gap-1"><FileText className="h-3 w-3" />Draft</Badge>;
      case 'archived':
        return <Badge variant="outline" className="gap-1"><Archive className="h-3 w-3" />Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatReadTime = (minutes: number) => {
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blogs</h1>
            <p className="text-muted-foreground">Manage blog posts and content</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blogs</h1>
          <p className="text-muted-foreground">Manage blog posts and content</p>
        </div>
        <Button onClick={() => navigate('/blogs/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Blog
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blogs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{blogStats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{blogStats.drafts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogStats.archived}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{blogStats.featured}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Management</CardTitle>
          <CardDescription>
            View and manage all blog posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {blogs.length} blogs
            </div>
          </div>

          {/* Blogs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' ? 'No blogs found matching your criteria' : 'No blogs found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  blogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {blog.title}
                              {blog.featured && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                              {blog.excerpt}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{blog.author?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{formatReadTime(blog.readTime || 0)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(blog.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(blog.tags || []).slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(blog.tags || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(blog.tags || []).length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-medium">{(blog.views || 0).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {blog.status === 'published' 
                          ? (blog.publishedAt ? formatDate(blog.publishedAt) : (blog.createdAt ? formatDate(blog.createdAt) : 'Published'))
                          : 'Not published'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(blog)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/blogs/${blog.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {blog.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handlePublish(blog.id)}>
                                <Play className="mr-2 h-4 w-4" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {(blog.status === 'published' || blog.status === 'draft') && (
                              <DropdownMenuItem onClick={() => handleArchive(blog.id)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleToggleFeatured(blog.id)}>
                              <Star className="mr-2 h-4 w-4" />
                              {blog.featured ? 'Remove Featured' : 'Make Featured'}
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
                                  <AlertDialogTitle>Delete Blog</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{blog.title}</strong>? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(blog.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deleting}
                                  >
                                    Delete Blog
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

export default BlogsPage;