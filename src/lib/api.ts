// API client for Marine-Axis Admin Panel
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, LOCAL_STORAGE_KEYS, ERROR_MESSAGES } from './constants';
import { ApiResponse, PaginatedResponse } from '../types';

// Mock Auth Service for token refresh
class MockAuthService {
  static async refreshToken() {
    // This will be replaced with actual refresh endpoint
    return {
      success: true,
      data: {
        accessToken: localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN) || '',
        refreshToken: localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN) || '',
      },
    };
  }
}

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const response = await MockAuthService.refreshToken();

              if (response.success) {
                const { accessToken, refreshToken } = response.data;
                localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, accessToken);
                if (refreshToken) {
                  localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
                }

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return this.instance(originalRequest);
              } else {
                throw new Error('Token refresh failed');
              }
            }
          } catch (refreshError) {
            this.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (!error.response) {
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    const { status, data } = error.response as any;

    switch (status) {
      case 400:
        // Try to parse validation errors for better error messages
        let errorMessage = data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
        if (data?.errors) {
          try {
            // Errors might be a JSON string or an array
            const errors = typeof data.errors === 'string' ? JSON.parse(data.errors) : data.errors;
            if (Array.isArray(errors) && errors.length > 0) {
              // Extract field-specific error messages
              const fieldErrors = errors.map((err: any) => {
                const field = err.path?.join('.') || 'field';
                return `${field}: ${err.message}`;
              });
              errorMessage = `Validation failed: ${fieldErrors.join(', ')}`;
            }
          } catch (parseError) {
            // If parsing fails, use the original message
            errorMessage = data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
          }
        }
        const errorObj = new Error(errorMessage);
        (errorObj as any).errors = data?.errors; // Attach raw errors for detailed handling
        return errorObj;
      case 401:
        return new Error(ERROR_MESSAGES.UNAUTHORIZED);
      case 403:
        return new Error(ERROR_MESSAGES.FORBIDDEN);
      case 404:
        return new Error(ERROR_MESSAGES.NOT_FOUND);
      case 500:
        return new Error(ERROR_MESSAGES.SERVER_ERROR);
      default:
        return new Error(data?.message || ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  private clearAuth() {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
  }

  // Generic API methods
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url);
    return response.data;
  }

  async getPaginated<T = any>(url: string, params?: any): Promise<PaginatedResponse<T>> {
    const response = await this.instance.get(url, { params });
    return response.data;
  }

  // File upload
  async uploadFile(file: File, path: string = 'uploads'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await this.instance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Multiple file upload
  async uploadFiles(files: File[], path: string = 'uploads'): Promise<ApiResponse<{ urls: string[] }>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    formData.append('path', path);

    const response = await this.instance.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Authentication methods (using mock service)
  auth = {
    // POST /api/v1/auth/login - Unified login endpoint (auto-detects role: admin/provider/customer)
    login: async (email: string, password: string) => {
      const response = await this.post('/auth/login', { email, password });
      return response;
    },

    logout: async () => {
      const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
      const response = await this.post('/auth/logout', { refreshToken });
      this.clearAuth();
      return response;
    },

    refreshToken: async (refreshToken: string) => {
      return this.post('/auth/refresh', { refreshToken });
    },

    me: async () => {
      return this.get('/auth/me');
    },

    updateProfile: async (data: any) => {
      return this.put('/auth/profile', data);
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      return this.post('/auth/change-password', { currentPassword, newPassword });
    },

    // POST /api/v1/auth/logout-all - Logout from all devices
    logoutAll: async () => {
      const response = await this.post('/auth/logout-all', {});
      this.clearAuth();
      return response;
    },
  };

  // Admin management - Updated with actual API endpoints
  // GET /api/v1/admins - Get all admins with filters and pagination
  // Query params: page, limit, role (superadmin|admin), isActive, search
  admins = {
    // GET /api/v1/admins - List all admins with pagination and filters
    list: async (params?: any) => {
      return this.getPaginated('/admins', params);
    },

    // GET /api/v1/admins/:adminId - Get single admin by ID
    get: async (id: string) => {
      return this.get(`/admins/${id}`);
    },

    // POST /api/v1/admins - Create new admin
    // Body: { name, email, password, role, isActive }
    create: async (data: any) => {
      return this.post('/admins', data);
    },

    // PUT /api/v1/admins/:adminId - Update admin
    // Body: { name, isActive } (partial update)
    update: async (id: string, data: any) => {
      return this.put(`/admins/${id}`, data);
    },

    // DELETE /api/v1/admins/:adminId - Delete admin
    delete: async (id: string) => {
      return this.delete(`/admins/${id}`);
    },

    // GET /api/v1/admins/stats - Get admin statistics
    getStats: async () => {
      return this.get('/admins/stats');
    },
  };

  // Provider management
  providers = {
    list: async (params?: any) => {
      return this.getPaginated('/providers', params);
    },

    get: async (id: string) => {
      return this.get(`/providers/${id}`);
    },

    create: async (data: any) => {
      return this.post('/providers', data);
    },

    update: async (id: string, data: any) => {
      return this.put(`/providers/${id}`, data);
    },

    delete: async (id: string) => {
      return this.delete(`/providers/${id}`);
    },

    getFeatured: async (params?: any) => {
      return this.get('/providers/featured', params);
    },

    getPending: async (params?: any) => {
      return this.get('/providers/pending', params);
    },

    getStats: async () => {
      return this.get('/providers/stats');
    },
    approve: async (id: string) => {
      return this.patch(`/providers/${id}/approve`);
    },

    reject: async (id: string, reason: string) => {
      return this.patch(`/providers/${id}/reject`, { rejectionReason: reason });
    },

    reapply: async (id: string, data: any) => {
      return this.patch(`/providers/${id}/reapply`, data);
    },

    toggleFeatured: async (id: string) => {
      return this.patch(`/providers/${id}/featured`);
    },

    sendWelcomeEmail: async (id: string) => {
      return this.post(`/providers/${id}/welcome-email`);
    },

    generateUploadUrl: async (id: string, fileName: string, fileType: string, fileCategory: 'gallery' | 'document' = 'gallery') => {
      return this.post(`/providers/${id}/upload-url`, { fileName, fileType, fileCategory });
    },
  };

  // Job management
  jobs = {
    list: async (params?: any) => {
      return this.getPaginated('/jobs', params);
    },

    get: async (id: string) => {
      return this.get(`/jobs/${id}`);
    },

    // GET /api/v1/jobs/slug/:slug - Get job by slug
    getBySlug: async (slug: string) => {
      return this.get(`/jobs/slug/${slug}`);
    },

    // GET /api/v1/jobs/featured - Get featured jobs
    getFeatured: async (params?: any) => {
      return this.get('/jobs/featured', params);
    },

    create: async (data: any) => {
      return this.post('/jobs', data);
    },

    update: async (id: string, data: any) => {
      return this.put(`/jobs/${id}`, data);
    },

    delete: async (id: string) => {
      return this.delete(`/jobs/${id}`);
    },

    publish: async (id: string) => {
      return this.patch(`/jobs/${id}/publish`);
    },

    unpublish: async (id: string) => {
      return this.patch(`/jobs/${id}/unpublish`);
    },

    close: async (id: string) => {
      return this.patch(`/jobs/${id}/close`);
    },

    // GET /api/v1/jobs/:id/applications - Get all applications for a job (Admin/Provider)
    getApplications: async (jobId: string, params?: any) => {
      return this.getPaginated(`/jobs/${jobId}/applications`, params);
    },

    // PATCH /api/v1/jobs/applications/:id/status - Update application status (Admin/Provider)
    // Body: { status, notes? }
    updateApplicationStatus: async (applicationId: string, data: { status: string; notes?: string }) => {
      return this.patch(`/jobs/applications/${applicationId}/status`, data);
    },

    // GET /api/v1/jobs/stats - Get job statistics (Admin only)
    getStats: async () => {
      return this.get('/jobs/stats');
    },
  };

  // Category management
  categories = {
    list: async (params?: any) => {
      return this.get('/categories', params);
    },

    get: async (id: string) => {
      return this.get(`/categories/${id}`);
    },

    create: async (data: any) => {
      return this.post('/categories', data);
    },

    update: async (id: string, data: any) => {
      return this.put(`/categories/${id}`, data);
    },

    delete: async (id: string) => {
      return this.delete(`/categories/${id}`);
    },

    reorder: async (categories: Array<{ id: string; order: number }>) => {
      return this.put('/categories/reorder', { categories });
    },

    getStats: async () => {
      return this.get('/categories/stats');
    },
  };

  // Blog management
  blogs = {
    list: async (params?: any) => {
      return this.getPaginated('/blogs', params);
    },

    // Admin endpoints
    listAdmin: async (params?: any) => {
      return this.getPaginated('/blogs/admin', params);
    },

    // Public endpoints
    getFeatured: async (params?: any) => {
      return this.get('/blogs/featured', params);
    },

    getBySlug: async (slug: string) => {
      return this.get(`/blogs/slug/${slug}`);
    },

    getPopularTags: async (params?: any) => {
      return this.get('/blogs/tags/popular', params);
    },

    getRelated: async (blogId: string, params?: any) => {
      return this.get(`/blogs/related/${blogId}`, params);
    },

    getStats: async () => {
      return this.get('/blogs/stats');
    },
    get: async (id: string) => {
      return this.get(`/blogs/${id}`);
    },

    create: async (data: any) => {
      return this.post('/blogs', data);
    },

    update: async (id: string, data: any) => {
      return this.put(`/blogs/${id}`, data);
    },

    delete: async (id: string) => {
      return this.delete(`/blogs/${id}`);
    },

    publish: async (id: string) => {
      return this.patch(`/blogs/${id}/publish`);
    },

    archive: async (id: string) => {
      return this.patch(`/blogs/${id}/archive`);
    },

    toggleFeatured: async (id: string) => {
      return this.patch(`/blogs/${id}/featured`);
    },

    updateGallery: async (id: string, gallery: any[]) => {
      return this.patch(`/blogs/${id}/gallery`, { gallery });
    },

    generateUploadUrl: async (id: string, fileName: string, fileType: string) => {
      return this.post(`/blogs/${id}/upload-url`, { fileName, fileType });
    },
  };

  // Approval management - Updated with actual API endpoints
  // GET /api/v1/approvals/pending - Get all pending approvals with filters
  // Query params: page, limit, type (provider, document, listing)
  approvals = {
    // GET /api/v1/approvals/pending - Get all pending approvals with pagination and filters
    getPending: async (params?: any) => {
      return this.getPaginated('/approvals/pending', params);
    },

    // GET /api/v1/approvals/:approvalId - Get single approval request by ID
    get: async (id: string) => {
      return this.get(`/approvals/${id}`);
    },

    // PATCH /api/v1/approvals/:approvalId/approve - Approve a request
    approve: async (id: string) => {
      return this.patch(`/approvals/${id}/approve`);
    },

    // PATCH /api/v1/approvals/:approvalId/reject - Reject a request with reason
    // Body: { reason: string }
    reject: async (id: string, reason: string) => {
      return this.patch(`/approvals/${id}/reject`, { reason });
    },

    // GET /api/v1/approvals/stats - Get approval statistics
    getStats: async () => {
      return this.get('/approvals/stats');
    },

    // Legacy method for listing all approvals (not in Postman)
    list: async (params?: any) => {
      return this.getPaginated('/approvals', params);
    },
  };

  // Email template management
  emailTemplates = {
    list: async (params?: any) => {
      return this.get('/email-templates', params);
    },

    get: async (id: string) => {
      return this.get(`/email-templates/${id}`);
    },

    create: async (data: any) => {
      return this.post('/email-templates', data);
    },

    update: async (id: string, data: any) => {
      return this.put(`/email-templates/${id}`, data);
    },

    delete: async (id: string) => {
      return this.delete(`/email-templates/${id}`);
    },

    // POST /api/v1/email-templates/send-test - Send test email
    // Body: { templateId, to, data? }
    test: async (templateId: string, to: string, data?: any) => {
      return this.post('/email-templates/send-test', { templateId, to, data });
    },
  };

  // Analytics
  analytics = {
    dashboard: async () => {
      return this.get('/analytics/dashboard');
    },

    // Role-specific dashboard endpoints
    adminDashboard: async () => {
      return this.get('/dashboard/admin');
    },

    providerDashboard: async () => {
      return this.get('/dashboard/provider');
    },

    customerDashboard: async () => {
      return this.get('/dashboard/customer');
    },
    providers: async (params?: any) => {
      return this.get('/analytics/providers', params);
    },

    jobs: async (params?: any) => {
      return this.get('/analytics/jobs', params);
    },

    blogs: async (params?: any) => {
      return this.get('/analytics/blogs', params);
    },

    export: async (type: string, params?: any) => {
      return this.get(`/analytics/export/${type}`, params);
    },
  };

  // Settings
  settings = {
    // GET /api/v1/settings - Get all settings
    get: async () => {
      return this.get('/settings');
    },

    // GET /api/v1/settings/:key - Get single setting by key
    getByKey: async (key: string) => {
      return this.get(`/settings/${key}`);
    },

    // PUT /api/v1/settings - Bulk update settings
    update: async (data: any) => {
      return this.put('/settings', data);
    },

    // PUT /api/v1/settings/:key - Update single setting by key
    updateByKey: async (key: string, data: { value: any }) => {
      return this.put(`/settings/${key}`, data);
    },

    // POST /api/v1/settings - Create new setting
    // Body: { key, value, description? }
    create: async (data: { key: string; value: any; description?: string }) => {
      return this.post('/settings', data);
    },

    // DELETE /api/v1/settings/:key - Delete setting by key
    delete: async (key: string) => {
      return this.delete(`/settings/${key}`);
    },

    getCompliance: async () => {
      return this.get('/settings/compliance');
    },

    updateCompliance: async (data: any) => {
      return this.put('/settings/compliance', data);
    },

    exportData: async (userId: string) => {
      return this.get(`/settings/export-data/${userId}`);
    },
  };

  // Audit logs
  auditLogs = {
    list: async (params?: any) => {
      return this.getPaginated('/audit-logs', params);
    },

    export: async (params?: any) => {
      return this.get('/audit-logs/export', params);
    },
  };

  // Newsletter management
  // POST /api/v1/newsletter/subscribe - Subscribe (Public)
  // POST /api/v1/newsletter/unsubscribe - Unsubscribe (Public)
  // GET /api/v1/newsletter/subscribers - List subscribers (Admin only)
  // DELETE /api/v1/newsletter/subscribers/:id - Delete subscriber (Admin only)
  // GET /api/v1/newsletter/stats - Statistics (Admin only)
  newsletter = {
    // POST /api/v1/newsletter/subscribe - Subscribe to newsletter (Public)
    subscribe: async (email: string) => {
      return this.post('/newsletter/subscribe', { email });
    },

    // POST /api/v1/newsletter/unsubscribe - Unsubscribe from newsletter (Public)
    unsubscribe: async (email: string) => {
      return this.post('/newsletter/unsubscribe', { email });
    },

    // GET /api/v1/newsletter/subscribers - List all subscribers with pagination and filters (Admin only)
    // Query params: page, limit, status (active|unsubscribed)
    listSubscribers: async (params?: any) => {
      return this.getPaginated('/newsletter/subscribers', params);
    },

    // GET /api/v1/newsletter/subscribers/:id - Get subscriber by ID (Admin only)
    getSubscriber: async (id: string) => {
      return this.get(`/newsletter/subscribers/${id}`);
    },

    // DELETE /api/v1/newsletter/subscribers/:id - Delete subscriber (Admin only)
    deleteSubscriber: async (id: string) => {
      return this.delete(`/newsletter/subscribers/${id}`);
    },

    // GET /api/v1/newsletter/stats - Get newsletter statistics (Admin only)
    getStats: async () => {
      return this.get('/newsletter/stats');
    },
  };

  // Enquiries management - Admin only
  // GET /api/v1/enquiries - Get all enquiries with filters and pagination
  // Query params: page, limit, status (pending|resolved), search
  enquiries = {
    // GET /api/v1/enquiries - List all enquiries with pagination and filters (Admin only)
    list: async (params?: any) => {
      return this.getPaginated('/enquiries', params);
    },

    // GET /api/v1/enquiries/:id - Get single enquiry by ID (Admin only)
    get: async (id: string) => {
      return this.get(`/enquiries/${id}`);
    },

    // POST /api/v1/enquiries - Submit new enquiry (Public)
    // Body: { name, email, subject, message, providerId? }
    create: async (data: any) => {
      return this.post('/enquiries', data);
    },

    // PATCH /api/v1/enquiries/:id/status - Update enquiry status (Admin only)
    // Body: { status, notes? }
    updateStatus: async (id: string, data: { status: string; notes?: string }) => {
      return this.patch(`/enquiries/${id}/status`, data);
    },

    // DELETE /api/v1/enquiries/:id - Delete enquiry (Admin only)
    delete: async (id: string) => {
      return this.delete(`/enquiries/${id}`);
    },

    // GET /api/v1/enquiries/stats - Get enquiry statistics (Admin only)
    getStats: async () => {
      return this.get('/enquiries/stats');
    },
  };

  // Bookings management
  // GET /api/v1/bookings - List bookings (User/Admin/Provider)
  // POST /api/v1/bookings - Create booking (Customer)
  // PATCH /api/v1/bookings/:id/status - Update status (Provider/Admin)
  // PATCH /api/v1/bookings/:id/cancel - Cancel booking (Customer/Admin)
  // GET /api/v1/bookings/stats - Statistics (Admin only)
  bookings = {
    // GET /api/v1/bookings - List all bookings with pagination and filters
    // Query params: page, limit, status (pending|confirmed|cancelled|completed), providerId
    list: async (params?: any) => {
      return this.getPaginated('/bookings', params);
    },

    // GET /api/v1/bookings/:id - Get single booking by ID
    get: async (id: string) => {
      return this.get(`/bookings/${id}`);
    },

    // POST /api/v1/bookings - Create new booking (Customer)
    // Body: { providerId, serviceId, startDate, endDate, totalPrice, currency, notes? }
    create: async (data: any) => {
      return this.post('/bookings', data);
    },

    // PATCH /api/v1/bookings/:id/status - Update booking status (Provider/Admin)
    // Body: { status }
    updateStatus: async (id: string, data: { status: string }) => {
      return this.patch(`/bookings/${id}/status`, data);
    },

    // PATCH /api/v1/bookings/:id/cancel - Cancel booking (Customer/Admin)
    cancel: async (id: string) => {
      return this.patch(`/bookings/${id}/cancel`);
    },

    // GET /api/v1/bookings/stats - Get booking statistics (Admin only)
    getStats: async () => {
      return this.get('/bookings/stats');
    },
  };

  // Contracts management
  // GET /api/v1/contracts - List contracts (User/Admin/Provider)
  // POST /api/v1/contracts - Create contract (Provider/Admin)
  // PUT /api/v1/contracts/:id - Update contract (Provider/Admin)
  // PATCH /api/v1/contracts/:id/status - Update status (Provider/Admin)
  // PATCH /api/v1/contracts/:id/sign - Sign contract (Customer/Provider)
  // DELETE /api/v1/contracts/:id - Delete contract (Admin)
  // GET /api/v1/contracts/stats - Statistics (Admin only)
  contracts = {
    // GET /api/v1/contracts - List all contracts with pagination and filters
    // Query params: page, limit, status (draft|active|completed|terminated), providerId
    list: async (params?: any) => {
      return this.getPaginated('/contracts', params);
    },

    // GET /api/v1/contracts/:id - Get single contract by ID
    get: async (id: string) => {
      return this.get(`/contracts/${id}`);
    },

    // POST /api/v1/contracts - Create new contract (Provider/Admin)
    // Body: { bookingId, providerId, customerId, terms, value, currency, status? }
    create: async (data: any) => {
      return this.post('/contracts', data);
    },

    // PUT /api/v1/contracts/:id - Update contract (Provider/Admin)
    // Body: { terms?, value?, etc. }
    update: async (id: string, data: any) => {
      return this.put(`/contracts/${id}`, data);
    },

    // PATCH /api/v1/contracts/:id/status - Update contract status (Provider/Admin)
    // Body: { status }
    updateStatus: async (id: string, data: { status: string }) => {
      return this.patch(`/contracts/${id}/status`, data);
    },

    // PATCH /api/v1/contracts/:id/sign - Sign contract (Customer/Provider)
    sign: async (id: string) => {
      return this.patch(`/contracts/${id}/sign`);
    },

    // DELETE /api/v1/contracts/:id - Delete contract (Admin only)
    delete: async (id: string) => {
      return this.delete(`/contracts/${id}`);
    },

    // GET /api/v1/contracts/stats - Get contract statistics (Admin only)
    getStats: async () => {
      return this.get('/contracts/stats');
    },
  };

  // Vessels management
  // GET /api/v1/vessels - List vessels (Public)
  // GET /api/v1/vessels/featured - Get featured vessels (Public)
  // POST /api/v1/vessels - Create vessel (Owner)
  // PUT /api/v1/vessels/:id - Update vessel (Owner/Admin)
  // DELETE /api/v1/vessels/:id - Delete vessel (Owner/Admin)
  // GET /api/v1/vessels/my-vessels - Get my vessels (Owner)
  // GET /api/v1/vessels/stats - Statistics (Admin only)
  vessels = {
    // GET /api/v1/vessels - List all vessels with pagination and filters (Public)
    // Query params: page, limit, type, minPrice, maxPrice, capacity
    list: async (params?: any) => {
      return this.getPaginated('/vessels', params);
    },

    // GET /api/v1/vessels/:id - Get single vessel by ID (Public)
    get: async (id: string) => {
      return this.get(`/vessels/${id}`);
    },

    // GET /api/v1/vessels/featured - Get featured vessels (Public)
    getFeatured: async (params?: any) => {
      return this.get('/vessels/featured', params);
    },

    // POST /api/v1/vessels - Create new vessel listing (Owner)
    // Body: { name, description, type, capacity, location, pricePerDay, amenities?, specifications? }
    create: async (data: any) => {
      return this.post('/vessels', data);
    },

    // PUT /api/v1/vessels/:id - Update vessel listing (Owner/Admin)
    // Body: { name?, description?, pricePerDay?, amenities?, etc. }
    update: async (id: string, data: any) => {
      return this.put(`/vessels/${id}`, data);
    },

    // DELETE /api/v1/vessels/:id - Delete vessel listing (Owner/Admin)
    delete: async (id: string) => {
      return this.delete(`/vessels/${id}`);
    },

    // GET /api/v1/vessels/my-vessels - Get my vessels (Owner)
    getMyVessels: async (params?: any) => {
      return this.getPaginated('/vessels/my-vessels', params);
    },

    // GET /api/v1/vessels/stats - Get vessel statistics (Admin only)
    getStats: async () => {
      return this.get('/vessels/stats');
    },
  };

  // Projects management
  // GET /api/v1/projects - List projects (User/Admin)
  // POST /api/v1/projects - Create project (User)
  // PUT /api/v1/projects/:id - Update project (Owner/Admin)
  // DELETE /api/v1/projects/:id - Delete project (Owner/Admin)
  // PATCH /api/v1/projects/:id/status - Update project status (Owner/Admin)
  // GET /api/v1/projects/stats - Statistics (Admin only)
  projects = {
    // GET /api/v1/projects - List all projects with pagination and filters (User/Admin)
    // Query params: page, limit, status (active|completed|cancelled), search
    list: async (params?: any) => {
      return this.getPaginated('/projects', params);
    },

    // GET /api/v1/projects/:id - Get single project by ID (Owner/Admin)
    get: async (id: string) => {
      return this.get(`/projects/${id}`);
    },

    // POST /api/v1/projects - Create new project (User)
    // Body: { title, description, budget, currency, startDate, endDate, status? }
    create: async (data: any) => {
      return this.post('/projects', data);
    },

    // PUT /api/v1/projects/:id - Update project (Owner/Admin)
    // Body: { title?, description?, budget?, status?, etc. }
    update: async (id: string, data: any) => {
      return this.put(`/projects/${id}`, data);
    },

    // DELETE /api/v1/projects/:id - Delete project (Owner/Admin)
    delete: async (id: string) => {
      return this.delete(`/projects/${id}`);
    },

    // PATCH /api/v1/projects/:id/status - Update project status (Owner/Admin)
    // Body: { status }
    updateStatus: async (id: string, data: { status: string }) => {
      return this.patch(`/projects/${id}/status`, data);
    },

    // GET /api/v1/projects/stats - Get project statistics (Admin only)
    getStats: async () => {
      return this.get('/projects/stats');
    },
  };

  // Social Links management (Admin only)
  // GET /api/v1/social-links - List social links
  // POST /api/v1/social-links - Create social link
  // PUT /api/v1/social-links/:id - Update social link
  // DELETE /api/v1/social-links/:id - Delete social link
  socialLinks = {
    // GET /api/v1/social-links - List all social media links (Admin only)
    list: async (params?: any) => {
      return this.get('/social-links', params);
    },

    // GET /api/v1/social-links/:id - Get single social link by ID (Admin only)
    get: async (id: string) => {
      return this.get(`/social-links/${id}`);
    },

    // POST /api/v1/social-links - Create new social media link (Admin only)
    // Body: { platform, url }
    create: async (data: { platform: string; url: string }) => {
      return this.post('/social-links', data);
    },

    // PUT /api/v1/social-links/:id - Update social media link (Admin only)
    // Body: { platform?, url? }
    update: async (id: string, data: { platform?: string; url?: string }) => {
      return this.put(`/social-links/${id}`, data);
    },

    // DELETE /api/v1/social-links/:id - Delete social media link (Admin only)
    delete: async (id: string) => {
      return this.delete(`/social-links/${id}`);
    },
  };
}

export const api = new ApiClient();
export default api;