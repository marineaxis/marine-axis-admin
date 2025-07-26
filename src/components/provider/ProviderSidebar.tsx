// Provider sidebar navigation
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Package, 
  Image, 
  BarChart3, 
  FileText, 
  Settings,
  Waves,
  LogOut
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useProviderAuth } from '../../context/ProviderAuthContext';

const navigation = [
  { name: 'Dashboard', href: '/provider/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/provider/profile', icon: User },
  { name: 'Listings', href: '/provider/listings', icon: Package },
  { name: 'Photos', href: '/provider/photos', icon: Image },
  { name: 'Analytics', href: '/provider/analytics', icon: BarChart3 },
  { name: 'Documents', href: '/provider/documents', icon: FileText },
  { name: 'Settings', href: '/provider/settings', icon: Settings },
];

export function ProviderSidebar() {
  const location = useLocation();
  const { logout, provider } = useProviderAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Marine-Axis</h2>
            <p className="text-xs text-muted-foreground">Provider Portal</p>
          </div>
        </div>
      </div>

      {/* Provider Info */}
      <div className="p-4 border-b border-border">
        <div className="text-sm">
          <p className="font-medium truncate">{provider?.name}</p>
          <p className="text-muted-foreground truncate">{provider?.email}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default ProviderSidebar;