import crypto from 'crypto';
import {
  User,
  Workspace,
  Project,
  Sample,
  AnalysisRun,
  UserRole,
  LODHandlingStrategy,
} from '@metalsense/shared';
import {
  IStore,
  SampleFilterOptions,
  WorkspaceSummary,
} from './types.js';
import { AuditEvent, ExtractionJob } from './models/index.js';

export class MemoryStore implements IStore {
  public users: Map<string, User & { passwordHash?: string }> = new Map();
  public workspaces: Map<string, Workspace> = new Map();
  public projects: Map<string, Project> = new Map();
  public samples: Map<string, Sample> = new Map();
  public analyses: Map<string, AnalysisRun> = new Map();
  public extractionJobs: Map<string, ExtractionJob> = new Map();
  public auditLogs: AuditEvent[] = [];

  constructor() {
    // Zero hardcoded demo users or workspaces. Clean state.
  }

  // --- User Operations ---
  async findUserById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async findUserByEmail(email: string): Promise<(User & { passwordHash?: string }) | null> {
    const user = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
    return user ? { ...user } : null;
  }

  async createUser(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { passwordHash?: string }
  ): Promise<User> {
    const now = new Date().toISOString();
    const user: User & { passwordHash?: string } = {
      id: `usr-${crypto.randomUUID()}`,
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      avatarUrl: data.avatarUrl,
      passwordHash: data.passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);

    const { passwordHash: _, ...publicUser } = user;
    return publicUser;
  }

  async updateUser(
    id: string,
    updates: Partial<User> & { passwordHash?: string }
  ): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.users.set(id, user);

    const { passwordHash: _, ...publicUser } = user;
    return publicUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // --- Workspace Operations ---
  async findWorkspaceById(id: string): Promise<Workspace | null> {
    const ws = this.workspaces.get(id);
    return ws ? { ...ws } : null;
  }

  async findWorkspacesForUser(userId: string): Promise<Workspace[]> {
    return Array.from(this.workspaces.values()).filter((w) =>
      w.members.some((m) => m.userId === userId)
    );
  }

  async createWorkspace(
    ownerId: string,
    name: string,
    options?: { defaultStandard?: string; defaultLodStrategy?: LODHandlingStrategy }
  ): Promise<Workspace> {
    const now = new Date().toISOString();
    const slugBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'workspace';

    const ws: Workspace = {
      id: `ws-${crypto.randomUUID()}`,
      name: name.trim(),
      slug: `${slugBase}-${crypto.randomBytes(3).toString('hex')}`,
      ownerId,
      members: [{ userId: ownerId, role: 'owner' }],
      defaultStandard: options?.defaultStandard || 'BIS_10500_2012',
      defaultLodStrategy: options?.defaultLodStrategy || 'half_lod',
      createdAt: now,
      updatedAt: now,
    };
    this.workspaces.set(ws.id, ws);

    // Auto-create default project for new workspace
    await this.createProject(ws.id, 'Default Project', 'Primary water quality monitoring project');

    return ws;
  }

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace | null> {
    const ws = this.workspaces.get(id);
    if (!ws) return null;
    Object.assign(ws, updates, { updatedAt: new Date().toISOString() });
    this.workspaces.set(id, ws);
    return { ...ws };
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const existed = this.workspaces.delete(id);
    if (existed) {
      // Cascade delete projects, samples, analyses, jobs
      for (const [sId, s] of Array.from(this.samples.entries())) {
        if (s.workspaceId === id) {
          this.samples.delete(sId);
        }
      }
      for (const [pId, p] of Array.from(this.projects.entries())) {
        if (p.workspaceId === id) {
          this.projects.delete(pId);
        }
      }
      for (const [aId, a] of Array.from(this.analyses.entries())) {
        if (a.workspaceId === id) {
          this.analyses.delete(aId);
        }
      }
    }
    return existed;
  }

  async addWorkspaceMember(workspaceId: string, userId: string, role: UserRole): Promise<boolean> {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return false;
    const existing = ws.members.find((m) => m.userId === userId);
    if (existing) {
      existing.role = role;
    } else {
      ws.members.push({ userId, role });
    }
    ws.updatedAt = new Date().toISOString();
    return true;
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return false;
    // Cannot remove owner
    if (ws.ownerId === userId) return false;
    const initialLen = ws.members.length;
    ws.members = ws.members.filter((m) => m.userId !== userId);
    ws.updatedAt = new Date().toISOString();
    return ws.members.length < initialLen;
  }

  async getUserRoleInWorkspace(workspaceId: string, userId: string): Promise<UserRole | null> {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) return null;
    const member = ws.members.find((m) => m.userId === userId);
    return member ? member.role : null;
  }

  // --- Project Operations ---
  async createProject(workspaceId: string, name: string, description?: string): Promise<Project> {
    const proj: Project = {
      id: `proj-${crypto.randomUUID()}`,
      workspaceId,
      name: name.trim(),
      description: description?.trim(),
      createdAt: new Date().toISOString(),
    };
    this.projects.set(proj.id, proj);
    return proj;
  }

  async findProjectsByWorkspace(workspaceId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter((p) => p.workspaceId === workspaceId);
  }

  // --- Sample Operations ---
  async createSample(sampleData: Omit<Sample, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sample> {
    const now = new Date().toISOString();
    const sample: Sample = {
      id: `sample-${crypto.randomUUID()}`,
      ...sampleData,
      createdAt: now,
      updatedAt: now,
    };
    this.samples.set(sample.id, sample);
    return sample;
  }

  async findSamplesByWorkspace(
    workspaceId: string,
    options?: SampleFilterOptions
  ): Promise<{ samples: Sample[]; total: number }> {
    let list = Array.from(this.samples.values()).filter((s) => s.workspaceId === workspaceId);

    // Apply search filter (code or location name)
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.sampleCode.toLowerCase().includes(q) ||
          s.location.name.toLowerCase().includes(q) ||
          (s.location.district && s.location.district.toLowerCase().includes(q))
      );
    }

    // Apply date range filter
    if (options?.from) {
      list = list.filter((s) => s.collectionDate >= options.from!);
    }
    if (options?.to) {
      list = list.filter((s) => s.collectionDate <= options.to!);
    }

    // Apply category filter (via latest analysis)
    if (options?.category) {
      list = list.filter((s) => {
        const analyses = Array.from(this.analyses.values())
          .filter((a) => a.sampleId === s.id)
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        const latest = analyses[0];
        return latest ? latest.hpi.classification === options.category : false;
      });
    }

    // Sort by collectionDate descending by default
    list.sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));

    const total = list.length;
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);

    return { samples: paginated, total };
  }

  async findSampleById(sampleId: string): Promise<Sample | null> {
    const sample = this.samples.get(sampleId);
    return sample ? { ...sample } : null;
  }

  async findSampleByCode(workspaceId: string, sampleCode: string): Promise<Sample | null> {
    const targetCode = sampleCode.trim().toLowerCase();
    const found = Array.from(this.samples.values()).find(
      (s) => s.workspaceId === workspaceId && s.sampleCode.trim().toLowerCase() === targetCode
    );
    return found ? { ...found } : null;
  }

  async upsertSample(
    sampleData: Omit<Sample, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ sample: Sample; isNew: boolean }> {
    const existing = await this.findSampleByCode(sampleData.workspaceId, sampleData.sampleCode);
    if (existing) {
      const updated = await this.updateSample(existing.id, sampleData);
      return { sample: updated!, isNew: false };
    }
    const created = await this.createSample(sampleData);
    return { sample: created, isNew: true };
  }

  async updateSample(sampleId: string, updates: Partial<Sample>): Promise<Sample | null> {
    const sample = this.samples.get(sampleId);
    if (!sample) return null;
    Object.assign(sample, updates, { updatedAt: new Date().toISOString() });
    this.samples.set(sampleId, sample);
    return { ...sample };
  }

  async deleteSample(sampleId: string): Promise<boolean> {
    const existed = this.samples.delete(sampleId);
    if (existed) {
      // Remove analyses for this sample
      for (const [aId, a] of Array.from(this.analyses.entries())) {
        if (a.sampleId === sampleId) {
          this.analyses.delete(aId);
        }
      }
    }
    return existed;
  }

  // --- Analysis Operations ---
  async createAnalysis(analysis: AnalysisRun): Promise<AnalysisRun> {
    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  async findAnalysisById(id: string): Promise<AnalysisRun | null> {
    const analysis = this.analyses.get(id);
    return analysis ? { ...analysis } : null;
  }

  async findAnalysesBySampleId(sampleId: string): Promise<AnalysisRun[]> {
    return Array.from(this.analyses.values())
      .filter((a) => a.sampleId === sampleId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async findLatestAnalysisForSample(sampleId: string): Promise<AnalysisRun | null> {
    const runs = await this.findAnalysesBySampleId(sampleId);
    return runs[0] || null;
  }

  async findLatestAnalysesForWorkspace(workspaceId: string): Promise<Map<string, AnalysisRun>> {
    const map = new Map<string, AnalysisRun>();
    const runs = Array.from(this.analyses.values())
      .filter((a) => a.workspaceId === workspaceId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    for (const run of runs) {
      if (!map.has(run.sampleId)) {
        map.set(run.sampleId, run);
      }
    }
    return map;
  }

  // --- Extraction Jobs ---
  async createExtractionJob(data: Omit<ExtractionJob, 'id' | 'createdAt'>): Promise<ExtractionJob> {
    const job: ExtractionJob = {
      id: `job-${crypto.randomUUID()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.extractionJobs.set(job.id, job);
    return job;
  }

  async findExtractionJobById(id: string): Promise<ExtractionJob | null> {
    const job = this.extractionJobs.get(id);
    return job ? { ...job } : null;
  }

  async updateExtractionJob(
    id: string,
    updates: Partial<ExtractionJob>
  ): Promise<ExtractionJob | null> {
    const job = this.extractionJobs.get(id);
    if (!job) return null;
    Object.assign(job, updates);
    this.extractionJobs.set(id, job);
    return { ...job };
  }

  // --- Audit Operations ---
  async recordAudit(
    workspaceId: string,
    userId: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
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

  async getAuditLogs(workspaceId: string): Promise<AuditEvent[]> {
    return this.auditLogs
      .filter((a) => a.workspaceId === workspaceId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  // --- Workspace Summary ---
  async getWorkspaceSummary(workspaceId: string): Promise<WorkspaceSummary> {
    const samples = Array.from(this.samples.values())
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));

    const latestAnalyses = await this.findLatestAnalysesForWorkspace(workspaceId);

    let criticalCount = 0;
    let moderateCount = 0;
    let safeCount = 0;
    let missingLocationCount = 0;
    const exceedanceMap: Record<string, number> = {};

    for (const sample of samples) {
      if (!sample.location.coordinates?.latitude || !sample.location.coordinates?.longitude) {
        missingLocationCount++;
      }

      const analysis = latestAnalyses.get(sample.id);
      if (analysis) {
        if (analysis.hpi.classification === 'high') {
          criticalCount++;
        } else if (analysis.hpi.classification === 'medium') {
          moderateCount++;
        } else {
          safeCount++;
        }

        for (const exceeded of analysis.exceededAnalytes) {
          exceedanceMap[exceeded.symbol] = (exceedanceMap[exceeded.symbol] || 0) + 1;
        }
      }
    }

    const topExceededMetals = Object.entries(exceedanceMap)
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const latestSamples = samples.slice(0, 5).map((sample) => ({
      sample,
      analysis: latestAnalyses.get(sample.id),
    }));

    return {
      totalSamples: samples.length,
      criticalCount,
      moderateCount,
      safeCount,
      missingLocationCount,
      topExceededMetals,
      latestSamples,
    };
  }

  // --- Testing Reset ---
  async reset(): Promise<void> {
    this.users.clear();
    this.workspaces.clear();
    this.projects.clear();
    this.samples.clear();
    this.analyses.clear();
    this.extractionJobs.clear();
    this.auditLogs = [];
  }
}
