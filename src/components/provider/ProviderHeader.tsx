// Provider header component
import React from 'react';
import { Bell, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProviderAuth } from '../../context/ProviderAuthContext';

export function ProviderHeader() {
  const { provider } = useProviderAuth();

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your listings..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Status Badge */}
        <Badge 
          variant={provider?.status === 'approved' ? 'default' : 'secondary'}
          className="capitalize"
        >
          {provider?.status}
        </Badge>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            2
          </Badge>
        </Button>

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {provider?.name?.charAt(0) || 'P'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default ProviderHeader;