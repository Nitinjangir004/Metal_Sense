import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Home, Plus, FlaskConical, Settings, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const mobileNavItems = [
    { label: 'Home', to: '/app', icon: Home, exact: true },
    { label: 'Samples', to: '/app/samples', icon: FlaskConical },
    { label: 'Add', to: '/app/samples/new', icon: Plus, isAdd: true },
    { label: 'Map', to: '/app/map', icon: MapPin },
    { label: 'Settings', to: '/app/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-page text-title">
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto bg-page p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Pill Bottom Navigation for Mobile (< 768px) */}
      <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <nav className="flex items-center gap-1.5 bg-forest-900 px-3 py-2 rounded-full shadow-elevated border border-forest-700/60 backdrop-blur-md">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            if (item.isAdd) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full mx-1 shadow-sm transition-transform active:scale-95',
                    isActive
                      ? 'bg-raised text-forest-900'
                      : 'bg-forest-500 text-page hover:bg-forest-600'
                  )}
                  title="Add Sample"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-raised text-forest-900 shadow-sm'
                    : 'text-page/80 hover:text-page'
                )}
              >
                <Icon className="w-4 h-4" />
                {isActive && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
