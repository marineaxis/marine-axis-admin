// API client for Marine-Axis Admin Panel
import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, LOCAL_STORAGE_KEYS, ERROR_MESSAGES } from './constants';
import { ApiResponse, PaginatedResponse, Blog, TableFilters, BlogCreatePayload, BlogUpdatePayload, Job } from '../types';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      // Allow browser to include and receive HttpOnly cookies (refresh token)
      withCredentials: true,
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
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const refreshRes = await this.auth.refreshToken(refreshToken);

              if (refreshRes.success) {
                const payload = refreshRes.data as { accessToken: string; refreshToken?: string };
                const accessToken = payload.accessToken;
                const newRefreshToken = payload.refreshToken;

                localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, accessToken);
                if (newRefreshToken) {
                  localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
                }

                originalRequest.headers = originalRequest.headers || {};
                // headers can be string[][] | Record<string, string> | undefined; normalize to Record
                const headers = (originalRequest.headers as Record<string, unknown>);
                headers.Authorization = `Bearer ${accessToken}`;
                return this.instance(originalRequest);
              } else {
                throw new Error('Token refresh failed');
              }
            }
          } catch (refreshError) {
            this.clearAuth();
            const errObj = new Error(refreshError instanceof Error ? refreshError.message : 'Refresh failed');
            (errObj as unknown as Record<string, unknown>).status = error.response?.status;
            (errObj as unknown as Record<string, unknown>).url = typeof originalRequest?.url === 'string' ? originalRequest.url : undefined;
            window.location.href = '/login';
            return Promise.reject(errObj);
          }
        }

        const enhanced = this.handleError(error);
        const enhancedErr = new Error(enhanced.message) as Error & { status?: number; url?: string };
        enhancedErr.status = error.response?.status;
        enhancedErr.url = typeof error.config?.url === 'string' ? error.config.url : undefined;
        return Promise.reject(enhancedErr);
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (!error.response) {
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    const resp = error.response as AxiosResponse | undefined;
    const status = resp?.status;
    const data = resp?.data as Record<string, unknown> | undefined;

    const extractMessage = (d?: Record<string, unknown>) => {
      if (!d) return undefined;
      const m = d['message'];
      return typeof m === 'string' ? m : undefined;
    };

    switch (status) {
      case 400:
        return new Error(extractMessage(data) || ERROR_MESSAGES.VALIDATION_ERROR);
      case 401:
        return new Error(ERROR_MESSAGES.UNAUTHORIZED);
      case 403:
        return new Error(ERROR_MESSAGES.FORBIDDEN);
      case 404:
        return new Error(ERROR_MESSAGES.NOT_FOUND);
      case 500:
        return new Error(ERROR_MESSAGES.SERVER_ERROR);
      default:
        return new Error(extractMessage(data) || ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  private clearAuth() {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
  }

  // Generic API methods
  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, { params });
    return response.data as ApiResponse<T>;
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data);
    return response.data as ApiResponse<T>;
  }

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data);
    return response.data as ApiResponse<T>;
  }

  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data);
    return response.data as ApiResponse<T>;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url);
    return response.data as ApiResponse<T>;
  }

  async getPaginated<T>(url: string, params?: TableFilters): Promise<PaginatedResponse<T>> {
    const response = await this.instance.get(url, { params });
    const raw: unknown = response.data;
    // Type guards
    const isWrapped = (v: unknown): v is ApiResponse<{ data: T[]; pagination: PaginatedResponse<T>['pagination'] }> => {
      if (typeof v !== 'object' || v === null) return false;
      const obj = v as Record<string, unknown>;
      if (obj.success !== true) return false;
      if (typeof obj.data !== 'object' || obj.data === null) return false;
      const inner = obj.data as Record<string, unknown>;
      return Array.isArray(inner.data) && typeof inner.pagination === 'object' && inner.pagination !== null;
    };
    if (isWrapped(raw)) {
      return { success: true, data: raw.data.data, pagination: raw.data.pagination, message: raw.message };
    }
    return raw as PaginatedResponse<T>;
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
    login: async (email: string, password: string) => {
      // Updated to unified login endpoint
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

    updateProfile: async (data: Record<string, unknown>) => {
      return this.put('/auth/profile', data);
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      return this.post('/auth/change-password', { currentPassword, newPassword });
    },
  };

  // Admin management
  admins = {
    list: async (params?: Record<string, unknown>) => this.getPaginated('/admins', params),
    get: async (id: string) => this.get(`/admins/${id}`),
    create: async (data: Record<string, unknown>) => this.post('/admins', data),
    update: async (id: string, data: Record<string, unknown>) => this.put(`/admins/${id}`, data),
    delete: async (id: string) => this.delete(`/admins/${id}`),
    stats: async () => this.get('/admins/stats'),
  };

  // Provider management
  providers = {
    list: async (params?: TableFilters) => this.getPaginated('/providers', params),
    get: async (id: string) => this.get(`/providers/${id}`),
    create: async (data: Record<string, unknown>) => this.post('/providers', data),
    update: async (id: string, data: Record<string, unknown>) => this.put(`/providers/${id}`, data),
    delete: async (id: string) => this.delete(`/providers/${id}`),
    getFeatured: async (params?: Record<string, unknown>) => this.get('/providers/featured', params),
    getPending: async (params?: Record<string, unknown>) => this.get('/providers/pending', params),
    getStats: async () => this.get('/providers/stats'),
    approve: async (id: string) => this.post(`/providers/${id}/approve`),
    reject: async (id: string, reason: string) => this.post(`/providers/${id}/reject`, { rejectionReason: reason }),
    reapply: async (id: string, data: Record<string, unknown>) => this.post(`/providers/${id}/reapply`, data),
    toggleFeatured: async (id: string) => this.patch(`/providers/${id}/featured`),
    sendWelcomeEmail: async (id: string) => this.post(`/providers/${id}/welcome-email`),
  };

  // Job management
  jobs = {
    list: async (params?: TableFilters) => this.getPaginated<Job>('/jobs', params),
    get: async (id: string) => this.get<Job>(`/jobs/${id}`),
    create: async (data?: unknown) => this.post<Job>('/jobs', data),
    update: async (id: string, data?: unknown) => this.put<Job>(`/jobs/${id}`, data),
    delete: async (id: string) => this.delete(`/jobs/${id}`),
    publish: async (id: string) => this.patch(`/jobs/${id}/publish`),
    unpublish: async (id: string) => this.patch(`/jobs/${id}/unpublish`),
    close: async (id: string) => this.patch(`/jobs/${id}/close`),
  };

  // Category management
  categories = {
    list: async (params?: Record<string, unknown>) => {
      return this.get('/categories', params);
    },

    get: async (id: string) => {
      return this.get(`/categories/${id}`);
    },

    create: async (data: Record<string, unknown>) => {
      return this.post('/categories', data);
    },

    update: async (id: string, data: Record<string, unknown>) => {
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
    list: async (params?: TableFilters) => this.getPaginated<Blog>('/blogs', params),
    listAdmin: async (params?: TableFilters) => {
      try {
        return await this.getPaginated<Blog>('/blogs/admin', params);
      } catch (err) {
        // Dev-only fallback: call debug admin endpoint if available
        if (process.env.NODE_ENV !== 'production') {
          try {
            const res = await this.getPaginated<Blog>('/blogs/_debug/admin', params);
            // mark runtime flag so UI can surface a helpful toast
            if (res && typeof res === 'object') {
              (res as unknown as Record<string, unknown>)._debugFallback = true;
            }
            return res;
          } catch (e) {
            // swallow and rethrow original
          }
        }
        throw err;
      }
    },
    listAdminDebug: async (params?: TableFilters) => this.getPaginated<Blog>('/blogs/_debug/admin', params),
    getFeatured: async (params?: Record<string, unknown>) => this.get('/blogs/featured', params),
    getBySlug: async (slug: string) => this.get(`/blogs/slug/${slug}`),
    getPopularTags: async (params?: Record<string, unknown>) => this.get('/blogs/tags/popular', params),
    getRelated: async (blogId: string, params?: Record<string, unknown>) => this.get(`/blogs/related/${blogId}`, params),
    getStats: async () => this.get('/blogs/stats'),
    get: async (id: string) => this.get<Blog>(`/blogs/${id}`),
    create: async (data: BlogCreatePayload) => {
      try {
        return await this.post<Blog>('/blogs', data);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          try {
            const res = await this.post<Blog>('/blogs/_debug/admin', data);
            if (res && typeof res === 'object') {
              (res as unknown as Record<string, unknown>)._debugFallback = true;
            }
            return res;
          } catch (e) {
            // swallow
          }
        }
        throw err;
      }
    },
    update: async (id: string, data: BlogUpdatePayload) => this.put<Blog>(`/blogs/${id}`, data),
    delete: async (id: string) => this.delete<void>(`/blogs/${id}`),
    publish: async (id: string) => this.patch(`/blogs/${id}/publish`),
    archive: async (id: string) => this.patch(`/blogs/${id}/archive`),
    toggleFeatured: async (id: string) => this.patch(`/blogs/${id}/featured`),
    updateGallery: async (id: string, gallery: Array<{ url: string; key: string; caption?: string; order?: number }>) => this.patch(`/blogs/${id}/gallery`, { gallery }),
    generateUploadUrl: async (id: string, fileName: string, fileType: string) => this.post(`/blogs/${id}/upload-url`, { fileName, fileType }),
  };

  // Approval management
  approvals = {
    list: async (params?: TableFilters) => this.getPaginated('/approvals', params),
    get: async (id: string) => this.get(`/approvals/${id}`),
    approve: async (id: string, notes?: string) => this.patch(`/approvals/${id}/approve`, { notes }),
    reject: async (id: string, notes: string) => this.patch(`/approvals/${id}/reject`, { notes }),
    getPending: async (params?: TableFilters) => this.getPaginated('/approvals/pending', params),
    getStats: async () => this.get('/approvals/stats'),
  };

  // Email template management
  emailTemplates = {
    list: async (params?: Record<string, unknown>) => {
      return this.get('/email-templates', params);
    },

    get: async (id: string) => {
      return this.get(`/email-templates/${id}`);
    },

    create: async (data: Record<string, unknown>) => {
      return this.post('/email-templates', data);
    },

    update: async (id: string, data: Record<string, unknown>) => {
      return this.put(`/email-templates/${id}`, data);
    },

    delete: async (id: string) => {
      return this.delete(`/email-templates/${id}`);
    },

    test: async (id: string, email: string) => {
      return this.post(`/email-templates/${id}/test`, { email });
    },
  };

  // Analytics
  analytics = {
    dashboard: async () => this.get('/analytics/dashboard'),
    adminDashboard: async () => this.get('/dashboard/admin'),
    providerDashboard: async () => this.get('/dashboard/provider'),
    customerDashboard: async () => this.get('/dashboard/customer'),
    providers: async (params?: Record<string, unknown>) => this.get('/analytics/providers', params),
    jobs: async (params?: Record<string, unknown>) => this.get('/analytics/jobs', params),
    blogs: async (params?: Record<string, unknown>) => this.get('/analytics/blogs', params),
    export: async (type: string, params?: Record<string, unknown>) => this.get(`/analytics/export/${type}`, params),
  };

  // Settings
  settings = {
    get: async () => this.get('/settings'),
    update: async (data: Record<string, unknown>) => this.put('/settings', data),
    getCompliance: async () => this.get('/settings/compliance'),
    updateCompliance: async (data: Record<string, unknown>) => this.put('/settings/compliance', data),
    exportData: async (userId: string) => this.get(`/settings/export-data/${userId}`),
  };

  // Audit logs
  auditLogs = {
    list: async (params?: TableFilters) => this.getPaginated('/audit-logs', params),
    export: async (params?: Record<string, unknown>) => this.get('/audit-logs/export', params),
  };
}

export const api = new ApiClient();
export default api;