// Provider dashboard layout
import React from 'react';
import { Outlet } from 'react-router-dom';
import { ProviderSidebar } from './ProviderSidebar';
import { ProviderHeader } from './ProviderHeader';

export function ProviderLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <ProviderSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <ProviderHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default ProviderLayout;