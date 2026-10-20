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
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import {
  CANONICAL_METALS,
  MetalSymbol,
  ConcentrationUnit,
  MeasurementQualifier,
} from '@metalsense/shared';
import { useAuth } from '../auth/AuthContext';
import { usePreviewCsv, useImportCsv, useUploadDocument } from '../../lib/api';

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
  const [csvFile, setCsvFile] = useState<File | null>(null);
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

  const handleLoadExampleCsv = async () => {
    setFeedback(null);
    try {
      const res = await fetch('/examples/groundwater_lab_samples.csv');
      let text = '';
      if (res.ok) {
        text = await res.text();
      } else {
        text = `SampleCode,LocationName,District,Latitude,Longitude,CollectionDate,SampleMatrix,LabName,ReportNumber,As_mg_L,Cd_mg_L,Cr_mg_L,Cu_mg_L,Fe_mg_L,Mn_mg_L,Ni_mg_L,Pb_mg_L,Zn_mg_L,Notes
GW-KAN-01,Jajmau Industrial Area Borewell 1,Kanpur,26.4312,80.3995,2026-03-15T09:30:00Z,groundwater,SGS Environmental Services,ENV-2026-0491,0.045,0.008,0.120,0.450,1.850,0.620,0.085,0.035,4.200,Industrial discharge zone near tannery cluster
GW-KAN-02,Civil Lines Community Handpump,Kanpur,26.4725,80.3489,2026-03-15T11:00:00Z,groundwater,SGS Environmental Services,ENV-2026-0492,< 0.001,< 0.001,0.012,0.080,0.180,0.050,0.005,< 0.005,0.850,Municipal deep aquifer community tap
GW-VAR-01,Assi Ghat Deep Tube Well,Varanasi,25.2891,83.0076,2026-03-16T08:15:00Z,groundwater,National Hydrology Research Lab,NHR-8821-A,0.028,< 0.001,0.025,0.150,0.780,0.310,0.018,0.015,1.200,Holocene alluvial aquifer monitoring point
GW-VAR-02,Ramnagar Rural Agricultural Borewell,Varanasi,25.2690,83.0289,2026-03-16T10:45:00Z,groundwater,National Hydrology Research Lab,NHR-8821-B,0.012,< 0.001,0.008,0.040,0.420,0.120,0.008,< 0.005,0.450,Agricultural irrigation tube well
GW-PAT-01,Danapur Peri-Urban Handpump,Patna,25.6322,85.0441,2026-03-17T09:00:00Z,groundwater,Bihar State Water Testing Lab,BSWT-2026-104,0.085,0.002,0.018,0.220,2.400,0.850,0.022,0.028,2.100,Known endemic arsenic hotspot in older alluvium`;
      }

      const preview = await previewCsvMutation.mutateAsync({
        csvText: text,
        fileName: 'groundwater_lab_samples.csv',
      });
      setCsvPreviewData(preview);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to parse example CSV.' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
          message: 'No valid samples could be ingested. Check row errors.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'CSV ingestion failed.' });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setIsSubmittingManual(true);
    setFeedback(null);

    try {
      const payload = {
        sampleCode,
        sampleMatrix: sampleMatrix as any,
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
          method: 'manual' as const,
          isDemo: false,
        },
      };

      const res = await fetch(`/api/v1/workspaces/${workspaceId}/samples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      <div className="flex items-center justify-between">
        <Link to="/app/samples">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Registry
          </Button>
        </Link>
        <Badge variant="cyan">INGESTION</Badge>
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
          <div className="text-xs text-slate-400 mt-1">Single sample form with live validation</div>
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
          <div className="text-xs text-slate-400 mt-1">3-step validation &amp; batch ingest</div>
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
          <div className="text-xs text-slate-400 mt-1">PDF &amp; Image extraction with review</div>
        </button>
      </div>

      {/* Mode 1: Manual Entry */}
      {entryMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">
                Sample Metadata &amp; Location
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
                  placeholder="e.g. Industrial Sub-basin Well #4"
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
                  placeholder="e.g. Kanpur, Uttar Pradesh"
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
                  placeholder="e.g. 26.4312"
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
                  placeholder="e.g. 80.3995"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  Collection Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Measured Analytes Rows */}
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-white">
                  Heavy Metal Concentrations
                </CardTitle>
                <CardDescription>
                  Enter measured chemical values and detection limit qualifiers
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
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
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-xs"
                >
                  <select
                    value={row.symbol}
                    onChange={(e) => {
                      const updated = [...rows];
                      updated[idx].symbol = e.target.value as MetalSymbol;
                      setRows(updated);
                    }}
                    className="w-32 rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-white font-mono"
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
                    className="w-20 rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-white font-mono"
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
                    className="flex-1 rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-white font-mono"
                  />

                  <select
                    value={row.unit}
                    onChange={(e) => {
                      const updated = [...rows];
                      updated[idx].unit = e.target.value as ConcentrationUnit;
                      setRows(updated);
                    }}
                    className="w-24 rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-white font-mono"
                  >
                    <option value="mg/L">mg/L (ppm)</option>
                    <option value="ug/L">&micro;g/L (ppb)</option>
                  </select>

                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400"
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
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                  <span>Step 1: Choose or Drop CSV Report</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload an environmental laboratory report matrix or load the verified example test dataset.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  leftIcon={<Download className="w-3.5 h-3.5 text-teal-400" />}
                >
                  Template CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLoadExampleCsv}
                  disabled={previewCsvMutation.isPending}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                >
                  Load Example CSV
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

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-teal-500/80 rounded-xl p-6 cursor-pointer bg-slate-950/40 text-center transition-colors"
            >
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">
                Click to browse or drag and drop laboratory CSV here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">RFC 4180 format • Up to 10 MB</p>
            </div>
          </Card>

          {/* Step 2 & 3: Preview and Confirmation Table */}
          {previewCsvMutation.isPending ? (
            <Card className="border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-teal-400 mx-auto mb-2" />
              <p className="text-xs">Parsing matrix rows and validating concentrations...</p>
            </Card>
          ) : csvPreviewData ? (
            <Card className="border-slate-800 bg-slate-900/80 space-y-4">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <span>Step 2: Review Parsed Samples ({csvPreviewData.fileName})</span>
                    <Badge variant="outline" className="text-xs text-teal-400 border-teal-500/30">
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
                  <div className="p-4 bg-rose-950/20 border-b border-rose-900/40 text-xs text-rose-300 space-y-1">
                    <div className="font-semibold text-rose-400">
                      {csvPreviewData.errors.length} Row Validation Warning(s):
                    </div>
                    {csvPreviewData.errors.map((err, i) => (
                      <div key={i} className="font-mono text-[11px]">
                        Row {err.rowNumber}: {err.message}
                      </div>
                    ))}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Sample Code</th>
                        <th className="py-3 px-4 font-semibold">Location</th>
                        <th className="py-3 px-4 font-semibold">Coordinates</th>
                        <th className="py-3 px-4 font-semibold">Matrix</th>
                        <th className="py-3 px-4 font-semibold">Analytes Detected</th>
                        <th className="py-3 px-4 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {csvPreviewData.samples.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-white">{s.sampleCode}</td>
                          <td className="py-3 px-4 text-slate-300">
                            <div>{s.location?.name}</div>
                            <div className="text-[11px] text-slate-500">{s.location?.district}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            {s.location?.coordinates
                              ? `${s.location.coordinates.latitude.toFixed(3)}, ${s.location.coordinates.longitude.toFixed(3)}`
                              : 'No GPS'}
                          </td>
                          <td className="py-3 px-4 capitalize text-slate-300">
                            {s.sampleMatrix?.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4 font-mono text-teal-400">
                            {s.measurements?.length || 0} metals ({s.measurements?.map((m: any) => m.symbol).join(', ')})
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant="safe" size="sm">
                              Valid
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* Mode 3: Lab Report OCR */}
      {entryMode === 'document' && (
        <Card className="border-slate-800 bg-slate-900/80 p-8 text-center space-y-5">
          <FileSearch className="w-12 h-12 text-teal-400 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-white">Upload Lab Certificate (PDF / Scanned Image)</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Supported formats: PDF, PNG, JPEG, WebP. Multimodal OCR proposes candidate values with page references for mandatory human verification.
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
                disabled={uploadDocMutation.isPending}
                leftIcon={
                  uploadDocMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <FileSearch className="w-4 h-4" />
                  )
                }
              >
                {uploadDocMutation.isPending ? 'Extracting Candidate Values...' : 'Extract Candidate Values'}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
