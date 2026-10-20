import {
  User,
  Workspace,
  Project,
  Sample,
  AnalysisRun,
  UserRole,
  LODHandlingStrategy,
} from '@metalsense/shared';
import { AuditEvent, ExtractionJob } from './models/index.js';

export interface SampleFilterOptions {
  search?: string;
  category?: 'low' | 'medium' | 'high';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface WorkspaceSummary {
  totalSamples: number;
  criticalCount: number;
  moderateCount: number;
  safeCount: number;
  missingLocationCount: number;
  topExceededMetals: { symbol: string; count: number }[];
  latestSamples: { sample: Sample; analysis?: AnalysisRun }[];
}

export interface IStore {
  // User Operations
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<(User & { passwordHash?: string }) | null>;
  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { passwordHash?: string }): Promise<User>;
  updateUser(id: string, updates: Partial<User> & { passwordHash?: string }): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;

  // Workspace Operations
  findWorkspaceById(id: string): Promise<Workspace | null>;
  findWorkspacesForUser(userId: string): Promise<Workspace[]>;
  createWorkspace(
    ownerId: string,
    name: string,
    options?: { defaultStandard?: string; defaultLodStrategy?: LODHandlingStrategy }
  ): Promise<Workspace>;
  updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace | null>;
  deleteWorkspace(id: string): Promise<boolean>;
  addWorkspaceMember(workspaceId: string, userId: string, role: UserRole): Promise<boolean>;
  removeWorkspaceMember(workspaceId: string, userId: string): Promise<boolean>;
  getUserRoleInWorkspace(workspaceId: string, userId: string): Promise<UserRole | null>;

  // Project Operations
  createProject(workspaceId: string, name: string, description?: string): Promise<Project>;
  findProjectsByWorkspace(workspaceId: string): Promise<Project[]>;

  // Sample Operations
  createSample(sampleData: Omit<Sample, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sample>;
  findSamplesByWorkspace(
    workspaceId: string,
    options?: SampleFilterOptions
  ): Promise<{ samples: Sample[]; total: number }>;
  findSampleById(sampleId: string): Promise<Sample | null>;
  updateSample(sampleId: string, updates: Partial<Sample>): Promise<Sample | null>;
  deleteSample(sampleId: string): Promise<boolean>;

  // Analysis Operations
  createAnalysis(analysis: AnalysisRun): Promise<AnalysisRun>;
  findAnalysisById(id: string): Promise<AnalysisRun | null>;
  findAnalysesBySampleId(sampleId: string): Promise<AnalysisRun[]>;
  findLatestAnalysisForSample(sampleId: string): Promise<AnalysisRun | null>;
  findLatestAnalysesForWorkspace(workspaceId: string): Promise<Map<string, AnalysisRun>>;

  // Extraction Job Operations
  createExtractionJob(data: Omit<ExtractionJob, 'id' | 'createdAt'>): Promise<ExtractionJob>;
  findExtractionJobById(id: string): Promise<ExtractionJob | null>;
  updateExtractionJob(id: string, updates: Partial<ExtractionJob>): Promise<ExtractionJob | null>;

  // Audit Operations
  recordAudit(
    workspaceId: string,
    userId: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, unknown>
  ): Promise<void>;
  getAuditLogs(workspaceId: string): Promise<AuditEvent[]>;

  // Workspace Summary
  getWorkspaceSummary(workspaceId: string): Promise<WorkspaceSummary>;

  // Testing Reset
  reset(): Promise<void>;
}
