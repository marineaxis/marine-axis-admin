import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, Eye, EyeOff, Play, Archive, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import api from '../lib/api';
import { Blog, BlogUpdatePayload } from '../types';

type FormState = {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  featured: boolean;
  seo: { metaTitle?: string; metaDescription?: string; keywords: string[] };
};

const EditBlogPage: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSeoPreview, setShowSeoPreview] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');

  const [formData, setFormData] = useState<FormState>({
    title: '',
    excerpt: '',
    content: '',
    tags: [],
    featured: false,
    seo: { metaTitle: '', metaDescription: '', keywords: [] },
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await api.blogs.get(id);
        if (res.success) {
          const b: Blog = res.data;
          setFormData({
            title: b.title || '',
            excerpt: b.excerpt || '',
            content: b.content || '',
            tags: b.tags || [],
            featured: Boolean(b.featured),
            seo: {
              metaTitle: b.seo?.metaTitle || '',
              metaDescription: b.seo?.metaDescription || '',
              keywords: b.seo?.keywords || [],
            },
          });
          setStatus(b.status);
        } else {
          toast({ title: 'Failed to load blog', description: res.message || 'Please try again', variant: 'destructive' });
          navigate('/blogs');
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Please try again';
        toast({ title: 'Failed to load blog', description: message, variant: 'destructive' });
        navigate('/blogs');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate, toast]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.excerpt.trim()) newErrors.excerpt = 'Excerpt is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (formData.tags.length === 0) newErrors.tags = 'At least one tag is required';
    if (formData.title.length > 60) newErrors.title = 'Title should be under 60 characters for SEO';
    if (formData.excerpt.length > 160) newErrors.excerpt = 'Excerpt should be under 160 characters for SEO';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function handleInputChange<K extends keyof FormState>(field: K, value: unknown) {
    setFormData(prev => {
      const next = { ...prev } as unknown as Record<string, unknown>;
      next[String(field)] = value as unknown;
      return next as unknown as FormState;
    });
    const key = String(field);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));

    // Mirror previous behavior: set SEO defaults when title/excerpt are updated
    if (field === 'title') {
      setFormData(prev => ({ ...prev, seo: { ...prev.seo, metaTitle: prev.seo.metaTitle || String(value) } }));
    }
    if (field === 'excerpt') {
      setFormData(prev => ({ ...prev, seo: { ...prev.seo, metaDescription: prev.seo.metaDescription || String(value) } }));
    }
  }

  const handleSeoChange = (field: 'metaTitle' | 'metaDescription', value: string) => {
    setFormData((prev) => ({ ...prev, seo: { ...prev.seo, [field]: value } }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
      setCurrentTag('');
      if (errors.tags) setErrors((prev) => ({ ...prev, tags: '' }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !formData.seo.keywords.includes(currentKeyword.trim())) {
      setFormData((prev) => ({ ...prev, seo: { ...prev.seo, keywords: [...prev.seo.keywords, currentKeyword.trim()] } }));
      setCurrentKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData((prev) => ({ ...prev, seo: { ...prev.seo, keywords: prev.seo.keywords.filter((k) => k !== keyword) } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Include possible recomputed reading time on update
      const readingTime = Math.max(1, Math.ceil(formData.content.split(/\s+/).filter(Boolean).length / 200));

      const payload: BlogUpdatePayload = {
        ...formData,
        tags: Array.isArray(formData.tags) ? formData.tags.map(String) : [],
        seo: {
          metaTitle: formData.seo.metaTitle || '',
          metaDescription: formData.seo.metaDescription || '',
          keywords: Array.isArray(formData.seo.keywords) ? formData.seo.keywords.map(String) : [],
        },
        readingTime,
      };

      const res = await api.blogs.update(id, payload);
      if (res.success) {
        toast({ title: 'Blog updated', description: 'Changes saved successfully' });
        navigate('/blogs');
      } else {
        toast({ title: 'Update failed', description: res.message || 'Please try again', variant: 'destructive' });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Please try again';
      toast({ title: 'Update error', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (): Promise<void> => {
    if (!id) return;
    try {
      const res = await api.blogs.publish(id);
      if (!res.success) throw new Error(res.message || 'Failed to publish');
      setStatus('published');
      toast({ title: 'Blog published', description: 'Blog is now live on the website' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Please try again';
      toast({ title: 'Publish error', description: message, variant: 'destructive' });
    }
  };

  const handleArchive = async (): Promise<void> => {
    if (!id) return;
    try {
      const res = await api.blogs.archive(id);
      if (!res.success) throw new Error(res.message || 'Failed to archive');
      setStatus('archived');
      toast({ title: 'Blog archived', description: 'Blog is no longer visible publicly' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Please try again';
      toast({ title: 'Archive error', description: message, variant: 'destructive' });
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const res = await api.blogs.delete(id);
      if (!res.success) throw new Error(res.message || 'Failed to delete');
      toast({ title: 'Blog deleted', description: 'Blog removed successfully' });
      navigate('/blogs');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Please try again';
      toast({ title: 'Delete error', description: message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCharacterCount = (text: string, limit: number) => {
    const isOverLimit = text.length > limit;
    return <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>{text.length}/{limit}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/blogs')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Blogs
        </Button>
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Edit Blog Post</h1>
          <p className="text-muted-foreground">Update and manage your blog post</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={status === 'published' ? 'default' : status === 'archived' ? 'outline' : 'secondary'} className="capitalize">
            {status}
          </Badge>
          {status !== 'published' && (
            <Button type="button" size="sm" onClick={handlePublish} disabled={isSaving} className="gap-1">
              <Play className="h-3 w-3" />
              Publish
            </Button>
          )}
          {status === 'published' && (
            <Button type="button" variant="outline" size="sm" onClick={handleArchive} disabled={isSaving} className="gap-1">
              <Archive className="h-3 w-3" />
              Archive
            </Button>
          )}
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting} className="gap-1">
            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Delete
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Content</CardTitle>
            <CardDescription>Edit the content and details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Title *</Label>
                {getCharacterCount(formData.title, 60)}
              </div>
              <Input id="title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} className={errors.title ? 'border-destructive' : ''} />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="excerpt">Excerpt *</Label>
                {getCharacterCount(formData.excerpt, 160)}
              </div>
              <Textarea id="excerpt" rows={3} value={formData.excerpt} onChange={(e) => handleInputChange('excerpt', e.target.value)} className={errors.excerpt ? 'border-destructive' : ''} />
              {errors.excerpt && <p className="text-sm text-destructive">{errors.excerpt}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea id="content" rows={12} value={formData.content} onChange={(e) => handleInputChange('content', e.target.value)} className={errors.content ? 'border-destructive' : ''} />
              {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
              <p className="text-xs text-muted-foreground">Estimated reading time: {Math.ceil(formData.content.split(' ').length / 200)} minutes</p>
            </div>
          </CardContent>
        </Card>

        {/* Tags and Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tags and Settings</CardTitle>
            <CardDescription>Organize and set visibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags *</Label>
              <div className="flex gap-2">
                <Input id="tags" placeholder="Enter a tag" value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} />
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
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
              {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="featured" checked={formData.featured} onCheckedChange={(checked) => handleInputChange('featured', checked)} />
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
                <CardDescription>Optimize for search engines</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowSeoPreview(!showSeoPreview)} className="gap-2">
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
              <Input id="metaTitle" value={formData.seo.metaTitle || ''} onChange={(e) => handleSeoChange('metaTitle', e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaDescription">Meta Description</Label>
                {getCharacterCount(formData.seo.metaDescription || '', 160)}
              </div>
              <Textarea id="metaDescription" rows={2} value={formData.seo.metaDescription || ''} onChange={(e) => handleSeoChange('metaDescription', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">SEO Keywords</Label>
              <div className="flex gap-2">
                <Input id="keywords" placeholder="Enter an SEO keyword" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())} />
                <Button type="button" onClick={handleAddKeyword} className="gap-2">
                  Add
                </Button>
              </div>
              {formData.seo.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.seo.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="gap-1">
                      {keyword}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveKeyword(keyword)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/blogs')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default EditBlogPage;
