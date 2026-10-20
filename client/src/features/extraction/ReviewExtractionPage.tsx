import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  FileCheck2,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Plus,
  Trash2,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../auth/AuthContext';
import { useExtractionJob, useConfirmExtraction, useUploadDocument } from '../../lib/api';
import {
  CANONICAL_METALS,
  MetalSymbol,
  ConcentrationUnit,
  MeasurementQualifier,
} from '@metalsense/shared';

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

  const { data: jobData, isLoading: jobLoading, isError: jobError } = useExtractionJob(
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
      <div className="max-w-3xl mx-auto p-12 text-center bg-slate-900/70 rounded-3xl border border-slate-800 space-y-6">
        <FileText className="w-16 h-16 text-slate-600 mx-auto" />
        <div>
          <h2 className="text-xl font-bold text-white">No Document Extraction Job Selected</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Upload an environmental laboratory report certificate (PDF or image) to initiate OCR extraction with human-in-the-loop review.
          </p>
        </div>

        <div className="pt-2">
          <label className="cursor-pointer">
            <Button
              variant="primary"
              size="md"
              disabled={uploadDocMutation.isPending}
              leftIcon={
                uploadDocMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Upload className="w-4 h-4" />
                )
              }
            >
              {uploadDocMutation.isPending ? 'Uploading & Extracting...' : 'Upload Lab Certificate (PDF / Image)'}
            </Button>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleDirectFileUpload}
            />
          </label>
        </div>
      </div>
    );
  }

  if (jobLoading) {
    return (
      <div className="max-w-4xl mx-auto p-16 text-center text-slate-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Extracting Candidate Measurements...</h3>
        <p className="text-xs text-slate-400">
          Running OCR parser and analyzing document bounding boxes.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Review &amp; Verify Document Extraction</span>
            <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
              UNVERIFIED CANDIDATE STATE
            </Badge>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Mandatory human verification: confirm or adjust proposed values extracted from{' '}
            <strong className="text-slate-200">{documentName}</strong>.
          </p>
        </div>

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
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Extracted Metadata</CardTitle>
          <CardDescription>Verify laboratory, sample code, and location identifiers</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Sample Code</label>
            <input
              type="text"
              value={sampleCode}
              onChange={(e) => setSampleCode(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Testing Laboratory</label>
            <input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Sampling Location</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">District / State</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Candidate Analytes Verification Table */}
      <Card className="border-slate-800 bg-slate-900/80 p-0 overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-white">
              Candidate Analyte Measurements ({candidates.length})
            </CardTitle>
            <CardDescription>
              Toggle the checkbox to accept or reject each extracted metal concentration
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAnalyte}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Analyte
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Accept</th>
                <th className="py-3 px-4 font-semibold">Analyte</th>
                <th className="py-3 px-4 font-semibold">Qualifier</th>
                <th className="py-3 px-4 font-semibold">Value</th>
                <th className="py-3 px-4 font-semibold">Unit</th>
                <th className="py-3 px-4 font-semibold">Confidence</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {candidates.map((c, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    c.confirmed ? 'bg-slate-950/30' : 'bg-slate-950/80 opacity-50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={c.confirmed}
                      onChange={() => handleToggleConfirm(idx)}
                      className="w-4 h-4 rounded border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-white">
                    <span className="font-bold text-teal-300 mr-2">{c.symbol}</span>
                    <span className="text-slate-300 text-xs">{c.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={c.qualifier}
                      onChange={(e) =>
                        handleQualifierChange(idx, e.target.value as MeasurementQualifier)
                      }
                      className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white"
                    >
                      <option value="=">=</option>
                      <option value="<">&lt; (LOD)</option>
                      <option value="<=">&le;</option>
                      <option value=">">&gt;</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="any"
                      value={c.value}
                      onChange={(e) => handleValueChange(idx, e.target.value)}
                      className="w-24 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white font-mono"
                    />
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{c.unit}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={c.confidence >= 0.9 ? 'safe' : 'moderate'}
                      size="sm"
                    >
                      {Math.round(c.confidence * 100)}% (p.{c.page})
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveAnalyte(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
