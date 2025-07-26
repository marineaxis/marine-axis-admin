// Authentication Context for Marine-Axis Admin Panel
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { AuthManager } from '../lib/auth';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  hasRole: (role: Role) => boolean;
  canAccess: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = Boolean(user) && AuthManager.isAuthenticated();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (AuthManager.isAuthenticated()) {
        const cachedUser = AuthManager.getUserData();
        if (cachedUser) {
          setUser(cachedUser);
        }

        // Verify token with server and get fresh user data
        const response = await api.auth.me();
        if (response.success) {
          setUser(response.data);
          AuthManager.setUserData(response.data);
        } else {
          AuthManager.clearTokens();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      AuthManager.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.auth.login(email, password);
      
      if (response.success) {
        const { user: userData, accessToken, refreshToken } = response.data;
        
        AuthManager.setTokens(accessToken, refreshToken);
        AuthManager.setUserData(userData);
        setUser(userData);

        toast({
          title: 'Welcome back!',
          description: `Logged in as ${userData.name}`,
        });

        return true;
      } else {
        toast({
          title: 'Login failed',
          description: response.message || 'Invalid credentials',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      toast({
        title: 'Login error',
        description: error.message || 'An error occurred during login',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      AuthManager.clearTokens();
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const response = await api.auth.updateProfile(data);
      
      if (response.success) {
        const updatedUser = { ...user, ...response.data };
        setUser(updatedUser);
        AuthManager.setUserData(updatedUser);

        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
        });

        return true;
      } else {
        toast({
          title: 'Update failed',
          description: response.message || 'Failed to update profile',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      toast({
        title: 'Update error',
        description: error.message || 'An error occurred while updating profile',
        variant: 'destructive',
      });
      return false;
    }
  };

  const hasRole = (role: Role): boolean => {
    return AuthManager.hasRole(role);
  };

  const canAccess = (roles: Role[]): boolean => {
    return AuthManager.canAccess(roles);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    hasRole,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;