import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  Layers,
  FlaskConical,
  Sparkles,
  UserCheck,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Logo */}
        <div className="flex items-center gap-4">
          {!isLandingPage && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden -ml-1.5 p-2 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              <Layers className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-navy-900 border border-teal-400/40 shadow-sm shadow-teal-950 group-hover:border-teal-300 transition-colors">
              <FlaskConical className="h-5 w-5 text-teal-100 group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base sm:text-lg">
                Metal<span className="text-teal-400">Sense</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase -mt-1 hidden sm:inline">
                Heavy Metal Intelligence
              </span>
            </div>
          </Link>

          {/* Active Workspace / Sandbox Pill */}
          <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-800">
            <Badge variant="cyan" size="sm" className="font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mr-1" />
              DEMO WORKSPACE
            </Badge>
          </div>
        </div>

        {/* Center/Right Navigation Actions */}
        <div className="flex items-center gap-3">
          <Link to="/methodology">
            <Button variant="ghost" size="sm" leftIcon={<BookOpen className="w-4 h-4 text-teal-400" />}>
              <span className="hidden sm:inline">Scientific Methodology</span>
              <span className="sm:hidden">Docs</span>
            </Button>
          </Link>

          {isLandingPage ? (
            <div className="flex items-center gap-2">
              <Link to="/app">
                <Button variant="secondary" size="sm">
                  Explore Demo
                </Button>
              </Link>
              <Link to="/app/samples/new">
                <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                  Analyze a Sample
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link to="/app/samples/new">
                <Button variant="primary" size="sm" leftIcon={<FlaskConical className="w-3.5 h-3.5" />}>
                  New Sample
                </Button>
              </Link>
              {/* User Avatar / Profile Button */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-teal-900/60 border border-teal-500/50 flex items-center justify-center text-teal-200 text-xs font-semibold">
                  DR
                </div>
                <div className="hidden lg:flex flex-col text-left text-xs">
                  <span className="font-medium text-slate-200">Dr. Environmental</span>
                  <span className="text-[11px] text-slate-400">Researcher</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
