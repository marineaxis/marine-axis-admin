// Sidebar component for Marine-Axis Admin Panel
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Tags,
  FileText,
  CheckSquare,
  Mail,
  Settings,
  BarChart3,
  Shield,
  Waves,
  ChevronDown,
  User,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../lib/constants';

const navigationItems = [
  {
    title: 'Dashboard',
    url: ROUTES.DASHBOARD,
    roles: ['superadmin', 'admin'],
    roles: ['super_admin', 'admin'],
  },
  {
    title: 'Admin Management',
    icon: Shield,
    roles: ['super_admin'],
    children: [
      {
        title: 'All Admins',
        url: ROUTES.ADMINS,
        icon: Users,
      },
      {
        title: 'Create Admin',
        url: ROUTES.ADMIN_CREATE,
        icon: User,
      },
    ],
  },
  {
    title: 'Provider Management',
    icon: Building2,
    roles: ['superadmin', 'admin'],
    children: [
      {
        title: 'All Providers',
        url: ROUTES.PROVIDERS,
        icon: Building2,
      },
      {
        title: 'Create Provider',
        url: ROUTES.PROVIDER_CREATE,
        icon: User,
      },
    ],
  },
  {
    title: 'Job Management',
    icon: Briefcase,
    roles: ['superadmin', 'admin'],
    children: [
      {
        title: 'All Jobs',
        url: ROUTES.JOBS,
        icon: Briefcase,
      },
      {
        title: 'Create Job',
        url: ROUTES.JOB_CREATE,
        icon: User,
      },
    ],
  },
  {
    title: 'Categories',
    url: ROUTES.CATEGORIES,
    icon: Tags, // Assuming Tags is a Lucide icon
    roles: ['superadmin', 'admin'],
  },
  {
    title: 'Blog Management',
    icon: FileText,
    roles: ['superadmin', 'admin'],
    children: [
      {
        title: 'All Blogs',
        url: ROUTES.BLOGS,
        icon: FileText,
      }, // Assuming FileText is a Lucide icon
      {
        title: 'Create Blog',
        url: ROUTES.BLOG_CREATE,
        icon: User,
      },
    ],
  },
  {
    title: 'Approvals',
    url: ROUTES.APPROVALS,
    icon: CheckSquare, // Assuming CheckSquare is a Lucide icon
    roles: ['superadmin', 'admin'],
  },
  {
    title: 'Email Templates',
    url: ROUTES.EMAIL_TEMPLATES,
    icon: Mail, // Assuming Mail is a Lucide icon
    roles: ['superadmin', 'admin'],
  },
  {
    title: 'Analytics',
    url: ROUTES.ANALYTICS,
    icon: BarChart3, // Assuming BarChart3 is a Lucide icon
    roles: ['superadmin', 'admin'],
  },
  {
    title: 'Settings',
    icon: Settings,
    roles: ['super_admin'],
    children: [
      {
        title: 'General',
        url: ROUTES.SETTINGS_GENERAL,
        icon: Settings,
      },
      {
        title: 'Security',
        url: ROUTES.SETTINGS_SECURITY,
        icon: Shield,
      },
      {
        title: 'Email',
        url: ROUTES.SETTINGS_EMAIL,
        icon: Mail,
      },
      {
        title: 'Compliance',
        url: ROUTES.SETTINGS_COMPLIANCE,
        icon: FileText,
      },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { canAccess, hasRole } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isGroupActive = (children: any[]) => {
    return children.some(child => isActive(child.url));
  };

  const getNavClassName = (isActiveLink: boolean) => {
    return isActiveLink 
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
      : 'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground';
  };

  const filterNavigationByRole = (items: typeof navigationItems) => {
    return items.filter(item => {
      if (item.roles) {
        return item.roles.some(role => hasRole(role as any));
      }
      return true;
    });
  };

  const filteredNavigation = filterNavigationByRole(navigationItems);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <SidebarGroup>
          <div className="flex items-center px-4 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Waves className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-lg font-bold text-sidebar-foreground">Marine-Axis</h1>
                  <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
                </div>
              )}
            </div>
          </div>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => {
                if (item.children) {
                  return (
                    <Collapsible
                      key={item.title}
                      defaultOpen={isGroupActive(item.children)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton 
                            className={getNavClassName(isGroupActive(item.children))}
                          >
                            <item.icon className="mr-2 h-4 w-4" />
                            {!collapsed && (
                              <>
                                <span className="flex-1">{item.title}</span>
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!collapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.title}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink 
                                      to={child.url} 
                                      className={({ isActive }) => getNavClassName(isActive)}
                                    >
                                      <child.icon className="mr-2 h-4 w-4" />
                                      <span>{child.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => getNavClassName(isActive)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;