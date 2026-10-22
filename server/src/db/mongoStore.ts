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
import {
  UserModel,
  WorkspaceModel,
  ProjectModel,
  SampleModel,
  AnalysisRunModel,
  ExtractionJobModel,
  AuditEventModel,
  ExtractionJob,
  AuditEvent,
} from './models/index.js';

export class MongoStore implements IStore {
  // --- User Operations ---
  async findUserById(id: string): Promise<User | null> {
    const doc = await UserModel.findOne({ id }).lean();
    if (!doc) return null;
    const { passwordHash: _, ...rest } = doc;
    return rest as User;
  }

  async findUserByEmail(email: string): Promise<(User & { passwordHash?: string }) | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!doc) return null;
    return doc as User & { passwordHash?: string };
  }

  async createUser(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { passwordHash?: string }
  ): Promise<User> {
    const now = new Date().toISOString();
    const id = `usr-${crypto.randomUUID()}`;
    const userDoc = await UserModel.create({
      id,
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      avatarUrl: data.avatarUrl,
      passwordHash: data.passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const userObj = userDoc.toObject();
    const { passwordHash: _, ...publicUser } = userObj;
    return publicUser as User;
  }

  async updateUser(
    id: string,
    updates: Partial<User> & { passwordHash?: string }
  ): Promise<User | null> {
    const now = new Date().toISOString();
    const updated = await UserModel.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: now } },
      { new: true }
    ).lean();

    if (!updated) return null;
    const { passwordHash: _, ...publicUser } = updated;
    return publicUser as User;
  }

  async deleteUser(id: string): Promise<boolean> {
    const res = await UserModel.deleteOne({ id });
    return res.deletedCount > 0;
  }

  // --- Workspace Operations ---
  async findWorkspaceById(id: string): Promise<Workspace | null> {
    const doc = await WorkspaceModel.findOne({ id }).lean();
    return doc as Workspace | null;
  }

  async findWorkspacesForUser(userId: string): Promise<Workspace[]> {
    const docs = await WorkspaceModel.find({ 'members.userId': userId }).lean();
    return docs as Workspace[];
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

    const wsId = `ws-${crypto.randomUUID()}`;
    const wsDoc = await WorkspaceModel.create({
      id: wsId,
      name: name.trim(),
      slug: `${slugBase}-${crypto.randomBytes(3).toString('hex')}`,
      ownerId,
      members: [{ userId: ownerId, role: 'owner' }],
      defaultStandard: options?.defaultStandard || 'BIS_10500_2012',
      defaultLodStrategy: options?.defaultLodStrategy || 'half_lod',
      createdAt: now,
      updatedAt: now,
    });

    // Auto-create default project for new workspace
    await this.createProject(wsId, 'Default Project', 'Primary water quality monitoring project');

    return wsDoc.toObject() as Workspace;
  }

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace | null> {
    const now = new Date().toISOString();
    const doc = await WorkspaceModel.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: now } },
      { new: true }
    ).lean();
    return doc as Workspace | null;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const res = await WorkspaceModel.deleteOne({ id });
    if (res.deletedCount > 0) {
      await Promise.all([
        ProjectModel.deleteMany({ workspaceId: id }),
        SampleModel.deleteMany({ workspaceId: id }),
        AnalysisRunModel.deleteMany({ workspaceId: id }),
        ExtractionJobModel.deleteMany({ workspaceId: id }),
        AuditEventModel.deleteMany({ workspaceId: id }),
      ]);
      return true;
    }
    return false;
  }

  async addWorkspaceMember(workspaceId: string, userId: string, role: UserRole): Promise<boolean> {
    const ws = await WorkspaceModel.findOne({ id: workspaceId });
    if (!ws) return false;

    const existingIndex = ws.members.findIndex((m) => m.userId === userId);
    if (existingIndex >= 0) {
      ws.members[existingIndex].role = role;
    } else {
      ws.members.push({ userId, role });
    }
    ws.updatedAt = new Date().toISOString();
    await ws.save();
    return true;
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const ws = await WorkspaceModel.findOne({ id: workspaceId });
    if (!ws || ws.ownerId === userId) return false;

    const initialLen = ws.members.length;
    ws.members = ws.members.filter((m) => m.userId !== userId);
    ws.updatedAt = new Date().toISOString();
    await ws.save();
    return ws.members.length < initialLen;
  }

  async getUserRoleInWorkspace(workspaceId: string, userId: string): Promise<UserRole | null> {
    const ws = await WorkspaceModel.findOne({ id: workspaceId }).lean();
    if (!ws) return null;
    const member = ws.members.find((m) => m.userId === userId);
    return member ? member.role : null;
  }

  // --- Project Operations ---
  async createProject(workspaceId: string, name: string, description?: string): Promise<Project> {
    const doc = await ProjectModel.create({
      id: `proj-${crypto.randomUUID()}`,
      workspaceId,
      name: name.trim(),
      description: description?.trim(),
      createdAt: new Date().toISOString(),
    });
    return doc.toObject() as Project;
  }

  async findProjectsByWorkspace(workspaceId: string): Promise<Project[]> {
    const docs = await ProjectModel.find({ workspaceId }).lean();
    return docs as Project[];
  }

  // --- Sample Operations ---
  async createSample(sampleData: Omit<Sample, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sample> {
    const now = new Date().toISOString();
    const doc = await SampleModel.create({
      id: `sample-${crypto.randomUUID()}`,
      ...sampleData,
      createdAt: now,
      updatedAt: now,
    });
    return doc.toObject() as Sample;
  }

  async findSamplesByWorkspace(
    workspaceId: string,
    options?: SampleFilterOptions
  ): Promise<{ samples: Sample[]; total: number }> {
    const query: Record<string, any> = { workspaceId };

    if (options?.search) {
      const q = options.search.trim();
      query.$or = [
        { sampleCode: { $regex: q, $options: 'i' } },
        { 'location.name': { $regex: q, $options: 'i' } },
        { 'location.district': { $regex: q, $options: 'i' } },
      ];
    }

    if (options?.from || options?.to) {
      query.collectionDate = {};
      if (options.from) query.collectionDate.$gte = options.from;
      if (options.to) query.collectionDate.$lte = options.to;
    }

    // Category filtering
    if (options?.category) {
      const matchingRuns = await AnalysisRunModel.find({
        workspaceId,
        'hpi.classification': options.category,
      })
        .select('sampleId')
        .lean();
      const sampleIds = matchingRuns.map((r) => r.sampleId);
      query.id = { $in: sampleIds };
    }

    const total = await SampleModel.countDocuments(query);
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const skip = (page - 1) * limit;

    const docs = await SampleModel.find(query)
      .sort({ collectionDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return { samples: docs as Sample[], total };
  }

  async findSampleById(sampleId: string): Promise<Sample | null> {
    const doc = await SampleModel.findOne({ id: sampleId }).lean();
    return doc as Sample | null;
  }

  async findSampleByCode(workspaceId: string, sampleCode: string): Promise<Sample | null> {
    const doc = await SampleModel.findOne({ workspaceId, sampleCode }).lean();
    return doc as Sample | null;
  }

  async upsertSample(
    sampleData: Omit<Sample, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ sample: Sample; isNew: boolean }> {
    const now = new Date().toISOString();
    const existing = await SampleModel.findOne({
      workspaceId: sampleData.workspaceId,
      sampleCode: sampleData.sampleCode,
    });

    if (existing) {
      const updated = await SampleModel.findOneAndUpdate(
        { id: existing.id },
        {
          $set: {
            ...sampleData,
            updatedAt: now,
          },
        },
        { new: true }
      ).lean();
      return { sample: updated as Sample, isNew: false };
    }

    try {
      const doc = await SampleModel.create({
        id: `sample-${crypto.randomUUID()}`,
        ...sampleData,
        createdAt: now,
        updatedAt: now,
      });
      return { sample: doc.toObject() as Sample, isNew: true };
    } catch (err: any) {
      // In case of concurrent write conflict on unique index (workspaceId, sampleCode)
      if (err.code === 11000 || (err.name === 'MongoServerError' && err.message?.includes('E11000'))) {
        const doc = await SampleModel.findOneAndUpdate(
          { workspaceId: sampleData.workspaceId, sampleCode: sampleData.sampleCode },
          {
            $set: {
              ...sampleData,
              updatedAt: now,
            },
          },
          { new: true }
        ).lean();
        if (doc) {
          return { sample: doc as Sample, isNew: false };
        }
      }
      throw err;
    }
  }

  async updateSample(sampleId: string, updates: Partial<Sample>): Promise<Sample | null> {
    const now = new Date().toISOString();
    const doc = await SampleModel.findOneAndUpdate(
      { id: sampleId },
      { $set: { ...updates, updatedAt: now } },
      { new: true }
    ).lean();
    return doc as Sample | null;
  }

  async deleteSample(sampleId: string): Promise<boolean> {
    const res = await SampleModel.deleteOne({ id: sampleId });
    if (res.deletedCount > 0) {
      await AnalysisRunModel.deleteMany({ sampleId });
      return true;
    }
    return false;
  }

  // --- Analysis Operations ---
  async createAnalysis(analysis: AnalysisRun): Promise<AnalysisRun> {
    const doc = await AnalysisRunModel.create(analysis);
    return doc.toObject() as AnalysisRun;
  }

  async findAnalysisById(id: string): Promise<AnalysisRun | null> {
    const doc = await AnalysisRunModel.findOne({ id }).lean();
    return doc as AnalysisRun | null;
  }

  async findAnalysesBySampleId(sampleId: string): Promise<AnalysisRun[]> {
    const docs = await AnalysisRunModel.find({ sampleId }).sort({ timestamp: -1 }).lean();
    return docs as AnalysisRun[];
  }

  async findLatestAnalysisForSample(sampleId: string): Promise<AnalysisRun | null> {
    const doc = await AnalysisRunModel.findOne({ sampleId }).sort({ timestamp: -1 }).lean();
    return doc as AnalysisRun | null;
  }

  async findLatestAnalysesForWorkspace(workspaceId: string): Promise<Map<string, AnalysisRun>> {
    const docs = await AnalysisRunModel.find({ workspaceId }).sort({ timestamp: -1 }).lean();
    const map = new Map<string, AnalysisRun>();
    for (const run of docs) {
      if (!map.has(run.sampleId)) {
        map.set(run.sampleId, run as AnalysisRun);
      }
    }
    return map;
  }

  // --- Extraction Jobs ---
  async createExtractionJob(data: Omit<ExtractionJob, 'id' | 'createdAt'>): Promise<ExtractionJob> {
    const doc = await ExtractionJobModel.create({
      id: `job-${crypto.randomUUID()}`,
      ...data,
      createdAt: new Date().toISOString(),
    });
    return doc.toObject() as ExtractionJob;
  }

  async findExtractionJobById(id: string): Promise<ExtractionJob | null> {
    const doc = await ExtractionJobModel.findOne({ id }).lean();
    return doc as ExtractionJob | null;
  }

  async updateExtractionJob(
    id: string,
    updates: Partial<ExtractionJob>
  ): Promise<ExtractionJob | null> {
    const doc = await ExtractionJobModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    ).lean();
    return doc as ExtractionJob | null;
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
    await AuditEventModel.create({
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
    const docs = await AuditEventModel.find({ workspaceId }).sort({ timestamp: -1 }).lean();
    return docs as AuditEvent[];
  }

  // --- Workspace Summary ---
  async getWorkspaceSummary(workspaceId: string): Promise<WorkspaceSummary> {
    const samples = await SampleModel.find({ workspaceId }).sort({ collectionDate: -1 }).lean();
    const latestAnalyses = await this.findLatestAnalysesForWorkspace(workspaceId);

    let criticalCount = 0;
    let moderateCount = 0;
    let safeCount = 0;
    let missingLocationCount = 0;
    const exceedanceMap: Record<string, number> = {};

    for (const sample of samples) {
      if (!sample.location?.coordinates?.latitude || !sample.location?.coordinates?.longitude) {
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

        for (const exceeded of analysis.exceededAnalytes || []) {
          exceedanceMap[exceeded.symbol] = (exceedanceMap[exceeded.symbol] || 0) + 1;
        }
      }
    }

    const topExceededMetals = Object.entries(exceedanceMap)
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const latestSamples = (samples.slice(0, 5) as Sample[]).map((sample) => ({
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
    await Promise.all([
      UserModel.deleteMany({}),
      WorkspaceModel.deleteMany({}),
      ProjectModel.deleteMany({}),
      SampleModel.deleteMany({}),
      AnalysisRunModel.deleteMany({}),
      ExtractionJobModel.deleteMany({}),
      AuditEventModel.deleteMany({}),
    ]);
  }
}
