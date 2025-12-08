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
    return token?.role ?? null;
  }

  static hasRole(requiredRole: Role): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;
    return userRole === requiredRole;
  }

  static canAccess(requiredRoles: Array<Role>): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;
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

  // Simplified: detect any non-alphanumeric, non-space character as a special char
  hasSpecialChar: (password: string): boolean => {
    return /[^A-Za-z0-9\s]/.test(password);
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

  // Simplified phone sanitization regex to avoid unnecessary escapes
  phone: (input: string): string => {
    return input.replace(/[^0-9+\-()\s]/g, '');
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
  canManageAdmins: (): boolean => AuthManager.hasRole('admin'),
  canCreateAdmins: (): boolean => AuthManager.hasRole('admin'),
  canDeleteAdmins: (): boolean => AuthManager.hasRole('admin'),

  // Provider management
  canManageProviders: (): boolean => AuthManager.canAccess(['admin']),
  canApproveProviders: (): boolean => AuthManager.canAccess(['admin']),
  canDeleteProviders: (): boolean => AuthManager.hasRole('admin'),

  // Job management
  canManageJobs: (): boolean => AuthManager.canAccess(['admin']),
  canDeleteJobs: (): boolean => AuthManager.hasRole('admin'),

  // Blog management
  canManageBlogs: (): boolean => AuthManager.canAccess(['admin']),
  canDeleteBlogs: (): boolean => AuthManager.hasRole('admin'),

  // Category management
  canManageCategories: (): boolean => AuthManager.canAccess(['admin']),
  canDeleteCategories: (): boolean => AuthManager.hasRole('admin'),

  // Approval management
  canManageApprovals: (): boolean => AuthManager.canAccess(['admin']),

  // Email templates
  canManageEmailTemplates: (): boolean => AuthManager.canAccess(['admin']),

  // Settings
  canManageSettings: (): boolean => AuthManager.hasRole('admin'),
  canViewSettings: (): boolean => AuthManager.canAccess(['admin']),

  // Analytics
  canViewAnalytics: (): boolean => AuthManager.canAccess(['admin']),
  canExportData: (): boolean => AuthManager.hasRole('admin'),

  // Audit logs
  canViewAuditLogs: (): boolean => AuthManager.hasRole('admin'),
};

export default AuthManager;