// Mock authentication service for Marine-Axis Admin Panel
import { User, ApiResponse, LoginForm } from '../types';
import { LOCAL_STORAGE_KEYS } from './constants';

// Mock users database
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@marine-axis.com',
    name: 'Admin User',
    role: 'admin',
    avatar: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'superadmin@marine-axis.com',
    name: 'Super Admin',
    role: 'super_admin',
    avatar: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'test@provider.com',
    name: 'Test Provider',
    role: 'provider',
    avatar: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
  },
];

// Mock password (same for both users for simplicity)
const MOCK_PASSWORD = 'password123';

// Simple JWT-like token generator (not secure, just for mock purposes)
function generateMockToken(user: User): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  }));
  const signature = btoa('mock-signature');
  
  return `${header}.${payload}.${signature}`;
}

function generateMockRefreshToken(): string {
  return btoa(`refresh-${Date.now()}-${Math.random()}`);
}

// Simulate network delay
function delay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class MockAuthService {
  static async login(email: string, password: string): Promise<ApiResponse<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }>> {
    await delay();

    const user = MOCK_USERS.find(u => u.email === email);
    
    if (!user || password !== MOCK_PASSWORD) {
      return {
        success: false,
        message: 'Invalid email or password',
        data: null as any,
      };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    const accessToken = generateMockToken(user);
    const refreshToken = generateMockRefreshToken();

    return {
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    };
  }

  static async me(): Promise<ApiResponse<User>> {
    await delay(200);

    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      return {
        success: false,
        message: 'No token provided',
        data: null as any,
      };
    }

    try {
      // Extract payload from mock token
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check if token is expired
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return {
          success: false,
          message: 'Token expired',
          data: null as any,
        };
      }

      const user = MOCK_USERS.find(u => u.id === payload.sub);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          data: null as any,
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid token',
        data: null as any,
      };
    }
  }

  static async refreshToken(): Promise<ApiResponse<{
    accessToken: string;
    refreshToken: string;
  }>> {
    await delay(200);

    const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      return {
        success: false,
        message: 'No refresh token provided',
        data: null as any,
      };
    }

    // Get current user from stored user data
    const userDataStr = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_DATA);
    if (!userDataStr) {
      return {
        success: false,
        message: 'No user data found',
        data: null as any,
      };
    }

    const user = JSON.parse(userDataStr);
    const newAccessToken = generateMockToken(user);
    const newRefreshToken = generateMockRefreshToken();

    return {
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  static async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    await delay();

    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      return {
        success: false,
        message: 'Not authenticated',
        data: null as any,
      };
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = MOCK_USERS.find(u => u.id === payload.sub);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          data: null as any,
        };
      }

      // Update user data (in real app, this would update the database)
      Object.assign(user, data, { updatedAt: new Date().toISOString() });

      return {
        success: true,
        message: 'Profile updated successfully',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid token',
        data: null as any,
      };
    }
  }

  static async logout(): Promise<ApiResponse<any>> {
    await delay(200);
    
    return {
      success: true,
      message: 'Logged out successfully',
      data: null,
    };
  }
}