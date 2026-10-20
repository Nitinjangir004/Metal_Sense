import React from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Scale,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  FileCheck2,
  Download,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useWorkspaceSummary } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';

export function OverviewDashboard() {
  const { activeWorkspace } = useAuth();
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkspaceSummary(activeWorkspace?.id);

  const handleDownloadTemplate = () => {
    window.location.href = '/api/v1/imports/template.csv';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-inset rounded-full w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card rounded-[28px] border border-inset p-4"></div>
          ))}
        </div>
        <div className="h-64 bg-card rounded-[28px] border border-inset"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-card rounded-[28px] border border-status-critical/30">
        <AlertTriangle className="w-10 h-10 text-status-critical mx-auto mb-3" />
        <h2 className="text-lg font-bold text-title">Failed to load workspace summary</h2>
        <p className="text-sm text-body mt-1 mb-4">
          {error instanceof Error ? error.message : 'An unexpected network error occurred.'}
        </p>
        <Button variant="secondary" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry
        </Button>
      </div>
    );
  }

  const kpis = summary?.kpis || {
    totalSamples: 0,
    criticalCount: 0,
    moderateCount: 0,
    safeCount: 0,
    missingGpsCount: 0,
  };

  const recentSamples = summary?.recentSamples || [];
  const topExceeded = summary?.topExceededMetals || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Water Quality Intelligence Dashboard"
        workspaceName={activeWorkspace?.name || 'Default Workspace'}
        description="Monitoring heavy metal indices, multi-parameter thresholds, and statutory compliance."
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/app/reports">
              <Button variant="secondary" size="md" leftIcon={<FileCheck2 className="w-4 h-4" />}>
                Export Dossier
              </Button>
            </Link>
          </div>
        }
      />

      {/* Empty State when 0 samples (Directive 4 & 8) */}
      {kpis.totalSamples === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No water samples recorded yet"
          description="Start evaluating heavy-metal pollution by uploading a laboratory CSV, entering measurements manually, or using our sample format template."
          action={{
            label: 'Import CSV / Add Sample',
            onClick: () => {
              window.location.href = '/app/samples/new';
            },
            icon: <FileSpreadsheet className="w-4 h-4" />,
          }}
          secondaryAction={{
            label: 'Download template',
            onClick: handleDownloadTemplate,
          }}
        />
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-caption">Total Samples</span>
                <div className="p-2 rounded-full bg-raised border border-inset text-forest-700">
                  <FlaskConical className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-title">{kpis.totalSamples}</span>
                <span className="text-xs text-body">Stations evaluated</span>
              </div>
              <div className="mt-2 text-xs font-medium">
                {kpis.missingGpsCount > 0 ? (
                  <span className="text-status-warning">{kpis.missingGpsCount} samples missing GPS</span>
                ) : (
                  <span className="text-status-safe">All stations mapped</span>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-status-critical">
                  Critical (HPI &ge; 100)
                </span>
                <div className="p-2 rounded-full bg-status-critical-bg border border-status-critical/30 text-status-critical">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-status-critical">
                  {kpis.criticalCount}
                </span>
                <span className="text-xs text-body">
                  {Math.round((kpis.criticalCount / (kpis.totalSamples || 1)) * 100)}% of total
                </span>
              </div>
              <div className="mt-2 text-xs text-status-critical font-medium">Requires treatment</div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-status-warning">
                  Moderate (HPI 25–99)
                </span>
                <div className="p-2 rounded-full bg-status-warning-bg border border-status-warning/30 text-status-warning">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-status-warning">
                  {kpis.moderateCount}
                </span>
                <span className="text-xs text-body">
                  {Math.round((kpis.moderateCount / (kpis.totalSamples || 1)) * 100)}% of total
                </span>
              </div>
              <div className="mt-2 text-xs text-status-warning font-medium">Sub-threshold elevation</div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-status-safe">
                  Low / Clean (HPI &lt; 25)
                </span>
                <div className="p-2 rounded-full bg-status-safe-bg border border-status-safe/30 text-status-safe">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-status-safe">
                  {kpis.safeCount}
                </span>
                <span className="text-xs text-body">
                  {Math.round((kpis.safeCount / (kpis.totalSamples || 1)) * 100)}% of total
                </span>
              </div>
              <div className="mt-2 text-xs text-status-safe font-medium">Compliant with baseline</div>
            </Card>
          </div>

          {/* Secondary Row: Top Exceeded Metals & Regulatory Baseline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5">
              <CardTitle className="text-sm font-bold flex items-center justify-between mb-3">
                <span>Top Exceeded Analytes</span>
                <Scale className="w-4 h-4 text-forest-700" />
              </CardTitle>
              {topExceeded.length === 0 ? (
                <p className="text-xs text-body py-4">No metals currently exceed standard thresholds.</p>
              ) : (
                <div className="space-y-2">
                  {topExceeded.map((m) => (
                    <div
                      key={m.symbol}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-inset last:border-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-status-critical w-8">{m.symbol}</span>
                        <span className="text-body font-medium">Exceeds Permissible Limit</span>
                      </div>
                      <Badge variant="high" size="sm">
                        {m.count} sample{m.count > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5 lg:col-span-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between mb-2">
                <span>Regulatory Standards in Use</span>
                <Badge variant="safe" size="sm">
                  {activeWorkspace?.defaultStandard || 'BIS_10500_2012'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-body leading-relaxed">
                Calculations are strictly deterministic pure functions adhering to Prasad &amp;
                Bose (2001) for Heavy Metal Pollution Index (HPI), Edet &amp; Offiong (2002) for
                Heavy Metal Evaluation Index (HEI), and Backman et al. (1998) for Degree of
                Contamination (C<sub>d</sub>).
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Link to="/app/standards">
                  <Button variant="secondary" size="sm">
                    Inspect Limits Registry
                  </Button>
                </Link>
                <Link to="/app/methodology">
                  <Button variant="secondary" size="sm">
                    Review Formulas
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Recent Samples Table */}
          <Card className="p-0 overflow-hidden">
            <CardHeader className="p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Laboratory Samples</CardTitle>
                <CardDescription>Latest water quality measurements evaluated in this workspace</CardDescription>
              </div>
              <Link
                to="/app/samples"
                className="text-xs text-forest-700 hover:text-forest-900 font-bold flex items-center gap-1"
              >
                <span>View all {kpis.totalSamples} samples</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Sample Code</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>HPI Score</TableHead>
                    <TableHead>HEI Score</TableHead>
                    <TableHead>C<sub>d</sub> Score</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {recentSamples.map(({ sample, analysis }) => {
                    const hpiVal = analysis?.hpi?.value ?? 0;
                    const heiVal = analysis?.hei?.value ?? 0;
                    const cdVal = analysis?.cd?.value ?? 0;

                    return (
                      <TableRow key={sample.id}>
                        <TableCell className="font-mono font-bold text-forest-900">
                          <Link to={`/app/samples/${sample.id}`} className="hover:underline">
                            {sample.sampleCode}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{sample.location.name}</div>
                          <div className="text-[11px] text-body">
                            {sample.location.district || 'Unspecified'}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-body">
                          {new Date(sample.collectionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-mono font-bold ${
                              hpiVal >= 100
                                ? 'text-status-critical'
                                : hpiVal >= 25
                                ? 'text-status-warning'
                                : 'text-status-safe'
                            }`}
                          >
                            {hpiVal.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-body">{heiVal.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-body">{cdVal.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Link to={`/app/samples/${sample.id}`}>
                            <Button variant="secondary" size="sm" className="text-[11px] py-1 px-3">
                              Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
