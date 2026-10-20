import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  FileSpreadsheet,
  FileSearch,
  Plus,
  Trash2,
  CheckCircle2,
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
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import {
  CANONICAL_METALS,
  MetalSymbol,
  ConcentrationUnit,
  MeasurementQualifier,
} from '@metalsense/shared';
import { useAuth } from '../auth/AuthContext';
import { usePreviewCsv, useImportCsv, useUploadDocument } from '../../lib/api';
import { cn } from '../../lib/utils';

export function NewSampleWizard() {
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  const [entryMode, setEntryMode] = useState<'manual' | 'csv' | 'document'>('manual');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

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
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Metal rows
  const [rows, setRows] = useState<
    {
      symbol: MetalSymbol;
      value: string;
      unit: ConcentrationUnit;
      qualifier: MeasurementQualifier;
    }[]
  >([
    { symbol: 'As', value: '0.015', unit: 'mg/L', qualifier: '=' },
    { symbol: 'Pb', value: '0.008', unit: 'mg/L', qualifier: '=' },
    { symbol: 'Cd', value: '0.001', unit: 'mg/L', qualifier: '<' },
    { symbol: 'Cr', value: '0.035', unit: 'mg/L', qualifier: '=' },
  ]);

  // CSV State
  const [, setCsvFile] = useState<File | null>(null);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState<{
    fileName: string;
    totalRows: number;
    validCount: number;
    errorCount: number;
    samples: any[];
    errors: { rowNumber: number; sampleCode?: string; message: string }[];
    rawCsvText: string;
  } | null>(null);

  const previewCsvMutation = usePreviewCsv(workspaceId);
  const importCsvMutation = useImportCsv(workspaceId);

  // Document Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const uploadDocMutation = useUploadDocument(workspaceId);

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

  const handleProcessCsvFile = async (file: File) => {
    setCsvFile(file);
    setFeedback(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const preview = await previewCsvMutation.mutateAsync(formData);
      setCsvPreviewData(preview);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to preview CSV file.' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessCsvFile(e.target.files[0]);
    }
  };

  const handleCommitCsv = async () => {
    if (!csvPreviewData) return;
    setFeedback(null);

    try {
      const result = await importCsvMutation.mutateAsync({
        csvText: csvPreviewData.rawCsvText,
        fileName: csvPreviewData.fileName,
      });

      if (result.validCount > 0) {
        navigate('/app/samples');
      } else {
        setFeedback({
          type: 'error',
          message: 'No valid samples could be imported. Please verify row format.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to import CSV samples.' });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    setIsSubmittingManual(true);
    setFeedback(null);

    try {
      const measurements = rows.map((r) => ({
        symbol: r.symbol,
        name: CANONICAL_METALS[r.symbol]?.name || r.symbol,
        value: parseFloat(r.value),
        unit: r.unit,
        qualifier: r.qualifier,
      }));

      const payload = {
        workspaceId,
        projectId: 'proj-default',
        sampleCode: sampleCode.trim(),
        sampleMatrix,
        collectionDate: new Date(collectionDate).toISOString(),
        location: {
          id: `loc-${Date.now()}`,
          name: locationName.trim(),
          code: sampleCode.trim(),
          coordinates:
            latitude && longitude
              ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
              : undefined,
          district: district.trim(),
        },
        measurements,
        provenance: {
          method: 'manual' as const,
          isDemo: false,
        },
      };

      const res = await fetch(`/api/v1/workspaces/${workspaceId}/samples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save sample');
      }

      const data = await res.json();
      navigate(`/app/samples/${data.data.sample.id}`);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Submission failed' });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleDocUpload = async () => {
    if (!docFile || !workspaceId) return;
    setFeedback(null);

    const formData = new FormData();
    formData.append('file', docFile);

    try {
      const result = await uploadDocMutation.mutateAsync(formData);
      navigate(`/app/import/review?jobId=${result.jobId}`);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Document upload failed' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Add Laboratory Measurement Data"
        workspaceName={activeWorkspace?.name}
        description="Ingest chemical measurements via single-point entry, batch CSV dataset, or multimodal lab certificate extraction."
        badge={<Badge variant="cyan">INGESTION</Badge>}
        actions={
          <Link to="/app/samples">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Registry
            </Button>
          </Link>
        }
      />

      {feedback && (
        <Alert variant={feedback.type === 'success' ? 'success' : 'danger'}>
          {feedback.message}
        </Alert>
      )}

      {/* Mode Switcher: 3 Equal Pill Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setEntryMode('manual');
            setFeedback(null);
          }}
          className={cn(
            'p-4 rounded-[28px] border text-left transition-all cursor-pointer',
            entryMode === 'manual'
              ? 'border-forest-900 bg-forest-900 text-white shadow-soft'
              : 'border-inset bg-pill-unselected text-title hover:bg-inset'
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <FlaskConical
              className={cn(
                'w-4 h-4',
                entryMode === 'manual' ? 'text-page' : 'text-forest-700'
              )}
            />
            <span className="font-bold text-sm">Manual Entry</span>
          </div>
          <p
            className={cn(
              'text-xs leading-relaxed',
              entryMode === 'manual' ? 'text-page/80' : 'text-body'
            )}
          >
            Single sample form with live scientific validation
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setEntryMode('csv');
            setFeedback(null);
          }}
          className={cn(
            'p-4 rounded-[28px] border text-left transition-all cursor-pointer',
            entryMode === 'csv'
              ? 'border-forest-900 bg-forest-900 text-white shadow-soft'
              : 'border-inset bg-pill-unselected text-title hover:bg-inset'
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <FileSpreadsheet
              className={cn(
                'w-4 h-4',
                entryMode === 'csv' ? 'text-page' : 'text-forest-700'
              )}
            />
            <span className="font-bold text-sm">CSV Batch Import</span>
          </div>
          <p
            className={cn(
              'text-xs leading-relaxed',
              entryMode === 'csv' ? 'text-page/80' : 'text-body'
            )}
          >
            3-step validation &amp; batch ingest
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setEntryMode('document');
            setFeedback(null);
          }}
          className={cn(
            'p-4 rounded-[28px] border text-left transition-all cursor-pointer',
            entryMode === 'document'
              ? 'border-forest-900 bg-forest-900 text-white shadow-soft'
              : 'border-inset bg-pill-unselected text-title hover:bg-inset'
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <FileSearch
              className={cn(
                'w-4 h-4',
                entryMode === 'document' ? 'text-page' : 'text-forest-700'
              )}
            />
            <span className="font-bold text-sm">Lab Report OCR</span>
          </div>
          <p
            className={cn(
              'text-xs leading-relaxed',
              entryMode === 'document' ? 'text-page/80' : 'text-body'
            )}
          >
            PDF &amp; Image extraction with review
          </p>
        </button>
      </div>

      {/* Mode 1: Manual Entry */}
      {entryMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sample Metadata &amp; Location</CardTitle>
              <CardDescription>
                Define provenance, sampling matrix, field location, and optional GPS coordinates.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-body font-semibold mb-1.5 ml-1">
                  Sample Identifier / Code <span className="text-status-critical">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. GW-2026-NSP-01"
                  value={sampleCode}
                  onChange={(e) => setSampleCode(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div>
                <label className="block text-body font-semibold mb-1.5 ml-1">
                  Sample Matrix <span className="text-status-critical">*</span>
                </label>
                <Select
                  value={sampleMatrix}
                  onChange={(e) => setSampleMatrix(e.target.value)}
                >
                  <option value="groundwater">Groundwater / Borewell</option>
                  <option value="drinking_water">Treated Drinking Water</option>
                  <option value="surface_water">Surface Water / River</option>
                </Select>
              </div>

              <div>
                <label className="block text-body font-semibold mb-1.5 ml-1">
                  Location Name / Well Number <span className="text-status-critical">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Industrial Sub-basin Well #4"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-body font-semibold mb-1.5 ml-1">
                  District / State <span className="text-status-critical">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Kanpur, Uttar Pradesh"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-body font-semibold mb-1.5 ml-1">
                  Latitude (Optional)
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 26.4312"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div>
                <label className="block text-body font-semibold mb-1.5 ml-1">
                  Longitude (Optional)
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 80.3995"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-body font-semibold mb-1.5 ml-1">
                  Collection Date &amp; Time <span className="text-status-critical">*</span>
                </label>
                <Input
                  type="datetime-local"
                  required
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Measured Analytes Rows */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Heavy Metal Concentrations</CardTitle>
                <CardDescription>
                  Enter measured chemical values and detection limit qualifiers
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddRow}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Analyte
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.map((row, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-raised rounded-full border border-inset text-xs"
                >
                  <select
                    value={row.symbol}
                    onChange={(e) => {
                      const updated = [...rows];
                      updated[idx].symbol = e.target.value as MetalSymbol;
                      setRows(updated);
                    }}
                    className="w-32 rounded-full bg-card border border-inset px-3 py-1.5 text-title font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
                  >
                    {Object.entries(CANONICAL_METALS).map(([sym, def]) => (
                      <option key={sym} value={sym}>
                        {sym} ({def.name})
                      </option>
                    ))}
                  </select>

                  <select
                    value={row.qualifier}
                    onChange={(e) => {
                      const updated = [...rows];
                      updated[idx].qualifier = e.target.value as MeasurementQualifier;
                      setRows(updated);
                    }}
                    className="w-24 rounded-full bg-card border border-inset px-3 py-1.5 text-title font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
                  >
                    <option value="=">=</option>
                    <option value="<">&lt; (LOD)</option>
                    <option value="<=">&le;</option>
                    <option value=">">&gt;</option>
                  </select>

                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={row.value}
                    onChange={(e) => {
                      const updated = [...rows];
                      updated[idx].value = e.target.value;
                      setRows(updated);
                    }}
                    className="flex-1 rounded-full bg-card border border-inset px-3 py-1.5 text-title font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 placeholder-placeholder"
                  />

                  <select
                    value={row.unit}
                    onChange={(e) => {
                      const updated = [...rows];
                      updated[idx].unit = e.target.value as ConcentrationUnit;
                      setRows(updated);
                    }}
                    className="w-28 rounded-full bg-card border border-inset px-3 py-1.5 text-title font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
                  >
                    <option value="mg/L">mg/L (ppm)</option>
                    <option value="ug/L">&micro;g/L (ppb)</option>
                  </select>

                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1.5 text-body hover:text-status-critical rounded-full hover:bg-inset transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingManual}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmittingManual ? 'Computing Indices...' : 'Confirm & Compute Indices'}
            </Button>
          </div>
        </form>
      )}

      {/* Mode 2: 3-Step CSV Ingestion Workflow */}
      {entryMode === 'csv' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-title flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-forest-700" />
                  <span>Step 1: Choose or Drop CSV Report</span>
                </h3>
                <p className="text-xs text-body mt-1">
                  Upload an environmental laboratory report matrix to compute multi-sample indices.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download template
                </Button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Redesigned Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingCsv(true);
              }}
              onDragLeave={() => setIsDraggingCsv(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingCsv(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleProcessCsvFile(e.dataTransfer.files[0]);
                }
              }}
              className={cn(
                'bg-raised border-2 border-dashed rounded-[28px] p-8 cursor-pointer text-center transition-all',
                isDraggingCsv
                  ? 'border-forest-900 bg-inset'
                  : 'border-accent hover:bg-inset'
              )}
            >
              <Upload className="w-8 h-8 text-forest-900 mx-auto mb-2" />
              <p className="text-sm font-bold text-title">
                Click to browse or drag and drop laboratory CSV here
              </p>
              <p className="text-xs text-body mt-1">RFC 4180 format • Up to 10 MB</p>
            </div>
          </Card>

          {/* Step 2 & 3: Preview and Confirmation Table */}
          {previewCsvMutation.isPending ? (
            <Card className="p-8 text-center text-body">
              <Loader2 className="w-6 h-6 animate-spin text-forest-700 mx-auto mb-2" />
              <p className="text-xs">Parsing matrix rows and validating concentrations...</p>
            </Card>
          ) : csvPreviewData ? (
            <Card className="space-y-4">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-inset pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>Step 2: Review Parsed Samples ({csvPreviewData.fileName})</span>
                    <Badge variant="safe" size="sm">
                      {csvPreviewData.validCount} Valid Samples
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Verify mapped columns, location coordinates, and analyte counts before saving
                  </CardDescription>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCommitCsv}
                  disabled={importCsvMutation.isPending || csvPreviewData.validCount === 0}
                  leftIcon={
                    importCsvMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )
                  }
                >
                  {importCsvMutation.isPending
                    ? 'Ingesting Samples...'
                    : `Confirm & Ingest ${csvPreviewData.validCount} Samples`}
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                {csvPreviewData.errors.length > 0 && (
                  <div className="p-4 bg-status-critical-bg border-b border-status-critical/30 text-xs text-status-critical space-y-1">
                    <div className="font-semibold">
                      {csvPreviewData.errors.length} Row Validation Warning(s):
                    </div>
                    {csvPreviewData.errors.map((err, i) => (
                      <div key={i} className="font-mono text-[11px]">
                        Row {err.rowNumber}: {err.message}
                      </div>
                    ))}
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Sample Code</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Matrix</TableHead>
                      <TableHead>Analytes Detected</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {csvPreviewData.samples.map((s, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono font-bold text-forest-900">
                          {s.sampleCode}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{s.location?.name}</div>
                          <div className="text-[11px] text-body">{s.location?.district}</div>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-body">
                          {s.location?.coordinates
                            ? `${s.location.coordinates.latitude.toFixed(3)}, ${s.location.coordinates.longitude.toFixed(3)}`
                            : 'No GPS'}
                        </TableCell>
                        <TableCell className="capitalize">
                          {s.sampleMatrix?.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="font-mono text-forest-700 font-semibold">
                          {s.measurements?.length || 0} metals (
                          {s.measurements?.map((m: any) => m.symbol).join(', ')})
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="safe" size="sm">
                            Valid
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* Mode 3: Lab Report OCR */}
      {entryMode === 'document' && (
        <Card className="p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-forest-900 flex items-center justify-center text-page mx-auto shadow-sm">
            <FileSearch className="w-7 h-7 text-page" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-title">
              Upload Lab Certificate (PDF / Scanned Image)
            </h3>
            <p className="text-xs text-body max-w-md mx-auto mt-1">
              Supported formats: PDF, PNG, JPEG, WebP. Multimodal OCR proposes candidate values
              with page references for mandatory human verification.
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

          {/* Redesigned Dropzone */}
          <div
            onClick={() => docInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingDoc(true);
            }}
            onDragLeave={() => setIsDraggingDoc(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingDoc(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setDocFile(e.dataTransfer.files[0]);
              }
            }}
            className={cn(
              'bg-raised border-2 border-dashed rounded-[28px] p-8 cursor-pointer text-center transition-all',
              isDraggingDoc
                ? 'border-forest-900 bg-inset'
                : 'border-accent hover:bg-inset'
            )}
          >
            {docFile ? (
              <div className="space-y-1">
                <CheckCircle2 className="w-6 h-6 text-status-safe mx-auto" />
                <div className="text-xs font-bold text-title font-mono">{docFile.name}</div>
                <div className="text-[11px] text-body">
                  {(docFile.size / 1024).toFixed(1)} KB • Click or drop to choose different file
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-forest-900 mx-auto mb-2" />
                <p className="text-sm font-bold text-title">
                  Click to browse or drag and drop PDF/image report here
                </p>
                <p className="text-xs text-body mt-1">
                  Max 10 MB • Scanned and multi-page certificates
                </p>
              </div>
            )}
          </div>

          {docFile && (
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleDocUpload}
                disabled={uploadDocMutation.isPending}
                leftIcon={
                  uploadDocMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <FileSearch className="w-4 h-4" />
                  )
                }
              >
                {uploadDocMutation.isPending
                  ? 'Extracting Candidate Values...'
                  : 'Extract Candidate Values'}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
