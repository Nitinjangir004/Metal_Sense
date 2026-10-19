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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../auth/AuthContext';
import { CANONICAL_METALS, MetalSymbol, ConcentrationUnit, MeasurementQualifier } from '@metalsense/shared';

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
  const workspaceId = activeWorkspace?.id || 'demo-workspace';
  const jobId = searchParams.get('jobId');

  const [documentName, setDocumentName] = useState('EnviroTech_Certificate_892.pdf');
  const [labName, setLabName] = useState('EnviroTech Analytical Labs (NABL)');
  const [sampleCode, setSampleCode] = useState('GW-IND-2026-01');
  const [locationName, setLocationName] = useState('Well #4 — Industrial Periphery');
  const [district, setDistrict] = useState('Patparganj Industrial Area');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<CandidateRow[]>([
    {
      symbol: 'As',
      name: 'Arsenic',
      value: '0.042',
      unit: 'mg/L',
      qualifier: '=',
      page: 1,
      confidence: 0.96,
      confirmed: true,
    },
    {
      symbol: 'Pb',
      name: 'Lead',
      value: '0.028',
      unit: 'mg/L',
      qualifier: '=',
      page: 1,
      confidence: 0.94,
      confirmed: true,
    },
    {
      symbol: 'Cd',
      name: 'Cadmium',
      value: '0.0045',
      unit: 'mg/L',
      qualifier: '=',
      page: 1,
      confidence: 0.88,
      confirmed: true,
    },
    {
      symbol: 'Cr',
      name: 'Chromium',
      value: '0.065',
      unit: 'mg/L',
      qualifier: '=',
      page: 1,
      confidence: 0.91,
      confirmed: true,
    },
    {
      symbol: 'Fe',
      name: 'Iron',
      value: '1.45',
      unit: 'mg/L',
      qualifier: '=',
      page: 2,
      confidence: 0.98,
      confirmed: true,
    },
    {
      symbol: 'Ni',
      name: 'Nickel',
      value: '0.035',
      unit: 'mg/L',
      qualifier: '=',
      page: 2,
      confidence: 0.82,
      confirmed: false,
    },
  ]);

  // If a live jobId is provided, poll or fetch its candidate data
  useEffect(() => {
    if (!jobId) return;

    async function fetchJob() {
      try {
        const res = await fetch(`/api/v1/imports/${workspaceId}/${jobId}`);
        if (!res.ok) return;
        const json = await res.json();
        const job = json.data;
        if (job.proposedData) {
          setDocumentName(job.originalFileName);
          if (job.proposedData.sampleCode) setSampleCode(job.proposedData.sampleCode);
          if (job.proposedData.laboratoryName) setLabName(job.proposedData.laboratoryName);
          if (job.proposedData.locationName) setLocationName(job.proposedData.locationName);
          if (job.proposedData.district) setDistrict(job.proposedData.district);

          if (job.proposedData.analytes) {
            setCandidates(
              job.proposedData.analytes.map((a: any) => ({
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
      } catch (err) {
        // Fallback to initial display
      }
    }

    fetchJob();
  }, [jobId, workspaceId]);

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

  const handleQualifierChange = (index: number, val: MeasurementQualifier) => {
    const updated = [...candidates];
    updated[index].qualifier = val;
    setCandidates(updated);
  };

  const handleUnitChange = (index: number, val: ConcentrationUnit) => {
    const updated = [...candidates];
    updated[index].unit = val;
    setCandidates(updated);
  };

  const handleConfirmAll = () => {
    setCandidates(candidates.map((c) => ({ ...c, confirmed: true })));
  };

  const handleSaveVerifiedData = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    const measurements = candidates.map((c) => ({
      symbol: c.symbol,
      name: c.name,
      value: parseFloat(c.value) || 0,
      unit: c.unit,
      qualifier: c.qualifier,
      detectionLimit: c.qualifier === '<' ? parseFloat(c.value) : undefined,
      sourcePage: c.page,
      confidence: c.confidence,
    }));

    try {
      if (jobId) {
        // Call backend confirmation endpoint
        const res = await fetch(`/api/v1/imports/${workspaceId}/${jobId}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sampleCode,
            sampleMatrix: 'groundwater',
            collectionDate: new Date().toISOString(),
            locationName,
            district,
            measurements,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || 'Failed to save confirmed sample.');
        }

        const json = await res.json();
        navigate(`/app/samples/${json.data.sample.id}`);
      } else {
        // Demo mode fallback: save directly to samples
        const res = await fetch(`/api/v1/workspaces/${workspaceId}/samples`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sampleCode,
            sampleMatrix: 'groundwater',
            collectionDate: new Date().toISOString(),
            location: {
              id: `loc-${Date.now()}`,
              name: locationName,
              code: `LOC-${sampleCode}`,
              district,
              country: 'India',
            },
            laboratory: { name: labName },
            measurements,
            provenance: {
              method: 'ocr_document',
              originalFileName: documentName,
              verifiedAt: new Date().toISOString(),
              isDemo: false,
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          navigate(`/app/samples/${json.data.sample.id}`);
        } else {
          // If demo offline, navigate to sample list
          navigate('/app/samples');
        }
      }
    } catch (err: any) {
      setFeedback(err.message || 'Error confirming extracted values.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Document Extraction Verification
            </h1>
            <Badge variant="cyan">HUMAN REVIEW REQUIRED</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Source: <span className="font-mono text-slate-300">{documentName}</span> (OCR Extraction Proposal)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleConfirmAll}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
          >
            Mark All as Confirmed
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveVerifiedData}
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Save &amp; Compute Verified Dossier
          </Button>
        </div>
      </div>

      {feedback && <Alert variant="danger">{feedback}</Alert>}

      <Alert variant="warning" title="Mandatory Scientific Integrity Rule">
        AI/OCR models produce candidate measurements, not verified scientific evidence. You must review
        every concentration, detection qualifier, and unit against the certificate before saving.
      </Alert>

      {/* Two Column Layout: Document Info + Candidate Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document Metadata & Preview Card */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Source Document Metadata</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3 text-xs">
              <div>
                <span className="text-slate-400">File Name:</span>
                <div className="font-mono text-slate-200 mt-0.5">{documentName}</div>
              </div>
              <div>
                <span className="text-slate-400">Detected Lab:</span>
                <div className="text-slate-200 mt-0.5">{labName}</div>
              </div>
              <div>
                <span className="text-slate-400">Sample Identifier:</span>
                <input
                  type="text"
                  value={sampleCode}
                  onChange={(e) => setSampleCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 mt-0.5 font-mono text-xs text-white"
                />
              </div>
              <div>
                <span className="text-slate-400">Location Name:</span>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 mt-0.5 text-xs text-white"
                />
              </div>
              <div>
                <span className="text-slate-400">District:</span>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 mt-0.5 text-xs text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4 text-center">
            <div className="border border-slate-800 bg-slate-950 rounded-lg p-6 text-xs text-slate-400">
              <Eye className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <span>Multi-Page Lab Report Preview</span>
              <p className="text-[11px] text-slate-500 mt-1">
                2 Pages Ingested • Click any row to view page reference
              </p>
            </div>
          </Card>
        </div>

        {/* Right: Candidate Values Review Table */}
        <div className="lg:col-span-8">
          <Card className="border-slate-800 bg-slate-900/90 overflow-hidden">
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white">
                  Proposed Analyte Concentrations
                </CardTitle>
                <CardDescription>
                  Verify detected numerical values, detection limits, and units. Edit directly if needed.
                </CardDescription>
              </div>
              <Badge variant="safe">
                {candidates.filter((c) => c.confirmed).length} / {candidates.length} Confirmed
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Analyte</th>
                      <th className="py-3 px-4 font-semibold">Qualifier</th>
                      <th className="py-3 px-4 font-semibold">Value</th>
                      <th className="py-3 px-4 font-semibold">Unit</th>
                      <th className="py-3 px-4 font-semibold">Confidence</th>
                      <th className="py-3 px-4 font-semibold">Page</th>
                      <th className="py-3 px-4 font-semibold text-center">Confirm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {candidates.map((cand, idx) => (
                      <tr
                        key={cand.symbol}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !cand.confirmed ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <span className="font-mono font-bold text-white">{cand.symbol}</span>
                          <span className="text-slate-400 text-xs ml-2">({cand.name})</span>
                        </td>

                        <td className="py-2.5 px-4 font-mono text-slate-300">
                          <select
                            value={cand.qualifier}
                            onChange={(e) =>
                              handleQualifierChange(idx, e.target.value as MeasurementQualifier)
                            }
                            className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white"
                          >
                            <option value="=">=</option>
                            <option value="<">&lt; (LOD)</option>
                            <option value="<=">&le;</option>
                          </select>
                        </td>

                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={cand.value}
                            onChange={(e) => handleValueChange(idx, e.target.value)}
                            className="w-24 rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                          />
                        </td>

                        <td className="py-2.5 px-4 font-mono text-slate-300">
                          <select
                            value={cand.unit}
                            onChange={(e) =>
                              handleUnitChange(idx, e.target.value as ConcentrationUnit)
                            }
                            className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white"
                          >
                            <option value="mg/L">mg/L</option>
                            <option value="ug/L">&mu;g/L</option>
                            <option value="ppm">ppm</option>
                            <option value="ppb">ppb</option>
                          </select>
                        </td>

                        <td className="py-2.5 px-4 font-mono">
                          <span
                            className={
                              cand.confidence > 0.9
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }
                          >
                            {(cand.confidence * 100).toFixed(0)}%
                          </span>
                        </td>

                        <td className="py-2.5 px-4 text-slate-400">Page {cand.page}</td>

                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleConfirm(idx)}
                            className={`p-1.5 rounded-md transition-colors ${
                              cand.confirmed
                                ? 'bg-teal-950 border border-teal-600 text-teal-300'
                                : 'bg-slate-800 text-slate-500 hover:text-white'
                            }`}
                            title={cand.confirmed ? 'Confirmed' : 'Click to confirm'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
