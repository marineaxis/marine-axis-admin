import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, Eye, EyeOff, ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { CreateBlogForm, BlogCreatePayload } from '../types';
import api from '../lib/api';

export function CreateBlogPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBlogForm>({
    title: '',
    excerpt: '',
    content: '',
    tags: [],
    featured: false,
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
    },
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [showSeoPreview, setShowSeoPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.excerpt.trim()) newErrors.excerpt = 'Excerpt is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.tags.length === 0) newErrors.tags = 'At least one tag is required';

    // SEO validation
    if (formData.title.length > 60) newErrors.title = 'Title should be under 60 characters for SEO';
    if (formData.excerpt.length > 160) newErrors.excerpt = 'Excerpt should be under 160 characters for SEO';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Prefer explicit, typed handlers to satisfy lint rules
  const handleTitleChange = (value: string) => {
    setFormData(prev => {
      const next = { ...prev, title: value };
      if (!prev.seo.metaTitle) next.seo = { ...prev.seo, metaTitle: value };
      return next;
    });
    if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
  };

  const handleExcerptChange = (value: string) => {
    setFormData(prev => {
      const next = { ...prev, excerpt: value };
      if (!prev.seo.metaDescription) next.seo = { ...prev.seo, metaDescription: value };
      return next;
    });
    if (errors.excerpt) setErrors(prev => ({ ...prev, excerpt: '' }));
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
    if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
  };

  const handleFeaturedChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, featured: checked }));
  };

  const handleSeoChange = (field: 'metaTitle' | 'metaDescription', value: string) => {
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
      if (errors.tags) {
        setErrors(prev => ({ ...prev, tags: '' }));
      }
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

  const handleCreateBlog = async (formData: CreateBlogForm, publishNow: boolean) => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const blogData: BlogCreatePayload = {
        ...formData,
        tags: Array.isArray(formData.tags) ? formData.tags.map(String) : [],
        seo: {
          metaTitle: formData.seo.metaTitle || '',
          metaDescription: formData.seo.metaDescription || '',
          keywords: Array.isArray(formData.seo.keywords) ? formData.seo.keywords.map(String) : [],
        },
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        readingTime: Math.max(1, Math.ceil(formData.content.split(/\s+/).filter(Boolean).length / 200)),
        status: publishNow ? 'published' : 'draft',
      };

      const res = await api.blogs.create(blogData);
      if (!res.success) {
        throw new Error(res.message || 'Failed to create blog');
      }

      toast({
        title: `Blog ${publishNow ? 'published' : 'saved as draft'} successfully`,
        description: `${formData.title} has been ${publishNow ? 'published' : 'saved as a draft'}`,
      });

      navigate('/blogs');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Please try again later';
      toast({ title: 'Error creating blog', description: message, variant: 'destructive' });
      console.error('Create blog error:', error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold">Create Blog Post</h1>
          <p className="text-muted-foreground">Write and publish a new blog post</p>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Basic Content */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Content</CardTitle>
            <CardDescription>
              Enter the main content for your blog post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="featuredImage">Featured Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <input
                  id="featuredImage"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Handle image preview here
                      toast({ title: 'Image uploaded', description: file.name });
                    }
                  }}
                />
                <div 
                  className="text-center cursor-pointer"
                  onClick={() => document.getElementById('featuredImage')?.click()}
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Click to upload featured image</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Title *</Label>
                {getCharacterCount(formData.title, 60)}
              </div>
              <Input
                id="title"
                placeholder="Enter an engaging blog title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
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
                onChange={(e) => handleExcerptChange(e.target.value)}
                className={errors.excerpt ? 'border-destructive' : ''}
              />
              {errors.excerpt && <p className="text-sm text-destructive">{errors.excerpt}</p>}
              <p className="text-xs text-muted-foreground">
                This will be displayed in blog previews and search results
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Write your blog content here..."
                rows={12}
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className={errors.content ? 'border-destructive' : ''}
              />
              {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
              <p className="text-xs text-muted-foreground">
                Estimated reading time: {Math.ceil(formData.content.split(' ').length / 200)} minutes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tags and Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tags and Settings</CardTitle>
            <CardDescription>
              Categorize your blog post and set visibility options
            </CardDescription>
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
                onCheckedChange={(checked) => handleFeaturedChange(Boolean(checked))}
              />
              <Label htmlFor="featured">Feature this blog post</Label>
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Optimize your blog post for search engines
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSeoPreview(!showSeoPreview)}
                className="gap-2"
              >
                {showSeoPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSeoPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaTitle">Meta Title</Label>
                {getCharacterCount(formData.seo.metaTitle || '', 60)}
              </div>
              <Input
                id="metaTitle"
                placeholder="SEO title (auto-generated from title)"
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
                placeholder="SEO description (auto-generated from excerpt)"
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

            {/* SEO Preview */}
            {showSeoPreview && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Search Engine Preview</h4>
                <div className="space-y-1">
                  <div className="text-blue-600 text-lg">{formData.seo.metaTitle || formData.title || 'Blog Title'}</div>
                  <div className="text-green-600 text-sm">marine-axis.com › blog › {formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</div>
                  <div className="text-gray-600 text-sm">{formData.seo.metaDescription || formData.excerpt || 'Blog description...'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <Button type="button" onClick={() => handleCreateBlog(formData, false)}>
            Save as Draft
          </Button>
          <Button type="button" variant="default" onClick={() => handleCreateBlog(formData, true)}>
            Publish
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/blogs')}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateBlogPage;