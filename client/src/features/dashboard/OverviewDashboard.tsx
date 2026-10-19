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
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { Alert } from '../../components/ui/Alert';
import { DEMO_SAMPLES, DEMO_ANALYSES } from '../../data/demoSamples';

export function OverviewDashboard() {
  const samples = DEMO_SAMPLES;
  const analyses = DEMO_ANALYSES;

  // Aggregate stats
  const totalSamples = samples.length;
  const highRiskSamples = Object.values(analyses).filter(
    (a) => a.hpi.value >= a.hpi.thresholdValue
  ).length;
  const moderateSamples = Object.values(analyses).filter(
    (a) => a.hpi.value >= 25 && a.hpi.value < 100
  ).length;
  const compliantSamples = Object.values(analyses).filter(
    (a) => a.hpi.value < 25
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Labeled Demo Mode Context */}
      <Alert variant="info" title="Active Workspace: Sandbox Benchmark Dataset">
        Viewing 3 verified demo groundwater monitoring locations in Delhi NCR. All values,
        evaluations, and index calculations are mathematically verified against BIS 10500:2012
        drinking water specifications.
      </Alert>

      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Water Quality Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitoring aquifer heavy-metal concentration profiles and statutory compliance.
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

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase text-slate-400">Total Monitored Wells</span>
            <div className="p-2 rounded-lg bg-teal-950/60 border border-teal-800/60 text-teal-300">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{totalSamples}</span>
            <span className="text-xs text-slate-400">Sampling points</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Delhi Aquifer Sub-Division #2
          </div>
        </Card>

        <Card className="border-rose-900/40 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase text-rose-300">HPI &gt; 100 (Critical)</span>
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{highRiskSamples}</span>
            <span className="text-xs text-rose-300 font-medium">Exceeds BIS Threshold</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Sample GW-IND-2026-01 (Industrial Well)
          </div>
        </Card>

        <Card className="border-amber-900/40 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase text-amber-300">Moderate Risk (25–100)</span>
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{moderateSamples}</span>
            <span className="text-xs text-amber-300 font-medium">Elevated Parameters</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Fe elevated in Tubewell #12
          </div>
        </Card>

        <Card className="border-emerald-900/40 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase text-emerald-300">Low Risk (&lt; 25)</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{compliantSamples}</span>
            <span className="text-xs text-emerald-300 font-medium">Pristine Aquifer</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            South Ridge Bedrock Well
          </div>
        </Card>
      </div>

      {/* Main Table: Monitored Samples & Calculations */}
      <Card className="border-slate-800 bg-slate-900/80 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <span>Monitored Sample Dossiers</span>
              <Badge variant="cyan" size="sm">BENCHMARK DATA</Badge>
            </CardTitle>
            <CardDescription>
              Evaluated against BIS 10500:2012 Drinking Water Specification. Click any sample for full audit breakdown.
            </CardDescription>
          </div>
          <Link to="/app/samples">
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
              View All Samples
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Sample Code</th>
                  <th className="py-3.5 px-4 font-semibold">Location & District</th>
                  <th className="py-3.5 px-4 font-semibold">Collection Date</th>
                  <th className="py-3.5 px-4 font-semibold">HPI Score</th>
                  <th className="py-3.5 px-4 font-semibold">HEI</th>
                  <th className="py-3.5 px-4 font-semibold">Cd Index</th>
                  <th className="py-3.5 px-4 font-semibold">Key Exceedances</th>
                  <th className="py-3.5 px-4 font-semibold">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {samples.map((s) => {
                  const a = analyses[s.id];
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-white">
                        <Link
                          to={`/app/samples/${s.id}`}
                          className="hover:text-teal-300 flex items-center gap-1.5"
                        >
                          <span>{s.sampleCode}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400" />
                        </Link>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{s.location.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{s.location.district}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {new Date(s.collectionDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-4">
                        {a ? (
                          <div className="flex flex-col gap-1">
                            <span
                              className={`font-mono font-bold ${
                                a.hpi.value >= 100
                                  ? 'text-rose-400'
                                  : a.hpi.value >= 25
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {a.hpi.value.toFixed(1)}
                            </span>
                            <StatusBadge status={a.hpi.classification} />
                          </div>
                        ) : (
                          <span className="text-slate-500">Not calculated</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-200">
                        {a ? a.hei.value.toFixed(2) : '—'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-200">
                        {a ? a.cd.value.toFixed(2) : '—'}
                      </td>

                      <td className="py-3 px-4">
                        {a && a.exceededAnalytes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {a.exceededAnalytes.map((m) => (
                              <Badge key={m.symbol} variant="high" size="sm">
                                {m.symbol} ({m.ratio.toFixed(1)}×)
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> None
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <ProvenanceBadge provenance={s.provenance} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Information Grid: Standards & Verification Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-400" />
              <span>Applied Regulatory Benchmark</span>
            </CardTitle>
            <CardDescription>
              Bureau of Indian Standards IS 10500:2012 (Drinking Water Specification).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Jurisdiction</span>
              <span className="font-semibold text-white">India (Nationwide)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Arsenic (As) Acceptable / Permissible</span>
              <span className="font-mono text-slate-200">0.01 mg/L / 0.05 mg/L</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Lead (Pb) Acceptable / Permissible</span>
              <span className="font-mono text-slate-200">0.01 mg/L / No Relaxation</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Cadmium (Cd) Acceptable / Permissible</span>
              <span className="font-mono text-slate-200">0.003 mg/L / No Relaxation</span>
            </div>
            <div className="pt-2">
              <Link to="/app/standards" className="text-teal-400 hover:underline flex items-center gap-1 font-medium">
                View complete regulatory limits & citation metadata <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-teal-400" />
              <span>Audit & Provenance Integrity</span>
            </CardTitle>
            <CardDescription>
              Guaranteed reproducibility for environmental consultants & laboratories.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">No Hallucinated Scores:</span> All math
                is solved deterministically in pure code, tested against worked hydrological papers.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Explicit LOD Strategy:</span> Below
                detection limit qualifiers (&lt;0.001 mg/L) are handled with selectable EPA-aligned
                strategies.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Non-geocoded Safety:</span> Samples
                without confirmed GPS coordinates are never hallucinated on map visualizations.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
