import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  FileSpreadsheet,
  FileSearch,
  LineChart,
  MapPin,
  Scale,
  FileCheck2,
  Settings,
  Plus,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../features/auth/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { activeWorkspace } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/app', icon: LayoutDashboard, exact: true },
    { label: 'Samples & Registry', to: '/app/samples', icon: FlaskConical },
    { label: 'Ingest & Review OCR', to: '/app/import/review', icon: FileSearch, badge: 'OCR' },
    { label: 'Analytical Trends', to: '/app/analytics', icon: LineChart },
    { label: 'Geospatial Map', to: '/app/map', icon: MapPin },
    { label: 'Standards Registry', to: '/app/standards', icon: Scale },
    { label: 'Auditable Reports', to: '/app/reports', icon: FileCheck2 },
    { label: 'Platform Settings', to: '/app/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-forest-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-inset bg-inset/50 p-4 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Workspace Identifier */}
        <div className="mb-4 rounded-[20px] border border-inset bg-card p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-caption">
            Active Workspace
          </div>
          <div className="mt-1 font-bold text-title truncate text-sm">
            {activeWorkspace?.name || 'Default Workspace'}
          </div>
          <div className="mt-1 text-[11px] text-forest-700 font-semibold">
            {activeWorkspace?.defaultStandard || 'BIS_10500_2012'}
          </div>
        </div>

        {/* Quick Add Button */}
        <div className="mb-4">
          <NavLink
            to="/app/samples/new"
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-full bg-forest-900 text-white hover:bg-forest-700 transition-all font-semibold text-xs shadow-soft cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Sample</span>
          </NavLink>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between rounded-full px-4 py-2.5 text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-forest-900 text-white shadow-soft'
                      : 'text-body hover:bg-card hover:text-title'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="safe" size="sm" className="ml-auto text-[10px] px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
