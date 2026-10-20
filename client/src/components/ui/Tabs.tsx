import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  description?: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  equalWidth?: boolean;
}

export function Tabs({ tabs, activeTab, onChange, className, equalWidth = false }: TabsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 p-1.5 rounded-full bg-pill-unselected border border-inset',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all select-none cursor-pointer',
              equalWidth && 'flex-1',
              isActive
                ? 'bg-forest-900 text-white shadow-soft'
                : 'text-title hover:bg-inset/60'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-forest-700 text-white' : 'bg-inset text-title'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
