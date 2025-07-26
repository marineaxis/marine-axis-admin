// Provider authentication context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Provider } from '../types';
import { useToast } from '../hooks/use-toast';

interface ProviderAuthContextType {
  provider: Provider | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Provider>) => Promise<boolean>;
}

const ProviderAuthContext = createContext<ProviderAuthContextType | undefined>(undefined);

// Mock provider data
const MOCK_PROVIDER: Provider = {
  id: '1',
  name: 'Marine Solutions Ltd',
  email: 'contact@marinesolutions.com',
  phone: '+1-555-0101',
  location: 'Miami, FL',
  description: 'Full-service marine equipment supplier and maintenance provider.',
  services: ['Equipment Supply', 'Maintenance', 'Repair'],
  categoryIds: ['1', '2'],
  status: 'approved',
  featured: true,
  logo: undefined,
  images: [],
  website: 'https://marinesolutions.com',
  socialLinks: { linkedin: 'marinesolutions' },
  verificationDocuments: [],
  rating: 4.8,
  reviewCount: 124,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-20T00:00:00Z',
};

interface ProviderAuthProviderProps {
  children: ReactNode;
}

export const ProviderAuthProvider: React.FC<ProviderAuthProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = Boolean(provider);

  useEffect(() => {
    // Check for existing session
    const savedProvider = localStorage.getItem('provider_data');
    if (savedProvider) {
      setProvider(JSON.parse(savedProvider));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('Provider login attempt:', { email, password });
      
      // Mock authentication - accept any provider email with "password123"
      if (password === 'password123' && email.includes('@')) {
        console.log('Login successful for provider:', email);
        const mockProvider = { ...MOCK_PROVIDER, email };
        
        localStorage.setItem('provider_data', JSON.stringify(mockProvider));
        localStorage.setItem('provider_token', 'mock-provider-token');
        setProvider(mockProvider);

        toast({
          title: 'Welcome back!',
          description: `Logged in successfully`,
        });

        return true;
      } else {
        console.log('Login failed - invalid credentials:', { email, password });
        toast({
          title: 'Login failed',
          description: 'Invalid credentials. Use any email and password: password123',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login error',
        description: 'An error occurred during login',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('provider_data');
    localStorage.removeItem('provider_token');
    setProvider(null);
    window.location.href = '/provider/login';
  };

  const updateProfile = async (data: Partial<Provider>): Promise<boolean> => {
    try {
      if (!provider) return false;

      const updatedProvider = { ...provider, ...data, updatedAt: new Date().toISOString() };
      setProvider(updatedProvider);
      localStorage.setItem('provider_data', JSON.stringify(updatedProvider));

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });

      return true;
    } catch (error) {
      toast({
        title: 'Update error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
      return false;
    }
  };

  const value: ProviderAuthContextType = {
    provider,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
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