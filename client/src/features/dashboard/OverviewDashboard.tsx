import React from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Scale,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  Calendar,
  Building2,
  UploadCloud,
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useWorkspaceSummary, useImportCsv } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Alert } from '../../components/ui/Alert';

export function OverviewDashboard() {
  const { activeWorkspace } = useAuth();
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkspaceSummary(activeWorkspace?.id);
  const importCsvMutation = useImportCsv(activeWorkspace?.id);

  const [loadingExample, setLoadingExample] = React.useState(false);
  const [exampleSuccess, setExampleSuccess] = React.useState(false);

  const handleLoadExampleData = async () => {
    if (!activeWorkspace) return;
    setLoadingExample(true);
    setExampleSuccess(false);
    try {
      // Fetch the bundled realistic groundwater lab samples
      const res = await fetch('/examples/groundwater_lab_samples.csv');
      let csvContent = '';
      if (res.ok) {
        csvContent = await res.text();
      } else {
        // Fallback inline dataset if static file not served directly
        csvContent = `SampleCode,LocationName,District,Latitude,Longitude,CollectionDate,SampleMatrix,LabName,ReportNumber,As_mg_L,Cd_mg_L,Cr_mg_L,Cu_mg_L,Fe_mg_L,Mn_mg_L,Ni_mg_L,Pb_mg_L,Zn_mg_L,Notes
GW-KAN-01,Jajmau Industrial Area Borewell 1,Kanpur,26.4312,80.3995,2026-03-15T09:30:00Z,groundwater,SGS Environmental Services,ENV-2026-0491,0.045,0.008,0.120,0.450,1.850,0.620,0.085,0.035,4.200,Industrial discharge zone near tannery cluster
GW-KAN-02,Civil Lines Community Handpump,Kanpur,26.4725,80.3489,2026-03-15T11:00:00Z,groundwater,SGS Environmental Services,ENV-2026-0492,< 0.001,< 0.001,0.012,0.080,0.180,0.050,0.005,< 0.005,0.850,Municipal deep aquifer community tap
GW-PAT-01,Danapur Peri-Urban Handpump,Patna,25.6322,85.0441,2026-03-17T09:00:00Z,groundwater,Bihar State Water Testing Lab,BSWT-2026-104,0.085,0.002,0.018,0.220,2.400,0.850,0.022,0.028,2.100,Known endemic arsenic hotspot in older alluvium
GW-PAT-02,Patliputra Institutional Well,Patna,25.6189,85.1132,2026-03-17T11:30:00Z,groundwater,Bihar State Water Testing Lab,BSWT-2026-105,0.004,< 0.001,0.005,0.030,0.150,0.040,< 0.005,< 0.005,0.320,Deep protected institutional borehole (120m)
GW-HYD-01,Patancheru Industrial Estate Well 4,Hyderabad,17.5310,78.2615,2026-03-19T09:45:00Z,groundwater,Telangana Pollution Control Board Lab,TPCB-5541,0.032,0.015,0.095,0.850,3.100,0.920,0.110,0.065,8.400,Severe multi-metal heavy industrial contamination zone`;
      }

      await importCsvMutation.mutateAsync({
        csvText: csvContent,
        fileName: 'groundwater_lab_samples.csv',
      });
      setExampleSuccess(true);
      await refetch();
    } catch (err) {
      alert('Failed to load example dataset. Please try again.');
    } finally {
      setLoadingExample(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-2xl border border-slate-800 p-4"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-rose-900/40">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Failed to load workspace summary</h2>
        <p className="text-sm text-slate-400 mt-1 mb-4">
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
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Water Quality Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Workspace: <strong className="text-slate-200">{activeWorkspace?.name || 'Default Workspace'}</strong> — Monitoring heavy metal indices and statutory compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/app/samples/new">
            <Button variant="primary" size="md" leftIcon={<FlaskConical className="w-4 h-4" />}>
              Add Sample
            </Button>
          </Link>
          <Link to="/app/reports">
            <Button variant="secondary" size="md" leftIcon={<FileCheck2 className="w-4 h-4 text-teal-400" />}>
              Export Dossier
            </Button>
          </Link>
        </div>
      </div>

      {exampleSuccess && (
        <Alert variant="info" className="flex items-center justify-between">
          <span>Example laboratory samples loaded successfully! Review the calculations below.</span>
        </Alert>
      )}

      {/* Empty State when 0 samples */}
      {kpis.totalSamples === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-slate-900/70 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-950/60 border border-teal-800/60 text-teal-300 flex items-center justify-center mx-auto">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold text-white">No water samples recorded yet</h2>
            <p className="text-sm text-slate-400 mt-2">
              Start evaluating heavy-metal pollution by uploading a laboratory CSV, entering measurements manually, or loading verified test samples.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to="/app/samples/new">
              <Button variant="primary" size="md" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
                Import CSV / Add Sample
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="md"
              onClick={handleLoadExampleData}
              disabled={loadingExample}
              leftIcon={
                loadingExample ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )
              }
            >
              {loadingExample ? 'Importing Test Dataset...' : 'Load Example Lab Data (5 Wells)'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-slate-400">Total Samples</span>
                <div className="p-2 rounded-lg bg-teal-950/60 border border-teal-800/60 text-teal-300">
                  <FlaskConical className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{kpis.totalSamples}</span>
                <span className="text-xs text-slate-400">Monitored stations</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {kpis.missingGpsCount > 0 ? (
                  <span className="text-amber-400">{kpis.missingGpsCount} samples missing GPS</span>
                ) : (
                  <span className="text-emerald-400">All samples mapped</span>
                )}
              </div>
            </Card>

            <Card className="border-rose-900/40 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-rose-300">Critical (HPI &ge; 100)</span>
                <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-400">{kpis.criticalCount}</span>
                <span className="text-xs text-rose-300/70">
                  {Math.round((kpis.criticalCount / (kpis.totalSamples || 1)) * 100)}% of total
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">Requires immediate treatment</div>
            </Card>

            <Card className="border-amber-900/40 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-amber-300">Moderate (HPI 25–99)</span>
                <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400">{kpis.moderateCount}</span>
                <span className="text-xs text-amber-300/70">
                  {Math.round((kpis.moderateCount / (kpis.totalSamples || 1)) * 100)}% of total
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">Sub-threshold contamination</div>
            </Card>

            <Card className="border-emerald-900/40 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-emerald-300">Low / Clean (HPI &lt; 25)</span>
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400">{kpis.safeCount}</span>
                <span className="text-xs text-emerald-300/70">
                  {Math.round((kpis.safeCount / (kpis.totalSamples || 1)) * 100)}% of total
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">Compliant with baseline</div>
            </Card>
          </div>

          {/* Secondary Row: Top Exceeded Metals & Regulatory Baseline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-slate-800 bg-slate-900/80 p-5">
              <CardTitle className="text-sm font-semibold text-white flex items-center justify-between mb-3">
                <span>Top Exceeded Analytes</span>
                <Scale className="w-4 h-4 text-teal-400" />
              </CardTitle>
              {topExceeded.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">No metals currently exceed standard thresholds.</p>
              ) : (
                <div className="space-y-2">
                  {topExceeded.map((m) => (
                    <div key={m.symbol} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-none">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-400 w-8">{m.symbol}</span>
                        <span className="text-slate-300">Heavy Metal Contaminant</span>
                      </div>
                      <Badge variant="outline" className="text-rose-400 border-rose-900/60">
                        {m.count} sample{m.count > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-slate-800 bg-slate-900/80 p-5 lg:col-span-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center justify-between mb-2">
                <span>Regulatory Standards in Use</span>
                <Badge variant="outline" className="text-teal-400 border-teal-500/30">
                  {activeWorkspace?.defaultStandard || 'BIS_10500_2012'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculations are strictly deterministic pure functions adhering to Prasad &amp; Bose (2001) for Heavy Metal Pollution Index (HPI), Edet &amp; Offiong (2002) for Heavy Metal Evaluation Index (HEI), and Backman et al. (1998) for Degree of Contamination (C<sub>d</sub>).
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
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white">Recent Laboratory Samples</CardTitle>
                <CardDescription>Latest water quality measurements evaluated in this workspace</CardDescription>
              </div>
              <Link to="/app/samples" className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1">
                <span>View all {kpis.totalSamples} samples</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-y border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Sample Code</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">HPI Score</th>
                      <th className="py-3 px-4">HEI Score</th>
                      <th className="py-3 px-4">C<sub>d</sub> Score</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {recentSamples.map(({ sample, analysis }) => {
                      const hpiVal = analysis?.hpi?.value ?? 0;
                      const heiVal = analysis?.hei?.value ?? 0;
                      const cdVal = analysis?.cd?.value ?? 0;

                      return (
                        <tr key={sample.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-white">
                            <Link to={`/app/samples/${sample.id}`} className="hover:text-teal-400">
                              {sample.sampleCode}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <div>{sample.location.name}</div>
                            <div className="text-[11px] text-slate-500">{sample.location.district || 'Unspecified'}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono">
                            {new Date(sample.collectionDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-mono font-bold ${
                                hpiVal >= 100
                                  ? 'text-rose-400'
                                  : hpiVal >= 25
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {hpiVal.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">{heiVal.toFixed(2)}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{cdVal.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <Link to={`/app/samples/${sample.id}`}>
                              <Button variant="secondary" size="sm" className="text-[11px] py-1 px-2.5">
                                Details
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
