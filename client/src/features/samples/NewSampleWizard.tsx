import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { CANONICAL_METALS } from '@metalsense/shared';

export function NewSampleWizard() {
  const navigate = useNavigate();
  const [entryMode, setEntryMode] = useState<'manual' | 'csv' | 'document'>('manual');

  // Form State
  const [sampleCode, setSampleCode] = useState('');
  const [locationName, setLocationName] = useState('');
  const [district, setDistrict] = useState('');
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().substring(0, 16)
  );
  const [sampleMatrix, setSampleMatrix] = useState('groundwater');

  // Metal rows
  const [rows, setRows] = useState<
    { symbol: string; value: string; unit: string; qualifier: string }[]
  >([
    { symbol: 'As', value: '0.005', unit: 'mg/L', qualifier: '=' },
    { symbol: 'Pb', value: '0.008', unit: 'mg/L', qualifier: '=' },
    { symbol: 'Cd', value: '0.001', unit: 'mg/L', qualifier: '<' },
    { symbol: 'Cr', value: '0.02', unit: 'mg/L', qualifier: '=' },
  ]);

  const handleAddRow = () => {
    setRows([...rows, { symbol: 'Fe', value: '0.1', unit: 'mg/L', qualifier: '=' }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to samples with feedback
    navigate('/app/samples');
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
          Enter validated heavy-metal concentrations manually or ingest a laboratory certificate.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setEntryMode('manual')}
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
          onClick={() => setEntryMode('csv')}
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
          onClick={() => setEntryMode('document')}
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

      {entryMode === 'manual' && (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                          updated[idx].symbol = e.target.value;
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
                          updated[idx].qualifier = e.target.value;
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
                          updated[idx].unit = e.target.value;
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
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Confirm &amp; Compute Indices
            </Button>
          </div>
        </form>
      )}

      {entryMode === 'csv' && (
        <Card className="border-slate-800 bg-slate-900/80 p-8 text-center space-y-4">
          <FileSpreadsheet className="w-12 h-12 text-teal-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Upload Laboratory CSV Matrix</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload a structured CSV file with columns for SampleID, Date, Latitude, Longitude, and metal concentrations.
          </p>
          <div className="pt-2">
            <Button variant="outline" size="sm">
              Download Standard CSV Template
            </Button>
          </div>
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 hover:border-teal-500/60 transition-colors cursor-pointer bg-slate-950/40">
            <p className="text-xs text-slate-300">Drag and drop .csv file here, or click to browse</p>
            <p className="text-[11px] text-slate-500 mt-1">Maximum file size: 10 MB</p>
          </div>
        </Card>
      )}

      {entryMode === 'document' && (
        <Card className="border-slate-800 bg-slate-900/80 p-8 text-center space-y-4">
          <FileSearch className="w-12 h-12 text-teal-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Upload Lab Certificate (PDF / Scanned Image)</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Our extraction engine reads scanned certificates and presents candidate numbers on an interactive review screen for human verification.
          </p>
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 hover:border-teal-500/60 transition-colors cursor-pointer bg-slate-950/40">
            <p className="text-xs text-slate-300">Drag and drop PDF, PNG, or JPEG file here</p>
            <p className="text-[11px] text-slate-500 mt-1">Multi-page lab certificates supported</p>
          </div>
          <Link to="/app/import/review">
            <Button variant="secondary" size="sm">
              View Sample Review &amp; Correct Screen
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
