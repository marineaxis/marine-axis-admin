// Authentication utilities for Marine-Axis Admin Panel
import { jwtDecode } from 'jwt-decode';
import { LOCAL_STORAGE_KEYS } from './constants';
import { User, Role } from '../types';

export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  exp: number;
  iat: number;
}

export class AuthManager {
  static getToken(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, accessToken);
    if (refreshToken) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
  }

  static getUserData(): User | null {
    const userData = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  static setUserData(user: User): void {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  }

  static getDecodedToken(): JWTPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode<JWTPayload>(token);
    } catch {
      return null;
    }
  }

  static getUserRole(): Role | null {
    const token = this.getDecodedToken();
    return token?.role || null;
  }

  static hasRole(requiredRole: 'superadmin' | 'admin'): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    // Super admin has access to everything
    if (userRole === 'super_admin') return true;
    
    // Admin can only access admin-level features
    return userRole === requiredRole;
  }

  static canAccess(requiredRoles: ('superadmin' | 'admin')[]): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    // Super admin has access to everything
    if (userRole === 'super_admin') return true;

    return requiredRoles.includes(userRole);
  }

  static isTokenExpiringSoon(thresholdMinutes: number = 5): boolean {
    const token = this.getDecodedToken();
    if (!token) return true;

    const currentTime = Date.now() / 1000;
    const expirationTime = token.exp;
    const timeUntilExpiration = expirationTime - currentTime;
    const thresholdSeconds = thresholdMinutes * 60;

    return timeUntilExpiration <= thresholdSeconds;
  }

  static logout(): void {
    this.clearTokens();
    window.location.href = '/login';
  }

  static redirectToLogin(): void {
    const currentPath = window.location.pathname;
    const loginUrl = `/login${currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : ''}`;
    window.location.href = loginUrl;
  }

  static getRedirectPath(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || '/';
  }
}

// Password validation utilities
export const passwordValidation = {
  minLength: (password: string, min: number = 8): boolean => {
    return password.length >= min;
  },

  hasUppercase: (password: string): boolean => {
    return /[A-Z]/.test(password);
  },

  hasLowercase: (password: string): boolean => {
    return /[a-z]/.test(password);
  },

  hasNumber: (password: string): boolean => {
    return /\d/.test(password);
  },

  hasSpecialChar: (password: string): boolean => {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  },

  isValid: (password: string): boolean => {
    return (
      passwordValidation.minLength(password) &&
      passwordValidation.hasUppercase(password) &&
      passwordValidation.hasLowercase(password) &&
      passwordValidation.hasNumber(password) &&
      passwordValidation.hasSpecialChar(password)
    );
  },

  getStrength: (password: string): 'weak' | 'medium' | 'strong' => {
    let score = 0;

    if (passwordValidation.minLength(password)) score++;
    if (passwordValidation.hasUppercase(password)) score++;
    if (passwordValidation.hasLowercase(password)) score++;
    if (passwordValidation.hasNumber(password)) score++;
    if (passwordValidation.hasSpecialChar(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  },

  getRequirements: (password: string) => {
    return {
      minLength: passwordValidation.minLength(password),
      hasUppercase: passwordValidation.hasUppercase(password),
      hasLowercase: passwordValidation.hasLowercase(password),
      hasNumber: passwordValidation.hasNumber(password),
      hasSpecialChar: passwordValidation.hasSpecialChar(password),
    };
  },
};

// Input sanitization
export const sanitize = {
  html: (input: string): string => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  sql: (input: string): string => {
    return input.replace(/['"`;\\]/g, '');
  },

  email: (input: string): string => {
    return input.toLowerCase().trim();
  },

  phone: (input: string): string => {
    return input.replace(/[^\d\+\-\(\)\s]/g, '');
  },

  url: (input: string): string => {
    try {
      const url = new URL(input);
      return url.toString();
    } catch {
      return '';
    }
  },
};

// RBAC helper functions
export const permissions = {
  // Admin management
  canManageAdmins: (): boolean => AuthManager.hasRole('superadmin'),
  canCreateAdmins: (): boolean => AuthManager.hasRole('superadmin'),
  canDeleteAdmins: (): boolean => AuthManager.hasRole('superadmin'),

  // Provider management
  canManageProviders: (): boolean => AuthManager.canAccess(['superadmin', 'admin']),
  canApproveProviders: (): boolean => AuthManager.canAccess(['superadmin', 'admin']),
  canDeleteProviders: (): boolean => AuthManager.hasRole('superadmin'),

  // Job management
  canManageJobs: (): boolean => AuthManager.canAccess(['superadmin', 'admin']),
  canDeleteJobs: (): boolean => AuthManager.hasRole('superadmin'),

  // Blog management
  canManageBlogs: (): boolean => AuthManager.canAccess(['superadmin', 'admin']),
  canDeleteBlogs: (): boolean => AuthManager.hasRole('superadmin'),

  // Category management
  canManageCategories: (): boolean => AuthManager.canAccess(['superadmin', 'admin']),
  canDeleteCategories: (): boolean => AuthManager.hasRole('superadmin'),

  // Approval management
  canManageApprovals: (): boolean => AuthManager.canAccess(['superadmin', 'admin']),

  // Email templates
  canManageEmailTemplates: (): boolean => AuthManager.canAccess(['superadmin', 'admin']),

  // Settings
  canManageSettings: (): boolean => AuthManager.hasRole('superadmin'),
  canViewSettings: (): boolean => AuthManager.canAccess(['superadmin', 'admin']),

  // Analytics
  canViewAnalytics: (): boolean => AuthManager.canAccess(['superadmin', 'admin']),
  canExportData: (): boolean => AuthManager.hasRole('superadmin'),

  // Audit logs
  canViewAuditLogs: (): boolean => AuthManager.hasRole('superadmin'),
};

export default AuthManager;