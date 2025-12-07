import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import ErrorPanel from '@/components/ErrorPanel';

import type { Blog, TableFilters, PaginatedResponse, ApiResponse } from '../types';
import useCRUD, { CRUDConfig } from '../hooks/useCRUD';
import api from '../lib/api';

export function BlogsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [blogStats, setBlogStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    archived: 0,
    featured: 0,
  });
  const [fetchError, setFetchError] = useState<{ message?: string; status?: number; url?: string } | null>(null);

  const getViewCount = (b: Blog): number => {
    return typeof b.viewCount === 'number' ? b.viewCount : 0;
  };

  // Use CRUD hook for blog management
  const crudConfig: CRUDConfig<Blog> = {
    resource: 'blogs',
    api: {
      list: api.blogs.listAdmin,
      get: api.blogs.get,
      create: api.blogs.create,
      update: api.blogs.update,
      delete: api.blogs.delete,
    },
    messages: {
      updated: 'Blog updated successfully',
      deleted: 'Blog deleted successfully',
    },
  };

  const {
    items: blogs,
    loading,
    updating,
    deleting,
    fetchItems,
    updateItem,
    deleteItem,
    setFilters,
    resetFilters,
    // pull current filters from hook state
    filters,
  } = useCRUD<Blog>(crudConfig);

  useEffect(() => {
    fetchBlogData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBlogData = async () => {
    try {
      // Fetch blog statistics only; list is fetched by filters effect
      const statsResponse = await api.blogs.getStats();
      if (statsResponse.success && statsResponse.data) {
        const d = statsResponse.data as unknown as Partial<typeof blogStats>;
        setBlogStats(prev => ({ ...prev, ...(d as typeof blogStats) }));
      }
    } catch (error: unknown) {
      console.error('Failed to fetch blog data:', error);
      toast({ title: 'Error', description: 'Failed to load blog data. Please try again.', variant: 'destructive' });
    }
  };

  // Keep track of the last filters we applied from the UI to avoid feedback loops
  const lastAppliedFiltersRef = React.useRef<Record<string, string> | null>(null);
  // Store key of last successful fetch to avoid duplicate requests
  const lastFetchedFiltersKeyRef = React.useRef<string | null>(null);

  // Stable serialized filters key to avoid object-identity churn in effect deps
  const filtersKey = useMemo(() => {
    try { return JSON.stringify(filters || {}); } catch { return String(filters || ''); }
  }, [filters]);

  // Initialize lastAppliedFiltersRef from the hook filters once to avoid
  // treating the initial hook-provided filters as different on first render.
  React.useEffect(() => {
    if (lastAppliedFiltersRef.current === null && filters) {
      // Normalize to string map for comparison
      const norm: Record<string, string> = {};
      Object.keys(filters).forEach((k) => { const v = (filters as Record<string, unknown>)[k]; if (v !== undefined) norm[k] = String(v); });
      lastAppliedFiltersRef.current = norm;
    }
  // run once when filters become available
  }, [filters]);

  // Debounced filter updates to hook state (no fetch here)
  useEffect(() => {
    const nextFilters: Record<string, string> = {};
    if (searchQuery.trim()) nextFilters.search = searchQuery.trim();
    if (statusFilter !== 'all') nextFilters.status = statusFilter;

    const last = lastAppliedFiltersRef.current;
    const nextKeys = Object.keys(nextFilters);

    const isSame = (() => {
      if (!last) return false;
      const lastKeys = Object.keys(last);
      if (lastKeys.length !== nextKeys.length) return false;
      for (const k of nextKeys) {
        if (String(last[k]) !== String(nextFilters[k])) return false;
      }
      return true;
    })();

    if (!isSame) {
      if (nextKeys.length === 0) {
        const defaultFilters = { page: 1, limit: 25, sortOrder: 'desc' } as unknown as Record<string, string>;
        lastAppliedFiltersRef.current = defaultFilters;
        setFilters(defaultFilters as unknown as Partial<TableFilters>);
      } else {
        lastAppliedFiltersRef.current = nextFilters;
        setFilters(nextFilters as unknown as Partial<TableFilters>);
      }
    }
  // only respond to UI-controlled values
  }, [searchQuery, statusFilter, setFilters]);

  // Fetch whenever filters in hook state change (debounced)
  const fetchDebounceTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!filtersKey) return;
    setFetchError(null);

    // If we've already fetched this exact filter set, skip
    if (lastFetchedFiltersKeyRef.current === filtersKey) return;

    // debounce to avoid rapid repeated requests
    if (fetchDebounceTimer.current) {
      clearTimeout(fetchDebounceTimer.current);
      fetchDebounceTimer.current = null;
    }

    fetchDebounceTimer.current = window.setTimeout(async () => {
      // parse filters and call fetchItems once
      let parsedFilters: TableFilters | undefined;
      try { parsedFilters = JSON.parse(filtersKey) as TableFilters; } catch { parsedFilters = undefined; }
      if (!parsedFilters) return;

      try {
        const result = await fetchItems(parsedFilters);
        if (!result) return;
        const norm: Record<string, string> = {};
        Object.keys(parsedFilters).forEach((k) => { const v = (parsedFilters as Record<string, unknown>)[k]; if (v !== undefined) norm[k] = String(v); });
        lastAppliedFiltersRef.current = norm;
        lastFetchedFiltersKeyRef.current = filtersKey;
      } catch (error: unknown) {
        const errRec = error as unknown as Record<string, unknown>;
        setFetchError({ message: typeof errRec?.message === 'string' ? (errRec.message as string) : undefined, status: typeof errRec?.status === 'number' ? (errRec.status as number) : undefined, url: typeof errRec?.url === 'string' ? (errRec.url as string) : undefined });
      }
    }, 500);

    return () => {
      if (fetchDebounceTimer.current) {
        clearTimeout(fetchDebounceTimer.current);
        fetchDebounceTimer.current = null;
      }
    };
  }, [filtersKey, fetchItems]);

  const handlePublish = async (blogId: string) => {
    try {
      const response = await api.blogs.publish(blogId);
      if (response.success) {
        toast({ title: 'Blog published', description: 'Blog post is now live' });
        await fetchBlogData();
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to publish blog', variant: 'destructive' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to publish blog';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleArchive = async (blogId: string) => {
    try {
      const response = await api.blogs.archive(blogId);
      if (response.success) {
        toast({ title: 'Blog archived', description: 'Blog post has been archived' });
        await fetchBlogData();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to archive blog';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleToggleFeatured = async (blogId: string) => {
    try {
      const response = await api.blogs.toggleFeatured(blogId);
      if (response.success) {
        const blog = blogs.find(b => b.id === blogId);
        toast({ title: blog?.featured ? 'Removed from featured' : 'Added to featured', description: blog?.featured ? 'Blog is no longer featured' : 'Blog is now featured' });
        await fetchBlogData();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update blog';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleDelete = async (blogId: string) => {
    try {
      await deleteItem(blogId);
      await fetchBlogData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete blog';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  // Blog creation handler with publish support
  const handleCreateBlog = async (blogData: Partial<Blog>, publishNow: boolean = false) => {
    try {
      // Build a safe create payload for the API - prefer explicit typing to satisfy TS
      const payload = ({
        title: blogData.title ?? '',
        excerpt: blogData.excerpt ?? '',
        content: blogData.content ?? '',
        tags: blogData.tags ?? [],
        featured: !!blogData.featured,
        seo: (blogData.seo ?? { keywords: [] }),
        status: publishNow ? 'published' : (blogData.status ?? 'draft'),
        readingTime: typeof blogData.readingTime === 'number' ? blogData.readingTime : undefined,
        featuredImage: blogData.featuredImage,
        images: blogData.images,
      } as unknown) as import('../types').BlogCreatePayload;

      const response = await api.blogs.create(payload);
      if (response.success) {
        toast({ title: publishNow ? 'Blog published' : 'Blog created', description: publishNow ? 'Blog post is now live' : 'Blog post has been created' });
        await fetchBlogData();
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to create blog', variant: 'destructive' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create blog';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleViewDetails = (blog: Blog) => {
    setSelectedBlog(blog);
    setViewDetailsOpen(true);
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

  const formatReadTime = (blog: Blog) => {
    const minutes = typeof blog.readingTime === 'number' ? blog.readingTime : 1;
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

  const safeBlogs = Array.isArray(blogs) ? blogs : [];

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
              {safeBlogs.length} blogs
            </div>
          </div>

          {/* Blogs Table */}
          <div className="border rounded-lg">
            {fetchError && <ErrorPanel title="Failed to load blogs" message={fetchError.message} status={fetchError.status} url={fetchError.url} />}
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
                {safeBlogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' ? 'No blogs found matching your criteria' : 'No blogs found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  safeBlogs.map((blog) => (
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
                          <div className="text-sm text-muted-foreground">{formatReadTime(blog)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(blog.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(Array.isArray(blog.tags) ? blog.tags : []).slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-medium">{getViewCount(blog).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {blog.publishedAt ? formatDate(blog.publishedAt) : 'Not published'}
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

      {/* View Blog Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Blog Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedBlog?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedBlog && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Blog Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Title:</span> {selectedBlog.title}</div>
                    <div><span className="font-medium">Slug:</span> {selectedBlog.slug}</div>
                    <div><span className="font-medium">Author:</span> {selectedBlog.author?.name || 'Unknown'}</div>
                    <div><span className="font-medium">Status:</span> {getStatusBadge(selectedBlog.status)}</div>
                    <div><span className="font-medium">Featured:</span> {selectedBlog.featured ? 'Yes' : 'No'}</div>
                    <div><span className="font-medium">Read Time:</span> {formatReadTime(selectedBlog)}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Metrics & Dates</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Views:</span> {getViewCount(selectedBlog).toLocaleString()}</div>
                    <div><span className="font-medium">Created:</span> {formatDate(selectedBlog.createdAt)}</div>
                    <div><span className="font-medium">Updated:</span> {formatDate(selectedBlog.updatedAt)}</div>
                    <div><span className="font-medium">Published:</span> {selectedBlog.publishedAt ? formatDate(selectedBlog.publishedAt) : 'Not published'}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Excerpt</h4>
                <p className="text-sm text-muted-foreground">{selectedBlog.excerpt}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBlog.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedBlog.seo && (
                <div>
                  <h4 className="font-semibold mb-2">SEO Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Meta Title:</span> {selectedBlog.seo.metaTitle || 'Not set'}</div>
                    <div><span className="font-medium">Meta Description:</span> {selectedBlog.seo.metaDescription || 'Not set'}</div>
                    <div>
                      <span className="font-medium">Keywords:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedBlog.seo.keywords.map((keyword) => (
                          <Badge key={keyword} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
              Close
            </Button>
            {selectedBlog && (
              <Button onClick={() => navigate(`/blogs/${selectedBlog.id}/edit`)}>
                Edit Blog
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BlogsPage;