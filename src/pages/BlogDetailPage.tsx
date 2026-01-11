import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Edit, Trash2, Calendar, Eye, Tag, Star, Archive, Play, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import useCRUD from '@/hooks/useCRUD';
import api from '@/lib/api';
import { Blog } from '@/types';

export function BlogDetailPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  const { deleteItem, deleting } = useCRUD<Blog>({
    resource: 'blogs',
    api: api.blogs,
    messages: {
      deleted: 'Blog deleted successfully',
    },
  });

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) {
        toast({
          title: 'Error',
          description: 'Blog ID is missing.',
          variant: 'destructive',
        });
        navigate('/blogs');
        return;
      }
      try {
        setLoading(true);
        const response = await api.blogs.get(id);
        if (response.success) {
          setBlog(response.data);
        } else {
          toast({
            title: 'Error',
            description: response.message || 'Failed to fetch blog details.',
            variant: 'destructive',
          });
          navigate('/blogs');
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch blog details.',
          variant: 'destructive',
        });
        navigate('/blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id, navigate, toast]);

  const handlePublish = async () => {
    if (!id) return;
    try {
      const response = await api.blogs.publish(id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Blog published successfully',
        });
        // Refresh blog data
        const updatedResponse = await api.blogs.get(id);
        if (updatedResponse.success) {
          setBlog(updatedResponse.data);
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to publish blog',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish blog',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    try {
      const response = await api.blogs.archive(id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Blog archived successfully',
        });
        // Refresh blog data
        const updatedResponse = await api.blogs.get(id);
        if (updatedResponse.success) {
          setBlog(updatedResponse.data);
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to archive blog',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive blog',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async () => {
    if (!id) return;
    try {
      const response = await api.blogs.toggleFeatured(id);
      if (response.success) {
        toast({
          title: 'Success',
          description: `Blog ${blog?.featured ? 'removed from' : 'added to'} featured`,
        });
        // Refresh blog data
        const updatedResponse = await api.blogs.get(id);
        if (updatedResponse.success) {
          setBlog(updatedResponse.data);
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update featured status',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update featured status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const result = await deleteItem(id);
    if (result) {
      navigate('/blogs');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Blog not found or could not be loaded.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500"><Play className="h-3 w-3 mr-1" />Published</Badge>;
      case 'draft':
        return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'archived':
        return <Badge variant="outline"><Archive className="h-3 w-3 mr-1" />Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/blogs')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blogs
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{blog.title}</h1>
            <p className="text-muted-foreground">Blog post details and management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/blogs/${id}/edit`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2" disabled={deleting}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the blog post "{blog.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status & Actions</CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(blog.status)}
              {blog.featured && (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3" />
                  Featured
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {blog.status === 'draft' && (
              <Button onClick={handlePublish} variant="default" className="gap-2">
                <Play className="h-4 w-4" />
                Publish
              </Button>
            )}
            {blog.status === 'published' && (
              <Button onClick={handleArchive} variant="outline" className="gap-2">
                <Archive className="h-4 w-4" />
                Archive
              </Button>
            )}
            <Button onClick={handleToggleFeatured} variant="outline" className="gap-2">
              <Star className="h-4 w-4" />
              {blog.featured ? 'Remove from Featured' : 'Add to Featured'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blog Content */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Excerpt</h3>
            <p className="text-base">{blog.excerpt || 'No excerpt provided'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Content</h3>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{blog.content}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Updated:</span>
              <span>{new Date(blog.updatedAt).toLocaleDateString()}</span>
            </div>
            {blog.publishedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Published:</span>
                <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Views:</span>
              <span>{blog.views || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Reading Time:</span>
              <span>{blog.readTime || 0} min</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags & SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags && blog.tags.length > 0 ? (
                  blog.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
            </div>
            {blog.seo && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">SEO</h3>
                <div className="space-y-2 text-sm">
                  {(blog.seo as any)?.metaTitle && (
                    <div>
                      <span className="text-muted-foreground">Meta Title:</span>
                      <p className="font-medium">{(blog.seo as any).metaTitle}</p>
                    </div>
                  )}
                  {(blog.seo as any)?.metaDescription && (
                    <div>
                      <span className="text-muted-foreground">Meta Description:</span>
                      <p className="font-medium">{(blog.seo as any).metaDescription}</p>
                    </div>
                  )}
                  {(blog.seo as any)?.keywords && (blog.seo as any).keywords.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Keywords:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(blog.seo as any).keywords.map((keyword: string) => (
                          <Badge key={keyword} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gallery */}
      {(blog as any).gallery && Array.isArray((blog as any).gallery) && (blog as any).gallery.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gallery</CardTitle>
            <CardDescription>Images associated with this blog post</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(blog as any).gallery.map((item: any, index: number) => (
                <div key={item.key || index} className="relative group">
                  <img 
                    src={item.url} 
                    alt={item.caption || 'Gallery image'} 
                    className="w-full h-32 object-cover rounded-md border"
                  />
                  {item.caption && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{item.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BlogDetailPage;

