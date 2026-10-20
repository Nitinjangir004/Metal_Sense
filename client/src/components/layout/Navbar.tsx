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
    <header className="sticky top-0 z-40 w-full border-b border-[#DFEADD] bg-[#ECF5EB]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Logo */}
        <div className="flex items-center gap-4">
          {!isLandingPage && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden -ml-1.5 p-2 text-[#4B5F54] hover:text-[#002F18] focus:outline-none focus:ring-2 focus:ring-[#002F18] rounded-full"
              aria-label="Toggle navigation menu"
            >
              <Layers className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#002F18] shadow-sm group-hover:bg-[#0B4A2C] transition-colors">
              <FlaskConical className="h-4 w-4 text-[#E9F4EA]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-[#0F1F17] flex items-center gap-1 text-base sm:text-lg">
                Metal<span className="text-[#2E7D55]">Sense</span>
              </span>
              <span className="text-[10px] text-[#7C8F84] tracking-wider uppercase -mt-1 hidden sm:inline font-medium">
                Pollution Intelligence
              </span>
            </div>
          </Link>

          {/* Active Workspace Switcher Dropdown (Authenticated) */}
          {isAuthenticated && activeWorkspace && (
            <div className="relative hidden md:block ml-4 pl-4 border-l border-[#DFEADD]">
              <button
                type="button"
                onClick={() => setIsWsMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] hover:bg-[#DFEADD]/50 transition-all text-xs font-semibold text-[#002F18]"
              >
                <Building className="w-3.5 h-3.5 text-[#2E7D55]" />
                <span className="max-w-[160px] truncate">{activeWorkspace.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#7C8F84]" />
              </button>

              {isWsMenuOpen && (
                <div className="absolute left-4 mt-2 w-64 rounded-[20px] border border-[#DFEADD] bg-[#ECF5EB] p-2 shadow-xl z-50 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7C8F84]">
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
                      className="w-full flex items-center justify-between px-3 py-2 rounded-full hover:bg-[#F0FCEF] text-left text-[#0F1F17]"
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === activeWorkspace.id && <Check className="w-4 h-4 text-[#1F8A5B]" />}
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
            <button className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#4B5F54] hover:text-[#002F18] hover:bg-[#DFEADD]/40 transition-all">
              <BookOpen className="w-3.5 h-3.5 text-[#2E7D55]" />
              <span>Scientific Methodology</span>
            </button>
          </Link>

          {isLandingPage ? (
            <div className="flex items-center gap-2.5">
              {isAuthenticated ? (
                <Link to="/app">
                  <button className="py-2 px-5 rounded-full bg-[#002F18] hover:bg-[#0B4A2C] text-white text-xs font-semibold shadow-sm transition-all">
                    Go to Workspace &rarr;
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <button className="py-2 px-4 rounded-full text-xs font-semibold text-[#002F18] hover:bg-[#DFEADD]/50 transition-all">
                      Sign In
                    </button>
                  </Link>
                  <Link to="/signup">
                    <button className="py-2 px-5 rounded-full bg-[#002F18] hover:bg-[#0B4A2C] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E9F4EA]" />
                      <span>Get Started Free</span>
                    </button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link to="/app/samples/new">
                <button className="py-2 px-4 rounded-full bg-[#002F18] hover:bg-[#0B4A2C] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>New Sample</span>
                </button>
              </Link>

              {/* User Avatar / Profile Dropdown */}
              <div className="relative pl-2 border-l border-[#DFEADD]">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-[#DFEADD]/40 transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-[#002F18] text-white flex items-center justify-center text-xs font-bold">
                    {user ? user.name.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div className="hidden lg:flex flex-col text-left text-xs">
                    <span className="font-semibold text-[#0F1F17]">{user?.name || 'User'}</span>
                    <span className="text-[10px] text-[#2E7D55] uppercase font-bold tracking-wider">
                      {userRole}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7C8F84] hidden lg:inline" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-[24px] border border-[#DFEADD] bg-[#ECF5EB] py-2 shadow-2xl z-50 text-xs">
                    <div className="px-4 py-2.5 border-b border-[#DFEADD]">
                      <div className="font-bold text-[#0F1F17]">{user?.name}</div>
                      <div className="text-[11px] text-[#4B5F54] truncate">{user?.email}</div>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#DDF3E6] text-[#1F8A5B] font-bold text-[10px] uppercase">
                          Role: {userRole}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/app/settings"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-[#0F1F17] hover:bg-[#F0FCEF] flex items-center gap-2 transition-colors font-medium"
                    >
                      <Settings className="w-4 h-4 text-[#2E7D55]" />
                      <span>Workspace & Account Settings</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-[#C2413B] hover:bg-[#FBE3E1] flex items-center gap-2 transition-colors font-medium"
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
