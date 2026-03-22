// Provider authentication context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Provider } from '../types';
import { useToast } from '../hooks/use-toast';
import api from '../lib/api';
import { LOCAL_STORAGE_KEYS } from '../lib/constants';
import { AuthManager } from '../lib/auth';

interface ProviderAuthContextType {
  provider: Provider | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Provider>) => Promise<boolean>;
  refreshProvider: () => Promise<void>;
}

const ProviderAuthContext = createContext<ProviderAuthContextType | undefined>(undefined);

interface ProviderAuthProviderProps {
  children: ReactNode;
}

export const ProviderAuthProvider: React.FC<ProviderAuthProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = Boolean(provider);

  useEffect(() => {
    // Only provider accounts have a /providers/me profile; staff (admin/superadmin) share the same token store
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    const role = AuthManager.getUserRole();
    if (token && role === 'provider') {
      fetchProviderData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProviderData = async () => {
    try {
      setIsLoading(true);
      const response = await api.providers.getMe();
      if (response.success && response.data) {
        const providerData = response.data as Provider;
        setProvider(providerData);
        localStorage.setItem('provider_data', JSON.stringify(providerData));
      } else {
        // If fetch fails, clear session
        clearSession();
      }
    } catch (error) {
      console.error('Failed to fetch provider data:', error);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem('provider_data');
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    setProvider(null);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Use unified login endpoint
      const response = await api.auth.login(email, password);
      
      if (response.success && response.data) {
        const { accessToken, refreshToken, user } = response.data;
        
        // Verify user is a provider
        if (user.role !== 'provider') {
          toast({
            title: 'Login failed',
            description: 'This account is not a provider account',
            variant: 'destructive',
          });
          return false;
        }
        
        // Store tokens
        localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, accessToken);
        if (refreshToken) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        
        // Fetch provider data
        await fetchProviderData();
        
        toast({
          title: 'Welcome back!',
          description: `Logged in successfully`,
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
      console.error('Login error:', error);
      toast({
        title: 'Login error',
        description: error?.response?.data?.message || 'An error occurred during login',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    window.location.href = '/provider/login';
  };

  const updateProfile = async (data: Partial<Provider>): Promise<boolean> => {
    try {
      if (!provider) {
        toast({
          title: 'Error',
          description: 'No provider data available',
          variant: 'destructive',
        });
        return false;
      }

      // Transform data to match backend schema
      const updateData: any = {
        ...data,
      };

      // Handle socialLinks transformation
      if (data.socialLinks) {
        const socialMedia = Object.entries(data.socialLinks)
          .filter(([_, value]) => value)
          .map(([key, url]) => ({ key, url }));
        updateData.socialMedia = socialMedia;
        delete updateData.socialLinks;
      }

      // Update via API
      const response = await api.providers.update(provider.id, updateData);
      
      if (response.success && response.data) {
        const updatedProvider = response.data as Provider;
        setProvider(updatedProvider);
        localStorage.setItem('provider_data', JSON.stringify(updatedProvider));

        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
        });

        return true;
      } else {
        toast({
          title: 'Update error',
          description: response.message || 'Failed to update profile',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast({
        title: 'Update error',
        description: error?.response?.data?.message || 'Failed to update profile',
        variant: 'destructive',
      });
      return false;
    }
  };

  const refreshProvider = async (): Promise<void> => {
    await fetchProviderData();
  };

  const value: ProviderAuthContextType = {
    provider,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    refreshProvider,
  };

  return (
    <ProviderAuthContext.Provider value={value}>
      {children}
    </ProviderAuthContext.Provider>
  );
};

export const useProviderAuth = (): ProviderAuthContextType => {
  const context = useContext(ProviderAuthContext);
  if (context === undefined) {
    throw new Error('useProviderAuth must be used within a ProviderAuthProvider');
  }
  return context;
};

export default ProviderAuthContext;