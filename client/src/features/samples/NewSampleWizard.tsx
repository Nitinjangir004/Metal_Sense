import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  FileSpreadsheet,
  FileSearch,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { CANONICAL_METALS, MetalSymbol, ConcentrationUnit, MeasurementQualifier } from '@metalsense/shared';
import { useAuth } from '../auth/AuthContext';

export function NewSampleWizard() {
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id || 'demo-workspace';

  const [entryMode, setEntryMode] = useState<'manual' | 'csv' | 'document'>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Manual Form State
  const [sampleCode, setSampleCode] = useState('');
  const [locationName, setLocationName] = useState('');
  const [district, setDistrict] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().substring(0, 16)
  );
  const [sampleMatrix, setSampleMatrix] = useState('groundwater');

  // Metal rows
  const [rows, setRows] = useState<
    { symbol: MetalSymbol; value: string; unit: ConcentrationUnit; qualifier: MeasurementQualifier }[]
  >([
    { symbol: 'As', value: '0.015', unit: 'mg/L', qualifier: '=' },
    { symbol: 'Pb', value: '0.008', unit: 'mg/L', qualifier: '=' },
    { symbol: 'Cd', value: '0.001', unit: 'mg/L', qualifier: '<' },
    { symbol: 'Cr', value: '0.035', unit: 'mg/L', qualifier: '=' },
  ]);

  // CSV Upload State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploadResult, setCsvUploadResult] = useState<{
    validCount: number;
    errorCount: number;
    errors: { rowNumber: number; message: string }[];
  } | null>(null);

  // Document Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleAddRow = () => {
    setRows([...rows, { symbol: 'Fe', value: '0.2', unit: 'mg/L', qualifier: '=' }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/v1/imports/template.csv';
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        sampleCode,
        sampleMatrix,
        collectionDate: new Date(collectionDate).toISOString(),
        location: {
          id: `loc-${Date.now()}`,
          name: locationName,
          code: `LOC-${sampleCode}`,
          district: district || undefined,
          country: 'India',
          isSensitive: false,
          coordinates:
            latitude && longitude
              ? {
                  latitude: parseFloat(latitude),
                  longitude: parseFloat(longitude),
                }
              : undefined,
        },
        measurements: rows.map((r) => ({
          symbol: r.symbol,
          name: CANONICAL_METALS[r.symbol]?.name || r.symbol,
          value: parseFloat(r.value),
          unit: r.unit,
          qualifier: r.qualifier,
          detectionLimit: r.qualifier === '<' ? parseFloat(r.value) : undefined,
        })),
        provenance: {
          method: 'manual',
          isDemo: false,
        },
      };

      const res = await fetch(`/api/v1/workspaces/${workspaceId}/samples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to create sample.');
      }

      const json = await res.json();
      navigate(`/app/samples/${json.data.sample.id}`);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error creating sample' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await fetch(`/api/v1/imports/${workspaceId}/csv`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'CSV import failed');
      }

      const json = await res.json();
      setCsvUploadResult({
        validCount: json.data.validCount,
        errorCount: json.data.errorCount,
        errors: json.data.errors,
      });

      if (json.data.validCount > 0) {
        setFeedback({
          type: 'success',
          message: `Successfully ingested ${json.data.validCount} samples with deterministic calculations.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'CSV processing error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocUpload = async () => {
    if (!docFile) return;
    setUploadProgress(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('file', docFile);

    try {
      const res = await fetch(`/api/v1/imports/${workspaceId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Document extraction failed');
      }

      const json = await res.json();
      navigate(`/app/import/review?jobId=${json.data.jobId}`);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Document upload error' });
    } finally {
      setUploadProgress(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/app/samples">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Registry
          </Button>
        </Link>
        <Badge variant="cyan">STEP 1 OF 2: INGESTION</Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Add Laboratory Measurement Data
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Active Workspace: <span className="font-semibold text-teal-300">{activeWorkspace?.name}</span>
        </p>
      </div>

      {feedback && (
        <Alert variant={feedback.type === 'success' ? 'success' : 'danger'}>
          {feedback.message}
        </Alert>
      )}

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setEntryMode('manual');
            setFeedback(null);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            entryMode === 'manual'
              ? 'border-teal-500 bg-teal-950/40 text-white shadow-sm shadow-teal-950'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-900'
          }`}
        >
          <FlaskConical className="w-5 h-5 text-teal-400 mb-2" />
          <div className="font-semibold text-sm">Manual Entry</div>
          <div className="text-xs text-slate-400 mt-1">Form entry with row-level validation</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setEntryMode('csv');
            setFeedback(null);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            entryMode === 'csv'
              ? 'border-teal-500 bg-teal-950/40 text-white shadow-sm shadow-teal-950'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 text-teal-400 mb-2" />
          <div className="font-semibold text-sm">CSV Batch Import</div>
          <div className="text-xs text-slate-400 mt-1">Bulk ingest multiple sample coordinates</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setEntryMode('document');
            setFeedback(null);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            entryMode === 'document'
              ? 'border-teal-500 bg-teal-950/40 text-white shadow-sm shadow-teal-950'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-900'
          }`}
        >
          <FileSearch className="w-5 h-5 text-teal-400 mb-2" />
          <div className="font-semibold text-sm">Lab Report OCR</div>
          <div className="text-xs text-slate-400 mt-1">PDF & Image extraction with review</div>
        </button>
      </div>

      {/* Mode 1: Manual Entry */}
      {entryMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">
                Sample Metadata & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Sample Identifier / Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GW-2026-NSP-01"
                  value={sampleCode}
                  onChange={(e) => setSampleCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Sample Matrix <span className="text-rose-400">*</span>
                </label>
                <select
                  value={sampleMatrix}
                  onChange={(e) => setSampleMatrix(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                >
                  <option value="groundwater">Groundwater / Borewell</option>
                  <option value="drinking_water">Treated Drinking Water</option>
                  <option value="surface_water">Surface Water / River</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Location Name / Well Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agricultural Tubewell #5"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  District / State <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Delhi, Delhi"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Latitude (Optional)</label>
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="e.g. 28.6139"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Longitude (Optional)</label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  placeholder="e.g. 77.2090"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Analyte Concentrations Table */}
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-white">
                  Heavy Metal Concentrations
                </CardTitle>
                <CardDescription>
                  Enter measured values. For measurements below detection threshold, select qualifier '&lt;'.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Analyte Row
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80"
                  >
                    <div className="col-span-4 sm:col-span-3">
                      <select
                        value={row.symbol}
                        onChange={(e) => {
                          const updated = [...rows];
                          updated[idx].symbol = e.target.value as MetalSymbol;
                          setRows(updated);
                        }}
                        className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        {Object.keys(CANONICAL_METALS).map((sym) => (
                          <option key={sym} value={sym}>
                            {sym} — {CANONICAL_METALS[sym as keyof typeof CANONICAL_METALS].name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3 sm:col-span-2">
                      <select
                        value={row.qualifier}
                        onChange={(e) => {
                          const updated = [...rows];
                          updated[idx].qualifier = e.target.value as MeasurementQualifier;
                          setRows(updated);
                        }}
                        className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                      >
                        <option value="=">=</option>
                        <option value="<">&lt; (LOD)</option>
                        <option value="<=">&le;</option>
                      </select>
                    </div>

                    <div className="col-span-3 sm:col-span-4">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={row.value}
                        onChange={(e) => {
                          const updated = [...rows];
                          updated[idx].value = e.target.value;
                          setRows(updated);
                        }}
                        className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                        placeholder="Value"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-2">
                      <select
                        value={row.unit}
                        onChange={(e) => {
                          const updated = [...rows];
                          updated[idx].unit = e.target.value as ConcentrationUnit;
                          setRows(updated);
                        }}
                        className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                      >
                        <option value="mg/L">mg/L</option>
                        <option value="ug/L">μg/L</option>
                        <option value="ppm">ppm</option>
                        <option value="ppb">ppb</option>
                      </select>
                    </div>

                    <div className="col-span-12 sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Link to="/app/samples">
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Confirm &amp; Compute Indices
            </Button>
          </div>
        </form>
      )}

      {/* Mode 2: CSV Upload */}
      {entryMode === 'csv' && (
        <Card className="border-slate-800 bg-slate-900/80 p-8 text-center space-y-5">
          <FileSpreadsheet className="w-12 h-12 text-teal-400 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-white">Upload Laboratory CSV Matrix</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Upload multi-sample CSV files. Column names like SampleCode, Date, Latitude, and metal symbols (As, Pb, Cd) are auto-detected.
            </p>
          </div>

          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              leftIcon={<Download className="w-3.5 h-3.5 text-teal-400" />}
            >
              Download Labeled Benchmark CSV Template
            </Button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setCsvFile(e.target.files[0]);
              }
            }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-teal-500/80 rounded-xl p-8 cursor-pointer bg-slate-950/40 transition-colors"
          >
            {csvFile ? (
              <div className="space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="text-xs font-bold text-white font-mono">{csvFile.name}</div>
                <div className="text-[11px] text-slate-400">
                  {(csvFile.size / 1024).toFixed(1)} KB • Click to choose different file
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-300">Click to browse or drag and drop .csv file here</p>
                <p className="text-[11px] text-slate-500 mt-1">Maximum file size: 10 MB</p>
              </div>
            )}
          </div>

          {csvFile && (
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleCsvUpload}
                isLoading={isSubmitting}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Process &amp; Ingest CSV Samples
              </Button>
            </div>
          )}

          {csvUploadResult && (
            <div className="text-left bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-400">Valid Ingested Samples: {csvUploadResult.validCount}</span>
                <span className={csvUploadResult.errorCount > 0 ? 'text-rose-400' : 'text-slate-500'}>
                  Row Errors: {csvUploadResult.errorCount}
                </span>
              </div>

              {csvUploadResult.errors.length > 0 && (
                <div className="space-y-1 text-xs text-rose-300">
                  {csvUploadResult.errors.map((err, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-mono text-rose-400">Row {err.rowNumber}:</span>
                      <span>{err.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {csvUploadResult.validCount > 0 && (
                <div className="pt-2">
                  <Link to="/app/samples">
                    <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Ingested Samples in Registry
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Mode 3: Lab Report OCR */}
      {entryMode === 'document' && (
        <Card className="border-slate-800 bg-slate-900/80 p-8 text-center space-y-5">
          <FileSearch className="w-12 h-12 text-teal-400 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-white">Upload Lab Certificate (PDF / Scanned Image)</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Supported formats: PDF, PNG, JPEG, WebP. Our document engine proposes candidate values with page references for mandatory human verification.
            </p>
          </div>

          <input
            type="file"
            ref={docInputRef}
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setDocFile(e.target.files[0]);
              }
            }}
          />

          <div
            onClick={() => docInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-teal-500/80 rounded-xl p-8 cursor-pointer bg-slate-950/40 transition-colors"
          >
            {docFile ? (
              <div className="space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="text-xs font-bold text-white font-mono">{docFile.name}</div>
                <div className="text-[11px] text-slate-400">
                  {(docFile.size / 1024).toFixed(1)} KB • Click to choose different file
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-300">Click to browse or drag and drop PDF/image report here</p>
                <p className="text-[11px] text-slate-500 mt-1">Max 10 MB • Scanned and multi-page certificates</p>
              </div>
            )}
          </div>

          {docFile && (
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleDocUpload}
                isLoading={uploadProgress}
                leftIcon={<FileSearch className="w-4 h-4" />}
              >
                Extract Candidate Values
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
