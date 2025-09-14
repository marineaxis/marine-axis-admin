// API client for Marine-Axis Admin Panel
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, LOCAL_STORAGE_KEYS, ERROR_MESSAGES } from './constants';
import { ApiResponse, PaginatedResponse } from '../types';

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
        return new Error(data?.message || ERROR_MESSAGES.VALIDATION_ERROR);
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
    login: async (email: string, password: string) => {
      const response = await this.post('/auth/admin/login', { email, password });
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
  };

  // Admin management
  admins = {
    list: async (params?: any) => {
      return this.getPaginated('/admins', params);
    },

    get: async (id: string) => {
      return this.get(`/admins/${id}`);
    },

    create: async (data: any) => {
      return this.post('/admins', data);
    },

    update: async (id: string, data: any) => {
      return this.put(`/admins/${id}`, data);
    },

    delete: async (id: string) => {
      return this.delete(`/admins/${id}`);
    },

    stats: async () => {
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
  };

  // Job management
  jobs = {
    list: async (params?: any) => {
      return this.getPaginated('/jobs', params);
    },

    get: async (id: string) => {
      return this.get(`/jobs/${id}`);
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
  };

  // Blog management
  blogs = {
    list: async (params?: any) => {
      return this.getPaginated('/blogs', params);
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

    unpublish: async (id: string) => {
      return this.patch(`/blogs/${id}/unpublish`);
    },

    toggleFeatured: async (id: string) => {
      return this.patch(`/blogs/${id}/featured`);
    },
  };

  // Approval management
  approvals = {
    list: async (params?: any) => {
      return this.getPaginated('/approvals', params);
    },

    get: async (id: string) => {
      return this.get(`/approvals/${id}`);
    },

    approve: async (id: string, notes?: string) => {
      return this.patch(`/approvals/${id}/approve`, { notes });
    },

    reject: async (id: string, notes: string) => {
      return this.patch(`/approvals/${id}/reject`, { notes });
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

    test: async (id: string, email: string) => {
      return this.post(`/email-templates/${id}/test`, { email });
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
    get: async () => {
      return this.get('/settings');
    },

    update: async (data: any) => {
      return this.put('/settings', data);
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
}

export const api = new ApiClient();
export default api;