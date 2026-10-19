import React from 'react';
import { Badge } from './Badge';
import { Database, FileSpreadsheet, Eye, FileText } from 'lucide-react';
import { SampleProvenance } from '@metalsense/shared';

interface ProvenanceBadgeProps {
  provenance: SampleProvenance;
  className?: string;
}

export function ProvenanceBadge({ provenance, className }: ProvenanceBadgeProps) {
  if (provenance.isDemo) {
    return (
      <Badge variant="cyan" className={className} title="Simulated laboratory reference dataset">
        <Database className="w-3 h-3 text-cyan-400 shrink-0" />
        <span>DEMO / BENCHMARK DATA</span>
      </Badge>
    );
  }

  switch (provenance.method) {
    case 'csv_import':
      return (
        <Badge variant="default" className={className} title={provenance.originalFileName}>
          <FileSpreadsheet className="w-3 h-3 text-slate-300 shrink-0" />
          <span>CSV Import</span>
        </Badge>
      );
    case 'ocr_document':
      return (
        <Badge
          variant={provenance.verifiedAt ? 'safe' : 'unverified'}
          className={className}
          title={provenance.originalFileName}
        >
          <FileText className="w-3 h-3 shrink-0" />
          <span>{provenance.verifiedAt ? 'Verified Lab PDF' : 'Candidate Extraction (Unverified)'}</span>
        </Badge>
      );
    case 'manual':
    default:
      return (
        <Badge variant="outline" className={className}>
          <Eye className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Manual Entry</span>
        </Badge>
      );
  }
}
