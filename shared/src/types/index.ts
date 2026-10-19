// Canonical Analyte Symbols supported in MetalSense (Water & Groundwater matrix)
export type MetalSymbol =
  | 'As' // Arsenic
  | 'Cd' // Cadmium
  | 'Cr' // Chromium (Total)
  | 'Cu' // Copper
  | 'Fe' // Iron
  | 'Pb' // Lead
  | 'Mn' // Manganese
  | 'Ni' // Nickel
  | 'Zn' // Zinc
  | 'Hg' // Mercury
  | 'Al' // Aluminium
  | 'Ba' // Barium
  | 'Se'; // Selenium

export type ConcentrationUnit = 'mg/L' | 'ug/L' | 'ppm' | 'ppb';

export type MeasurementQualifier = '=' | '<' | '<=' | '>' | '>=';

export type LODHandlingStrategy =
  | 'zero' // Treat <LOD as 0
  | 'half_lod' // Treat <LOD as LOD / 2 (EPA standard heuristic)
  | 'full_lod'; // Treat <LOD as LOD (Conservative)

export type SampleMatrix = 'drinking_water' | 'groundwater' | 'surface_water';

export interface AnalyteMeasurement {
  symbol: MetalSymbol;
  name: string;
  value: number; // Raw numeric value input
  unit: ConcentrationUnit;
  qualifier: MeasurementQualifier;
  detectionLimit?: number; // Optional Limit of Detection (LOD)
  uncertainty?: number;
  sourcePage?: number; // If extracted from PDF
  confidence?: number; // 0.0 to 1.0 confidence score if AI/OCR extracted
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  accuracyMeters?: number;
}

export interface SamplingLocation {
  id: string;
  name: string;
  code: string;
  description?: string;
  coordinates?: Coordinates;
  isSensitive?: boolean; // Redacts exact GPS in viewer role
  district?: string;
  state?: string;
  country?: string;
}

export interface SampleProvenance {
  method: 'manual' | 'csv_import' | 'ocr_document' | 'demo_seed';
  originalFileName?: string;
  fileChecksum?: string;
  extractedAt?: string;
  verifiedByUserId?: string;
  verifiedAt?: string;
  isDemo?: boolean;
}

export interface Sample {
  id: string;
  workspaceId: string;
  projectId: string;
  sampleCode: string; // e.g. "GW-2026-001"
  sampleMatrix: SampleMatrix;
  collectionDate: string; // ISO 8601
  location: SamplingLocation;
  laboratory?: {
    name: string;
    accreditationNumber?: string;
    reportNumber?: string;
    analystName?: string;
  };
  measurements: AnalyteMeasurement[];
  notes?: string;
  provenance: SampleProvenance;
  createdAt: string;
  updatedAt: string;
}

// Standards & Permissible Limits Registry
export interface StandardAnalyteLimit {
  symbol: MetalSymbol;
  acceptableLimit: number; // Desirable / Ideal / Acceptable limit in standard units
  permissibleLimit: number; // Maximum allowable limit before considered unsafe
  unit: ConcentrationUnit;
  idealLimit?: number; // Ideal pure limit (often 0 or lower baseline)
  notes?: string;
}

export interface RegulatoryStandard {
  id: string;
  code: string; // e.g. "BIS_10500_2012"
  title: string;
  issuingOrganization: string; // e.g. "Bureau of Indian Standards"
  jurisdiction: 'India' | 'International_WHO' | 'USEPA' | 'EU';
  matrix: SampleMatrix;
  version: string;
  publicationYear: number;
  sourceUrl: string;
  citation: string;
  isDefault?: boolean;
  limits: Record<MetalSymbol, StandardAnalyteLimit>;
}

// Deterministic Calculation Result Interfaces
export interface SubIndexTrace {
  symbol: MetalSymbol;
  monitoredConcentration: number; // in normalized unit (ug/L or mg/L)
  acceptableLimit: number;
  permissibleLimit: number;
  unitWeight: number; // Wi
  subIndex: number; // Qi
  weightedSubIndex: number; // Wi * Qi
  status: 'within_acceptable' | 'within_permissible' | 'exceeds_permissible' | 'not_evaluated';
  notes?: string;
}

export interface HpiResult {
  value: number;
  classification: 'low' | 'medium' | 'high'; // Standard Prasad & Bose thresholds: <25 low, 25-50 med, >50-100 high, >100 critical
  thresholdValue: number; // Standard 100
  traces: SubIndexTrace[];
  sumWi: number;
  sumWiQi: number;
  evaluatedAnalytesCount: number;
  missingAnalytes: MetalSymbol[];
}

export interface HeiResult {
  value: number;
  classification: 'low' | 'medium' | 'high'; // Edet & Offiong: <10 low, 10-20 medium, >20 high
  traces: {
    symbol: MetalSymbol;
    monitoredConcentration: number;
    mac: number; // Maximum Admissible Concentration
    ratio: number; // Hc / Hmac
  }[];
  evaluatedAnalytesCount: number;
}

export interface CdResult {
  value: number;
  classification: 'low' | 'medium' | 'high'; // Backman: <1 low, 1-3 medium, >3 high
  traces: {
    symbol: MetalSymbol;
    monitoredConcentration: number;
    baselineLimit: number;
    contaminationFactor: number; // Cfi = (CAi / CNi) - 1
  }[];
  evaluatedAnalytesCount: number;
}

export interface AnalysisRun {
  id: string;
  sampleId: string;
  workspaceId: string;
  timestamp: string;
  calculationVersion: string;
  standardUsed: {
    code: string;
    version: string;
    citation: string;
  };
  lodStrategy: LODHandlingStrategy;
  normalizedUnit: ConcentrationUnit;
  hpi: HpiResult;
  hei: HeiResult;
  cd: CdResult;
  overallPollutionCategory: 'Low Pollution' | 'Moderate Pollution' | 'High Pollution' | 'Critical Pollution';
  exceededAnalytes: {
    symbol: MetalSymbol;
    monitored: number;
    permissible: number;
    ratio: number;
  }[];
  auditTrail: {
    formulaVersion: string;
    calculatedAt: string;
    engineVersion: string;
  };
}

// User, Workspace & Multi-tenancy
export type UserRole = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: {
    userId: string;
    role: UserRole;
  }[];
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
}
