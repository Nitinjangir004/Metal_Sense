import mongoose, { Schema, Document } from 'mongoose';
import {
  User,
  Workspace,
  Project,
  Sample,
  AnalysisRun,
  UserRole,
  SampleMatrix,
  ConcentrationUnit,
  MeasurementQualifier,
  LODHandlingStrategy,
} from '@metalsense/shared';

// --- User Model ---
export interface UserDocument extends Document {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const UserSchema = new Schema<UserDocument>(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { _id: false, timestamps: false }
);

// --- Workspace Model ---
export interface WorkspaceDocument extends Document {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: { userId: string; role: UserRole }[];
  defaultStandard?: string;
  defaultLodStrategy?: LODHandlingStrategy;
  createdAt: string;
  updatedAt: string;
}

const WorkspaceSchema = new Schema<WorkspaceDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true, index: true },
    members: [
      {
        userId: { type: String, required: true },
        role: { type: String, required: true, enum: ['owner', 'editor', 'viewer'] },
        _id: false,
      },
    ],
    defaultStandard: { type: String, default: 'BIS_10500_2012' },
    defaultLodStrategy: { type: String, default: 'half_lod' },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { _id: false, timestamps: false }
);
WorkspaceSchema.index({ 'members.userId': 1 });

// --- Project Model ---
export interface ProjectDocument extends Document {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
}

const ProjectSchema = new Schema<ProjectDocument>(
  {
    id: { type: String, required: true, unique: true },
    workspaceId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    createdAt: { type: String, required: true },
  },
  { _id: false, timestamps: false }
);

// --- Sample Model ---
export interface SampleDocument extends Document, Omit<Sample, 'id'> {
  id: string;
}

const SampleSchema = new Schema<SampleDocument>(
  {
    id: { type: String, required: true, unique: true },
    workspaceId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    sampleCode: { type: String, required: true },
    sampleMatrix: {
      type: String,
      required: true,
      enum: ['drinking_water', 'groundwater', 'surface_water'],
    },
    collectionDate: { type: String, required: true, index: true },
    location: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      code: { type: String, required: true },
      description: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
        altitudeMeters: { type: Number },
        accuracyMeters: { type: Number },
      },
      district: { type: String },
      state: { type: String },
      country: { type: String },
      isSensitive: { type: Boolean, default: false },
    },
    laboratory: {
      name: { type: String },
      accreditationNumber: { type: String },
      reportNumber: { type: String },
      analystName: { type: String },
    },
    measurements: [
      {
        symbol: { type: String, required: true },
        name: { type: String, required: true },
        value: { type: Number, required: true },
        unit: { type: String, required: true },
        qualifier: { type: String, required: true, enum: ['=', '<', '<=', '>', '>='] },
        detectionLimit: { type: Number },
        uncertainty: { type: Number },
        sourcePage: { type: Number },
        confidence: { type: Number },
        _id: false,
      },
    ],
    notes: { type: String },
    provenance: {
      method: { type: String, required: true },
      originalFileName: { type: String },
      fileChecksum: { type: String },
      extractedAt: { type: String },
      verifiedByUserId: { type: String },
      verifiedAt: { type: String },
      isDemo: { type: Boolean, default: false },
    },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { _id: false, timestamps: false }
);

SampleSchema.index({ workspaceId: 1, sampleCode: 1 }, { unique: true });
SampleSchema.index({ workspaceId: 1, collectionDate: -1 });

// --- AnalysisRun Model ---
export interface AnalysisRunDocument extends Document, Omit<AnalysisRun, 'id'> {
  id: string;
}

const AnalysisRunSchema = new Schema<AnalysisRunDocument>(
  {
    id: { type: String, required: true, unique: true },
    sampleId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    timestamp: { type: String, required: true, index: true },
    calculationVersion: { type: String, required: true },
    standardUsed: {
      code: { type: String, required: true },
      version: { type: String, required: true },
      citation: { type: String, required: true },
    },
    lodStrategy: { type: String, required: true },
    normalizedUnit: { type: String, required: true },
    hpi: { type: Schema.Types.Mixed, required: true },
    hei: { type: Schema.Types.Mixed, required: true },
    cd: { type: Schema.Types.Mixed, required: true },
    overallPollutionCategory: { type: String, required: true },
    exceededAnalytes: [{ type: Schema.Types.Mixed, _id: false }],
    auditTrail: {
      formulaVersion: { type: String, required: true },
      calculatedAt: { type: String, required: true },
      engineVersion: { type: String, required: true },
    },
  },
  { _id: false, timestamps: false }
);

AnalysisRunSchema.index({ sampleId: 1, timestamp: -1 });
AnalysisRunSchema.index({ workspaceId: 1, timestamp: -1 });

// --- ExtractionJob Model ---
export interface ExtractionJob {
  id: string;
  workspaceId: string;
  userId: string;
  originalFileName: string;
  fileKey: string;
  mimeType: string;
  sizeBytes: number;
  status: 'pending' | 'processing' | 'ready_for_review' | 'confirmed' | 'failed';
  proposedData?: any;
  error?: string;
  createdAt: string;
  confirmedAt?: string;
  createdSampleId?: string;
}

export interface ExtractionJobDocument extends Document, Omit<ExtractionJob, 'id'> {
  id: string;
}

const ExtractionJobSchema = new Schema<ExtractionJobDocument>(
  {
    id: { type: String, required: true, unique: true },
    workspaceId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    originalFileName: { type: String, required: true },
    fileKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'ready_for_review', 'confirmed', 'failed'],
    },
    proposedData: { type: Schema.Types.Mixed },
    error: { type: String },
    createdAt: { type: String, required: true },
    confirmedAt: { type: String },
    createdSampleId: { type: String },
  },
  { _id: false, timestamps: false }
);

// --- AuditEvent Model ---
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

export interface AuditEventDocument extends Document, Omit<AuditEvent, 'id'> {
  id: string;
}

const AuditEventSchema = new Schema<AuditEventDocument>(
  {
    id: { type: String, required: true, unique: true },
    workspaceId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    timestamp: { type: String, required: true, index: true },
    ipAddress: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  { _id: false, timestamps: false }
);

AuditEventSchema.index({ workspaceId: 1, timestamp: -1 });

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
export const WorkspaceModel = mongoose.model<WorkspaceDocument>('Workspace', WorkspaceSchema);
export const ProjectModel = mongoose.model<ProjectDocument>('Project', ProjectSchema);
export const SampleModel = mongoose.model<SampleDocument>('Sample', SampleSchema);
export const AnalysisRunModel = mongoose.model<AnalysisRunDocument>('AnalysisRun', AnalysisRunSchema);
export const ExtractionJobModel = mongoose.model<ExtractionJobDocument>('ExtractionJob', ExtractionJobSchema);
export const AuditEventModel = mongoose.model<AuditEventDocument>('AuditEvent', AuditEventSchema);
