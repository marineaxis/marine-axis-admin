import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, Upload, Image as ImageIcon, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { sanitize } from '@/lib/auth';
import api from '@/lib/api';
import { Category } from '@/types';

interface ProviderFormData {
  // Required fields
  email: string;
  phone: string;
  companyName: string;
  
  // Optional basic fields
  contactName?: string;
  description?: string;
  website?: string;
  
  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  
  // Location coordinates (optional)
  coordinates?: [number, number];
  
  // Arrays
  services?: string[];
  categoryIds?: string[];
  certifications?: string[];
  features?: string[];
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  
  // Business hours
  businessHours?: {
    [key: string]: {
      open?: string;
      close?: string;
      closed?: boolean;
    };
  };
  
  // Status fields (admin only)
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  featured?: boolean;
  isActive?: boolean;
  
  // Password (only for create)
  password?: string;
  
  // Gallery (images)
  gallery?: Array<{
    url: string;
    key: string;
    caption?: string;
    order?: number;
  }>;
  
  // Documents
  documents?: Array<{
    name: string;
    type: string;
    url: string;
    key: string;
    uploadedAt?: Date | string;
  }>;
}

interface ProviderFormProps {
  initialData?: any; // Provider data for edit mode
  mode: 'create' | 'edit';
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Common countries list (same as CreateJobPage)
const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Italy', 'Spain',
  'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Poland', 'Portugal', 'Greece', 'Ireland', 'New Zealand', 'Japan', 'South Korea', 'Singapore',
  'Malaysia', 'Thailand', 'Indonesia', 'Philippines', 'Vietnam', 'India', 'China', 'Hong Kong',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'South Africa',
  'Egypt', 'Nigeria', 'Kenya', 'Brazil', 'Argentina', 'Chile', 'Mexico', 'Colombia', 'Peru',
  'Turkey', 'Israel', 'Russia', 'Ukraine', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria',
  'Croatia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania', 'Iceland', 'Luxembourg', 'Malta',
  'Cyprus', 'Monaco', 'Liechtenstein', 'Andorra', 'San Marino', 'Vatican City'
].sort();

// Helper to normalize categories - handle both array of strings (IDs) and array of objects
const normalizeCategoryIds = (categories: any): string[] => {
  if (!categories || !Array.isArray(categories)) return [];
  // If it's an array of strings (IDs), return as-is
  if (categories.length > 0 && typeof categories[0] === 'string') {
    return categories;
  }
  // If it's an array of objects, extract IDs
  // Prefer 'id' (string) over '_id' (ObjectId) to ensure consistent string comparison
  return categories.map((c: any) => {
    if (c?.id) return String(c.id);
    if (c?._id) return String(c._id);
    return String(c);
  }).filter(Boolean);
};

// Helper to normalize certifications - extract name from objects or use strings
const normalizeCertifications = (certifications: any): string[] => {
  if (!certifications || !Array.isArray(certifications)) return [];
  return certifications.map((cert: any) => {
    if (typeof cert === 'string') return cert;
    return cert.name || '';
  }).filter(Boolean);
};

// Helper to normalize social media - convert array of {key, url} to object
const normalizeSocialLinks = (socialMedia: any): { linkedin?: string; facebook?: string; twitter?: string } => {
  const links: { linkedin?: string; facebook?: string; twitter?: string } = {};
  if (socialMedia && Array.isArray(socialMedia)) {
    socialMedia.forEach((item: any) => {
      const key = item.key || item.platform;
      const url = item.url;
      if (key && url && (key === 'linkedin' || key === 'facebook' || key === 'twitter')) {
        links[key as 'linkedin' | 'facebook' | 'twitter'] = url;
      }
    });
  }
  return links;
};

// Helper to normalize gallery items
const normalizeGallery = (gallery: any): Array<{ url: string; key: string; caption?: string; order?: number }> => {
  if (!gallery || !Array.isArray(gallery)) return [];
  return gallery.map((item: any) => ({
    url: item.url || '',
    key: item.key || '',
    caption: item.caption || '',
    order: item.order || 0,
  })).filter(item => item.url && item.key);
};

// Helper to normalize document items
const normalizeDocuments = (documents: any): Array<{ name: string; type: string; url: string; key: string; uploadedAt?: string }> => {
  if (!documents || !Array.isArray(documents)) return [];
  return documents.map((item: any) => ({
    name: item.name || '',
    type: item.type || 'Other',
    url: item.url || '',
    key: item.key || '',
    uploadedAt: item.uploadedAt || new Date().toISOString(),
  })).filter(item => item.url && item.key);
};

export function ProviderForm({ initialData, mode, onSubmit, onCancel, loading = false }: ProviderFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const [formData, setFormData] = useState<ProviderFormData>({
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    companyName: initialData?.companyName || initialData?.name || '',
    contactName: initialData?.contactName || '',
    description: initialData?.description || '',
    website: initialData?.website || '',
    address: {
      street: initialData?.address?.street || '',
      city: initialData?.address?.city || '',
      state: initialData?.address?.state || '',
      country: initialData?.address?.country || '',
    },
    services: initialData?.services || [],
    categoryIds: (() => {
      const fromCategories = normalizeCategoryIds(initialData?.categories);
      if (fromCategories.length > 0) return fromCategories;
      return normalizeCategoryIds(initialData?.categoryIds);
    })(),
    certifications: normalizeCertifications(initialData?.certifications) || [],
    features: initialData?.features || [],
    socialLinks: normalizeSocialLinks(initialData?.socialMedia) || initialData?.socialLinks || {},
    status: initialData?.status || 'pending',
    featured: initialData?.featured || false,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    businessHours: initialData?.businessHours || {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true },
    },
    gallery: normalizeGallery(initialData?.gallery) || [],
    documents: normalizeDocuments(initialData?.documents) || [],
    password: '',
  });

  const [currentService, setCurrentService] = useState('');
  const [currentCertification, setCurrentCertification] = useState('');
  const [currentFeature, setCurrentFeature] = useState('');
  const [currentGalleryFile, setCurrentGalleryFile] = useState<File | null>(null);
  const [currentImageCaption, setCurrentImageCaption] = useState('');
  const [currentDocumentFile, setCurrentDocumentFile] = useState<File | null>(null);
  const [currentDocumentType, setCurrentDocumentType] = useState('Other');
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await api.categories.list();
        if (response.success && response.data) {
          // Handle different response structures
          let cats: Category[] = [];
          if (Array.isArray(response.data)) {
            cats = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            cats = response.data.data;
          } else if (response.data?.items && Array.isArray(response.data.items)) {
            cats = response.data.items;
          }
          // Filter out inactive categories if active field exists
          const activeCategories = cats.filter((c: Category) => {
            // Some categories might not have an active field, include them by default
            return c.active !== false;
          });
          setCategories(activeCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Set empty array on error so UI doesn't show loading forever
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Update formData when initialData changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const normalizedCategoryIds = (() => {
        const fromCategories = normalizeCategoryIds(initialData?.categories);
        if (fromCategories.length > 0) return fromCategories;
        return normalizeCategoryIds(initialData?.categoryIds);
      })();

      setFormData(prev => ({
        ...prev,
        email: initialData?.email || prev.email,
        phone: initialData?.phone || prev.phone,
        companyName: initialData?.companyName || initialData?.name || prev.companyName,
        contactName: initialData?.contactName || prev.contactName,
        description: initialData?.description || prev.description,
        website: initialData?.website || prev.website,
        address: {
          street: initialData?.address?.street || prev.address?.street || '',
          city: initialData?.address?.city || prev.address?.city || '',
          state: initialData?.address?.state || prev.address?.state || '',
          country: initialData?.address?.country || prev.address?.country || '',
        },
        coordinates: initialData?.location?.coordinates ? [initialData.location.coordinates[0], initialData.location.coordinates[1]] : prev.coordinates,
        services: initialData?.services || prev.services || [],
        categoryIds: normalizedCategoryIds.length > 0 ? normalizedCategoryIds : prev.categoryIds,
        certifications: normalizeCertifications(initialData?.certifications) || prev.certifications || [],
        features: initialData?.features || prev.features || [],
        socialLinks: normalizeSocialLinks(initialData?.socialMedia) || initialData?.socialLinks || prev.socialLinks || {},
        status: initialData?.status || prev.status || 'pending',
        featured: initialData?.featured !== undefined ? initialData.featured : prev.featured,
        isActive: initialData?.isActive !== undefined ? initialData.isActive : prev.isActive,
        businessHours: initialData?.businessHours || prev.businessHours,
        gallery: normalizeGallery(initialData?.gallery) || prev.gallery || [],
        documents: normalizeDocuments(initialData?.documents) || prev.documents || [],
      }));
    }
  }, [initialData, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';

    // URL validation
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProviderFormData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours?.[day],
          [field]: value,
        },
      },
    }));
  };

  const handleAddItem = (type: 'service' | 'certification' | 'feature') => {
    const current = type === 'service' ? currentService : type === 'certification' ? currentCertification : currentFeature;
    const field = type === 'service' ? 'services' : type === 'certification' ? 'certifications' : 'features';
    
    if (current.trim() && !formData[field]?.includes(current.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), current.trim()],
      }));
      
      if (type === 'service') setCurrentService('');
      else if (type === 'certification') setCurrentCertification('');
      else setCurrentFeature('');
    }
  };

  const handleRemoveItem = (type: 'service' | 'certification' | 'feature', item: string) => {
    const field = type === 'service' ? 'services' : type === 'certification' ? 'certifications' : 'features';
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.filter(i => i !== item) || [],
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds?.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...(prev.categoryIds || []), categoryId],
    }));
  };

  const handleGalleryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCurrentGalleryFile(file);
  };

  const handleAddGalleryItem = async () => {
    if (!currentGalleryFile) {
      toast({ title: 'Error', description: 'Please select a file to upload.', variant: 'destructive' });
      return;
    }
    
    setUploadingGallery(true);
    try {
      const providerId = initialData?.id || initialData?._id || 'new';
      
      // For new providers, we'll need to create the provider first or use a temporary ID
      if (providerId === 'new') {
        toast({ 
          title: 'Info', 
          description: 'Please save the provider first, then you can upload images.', 
          variant: 'default' 
        });
        setUploadingGallery(false);
        return;
      }
      
      // Step 1: Get presigned upload URL
      const uploadUrlResponse = await api.providers.generateUploadUrl(
        providerId,
        currentGalleryFile.name,
        currentGalleryFile.type,
        'gallery'
      );
      
      if (!uploadUrlResponse.success || !uploadUrlResponse.data?.uploadUrl) {
        throw new Error(uploadUrlResponse.message || 'Failed to get upload URL.');
      }
      
      const { uploadUrl, key } = uploadUrlResponse.data;
      
      // Step 2: Upload file directly to upload URL
      // For Cloudinary, we need to send file name and folder in headers
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: currentGalleryFile,
        headers: {
          'Content-Type': currentGalleryFile.type,
          'X-File-Name': currentGalleryFile.name,
          'X-Folder': `providers/${providerId}/gallery`,
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
        url: fileUrl, // Use the actual Cloudinary URL
        key: uploadResult.data?.key || key || currentGalleryFile.name,
        caption: currentImageCaption,
        order: formData.gallery ? formData.gallery.length + 1 : 1,
      };
      
      setFormData(prev => ({
        ...prev,
        gallery: [...(prev.gallery || []), newGalleryItem],
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
      gallery: prev.gallery?.filter(item => item.key !== key) || [],
    }));
  };

  const handleDocumentFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    toast({ 
      title: 'Coming Soon', 
      description: 'Document upload functionality will be available soon.', 
      variant: 'default' 
    });
  };

  const handleAddDocumentItem = async () => {
    toast({ 
      title: 'Coming Soon', 
      description: 'Document upload functionality will be available soon.', 
      variant: 'default' 
    });
    return;
    
    setUploadingDocument(true);
    try {
      const providerId = initialData?.id || initialData?._id || 'new';
      
      // For new providers, we'll need to create the provider first or use a temporary ID
      if (providerId === 'new') {
        toast({ 
          title: 'Info', 
          description: 'Please save the provider first, then you can upload documents.', 
          variant: 'default' 
        });
        setUploadingDocument(false);
        return;
      }
      
      // Step 1: Get presigned upload URL
      const uploadUrlResponse = await api.providers.generateUploadUrl(
        providerId,
        currentDocumentFile.name,
        currentDocumentFile.type,
        'document'
      );
      
      if (!uploadUrlResponse.success || !uploadUrlResponse.data?.uploadUrl) {
        throw new Error(uploadUrlResponse.message || 'Failed to get upload URL.');
      }
      
      const { uploadUrl, key } = uploadUrlResponse.data;
      
      // Step 2: Upload file directly to upload URL
      // For Cloudinary, we need to send file name and folder in headers
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: currentDocumentFile,
        headers: {
          'Content-Type': currentDocumentFile.type,
          'X-File-Name': currentDocumentFile.name,
          'X-Folder': `providers/${providerId}/documents`,
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
      
      const newDocumentItem = {
        name: currentDocumentFile.name,
        type: currentDocumentType,
        url: fileUrl, // Use the actual Cloudinary URL
        key: uploadResult.data?.key || key || currentDocumentFile.name,
        uploadedAt: new Date().toISOString(),
      };
      
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), newDocumentItem],
      }));
      setCurrentDocumentFile(null);
      setCurrentDocumentType('Other');
      toast({ title: 'Success', description: 'Document uploaded successfully.' });
    } catch (error: any) {
      console.error('Document upload error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to upload document.', variant: 'destructive' });
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleRemoveDocumentItem = (key: string) => {
    toast({ 
      title: 'Coming Soon', 
      description: 'Document management will be available soon.', 
      variant: 'default' 
    });
    // Disabled for now - coming soon
    // setFormData(prev => ({
    //   ...prev,
    //   documents: prev.documents?.filter(item => item.key !== key) || [],
    // }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    // Clean business hours - remove open/close times when closed is true
    const cleanedBusinessHours: any = {};
    if (formData.businessHours) {
      Object.keys(formData.businessHours).forEach((day) => {
        const dayHours = formData.businessHours![day];
        if (dayHours.closed) {
          cleanedBusinessHours[day] = { closed: true };
        } else {
          cleanedBusinessHours[day] = {
            open: dayHours.open || '09:00',
            close: dayHours.close || '17:00',
            closed: false,
          };
        }
      });
    }

    const submitData: any = {
      email: sanitize.email(formData.email),
      phone: sanitize.phone(formData.phone),
      companyName: formData.companyName.trim(),
      contactName: formData.contactName?.trim() || formData.companyName.trim(),
      description: formData.description?.trim(),
      address: {
        street: formData.address?.street?.trim() || '',
        city: formData.address?.city?.trim() || '',
        state: formData.address?.state?.trim() || '',
        country: formData.address?.country?.trim() || '',
      },
      location: {
        type: 'Point',
        coordinates: formData.coordinates || [0, 0],
      },
      services: formData.services || [],
      categories: formData.categoryIds || [], // Backend expects 'categories' not 'categoryIds'
      // Certifications: Backend expects array of objects, but we're storing as strings
      // Convert string certifications to objects, or skip if empty
      certifications: formData.certifications && formData.certifications.length > 0
        ? formData.certifications.map((cert: string) => ({
            name: cert,
            issuer: '', // Required field but can be empty
            issuedDate: new Date().toISOString().split('T')[0], // Required field - use today's date as default
          }))
        : undefined, // Don't send if empty since it's optional
      features: formData.features || [],
      businessHours: cleanedBusinessHours,
      status: formData.status || 'pending',
      featured: formData.featured || false,
      isActive: formData.isActive !== undefined ? formData.isActive : true,
      gallery: formData.gallery || [],
      documents: formData.documents || [],
    };

    // Only include optional fields if they have values
    if (formData.website?.trim()) {
      const sanitizedUrl = sanitize.url(formData.website.trim());
      if (sanitizedUrl) {
        submitData.website = sanitizedUrl;
      }
    }

    // Social media - convert to array format expected by backend
    const socialMedia: Array<{ key: string; url: string }> = [];
    if (formData.socialLinks?.linkedin?.trim()) {
      socialMedia.push({ key: 'linkedin', url: formData.socialLinks.linkedin.trim() });
    }
    if (formData.socialLinks?.facebook?.trim()) {
      socialMedia.push({ key: 'facebook', url: formData.socialLinks.facebook.trim() });
    }
    if (formData.socialLinks?.twitter?.trim()) {
      socialMedia.push({ key: 'twitter', url: formData.socialLinks.twitter.trim() });
    }
    // Always include socialMedia (even if empty array) so backend can update it
    submitData.socialMedia = socialMedia;

    // Password only for create
    if (mode === 'create' && formData.password?.trim()) {
      submitData.password = formData.password;
    }

    await onSubmit(submitData);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/providers');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter the basic details for the provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Enter company name"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className={errors.companyName ? 'border-destructive' : ''}
              />
              {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                placeholder="Enter contact person name"
                value={formData.contactName || ''}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Leave empty to auto-generate"
                  value={formData.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className={errors.website ? 'border-destructive' : ''}
              />
              {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the provider's services and expertise"
              rows={4}
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>Provider's business address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address.street">Street</Label>
              <Input
                id="address.street"
                placeholder="Street address"
                value={formData.address?.street || ''}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.city">City</Label>
              <Input
                id="address.city"
                placeholder="City"
                value={formData.address?.city || ''}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.state">State</Label>
              <Input
                id="address.state"
                placeholder="State"
                value={formData.address?.state || ''}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.country">Country</Label>
              <Select
                value={formData.address?.country || ''}
                onValueChange={(value) => handleInputChange('address.country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Add the services this provider offers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a service"
              value={currentService}
              onChange={(e) => setCurrentService(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('service'))}
            />
            <Button type="button" onClick={() => handleAddItem('service')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          
          {formData.services && formData.services.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.services.map((service) => (
                <Badge key={service} variant="secondary" className="gap-1">
                  {service}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveItem('service', service)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Select the categories that best describe this provider</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCategories ? (
            <div className="text-center py-4 text-muted-foreground">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No categories available. Please create categories first.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.categoryIds?.includes(category.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-muted border-border'
                  }`}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <div className="text-sm font-medium">{category.name}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
          <CardDescription>Add certifications and credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a certification"
              value={currentCertification}
              onChange={(e) => setCurrentCertification(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('certification'))}
            />
            <Button type="button" onClick={() => handleAddItem('certification')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          
          {formData.certifications && formData.certifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.certifications.map((cert) => (
                <Badge key={cert} variant="secondary" className="gap-1">
                  {cert}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveItem('certification', cert)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Add special features or amenities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a feature"
              value={currentFeature}
              onChange={(e) => setCurrentFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('feature'))}
            />
            <Button type="button" onClick={() => handleAddItem('feature')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          
          {formData.features && formData.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature) => (
                <Badge key={feature} variant="secondary" className="gap-1">
                  {feature}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveItem('feature', feature)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Add social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                placeholder="LinkedIn URL or username"
                value={formData.socialLinks?.linkedin || ''}
                onChange={(e) => handleInputChange('socialLinks.linkedin', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                placeholder="Facebook URL or username"
                value={formData.socialLinks?.facebook || ''}
                onChange={(e) => handleInputChange('socialLinks.facebook', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                placeholder="Twitter URL or username"
                value={formData.socialLinks?.twitter || ''}
                onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
          <CardDescription>Set operating hours for each day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const dayHours = formData.businessHours?.[day] || { open: '09:00', close: '17:00', closed: false };
            return (
              <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-24 font-medium capitalize">{day}</div>
                <Checkbox
                  id={`${day}-closed`}
                  checked={dayHours.closed || false}
                  onCheckedChange={(checked) => handleBusinessHoursChange(day, 'closed', checked)}
                />
                <Label htmlFor={`${day}-closed`} className="cursor-pointer">Closed</Label>
                {!dayHours.closed && (
                  <>
                    <Input
                      type="time"
                      value={dayHours.open || '09:00'}
                      onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={dayHours.close || '17:00'}
                      onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                      className="w-32"
                    />
                  </>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
          <CardDescription>Upload images to showcase the provider's work or facilities</CardDescription>
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
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Upload relevant documents (e.g., licenses, certificates, brochures) - Coming Soon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 opacity-50 cursor-not-allowed">
            <Input
              id="document-file-upload"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleDocumentFileUpload}
              onClick={(e) => {
                e.preventDefault();
                toast({ 
                  title: 'Coming Soon', 
                  description: 'Document upload functionality will be available soon.', 
                  variant: 'default' 
                });
              }}
              className="flex-grow"
              disabled={true}
            />
            <Select
              value={currentDocumentType}
              onValueChange={() => {
                toast({ 
                  title: 'Coming Soon', 
                  description: 'Document upload functionality will be available soon.', 
                  variant: 'default' 
                });
              }}
              disabled={true}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="License">License</SelectItem>
                <SelectItem value="Certificate">Certificate</SelectItem>
                <SelectItem value="Brochure">Brochure</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              onClick={handleAddDocumentItem} 
              disabled={true}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
          <div className="text-sm text-muted-foreground text-center py-2">
            Document upload functionality is coming soon
          </div>
          {formData.documents && formData.documents.length > 0 && (
            <div className="space-y-2 opacity-50">
              {formData.documents.map((item, index) => (
                <div key={item.key || index} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-medium hover:underline"
                      >
                        {item.name}
                      </a>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveDocumentItem(item.key)}
                    type="button"
                    disabled={true}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Fields (Status, Featured, Active) */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Settings</CardTitle>
          <CardDescription>Administrative settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'pending'}
                onValueChange={(value: any) => handleInputChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="featured"
                checked={formData.featured || false}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
              <Label htmlFor="featured" className="cursor-pointer">Featured Provider</Label>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="isActive"
                checked={formData.isActive !== undefined ? formData.isActive : true}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading} className="min-w-32">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Provider' : 'Update Provider'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

