import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Workspace, UserRole, LODHandlingStrategy } from '@metalsense/shared';

interface AuthContextType {
  user: User | null;
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  userRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (
    name: string,
    email: string,
    password: string,
    workspaceName?: string,
    defaultStandard?: string,
    defaultLodStrategy?: LODHandlingStrategy
  ) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  updateActiveWorkspace: (updates: Partial<Workspace>) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const calculateRole = (ws: Workspace | null, u: User | null): UserRole => {
    if (!ws || !u) return 'viewer';
    if (ws.ownerId === u.id) return 'owner';
    const member = ws.members.find((m) => m.userId === u.id);
    return member?.role || 'viewer';
  };

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const userData: User = json.data.user;
        const wsList: Workspace[] = json.data.workspaces || [];

        setUser(userData);
        setWorkspaces(wsList);
        setIsAuthenticated(true);

        // Retain current active workspace or pick first available
        setActiveWorkspace((prev) => {
          if (prev) {
            const found = wsList.find((w) => w.id === prev.id);
            if (found) {
              setUserRole(calculateRole(found, userData));
              return found;
            }
          }
          if (wsList.length > 0) {
            setUserRole(calculateRole(wsList[0], userData));
            return wsList[0];
          }
          return null;
        });
      } else {
        setUser(null);
        setWorkspaces([]);
        setActiveWorkspace(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        throw new Error(data?.error || `Login failed (${res.status}). Please check your credentials.`);
      }
      await refreshSession();
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithEmail = async (
    name: string,
    email: string,
    password: string,
    workspaceName?: string,
    defaultStandard?: string,
    defaultLodStrategy?: LODHandlingStrategy
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
          password,
          workspaceName,
          defaultStandard,
          defaultLodStrategy,
        }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        throw new Error(data?.error || `Signup failed (${res.status}). Please try again.`);
      }
      await refreshSession();
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        throw new Error(data?.error || `Google authentication failed (${res.status}).`);
      }
      await refreshSession();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setActiveWorkspace(ws);
      setUserRole(calculateRole(ws, user));
    }
  };

  const updateActiveWorkspace = (updates: Partial<Workspace>) => {
    if (!activeWorkspace) return;
    const updated = { ...activeWorkspace, ...updates };
    setActiveWorkspace(updated);
    setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeWorkspace,
        workspaces,
        userRole,
        isAuthenticated,
        isLoading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
        switchWorkspace,
        updateActiveWorkspace,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
