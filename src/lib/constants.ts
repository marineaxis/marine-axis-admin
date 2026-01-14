interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_JWT_SECRET?: string;
  readonly VITE_FRONTEND_ORIGIN?: string;
  readonly VITE_FRONTEND_ORIGIN_ADMIN?: string;
  readonly MODE?: string; // Vite automatically injects this
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Dynamically choose API URL based on env
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'development'
    ? 'http://localhost:3000/api/v1'
    : 'https://marine-axis-be.onrender.com/api/v1');

// JWT secret (optional in frontend)
export const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'marine-axis-jwt-secret';

// Frontend origins (for frontend usage, optional)
export const FRONTEND_ORIGIN = import.meta.env.VITE_FRONTEND_ORIGIN || 'https://marineaxis.in';
export const FRONTEND_ORIGIN_ADMIN = import.meta.env.VITE_FRONTEND_ORIGIN_ADMIN || 'https://admin.marineaxis.in';

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  
  // Main
  DASHBOARD: '/',
  
  // Admin Management
  ADMINS: '/admins',
  ADMIN_CREATE: '/admins/create',
  ADMIN_EDIT: '/admins/:id/edit',
  
  // Customer Management
  CUSTOMERS: '/customers',
  
  // Provider Management
  PROVIDERS: '/providers',
  PROVIDER_CREATE: '/providers/create',
  PROVIDER_EDIT: '/providers/:id/edit',
  PROVIDER_DETAIL: '/providers/:id',
  
  // Job Management
  JOBS: '/jobs',
  JOB_CREATE: '/jobs/create',
  JOB_EDIT: '/jobs/:id/edit',
  JOB_DETAIL: '/jobs/:id',
  
  // Category Management
  CATEGORIES: '/categories',
  CATEGORY_CREATE: '/categories/create',
  CATEGORY_EDIT: '/categories/:id/edit',
  
  // Blog Management
  BLOGS: '/blogs',
  BLOG_CREATE: '/blogs/create',
  BLOG_EDIT: '/blogs/:id/edit',
  BLOG_DETAIL: '/blogs/:id',
  
  // Approval System
  APPROVALS: '/approvals',
  APPROVAL_DETAIL: '/approvals/:id',
  
  // Email Templates
  EMAIL_TEMPLATES: '/email-templates',
  EMAIL_TEMPLATE_CREATE: '/email-templates/create',
  EMAIL_TEMPLATE_EDIT: '/email-templates/:id/edit',
  
  // Settings
  SETTINGS: '/settings',
  SETTINGS_GENERAL: '/settings/general',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_EMAIL: '/settings/email',
  SETTINGS_COMPLIANCE: '/settings/compliance',
  
  // Profile
  PROFILE: '/profile',
  
  // Reports
  REPORTS: '/reports',
  ANALYTICS: '/analytics',
  
  // Enquiries
  ENQUIRIES: '/enquiries',
  
  // Newsletter
  NEWSLETTER: '/newsletter',
  
  // Bookings
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: '/bookings/:id',
  
  // Contracts
  CONTRACTS: '/contracts',
  CONTRACT_DETAIL: '/contracts/:id',
  
  // Vessels
  VESSELS: '/vessels',
  VESSEL_DETAIL: '/vessels/:id',
  
  // Projects
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  
  // Social Links
  SOCIAL_LINKS: '/social-links',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
} as const;

export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export const PROVIDER_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
} as const;

export const JOB_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
  PAUSED: 'paused',
} as const;

export const BLOG_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const APPROVAL_TYPES = {
  PROVIDER_REGISTRATION: 'provider_registration',
  PROVIDER_EDIT: 'provider_edit',
  JOB_POSTING: 'job_posting',
  BLOG_POST: 'blog_post',
} as const;

export const EMAIL_TEMPLATE_TYPES = {
  WELCOME: 'welcome',
  NEWSLETTER: 'newsletter',
  CONFIRMATION: 'confirmation',
  NOTIFICATION: 'notification',
  CUSTOM: 'custom',
} as const;

export const JOB_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'SGD', label: 'Singapore Dollar (S$)' },
  { value: 'NOK', label: 'Norwegian Krone (kr)' },
] as const;

export const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Norway',
  'Denmark',
  'Netherlands',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Australia',
  'Singapore',
  'Japan',
  'South Korea',
  'Brazil',
  'Mexico',
] as const;

export const MARINE_CATEGORIES = [
  { name: 'Offshore Wind', icon: 'Wind' },
  { name: 'Oil & Gas', icon: 'Fuel' },
  { name: 'Shipping & Logistics', icon: 'Ship' },
  { name: 'Marine Engineering', icon: 'Wrench' },
  { name: 'Naval Architecture', icon: 'Compass' },
  { name: 'Port Operations', icon: 'Anchor' },
  { name: 'Subsea Services', icon: 'Waves' },
  { name: 'Maritime Law', icon: 'Scale' },
  { name: 'Marine Insurance', icon: 'Shield' },
  { name: 'Crew Services', icon: 'Users' },
  { name: 'Vessel Management', icon: 'Settings' },
  { name: 'Marine Surveying', icon: 'Search' },
] as const;

export const PAGINATION_LIMITS = [10, 25, 50, 100] as const;

export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
} as const;

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/.+/,
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALL: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
} as const;

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'marine_axis_token',
  REFRESH_TOKEN: 'marine_axis_refresh_token',
  USER_DATA: 'marine_axis_user',
  THEME: 'marine_axis_theme',
  SIDEBAR_COLLAPSED: 'marine_axis_sidebar_collapsed',
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created!',
  UPDATED: 'Successfully updated!',
  DELETED: 'Successfully deleted!',
  APPROVED: 'Successfully approved!',
  REJECTED: 'Successfully rejected!',
  EMAIL_SENT: 'Email sent successfully!',
  SAVED: 'Changes saved successfully!',
} as const;