// Core types for Marine-Axis Admin Panel

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  services: string[];
  categoryIds: string[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  featured: boolean;
  logo?: string;
  images: string[];
  website?: string;
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  verificationDocuments: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  providerId: string;
  provider?: Provider;
  categoryIds: string[];
  location: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  requirements: string[];
  benefits: string[];
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  urgency: 'low' | 'medium' | 'high';
  status: 'draft' | 'published' | 'closed' | 'paused';
  expiresAt: string;
  applications: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  parentId?: string;
  children?: Category[];
  providersCount: number;
  jobsCount: number;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  images: string[];
  tags: string[];
  authorId: string;
  author?: User;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  };
  readingTime: number; // minutes
  viewCount?: number; // backend field name
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  type: 'provider_registration' | 'provider_edit' | 'job_posting' | 'blog_post';
  entityId: string;
  entity?: Provider | Job | Blog;
  changes?: Record<string, unknown>;
  requestedBy: string;
  requester?: User | Provider;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  reviewerId?: string;
  reviewer?: User;
  reviewNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'newsletter' | 'confirmation' | 'notification' | 'custom';
  variables: string[];
  active: boolean;
  language: string;
  lastUsed?: string;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  totalProviders: number;
  totalJobs: number;
  totalBlogs: number;
  totalUsers: number;
  pendingApprovals: number;
  activeJobs: number;
  featuredProviders: number;
  publishedBlogs: number;
  monthlyStats: {
    providers: number;
    jobs: number;
    blogs: number;
    applications: number;
  };
  categoryStats: Array<{
    categoryId: string;
    name: string;
    providers: number;
    jobs: number;
  }>;
  topLocations: Array<{
    location: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  error?: string; // Add error field for dashboard error reporting
}

export interface Settings {
  id: string;
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  maintenance: boolean;
  allowRegistrations: boolean;
  requireApproval: boolean;
  gdprEnabled: boolean;
  termsOfService: string;
  privacyPolicy: string;
  contactEmail: string;
  supportEmail: string;
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  emailSettings: {
    fromName: string;
    fromEmail: string;
    replyTo: string;
  };
  seoSettings: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  success: boolean;
  message?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: 'admin';
}

export interface UpdateUserForm {
  name?: string;
  email?: string;
  role?: 'admin';
}

export interface CreateProviderForm {
  name: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  services: string[];
  categoryIds: string[];
  website?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
}

export interface CreateJobForm {
  title: string;
  description: string;
  providerId: string;
  categoryIds: string[];
  location: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  requirements: string[];
  benefits: string[];
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  urgency: 'low' | 'medium' | 'high';
  expiresAt: string;
}

export interface CreateBlogForm {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  featured: boolean;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  };
}

// Payload types for API
export interface BlogCreatePayload extends CreateBlogForm {
  slug?: string;
  readingTime?: number;
  status?: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  images?: string[];
}

export type BlogUpdatePayload = Partial<BlogCreatePayload>;

export interface CreateCategoryForm {
  name: string;
  description: string;
  icon: string;
  parentId?: string;
  order?: number;
}

// Utility types
export type Role = 'superadmin' | 'admin' | 'provider' | 'customer';
export type Status = 'active' | 'inactive' | 'pending' | 'suspended';
export type SortOrder = 'asc' | 'desc';

export interface TableFilters {
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: unknown, record: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}