import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace, UserRole } from '@metalsense/shared';

interface AuthContextType {
  user: User | null;
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  userRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAsDevUser: (email: string, name: string, role?: UserRole) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default Sandbox fallback profile
const SANDBOX_USER: User = {
  id: 'usr-demo-001',
  email: 'researcher@metalsense.local',
  name: 'Dr. V. Sharma',
  avatarUrl: 'https://ui-avatars.com/api/?name=Dr+Sharma&background=0f766e&color=fff',
  createdAt: new Date().toISOString(),
};

const SANDBOX_WORKSPACE: Workspace = {
  id: 'demo-workspace',
  name: 'Delhi Aquifer Monitoring',
  slug: 'delhi-aquifer-monitoring',
  ownerId: SANDBOX_USER.id,
  members: [{ userId: SANDBOX_USER.id, role: 'owner' }],
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(SANDBOX_USER);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([SANDBOX_WORKSPACE]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(SANDBOX_WORKSPACE);
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check active session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/v1/auth/me');
        if (res.ok) {
          const json = await res.json();
          setUser(json.data.user);
          setWorkspaces(json.data.workspaces);
          if (json.data.workspaces.length > 0) {
            setActiveWorkspace(json.data.workspaces[0]);
            const role = json.data.workspaces[0].members.find(
              (m: any) => m.userId === json.data.user.id
            )?.role || 'owner';
            setUserRole(role);
          }
          setIsAuthenticated(true);
        }
      } catch (err) {
        // Fall back to sandbox demo
      }
    }
    checkSession();
  }, []);

  const loginAsDevUser = async (email: string, name: string, role: UserRole = 'owner') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      });
      if (!res.ok) throw new Error('Dev login failed');
      const json = await res.json();
      setUser(json.data.user);
      setWorkspaces(json.data.workspaces);
      if (json.data.workspaces.length > 0) {
        setActiveWorkspace(json.data.workspaces[0]);
        setUserRole(role);
      }
      setIsAuthenticated(true);
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
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Google login failed');
      }
      const json = await res.json();
      setUser(json.data.user);
      setWorkspaces(json.data.workspaces);
      if (json.data.workspaces.length > 0) {
        setActiveWorkspace(json.data.workspaces[0]);
        setUserRole('owner');
      }
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      setUser(null);
      setActiveWorkspace(null);
      setWorkspaces([]);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setActiveWorkspace(ws);
      const role = ws.members.find((m) => m.userId === user?.id)?.role || 'viewer';
      setUserRole(role);
    }
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
        loginAsDevUser,
        loginWithGoogle,
        logout,
        switchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
