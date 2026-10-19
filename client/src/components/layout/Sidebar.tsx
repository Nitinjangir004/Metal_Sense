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
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navItems = [
    { label: 'Overview', to: '/app', icon: LayoutDashboard, exact: true },
    { label: 'Samples & Registry', to: '/app/samples', icon: FlaskConical },
    { label: 'Ingest & Review OCR', to: '/app/import/review', icon: FileSearch, badge: 'AI/OCR' },
    { label: 'Analytical Comparisons', to: '/app/analytics', icon: LineChart },
    { label: 'Geospatial Map', to: '/app/map', icon: MapPin },
    { label: 'Regulatory Standards', to: '/app/standards', icon: Scale },
    { label: 'Auditable Reports', to: '/app/reports', icon: FileCheck2 },
    { label: 'Settings', to: '/app/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/80 bg-slate-950 px-4 py-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Workspace Identifier */}
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Active Workspace
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-semibold text-white truncate text-sm">
              Delhi Aquifer Monitoring
            </span>
          </div>
          <div className="mt-2 text-[11px] text-teal-400/90 font-mono">
            Groundwater Sub-Division #2
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
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
                    'group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-950/70 text-teal-300 border border-teal-800/60 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="cyan" size="sm" className="ml-auto text-[10px] px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Documentation & Scientific Integrity Link */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <NavLink
            to="/methodology"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-teal-300 py-1.5 px-2 rounded-md hover:bg-slate-900 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Mathematical Formulas</span>
            <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
          </NavLink>
          <div className="px-2 pt-1 text-[11px] text-slate-500 leading-tight">
            Deterministic Engine v1.0 • BIS 10500:2012 / WHO GDWQ
          </div>
        </div>
      </aside>
    </>
  );
}
