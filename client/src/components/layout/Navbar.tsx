import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Layers,
  FlaskConical,
  Sparkles,
  UserCheck,
  ChevronDown,
  BookOpen,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import { SignInModal } from '../../features/auth/SignInModal';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const { user, activeWorkspace, userRole, isAuthenticated, logout } = useAuth();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <>
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
                {activeWorkspace ? activeWorkspace.name : 'DEMO WORKSPACE'}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSignInModalOpen(true)}
                  leftIcon={<Shield className="w-3.5 h-3.5 text-teal-400" />}
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/app/samples/new">
                  <Button variant="primary" size="sm" leftIcon={<FlaskConical className="w-3.5 h-3.5" />}>
                    New Sample
                  </Button>
                </Link>

                {/* User Avatar / Profile Dropdown */}
                <div className="relative pl-2 border-l border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-900 transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-900/60 border border-teal-500/50 flex items-center justify-center text-teal-200 text-xs font-semibold">
                      {user ? user.name.substring(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div className="hidden lg:flex flex-col text-left text-xs">
                      <span className="font-medium text-slate-200">
                        {user ? user.name : 'Researcher'}
                      </span>
                      <span className="text-[11px] text-teal-400 uppercase font-mono tracking-wider">
                        {userRole}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:inline" />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 py-1.5 shadow-2xl z-50 text-xs">
                      <div className="px-3 py-2 border-b border-slate-800">
                        <div className="font-semibold text-white">{user?.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                        <div className="mt-1">
                          <Badge variant="cyan" size="sm" className="uppercase font-mono text-[10px]">
                            ROLE: {userRole}
                          </Badge>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsSignInModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4 text-teal-400" />
                        <span>Switch Persona / Sign In</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-400 hover:bg-slate-800 hover:text-rose-300 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sign In & Persona Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </>
  );
}
