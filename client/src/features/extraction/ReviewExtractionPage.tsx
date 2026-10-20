import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { useAuth } from '../auth/AuthContext';
import { useExtractionJob, useConfirmExtraction, useUploadDocument } from '../../lib/api';
import {
  CANONICAL_METALS,
  MetalSymbol,
  ConcentrationUnit,
  MeasurementQualifier,
} from '@metalsense/shared';
import { cn } from '../../lib/utils';

interface CandidateRow {
  symbol: MetalSymbol;
  name: string;
  value: string;
  unit: ConcentrationUnit;
  qualifier: MeasurementQualifier;
  page: number;
  confidence: number;
  confirmed: boolean;
}

export function ReviewExtractionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;
  const jobId = searchParams.get('jobId');

  const { data: jobData, isLoading: jobLoading } = useExtractionJob(
    workspaceId,
    jobId || undefined
  );
  const confirmMutation = useConfirmExtraction(workspaceId);
  const uploadDocMutation = useUploadDocument(workspaceId);

  const [documentName, setDocumentName] = useState('');
  const [labName, setLabName] = useState('');
  const [sampleCode, setSampleCode] = useState('');
  const [locationName, setLocationName] = useState('');
  const [district, setDistrict] = useState('');
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().substring(0, 16)
  );
  const [sampleMatrix, setSampleMatrix] = useState<
    'groundwater' | 'drinking_water' | 'surface_water'
  >('groundwater');

  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Sync data when job arrives
  useEffect(() => {
    if (jobData) {
      setDocumentName(jobData.originalFileName || 'Uploaded_Report.pdf');
      const prop = jobData.proposedData;
      if (prop) {
        if (prop.sampleCode) setSampleCode(prop.sampleCode);
        if (prop.laboratoryName) setLabName(prop.laboratoryName);
        if (prop.locationName) setLocationName(prop.locationName);
        if (prop.district) setDistrict(prop.district);
        if (prop.sampleMatrix) setSampleMatrix(prop.sampleMatrix);
        if (prop.collectionDate) {
          try {
            setCollectionDate(new Date(prop.collectionDate).toISOString().substring(0, 16));
          } catch {}
        }

        if (Array.isArray(prop.analytes)) {
          setCandidates(
            prop.analytes.map((a: any) => ({
              symbol: a.symbol,
              name: a.name || CANONICAL_METALS[a.symbol as MetalSymbol]?.name || a.symbol,
              value: String(a.value),
              unit: a.unit || 'mg/L',
              qualifier: a.qualifier || '=',
              page: a.sourcePage || 1,
              confidence: a.confidence || 0.9,
              confirmed: true,
            }))
          );
        }
      }
    }
  }, [jobData]);

  const handleToggleConfirm = (index: number) => {
    const updated = [...candidates];
    updated[index].confirmed = !updated[index].confirmed;
    setCandidates(updated);
  };

  const handleValueChange = (index: number, val: string) => {
    const updated = [...candidates];
    updated[index].value = val;
    setCandidates(updated);
  };

  const handleQualifierChange = (index: number, q: MeasurementQualifier) => {
    const updated = [...candidates];
    updated[index].qualifier = q;
    setCandidates(updated);
  };

  const handleAddAnalyte = () => {
    setCandidates([
      ...candidates,
      {
        symbol: 'Fe',
        name: 'Iron',
        value: '0.10',
        unit: 'mg/L',
        qualifier: '=',
        page: 1,
        confidence: 1.0,
        confirmed: true,
      },
    ]);
  };

  const handleRemoveAnalyte = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleConfirmExtraction = async () => {
    if (!jobId || !workspaceId) return;
    setFeedback(null);

    const activeAnalytes = candidates.filter((c) => c.confirmed);
    if (activeAnalytes.length === 0) {
      setFeedback({ type: 'error', message: 'Please confirm at least one analyte measurement.' });
      return;
    }

    try {
      const result = await confirmMutation.mutateAsync({
        jobId,
        data: {
          sampleCode: sampleCode || `EXT-${Date.now().toString().slice(-4)}`,
          sampleMatrix,
          collectionDate: new Date(collectionDate).toISOString(),
          locationName: locationName || 'Verified Monitoring Station',
          district: district || undefined,
          notes: `Verified OCR extraction from file: ${documentName}`,
          measurements: activeAnalytes.map((c) => ({
            symbol: c.symbol,
            name: c.name,
            value: parseFloat(c.value),
            unit: c.unit,
            qualifier: c.qualifier,
            detectionLimit: c.qualifier === '<' ? parseFloat(c.value) : undefined,
          })),
        },
      });

      navigate(`/app/samples/${result.sample.id}`);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to confirm extraction and create sample.',
      });
    }
  };

  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && workspaceId) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await uploadDocMutation.mutateAsync(formData);
        navigate(`/app/import/review?jobId=${res.jobId}`);
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'File upload failed.' });
      }
    }
  };

  if (!jobId) {
    return (
      <div className="py-8">
        <EmptyState
          icon={FileText}
          title="No Document Extraction Job Selected"
          description="Upload an environmental laboratory report certificate (PDF or image) to initiate OCR extraction with human-in-the-loop review."
          action={{
            label: 'Choose PDF / Image Certificate',
            onClick: () => {
              const el = document.getElementById('direct-cert-upload');
              el?.click();
            },
            icon: <Upload className="w-4 h-4" />,
          }}
        />
        <input
          id="direct-cert-upload"
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleDirectFileUpload}
        />
      </div>
    );
  }

  if (jobLoading) {
    return (
      <div className="max-w-4xl mx-auto p-16 text-center text-body space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-forest-700 mx-auto" />
        <h3 className="text-base font-bold text-title">Extracting Candidate Measurements...</h3>
        <p className="text-xs text-body">
          Running OCR parser and analyzing document bounding boxes.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Review &amp; Verify Document Extraction"
        workspaceName={activeWorkspace?.name}
        description={`Mandatory human verification: confirm or adjust proposed values extracted from ${documentName}.`}
        badge={<Badge variant="moderate">UNVERIFIED CANDIDATE STATE</Badge>}
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/app/samples/new">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={handleConfirmExtraction}
              disabled={confirmMutation.isPending}
              leftIcon={
                confirmMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )
              }
            >
              {confirmMutation.isPending ? 'Creating Sample...' : 'Approve & Ingest Sample'}
            </Button>
          </div>
        }
      />

      {feedback && (
        <Alert variant={feedback.type === 'success' ? 'success' : 'danger'}>
          {feedback.message}
        </Alert>
      )}

      {/* Scientific Integrity Notice */}
      <Alert variant="warning" title="Scientific Integrity Rule">
        AI and OCR engines never declare water safe or compute pollution indices directly. Review
        each candidate analyte below before confirming. Unchecked rows will be excluded.
      </Alert>

      {/* Metadata Form */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Metadata</CardTitle>
          <CardDescription>Verify laboratory, sample code, and location identifiers</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-body font-semibold mb-1.5 ml-1">Sample Code</label>
            <Input
              type="text"
              value={sampleCode}
              onChange={(e) => setSampleCode(e.target.value)}
              className="font-mono"
            />
          </div>

          <div>
            <label className="block text-body font-semibold mb-1.5 ml-1">Testing Laboratory</label>
            <Input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-body font-semibold mb-1.5 ml-1">Sampling Location</label>
            <Input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-body font-semibold mb-1.5 ml-1">District / State</label>
            <Input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Candidate Analytes Verification Table */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="p-4 border-b border-inset bg-inset/30 flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              Candidate Analyte Measurements ({candidates.length})
            </CardTitle>
            <CardDescription>
              Toggle the checkbox to accept or reject each extracted metal concentration
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddAnalyte}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Analyte
          </Button>
        </CardHeader>

        <Table>
          <TableHeader>
            <tr>
              <TableHead className="w-16">Accept</TableHead>
              <TableHead>Analyte</TableHead>
              <TableHead>Qualifier</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {candidates.map((c, idx) => (
              <TableRow
                key={idx}
                className={cn(
                  'transition-colors',
                  !c.confirmed && 'opacity-50 bg-inset/20'
                )}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={c.confirmed}
                    onChange={() => handleToggleConfirm(idx)}
                    className="w-4 h-4 rounded border-inset text-forest-900 focus:ring-forest-500 cursor-pointer accent-forest-900"
                  />
                </TableCell>
                <TableCell className="font-mono font-medium">
                  <span className="font-bold text-forest-700 mr-2">{c.symbol}</span>
                  <span className="text-title text-xs font-semibold">{c.name}</span>
                </TableCell>
                <TableCell>
                  <select
                    value={c.qualifier}
                    onChange={(e) =>
                      handleQualifierChange(idx, e.target.value as MeasurementQualifier)
                    }
                    className="rounded-full bg-raised border border-inset px-3 py-1 text-xs text-title font-mono cursor-pointer"
                  >
                    <option value="=">=</option>
                    <option value="<">&lt; (LOD)</option>
                    <option value="<=">&le;</option>
                    <option value=">">&gt;</option>
                  </select>
                </TableCell>
                <TableCell>
                  <input
                    type="number"
                    step="any"
                    value={c.value}
                    onChange={(e) => handleValueChange(idx, e.target.value)}
                    className="w-24 rounded-full bg-raised border border-inset px-3 py-1 text-xs text-title font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </TableCell>
                <TableCell className="font-mono text-body font-semibold">{c.unit}</TableCell>
                <TableCell>
                  <Badge
                    variant={c.confidence >= 0.9 ? 'safe' : 'moderate'}
                    size="sm"
                  >
                    {Math.round(c.confidence * 100)}% (p.{c.page})
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveAnalyte(idx)}
                    className="p-1.5 text-body hover:text-status-critical rounded-full hover:bg-inset transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
