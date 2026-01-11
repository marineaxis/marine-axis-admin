import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import useCRUD from '@/hooks/useCRUD';
import api from '@/lib/api';
import { Blog } from '@/types';

export function EditBlogPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [blogData, setBlogData] = useState<Blog | null>(null);
  const [loadingBlog, setLoadingBlog] = useState(true);

  const { updateItem, updating } = useCRUD<Blog>({
    resource: 'blogs',
    api: api.blogs,
    messages: {
      updated: 'Blog updated successfully',
    },
  });

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    tags: [] as string[],
    featured: false,
    status: 'draft' as 'draft' | 'published' | 'archived',
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [] as string[],
    },
    gallery: [] as Array<{ url: string; key: string; caption?: string; order?: number }>,
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentGalleryFile, setCurrentGalleryFile] = useState<File | null>(null);
  const [currentImageCaption, setCurrentImageCaption] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        setLoadingBlog(true);
        const response = await api.blogs.get(id);
        if (response.success) {
          const blog = response.data;
          setBlogData(blog);
          setFormData({
            title: blog.title || '',
            excerpt: blog.excerpt || '',
            content: blog.content || '',
            tags: blog.tags || [],
            featured: blog.featured || false,
            status: blog.status || 'draft',
            seo: {
              metaTitle: (blog.seo as any)?.metaTitle || '',
              metaDescription: (blog.seo as any)?.metaDescription || '',
              keywords: (blog.seo as any)?.keywords || [],
            },
            gallery: (blog as any).gallery || [],
          });
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
        setLoadingBlog(false);
      }
    };
    fetchBlog();
  }, [id, navigate, toast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.excerpt.trim()) newErrors.excerpt = 'Excerpt is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.tags.length === 0) newErrors.tags = 'At least one tag is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSeoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      seo: { ...prev.seo, [field]: value }
    }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !formData.seo.keywords.includes(currentKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          keywords: [...prev.seo.keywords, currentKeyword.trim()],
        },
      }));
      setCurrentKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.filter(k => k !== keyword),
      },
    }));
  };

  const handleGalleryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCurrentGalleryFile(file);
  };

  const handleAddGalleryItem = async () => {
    if (!currentGalleryFile || !id) {
      toast({ title: 'Error', description: 'Please select a file to upload.', variant: 'destructive' });
      return;
    }
    
    setUploadingGallery(true);
    try {
      // Step 1: Get presigned upload URL
      const uploadUrlResponse = await api.blogs.generateUploadUrl(
        id,
        currentGalleryFile.name,
        currentGalleryFile.type
      );
      
      if (!uploadUrlResponse.success || !uploadUrlResponse.data?.uploadUrl) {
        throw new Error(uploadUrlResponse.message || 'Failed to get upload URL.');
      }
      
      const { uploadUrl, key } = uploadUrlResponse.data;
      
      // Step 2: Upload file directly to upload URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: currentGalleryFile,
        headers: {
          'Content-Type': currentGalleryFile.type,
          'X-File-Name': currentGalleryFile.name,
          'X-Folder': `blogs/${id}/gallery`,
        },
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload file: ${errorText}`);
      }
      
      // Step 3: Get the response with the actual URL
      const uploadResult = await uploadResponse.json();
      const fileUrl = uploadResult.data?.url || uploadResult.data?.downloadUrl;
      
      if (!fileUrl) {
        throw new Error('Upload succeeded but no URL returned');
      }
      
      const newGalleryItem = {
        url: fileUrl,
        key: uploadResult.data?.key || key || currentGalleryFile.name,
        caption: currentImageCaption,
        order: formData.gallery.length + 1,
      };
      
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, newGalleryItem],
      }));
      setCurrentGalleryFile(null);
      setCurrentImageCaption('');
      toast({ title: 'Success', description: 'Image uploaded successfully.' });
    } catch (error: any) {
      console.error('Gallery upload error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to upload image.', variant: 'destructive' });
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryItem = (key: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(item => item.key !== key),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) {
      return;
    }

    try {
      const updateData: any = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        tags: formData.tags,
        featured: formData.featured,
        status: formData.status,
        seo: {
          metaTitle: formData.seo.metaTitle || undefined,
          metaDescription: formData.seo.metaDescription || undefined,
          keywords: formData.seo.keywords.length > 0 ? formData.seo.keywords : undefined,
        },
        gallery: formData.gallery.length > 0 ? formData.gallery : undefined,
      };

      const result = await updateItem(id, updateData);
      if (result) {
        navigate('/blogs');
      }
    } catch (error: any) {
      console.error('Update blog error:', error);
    }
  };

  const getCharacterCount = (text: string, limit: number) => {
    const isOverLimit = text.length > limit;
    return (
      <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
        {text.length}/{limit}
      </span>
    );
  };

  if (loadingBlog) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!blogData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Blog not found or could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <h1 className="text-3xl font-bold">Edit Blog Post</h1>
          <p className="text-muted-foreground">Update details for {blogData.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Content */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Content</CardTitle>
            <CardDescription>Update the main content for your blog post</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Title *</Label>
                {getCharacterCount(formData.title, 60)}
              </div>
              <Input
                id="title"
                placeholder="Enter an engaging blog title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="excerpt">Excerpt *</Label>
                {getCharacterCount(formData.excerpt, 160)}
              </div>
              <Textarea
                id="excerpt"
                placeholder="Write a compelling excerpt that summarizes your post"
                rows={3}
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                className={errors.excerpt ? 'border-destructive' : ''}
              />
              {errors.excerpt && <p className="text-sm text-destructive">{errors.excerpt}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Write your blog content here..."
                rows={12}
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className={errors.content ? 'border-destructive' : ''}
              />
              {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'draft' | 'published' | 'archived') => handleInputChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tags and Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tags and Settings</CardTitle>
            <CardDescription>Categorize your blog post and set visibility options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags *</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Enter a tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
              <Label htmlFor="featured">Feature this blog post</Label>
            </div>
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Gallery Images</CardTitle>
            <CardDescription>Upload images to showcase in your blog post</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input
                id="gallery-file-upload"
                type="file"
                accept="image/*"
                onChange={handleGalleryFileUpload}
                className="flex-grow"
                disabled={uploadingGallery}
              />
              <Input
                placeholder="Image caption (optional)"
                value={currentImageCaption}
                onChange={(e) => setCurrentImageCaption(e.target.value)}
                className="flex-grow"
                disabled={uploadingGallery}
              />
              <Button 
                type="button" 
                onClick={handleAddGalleryItem} 
                disabled={!currentGalleryFile || uploadingGallery}
                className="gap-2"
              >
                {uploadingGallery ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>
            {formData.gallery && formData.gallery.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.gallery.map((item, index) => (
                  <div key={item.key || index} className="relative group">
                    <img 
                      src={item.url} 
                      alt={item.caption || 'Gallery image'} 
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    {item.caption && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{item.caption}</p>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      onClick={() => handleRemoveGalleryItem(item.key)}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Optimize your blog post for search engines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaTitle">Meta Title</Label>
                {getCharacterCount(formData.seo.metaTitle || '', 60)}
              </div>
              <Input
                id="metaTitle"
                placeholder="SEO title"
                value={formData.seo.metaTitle || ''}
                onChange={(e) => handleSeoChange('metaTitle', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaDescription">Meta Description</Label>
                {getCharacterCount(formData.seo.metaDescription || '', 160)}
              </div>
              <Textarea
                id="metaDescription"
                placeholder="SEO description"
                rows={2}
                value={formData.seo.metaDescription || ''}
                onChange={(e) => handleSeoChange('metaDescription', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">SEO Keywords</Label>
              <div className="flex gap-2">
                <Input
                  id="keywords"
                  placeholder="Enter an SEO keyword"
                  value={currentKeyword}
                  onChange={(e) => setCurrentKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                />
                <Button type="button" onClick={handleAddKeyword} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              
              {formData.seo.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.seo.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="gap-1">
                      {keyword}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveKeyword(keyword)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={updating} className="min-w-32">
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Blog
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/blogs')}
            disabled={updating}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EditBlogPage;

