import { User, Workspace, Project, Sample, AnalysisRun, UserRole } from '@metalsense/shared';
import crypto from 'crypto';

export interface AuditEvent {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
}

export class MemoryStore {
  public users: Map<string, User> = new Map();
  public workspaces: Map<string, Workspace> = new Map();
  public projects: Map<string, Project> = new Map();
  public samples: Map<string, Sample> = new Map();
  public analyses: Map<string, AnalysisRun> = new Map();
  public auditLogs: AuditEvent[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // Default Demo User
    const demoUser: User = {
      id: 'usr-demo-001',
      email: 'researcher@metalsense.local',
      name: 'Dr. V. Sharma',
      avatarUrl: 'https://ui-avatars.com/api/?name=Dr+Sharma&background=0f766e&color=fff',
      createdAt: new Date().toISOString(),
    };
    this.users.set(demoUser.id, demoUser);

    // Default Demo Workspace
    const demoWorkspace: Workspace = {
      id: 'demo-workspace',
      name: 'Delhi Aquifer Monitoring',
      slug: 'delhi-aquifer-monitoring',
      ownerId: demoUser.id,
      members: [
        {
          userId: demoUser.id,
          role: 'owner',
        },
      ],
      createdAt: new Date().toISOString(),
    };
    this.workspaces.set(demoWorkspace.id, demoWorkspace);

    // Default Project
    const demoProject: Project = {
      id: 'demo-proj-gw',
      workspaceId: demoWorkspace.id,
      name: 'Groundwater Sub-Division #2 Survey',
      description: 'Regional monitoring of heavy-metal pollution in Delhi groundwater wells',
      createdAt: new Date().toISOString(),
    };
    this.projects.set(demoProject.id, demoProject);
  }

  // User Operations
  findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(data: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      id: `usr-${crypto.randomUUID()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.users.set(user.id, user);

    // Auto-create initial personal workspace for new user
    const workspaceName = `${data.name.split(' ')[0]}'s Environmental Workspace`;
    this.createWorkspace(user.id, workspaceName);

    return user;
  }

  // Workspace Operations
  findWorkspaceById(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }

  findWorkspacesForUser(userId: string): Workspace[] {
    return Array.from(this.workspaces.values()).filter((w) =>
      w.members.some((m) => m.userId === userId)
    );
  }

  createWorkspace(ownerId: string, name: string): Workspace {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const ws: Workspace = {
      id: `ws-${crypto.randomUUID()}`,
      name,
      slug: `${slug}-${crypto.randomBytes(3).toString('hex')}`,
      ownerId,
      members: [{ userId: ownerId, role: 'owner' }],
      createdAt: new Date().toISOString(),
    };
    this.workspaces.set(ws.id, ws);

    // Create default project
    this.createProject(ws.id, 'Default Project', 'Primary water quality monitoring project');

    return ws;
  }

  addWorkspaceMember(workspaceId: string, userId: string, role: UserRole): boolean {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return false;
    const existing = ws.members.find((m) => m.userId === userId);
    if (existing) {
      existing.role = role;
    } else {
      ws.members.push({ userId, role });
    }
    return true;
  }

  getUserRoleInWorkspace(workspaceId: string, userId: string): UserRole | null {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return null;
    const member = ws.members.find((m) => m.userId === userId);
    return member ? member.role : null;
  }

  // Project Operations
  createProject(workspaceId: string, name: string, description?: string): Project {
    const proj: Project = {
      id: `proj-${crypto.randomUUID()}`,
      workspaceId,
      name,
      description,
      createdAt: new Date().toISOString(),
    };
    this.projects.set(proj.id, proj);
    return proj;
  }

  findProjectsByWorkspace(workspaceId: string): Project[] {
    return Array.from(this.projects.values()).filter((p) => p.workspaceId === workspaceId);
  }

  // Sample Operations (Tenant Scoped)
  createSample(sampleData: Omit<Sample, 'id' | 'createdAt' | 'updatedAt'>): Sample {
    const sample: Sample = {
      id: `sample-${crypto.randomUUID()}`,
      ...sampleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.samples.set(sample.id, sample);
    return sample;
  }

  findSamplesByWorkspace(workspaceId: string): Sample[] {
    return Array.from(this.samples.values()).filter((s) => s.workspaceId === workspaceId);
  }

  findSampleById(sampleId: string): Sample | undefined {
    return this.samples.get(sampleId);
  }

  // Audit Logging
  recordAudit(
    workspaceId: string,
    userId: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, unknown>
  ) {
    this.auditLogs.push({
      id: `audit-${crypto.randomUUID()}`,
      workspaceId,
      userId,
      action,
      targetType,
      targetId,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  getAuditLogs(workspaceId: string): AuditEvent[] {
    return this.auditLogs.filter((a) => a.workspaceId === workspaceId);
  }

  // Reset store for testing
  reset() {
    this.users.clear();
    this.workspaces.clear();
    this.projects.clear();
    this.samples.clear();
    this.analyses.clear();
    this.auditLogs = [];
    this.seedDefaultData();
  }
}

export const db = new MemoryStore();
