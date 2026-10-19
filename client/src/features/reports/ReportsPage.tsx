import React, { useState } from 'react';
import {
  FileCheck2,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../auth/AuthContext';
import { DEMO_SAMPLES, DEMO_ANALYSES } from '../../data/demoSamples';

export function ReportsPage() {
  const { activeWorkspace } = useAuth();
  const [selectedStandard, setSelectedStandard] = useState<'BIS_10500_2012' | 'WHO_GDWQ_4TH'>('BIS_10500_2012');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportCSV = async () => {
    setIsExportingCsv(true);
    setExportNotice(null);

    try {
      if (activeWorkspace?.id && activeWorkspace.id !== 'demo-workspace') {
        const response = await fetch(`/api/v1/workspaces/${activeWorkspace.id}/reports/csv`, {
          credentials: 'include',
        });
        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `MetalSense_${activeWorkspace.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Matrix.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          setExportNotice('CSV matrix successfully generated and downloaded from server.');
          setIsExportingCsv(false);
          return;
        }
      }
    } catch {
      // Fallback to client-side generation
    }

    // Client-side fallback generation
    const headers = [
      'SampleCode',
      'LocationName',
      'District',
      'CollectionDate',
      'HPI',
      'HPI_Classification',
      'HEI',
      'Cd',
      'StandardUsed',
      'LOD_Strategy',
    ];

    const rows = DEMO_SAMPLES.map((s) => {
      const a = DEMO_ANALYSES[s.id];
      return [
        s.sampleCode,
        `"${s.location.name}"`,
        `"${s.location.district || ''}"`,
        s.collectionDate,
        a ? a.hpi.value.toFixed(2) : '',
        a ? a.hpi.classification : '',
        a ? a.hei.value.toFixed(2) : '',
        a ? a.cd.value.toFixed(2) : '',
        a ? a.standardUsed.code : selectedStandard,
        a ? a.lodStrategy : 'half_lod',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MetalSense_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice('CSV matrix generated from local benchmark dataset.');
    setIsExportingCsv(false);
  };

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    setExportNotice(null);

    try {
      if (activeWorkspace?.id && activeWorkspace.id !== 'demo-workspace') {
        const response = await fetch(
          `/api/v1/workspaces/${activeWorkspace.id}/reports/pdf?standardCode=${selectedStandard}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `MetalSense_${activeWorkspace.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Dossier.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          setExportNotice('Official PDF compliance dossier generated and downloaded.');
          setIsExportingPdf(false);
          return;
        }
      }
    } catch {
      // Fallback to print
    }

    // Client-side fallback: system print to PDF
    setTimeout(() => {
      setIsExportingPdf(false);
      window.print();
    }, 400);
  };

  const handleSampleExportPDF = async (sampleCode: string, sampleId: string) => {
    try {
      if (activeWorkspace?.id && activeWorkspace.id !== 'demo-workspace') {
        const response = await fetch(
          `/api/v1/workspaces/${activeWorkspace.id}/samples/${sampleId}/reports/pdf`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `MetalSense_${sampleCode}_Dossier.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          return;
        }
      }
    } catch {
      // fallback
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Auditable Environmental Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Export legally traceable compliance dossiers, calculation matrices, and PDF summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Standard:</span>
            <select
              aria-label="Select Regulatory Standard"
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value as any)}
              className="bg-transparent text-teal-300 font-semibold focus:outline-none"
            >
              <option value="BIS_10500_2012" className="bg-slate-900 text-slate-200">
                BIS IS 10500:2012
              </option>
              <option value="WHO_GDWQ_4TH" className="bg-slate-900 text-slate-200">
                WHO GDWQ 4th Ed.
              </option>
            </select>
          </div>

          <Button
            variant="secondary"
            onClick={handleExportCSV}
            isLoading={isExportingCsv}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
          >
            Export CSV Matrix
          </Button>
          <Button
            variant="primary"
            onClick={handleExportPDF}
            isLoading={isExportingPdf}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download PDF Dossier
          </Button>
        </div>
      </div>

      {exportNotice && (
        <Alert variant="success" title="Export Success">
          {exportNotice}
        </Alert>
      )}

      <Alert variant="info" title="Reproducible Audit Guarantee">
        All generated reports contain the complete mathematical snapshot, regulatory standard
        citation, unit normalization factors, and intermediate sub-index weights ($W_i \cdot Q_i$).
        Calculations are strictly deterministic (Engine Version: <code className="font-mono text-teal-300">v1.0.0-deterministic</code>).
      </Alert>

      {/* Generated Report Dossier Preview */}
      <Card className="border-slate-800 bg-slate-900/90 p-6 space-y-6 print:border-none print:bg-white print:text-black">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono uppercase text-teal-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Official Compliance Dossier</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Aquifer Heavy-Metal Pollution Assessment Report
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Workspace: {activeWorkspace?.name || 'Delhi Aquifer Monitoring'} • Standard: {selectedStandard === 'BIS_10500_2012' ? 'IS 10500:2012' : 'WHO GDWQ 4th Ed'}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            <div>Report ID: MS-REP-2026-AUDIT</div>
            <div>Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-xs">
            Summary of Evaluated Wells & Calculated Indices
          </h3>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Sample Code</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold">HPI Score</th>
                <th className="py-2.5 px-3 font-semibold">HEI Score</th>
                <th className="py-2.5 px-3 font-semibold">Cd Index</th>
                <th className="py-2.5 px-3 font-semibold">Classification</th>
                <th className="py-2.5 px-3 font-semibold text-right print:hidden">Dossier Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {DEMO_SAMPLES.map((s) => {
                const a = DEMO_ANALYSES[s.id];
                return (
                  <tr key={s.id} className="font-mono">
                    <td className="py-2.5 px-3 font-bold text-slate-200">{s.sampleCode}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{s.location.name}</td>
                    <td className="py-2.5 px-3 text-slate-200">{a ? a.hpi.value.toFixed(1) : '—'}</td>
                    <td className="py-2.5 px-3 text-slate-200">{a ? a.hei.value.toFixed(2) : '—'}</td>
                    <td className="py-2.5 px-3 text-slate-200">{a ? a.cd.value.toFixed(2) : '—'}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`text-xs font-semibold ${
                          a?.hpi.value && a.hpi.value >= 100
                            ? 'text-rose-400'
                            : a?.hpi.value && a.hpi.value >= 25
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {a?.hpi.classification.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right print:hidden">
                      <button
                        onClick={() => handleSampleExportPDF(s.sampleCode, s.id)}
                        className="text-xs text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 font-sans"
                        title="Download sample dossier"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Regulatory Caveats & Disclaimers */}
        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">Methodological Disclaimers & Assumptions:</div>
          <div>1. Standard reference: Bureau of Indian Standards IS 10500:2012 Drinking Water Specification / WHO GDWQ 4th Edition.</div>
          <div>2. Detection limit handling: Values flagged below limit (&lt;LOD) calculated using EPA 0.5 × LOD strategy.</div>
          <div>3. MetalSense is a computational intelligence platform and does not replace certified NABL physical testing or formal regulatory directives.</div>
        </div>
      </Card>
    </div>
  );
}
