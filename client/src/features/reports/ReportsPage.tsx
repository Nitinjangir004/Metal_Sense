import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { useAuth } from '../auth/AuthContext';
import { useSamples } from '../../lib/api';

export function ReportsPage() {
  const { activeWorkspace } = useAuth();
  const { data: samplesData, isLoading } = useSamples(activeWorkspace?.id, { limit: 100 });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const rawList: any[] = Array.isArray(samplesData) ? samplesData : (samplesData as any)?.samples || [];
  const samplesList = rawList.map((item: any) => {
    const s = item.sample || item;
    const a = item.analysis || null;
    return { sample: s, analysis: a, ...s };
  });

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
      link.download = `Metal_Sense_${activeWorkspace.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Matrix.csv`;
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
      link.download = `Metal_Sense_${activeWorkspace.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Compliance_Report.pdf`;
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

  const handleDownloadSamplePdf = (sampleId: string) => {
    if (!activeWorkspace?.id) return;
    window.open(
      `/api/v1/workspaces/${activeWorkspace.id}/samples/${sampleId}/report/pdf`,
      '_blank'
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Reports &amp; Export Center"
        workspaceName={activeWorkspace?.name || 'Workspace'}
        description="Export verified calculation dossiers, regulatory certificates, and raw matrix CSV datasets."
      />

      {exportNotice && (
        <Alert variant="info" className="text-xs">
          {exportNotice}
        </Alert>
      )}

      {/* Main Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Executive Dossier */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-forest-900 text-page flex items-center justify-center shadow-sm">
              <FileText className="w-6 h-6 text-page" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-title">Executive Compliance PDF Dossier</h2>
              <p className="text-xs text-body mt-1 leading-relaxed">
                Complete formal environmental audit document including exact mathematical formulas,
                analyte concentration tables, standard comparison limits, and sample classifications.
              </p>
            </div>
            <div className="space-y-1.5 text-xs text-body pt-3 border-t border-inset">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                <span>Deterministic index breakdowns (HPI, HEI, C<sub>d</sub>)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                <span>Standard-specific limits and exceedance tags</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 shrink-0" />
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
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-pill-unselected text-forest-900 border border-inset flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-6 h-6 text-forest-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-title">Full Ingestion &amp; Results Matrix (CSV)</h2>
              <p className="text-xs text-body mt-1 leading-relaxed">
                Raw comma-separated matrix containing sample codes, GPS coordinates, all heavy metal
                concentrations, LOD qualifiers, and computed pollution indices.
              </p>
            </div>
            <div className="space-y-1.5 text-xs text-body pt-3 border-t border-inset">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-safe shrink-0" />
                <span>Compatible with R, Python Pandas, and GIS packages</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-safe shrink-0" />
                <span>Original laboratory units and detection limit qualifiers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-safe shrink-0" />
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
                  <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
                ) : (
                  <Download className="w-4 h-4" />
                )
              }
            >
              {isExportingCsv ? 'Generating CSV...' : 'Download Full Matrix CSV'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Individual Sample Dossiers Table */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="p-5 border-b border-inset bg-inset/30">
          <CardTitle>Individual Sample Audit Dossiers</CardTitle>
          <CardDescription>
            Download isolated compliance certificates for specific water samples
          </CardDescription>
        </CardHeader>

        {isLoading ? (
          <div className="p-8 text-center text-body">Loading samples...</div>
        ) : samplesList.length === 0 ? (
          <div className="p-8 text-center text-body text-xs">
            No samples recorded in this workspace yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Sample Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>HPI Score</TableHead>
                <TableHead>HEI Score</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead className="text-right">Certificate</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {samplesList.map((item: any) => {
                const s = item.sample || item;
                const a = item.analysis;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-bold text-forest-900">{s.sampleCode}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-title">{s.location?.name || 'Unknown Location'}</div>
                      <div className="text-[11px] text-body">{s.location?.district}</div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-title">
                      {a?.hpi?.value ? a.hpi.value.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-body">
                      {a?.hei?.value ? a.hei.value.toFixed(2) : '—'}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadSamplePdf(s.id)}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                      >
                        PDF Dossier
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
