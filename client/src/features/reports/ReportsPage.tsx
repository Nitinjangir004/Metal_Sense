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
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../auth/AuthContext';
import { useSamples, useStandards } from '../../lib/api';

export function ReportsPage() {
  const { activeWorkspace } = useAuth();
  const { data: samplesData, isLoading, isError } = useSamples(activeWorkspace?.id, { limit: 100 });
  const { data: standards } = useStandards();

  const [selectedStandard, setSelectedStandard] = useState('BIS_10500_2012');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const samplesList = samplesData?.samples || [];

  const handleExportCSV = async () => {
    if (!activeWorkspace?.id) return;
    setIsExportingCsv(true);
    setExportNotice(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${activeWorkspace.id}/reports/csv`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Server returned an error generating CSV.');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `MetalSense_${activeWorkspace.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Matrix.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      setExportNotice('CSV matrix successfully generated and downloaded.');
    } catch (err: any) {
      setExportNotice(`Export failed: ${err.message}`);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportPDF = async () => {
    if (!activeWorkspace?.id) return;
    setIsExportingPdf(true);
    setExportNotice(null);

    try {
      const response = await fetch(`/api/v1/workspaces/${activeWorkspace.id}/reports/pdf`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Server returned an error generating PDF.');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `MetalSense_${activeWorkspace.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Compliance_Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      setExportNotice('Executive PDF compliance report successfully generated and downloaded.');
    } catch (err: any) {
      setExportNotice(`PDF export failed: ${err.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadSamplePdf = (sampleId: string, sampleCode: string) => {
    if (!activeWorkspace?.id) return;
    window.open(
      `/api/v1/workspaces/${activeWorkspace.id}/samples/${sampleId}/report/pdf`,
      '_blank'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Compliance Reports &amp; Export Center
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Export verified calculation dossiers, regulatory certificates, and raw matrix CSV datasets for{' '}
          <strong className="text-slate-200">{activeWorkspace?.name || 'Workspace'}</strong>.
        </p>
      </div>

      {exportNotice && (
        <Alert variant="info" className="text-xs">
          {exportNotice}
        </Alert>
      )}

      {/* Main Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Executive Dossier */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-950/60 border border-teal-800/60 text-teal-300 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Executive Compliance PDF Dossier</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Complete formal environmental audit document including exact mathematical formulas,
                analyte concentration tables, standard comparison limits, and sample classifications.
              </p>
            </div>
            <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Deterministic index breakdowns (HPI, HEI, C<sub>d</sub>)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Standard-specific limits and exceedance tags</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Audit trail hash and timestamped laboratory metadata</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              disabled={isExportingPdf || samplesList.length === 0}
              onClick={handleExportPDF}
              leftIcon={
                isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4" />
                )
              }
            >
              {isExportingPdf ? 'Generating PDF...' : 'Download Executive PDF'}
            </Button>
          </div>
        </Card>

        {/* CSV Matrix Export */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Full Ingestion &amp; Results Matrix (CSV)</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Raw comma-separated matrix containing sample codes, GPS coordinates, all heavy metal
                concentrations, LOD qualifiers, and computed pollution indices.
              </p>
            </div>
            <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compatible with R, Python Pandas, and GIS packages</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Original laboratory units and detection limit qualifiers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Computed sub-indices and total scores per sample</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              disabled={isExportingCsv || samplesList.length === 0}
              onClick={handleExportCSV}
              leftIcon={
                isExportingCsv ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-400" />
                )
              }
            >
              {isExportingCsv ? 'Generating CSV...' : 'Download Full Matrix CSV'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Individual Sample Dossiers Table */}
      <Card className="border-slate-800 bg-slate-900/80 p-0 overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-800 bg-slate-950/40">
          <CardTitle className="text-base font-bold text-white">Individual Sample Audit Dossiers</CardTitle>
          <CardDescription>
            Download isolated compliance certificates for specific water samples
          </CardDescription>
        </CardHeader>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading samples...</div>
        ) : samplesList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No samples recorded in this workspace yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Sample Code</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">HPI Score</th>
                  <th className="py-3 px-4 font-semibold">HEI Score</th>
                  <th className="py-3 px-4 font-semibold">Classification</th>
                  <th className="py-3 px-4 font-semibold text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {samplesList.map(({ sample: s, analysis: a }) => {
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-white">{s.sampleCode}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{s.location.name}</div>
                        <div className="text-[11px] text-slate-500">{s.location.district}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {a?.hpi?.value ? a.hpi.value.toFixed(1) : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {a?.hei?.value ? a.hei.value.toFixed(2) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            a?.hpi?.classification === 'high'
                              ? 'high'
                              : a?.hpi?.classification === 'medium'
                              ? 'moderate'
                              : 'safe'
                          }
                          size="sm"
                        >
                          {a?.hpi?.classification?.toUpperCase() || 'EVALUATED'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadSamplePdf(s.id, s.sampleCode)}
                          className="text-teal-400 hover:text-teal-300"
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                        >
                          PDF Dossier
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
