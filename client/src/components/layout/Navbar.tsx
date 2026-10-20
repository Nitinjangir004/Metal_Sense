import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
  FlaskConical,
  Sparkles,
  ChevronDown,
  BookOpen,
  LogOut,
  Settings,
  Check,
  Building,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/AuthContext';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === '/';
  const { user, activeWorkspace, workspaces, userRole, isAuthenticated, logout, switchWorkspace } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isWsMenuOpen, setIsWsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-inset bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Logo */}
        <div className="flex items-center gap-4">
          {!isLandingPage && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden -ml-1.5 p-2 text-body hover:text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-900 rounded-full"
              aria-label="Toggle navigation menu"
            >
              <Layers className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-900 shadow-sm group-hover:bg-forest-700 transition-colors">
              <FlaskConical className="h-4 w-4 text-page" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-title flex items-center gap-1 text-base sm:text-lg">
                Metal <span className="text-forest-600">Sense</span>
              </span>
              <span className="text-[10px] text-caption tracking-wider uppercase -mt-1 hidden sm:inline font-bold">
                Heavy Metal Pollution Intelligence
              </span>
            </div>
          </Link>

          {/* Active Workspace Switcher Dropdown (Authenticated) */}
          {isAuthenticated && activeWorkspace && (
            <div className="relative hidden md:block ml-4 pl-4 border-l border-inset">
              <button
                type="button"
                onClick={() => setIsWsMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-raised border border-inset hover:bg-inset/50 transition-all text-xs font-semibold text-forest-900"
              >
                <Building className="w-3.5 h-3.5 text-forest-500" />
                <span className="max-w-[160px] truncate">{activeWorkspace.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-caption" />
              </button>

              {isWsMenuOpen && (
                <div className="absolute left-4 mt-2 w-64 rounded-[20px] border border-inset bg-card p-2 shadow-xl z-50 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-caption">
                    Your Workspaces
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        switchWorkspace(ws.id);
                        setIsWsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-full hover:bg-raised text-left text-title"
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === activeWorkspace.id && <Check className="w-4 h-4 text-status-safe" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center/Right Navigation Actions */}
        <div className="flex items-center gap-3">
          <Link to="/methodology">
            <button className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-body hover:text-forest-900 hover:bg-inset/40 transition-all cursor-pointer">
              <BookOpen className="w-3.5 h-3.5 text-forest-500" />
              <span>Scientific Methodology</span>
            </button>
          </Link>

          {isLandingPage ? (
            <div className="flex items-center gap-2.5">
              {isAuthenticated ? (
                <Link to="/app">
                  <button className="py-2 px-5 rounded-full bg-forest-900 hover:bg-forest-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer">
                    Go to Workspace &rarr;
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <button className="py-2 px-4 rounded-full text-xs font-semibold text-forest-900 hover:bg-inset/50 transition-all cursor-pointer">
                      Sign In
                    </button>
                  </Link>
                  <Link to="/signup">
                    <button className="py-2 px-5 rounded-full bg-forest-900 hover:bg-forest-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
                      <Sparkles className="w-3.5 h-3.5 text-page" />
                      <span>Get Started Free</span>
                    </button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* User Avatar / Profile Dropdown */}
              <div className="relative pl-2">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-inset/40 transition-colors focus:outline-none cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-forest-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {user ? user.name.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div className="hidden lg:flex flex-col text-left text-xs">
                    <span className="font-semibold text-title">{user?.name || 'User'}</span>
                    <span className="text-[10px] text-forest-700 uppercase font-bold tracking-wider">
                      {userRole}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-caption hidden lg:inline" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-[24px] border border-inset bg-card py-2 shadow-2xl z-50 text-xs">
                    <div className="px-4 py-2.5 border-b border-inset">
                      <div className="font-bold text-title">{user?.name}</div>
                      <div className="text-[11px] text-body truncate">{user?.email}</div>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-status-safe-bg text-status-safe font-bold text-[10px] uppercase">
                          Role: {userRole}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/app/settings"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-title hover:bg-raised flex items-center gap-2 transition-colors font-medium"
                    >
                      <Settings className="w-4 h-4 text-forest-500" />
                      <span>Workspace & Account Settings</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-status-critical hover:bg-status-critical-bg flex items-center gap-2 transition-colors font-medium cursor-pointer"
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
  );
}
