import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Filter,
  AlertTriangle,
  RefreshCw,
  FlaskConical,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Scale,
  Activity,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useWorkspaceAnalytics, useStandards } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { tokens } from '../../lib/tokens';
import {
  BIS_10500_2012,
  WHO_GDWQ_4TH_ED,
  STANDARD_REGISTRY,
  RegulatoryStandard,
  MetalSymbol,
} from '@metalsense/shared';
import { cn } from '../../lib/utils';

export function AnalyticsPage() {
  const { activeWorkspace } = useAuth();
  const [selectedStandardCode, setSelectedStandardCode] = useState<string>('BIS_10500_2012');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [selectedMetric, setSelectedMetric] = useState<'hpi' | 'hei' | 'cd'>('hpi');
  const [viewMode, setViewMode] = useState<'profile' | 'trend'>('profile');

  const { data, isLoading, isError, error, refetch } = useWorkspaceAnalytics(
    activeWorkspace?.id,
    selectedStandardCode
  );
  const { data: standards } = useStandards();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-inset rounded-full w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card rounded-[28px] border border-inset p-4"></div>
          ))}
        </div>
        <div className="h-80 bg-card rounded-[28px] border border-inset"></div>
        <div className="h-80 bg-card rounded-[28px] border border-inset"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-card rounded-[28px] border border-status-critical/30 space-y-3">
        <AlertTriangle className="w-8 h-8 text-status-critical mx-auto" />
        <p className="text-sm font-semibold text-title">
          Failed to load analytics: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Retry
        </Button>
      </div>
    );
  }

  const samplesWithAnalysis = data?.samplesWithAnalysis || [];

  if (samplesWithAnalysis.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={FlaskConical}
          title="No Analytics Data Available"
          description="Add or import water samples in this workspace to see comparative charts, longitudinal trends, and heavy metal distribution profiles."
          action={{
            label: 'Import CSV / Add Sample',
            onClick: () => {
              window.location.href = '/app/samples/new';
            },
          }}
        />
      </div>
    );
  }

  // Resolve active standard with complete limits dictionary
  const standard: RegulatoryStandard =
    STANDARD_REGISTRY[selectedStandardCode] ||
    standards?.find((s) => s.code === selectedStandardCode) ||
    (selectedStandardCode === 'WHO_GDWQ_4TH' ? WHO_GDWQ_4TH_ED : BIS_10500_2012);

  // Cross-sample metric profile data
  const metricChartData = samplesWithAnalysis.map((item: any) => {
    const s = item.sample || item;
    const a = item.analysis;
    let val = 0;
    let threshold = 100;

    if (selectedMetric === 'hpi') {
      val = a?.hpi ? a.hpi.value : 0;
      threshold = 100;
    } else if (selectedMetric === 'hei') {
      val = a?.hei ? a.hei.value : 0;
      threshold = 20;
    } else {
      val = a?.cd ? a.cd.value : 0;
      threshold = 3;
    }

    return {
      code: s?.sampleCode || 'Sample',
      name: s?.location?.name || '',
      value: Number((val || 0).toFixed(2)),
      threshold,
      status: a?.hpi?.classification || 'low',
    };
  });

  // Chronological time-series trend data
  const chronologicalTrendData = [...samplesWithAnalysis]
    .sort((a: any, b: any) => {
      const dateA = new Date(a.sample?.collectionDate || a.collectionDate || 0).getTime();
      const dateB = new Date(b.sample?.collectionDate || b.collectionDate || 0).getTime();
      return dateA - dateB;
    })
    .map((item: any) => {
      const s = item.sample || item;
      const a = item.analysis;
      const dateStr = s?.collectionDate
        ? new Date(s.collectionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'N/A';

      return {
        date: dateStr,
        code: s?.sampleCode || '',
        name: s?.location?.name || '',
        hpi: Number((a?.hpi?.value || 0).toFixed(2)),
        hei: Number((a?.hei?.value || 0).toFixed(2)),
        cd: Number((a?.cd?.value || 0).toFixed(2)),
      };
    });

  // Selected station analyte measurements vs limits
  const safeIndex = selectedSampleIndex < samplesWithAnalysis.length ? selectedSampleIndex : 0;
  const currentItem = samplesWithAnalysis[safeIndex] || samplesWithAnalysis[0];
  const currentSample = currentItem?.sample || currentItem;
  const currentMeasurements = currentSample?.measurements || [];

  const metalsComparisonData = currentMeasurements.map((m: any) => {
    const limitDef = standard?.limits?.[m.symbol as MetalSymbol];
    const permissible = limitDef ? limitDef.permissibleLimit : 0.05;
    const monitored = typeof m.value === 'number' ? m.value : parseFloat(m.value) || 0;
    const isExceeded = monitored > permissible;

    return {
      analyte: m.symbol,
      name: m.name || m.symbol,
      monitored,
      permissible,
      isExceeded,
    };
  });

  // KPI calculations
  const totalStations = samplesWithAnalysis.length;
  const criticalCount = data?.distributions?.hpi?.high || metricChartData.filter((d) => d.status === 'high').length;
  const moderateCount = data?.distributions?.hpi?.medium || metricChartData.filter((d) => d.status === 'medium').length;
  const safeCount = data?.distributions?.hpi?.low || metricChartData.filter((d) => d.status === 'low').length;
  const avgHpi =
    metricChartData.length > 0
      ? (metricChartData.reduce((sum, d) => sum + (d.value || 0), 0) / metricChartData.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytical Comparison &amp; Trends"
        workspaceName={activeWorkspace?.name}
        description={`Deterministic index comparisons, temporal trajectories, and regulatory benchmark evaluations across ${totalStations} monitoring stations.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-raised border border-inset rounded-full px-4 py-2 text-xs text-body shadow-sm">
              <Filter className="w-3.5 h-3.5 text-forest-700" />
              <span className="font-semibold text-title">Standard:</span>
              <select
                aria-label="Select Regulatory Standard"
                value={selectedStandardCode}
                onChange={(e) => setSelectedStandardCode(e.target.value)}
                className="bg-transparent text-forest-700 font-bold focus:outline-none cursor-pointer"
              >
                {standards?.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.title}
                  </option>
                )) || (
                  <>
                    <option value="BIS_10500_2012">BIS IS 10500:2012</option>
                    <option value="WHO_GDWQ_4TH">WHO GDWQ 4th Ed</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-pill-unselected border border-inset rounded-full p-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedMetric('hpi')}
                className={cn(
                  'px-3 py-1.5 rounded-full font-mono font-bold uppercase transition-all cursor-pointer',
                  selectedMetric === 'hpi'
                    ? 'bg-forest-900 text-white shadow-soft'
                    : 'text-body hover:text-title'
                )}
              >
                HPI
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('hei')}
                className={cn(
                  'px-3 py-1.5 rounded-full font-mono font-bold uppercase transition-all cursor-pointer',
                  selectedMetric === 'hei'
                    ? 'bg-forest-900 text-white shadow-soft'
                    : 'text-body hover:text-title'
                )}
              >
                HEI
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric('cd')}
                className={cn(
                  'px-3 py-1.5 rounded-full font-mono font-bold uppercase transition-all cursor-pointer',
                  selectedMetric === 'cd'
                    ? 'bg-forest-900 text-white shadow-soft'
                    : 'text-body hover:text-title'
                )}
              >
                C<sub>d</sub>
              </button>
            </div>
          </div>
        }
      />

      {/* KPI Stat Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-caption">Monitored Stations</span>
            <div className="p-2 rounded-full bg-raised border border-inset text-forest-700">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-title">{totalStations}</span>
            <span className="text-xs text-body">Sampling points</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-status-critical">Critical Stations</span>
            <div className="p-2 rounded-full bg-status-critical-bg border border-status-critical/30 text-status-critical">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-status-critical">{criticalCount}</span>
            <span className="text-xs text-body">HPI &ge; 100</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-status-warning">Moderate Stations</span>
            <div className="p-2 rounded-full bg-status-warning-bg border border-status-warning/30 text-status-warning">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-status-warning">{moderateCount}</span>
            <span className="text-xs text-body">HPI 25–99</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-status-safe">Workspace Mean HPI</span>
            <div className="p-2 rounded-full bg-status-safe-bg border border-status-safe/30 text-status-safe">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-title">{avgHpi}</span>
            <span className="text-xs text-body">Mean index score</span>
          </div>
        </Card>
      </div>

      {/* Primary Analytics Chart Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>
                {viewMode === 'profile'
                  ? `Aquifer Cross-Section: ${selectedMetric.toUpperCase()} Index Profile`
                  : `Longitudinal Pollution Trajectory: ${selectedMetric.toUpperCase()} Over Time`}
              </span>
              <Badge variant="safe" size="sm">
                {selectedMetric.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              {viewMode === 'profile'
                ? 'Deterministic index score computed for each monitored borehole and sampling point'
                : 'Chronological progression of heavy metal pollution across sampling dates'}
            </CardDescription>
          </div>

          {/* Toggle between Station Profile and Chronological Trend */}
          <div className="flex items-center gap-1 bg-pill-unselected border border-inset rounded-full p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('profile')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer',
                viewMode === 'profile'
                  ? 'bg-forest-900 text-white shadow-soft'
                  : 'text-body hover:text-title'
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Cross-Section</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('trend')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer',
                viewMode === 'trend'
                  ? 'bg-forest-900 text-white shadow-soft'
                  : 'text-body hover:text-title'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Temporal Trend</span>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'profile' ? (
                <BarChart data={metricChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={tokens.inset} vertical={false} />
                  <XAxis dataKey="code" stroke={tokens.body} tick={{ fill: tokens.body, fontSize: 11 }} />
                  <YAxis stroke={tokens.body} tick={{ fill: tokens.body, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tokens.card,
                      borderColor: tokens.inset,
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: tokens.title,
                      boxShadow: '0 8px 24px rgba(0, 47, 24, 0.08)',
                    }}
                    itemStyle={{ color: tokens.title }}
                  />
                  <ReferenceLine
                    y={selectedMetric === 'hpi' ? 100 : selectedMetric === 'hei' ? 20 : 3}
                    stroke={tokens.status.critical}
                    strokeDasharray="4 4"
                    label={{
                      value: 'Critical Threshold',
                      fill: tokens.status.critical,
                      fontSize: 11,
                      position: 'top',
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {metricChartData.map((entry, index) => {
                      let color: string = tokens.status.safe;
                      if (entry.status === 'high') color = tokens.status.critical;
                      else if (entry.status === 'medium') color = tokens.status.warning;
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={chronologicalTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tokens.primary} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={tokens.primary} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={tokens.inset} vertical={false} />
                  <XAxis dataKey="date" stroke={tokens.body} tick={{ fill: tokens.body, fontSize: 11 }} />
                  <YAxis stroke={tokens.body} tick={{ fill: tokens.body, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tokens.card,
                      borderColor: tokens.inset,
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: tokens.title,
                      boxShadow: '0 8px 24px rgba(0, 47, 24, 0.08)',
                    }}
                    itemStyle={{ color: tokens.title }}
                  />
                  <ReferenceLine
                    y={selectedMetric === 'hpi' ? 100 : selectedMetric === 'hei' ? 20 : 3}
                    stroke={tokens.status.critical}
                    strokeDasharray="4 4"
                    label={{
                      value: 'Critical Threshold',
                      fill: tokens.status.critical,
                      fontSize: 11,
                      position: 'top',
                      fontWeight: 'bold',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    name={`${selectedMetric.toUpperCase()} Score`}
                    stroke={tokens.primary}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#metricGradient)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Selected Sample Analyte Breakdown vs Limits */}
      {currentSample && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>
                Analyte Concentrations vs Permissible Limits (S<sub>i</sub>)
              </CardTitle>
              <CardDescription>
                Station: <strong className="text-title">{currentSample.sampleCode}</strong> ({currentSample.location?.name || 'Monitoring Station'})
              </CardDescription>
            </div>
            <select
              aria-label="Select Monitoring Point"
              value={safeIndex}
              onChange={(e) => setSelectedSampleIndex(Number(e.target.value))}
              className="rounded-full bg-raised border border-inset px-4 py-2 text-xs text-title font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer shadow-sm"
            >
              {samplesWithAnalysis.map((item: any, idx: number) => {
                const s = item.sample || item;
                return (
                  <option key={s.id || idx} value={idx}>
                    {s.sampleCode} — {s.location?.name || 'Station'}
                  </option>
                );
              })}
            </select>
          </CardHeader>
          <CardContent>
            {metalsComparisonData.length === 0 ? (
              <p className="text-xs text-body py-8 text-center">
                No analyte measurements recorded for this sampling point.
              </p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metalsComparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={tokens.inset} vertical={false} />
                    <XAxis dataKey="analyte" stroke={tokens.body} tick={{ fill: tokens.body, fontSize: 11 }} />
                    <YAxis stroke={tokens.body} tick={{ fill: tokens.body, fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tokens.card,
                        borderColor: tokens.inset,
                        borderRadius: '16px',
                        fontSize: '12px',
                        color: tokens.title,
                        boxShadow: '0 8px 24px rgba(0, 47, 24, 0.08)',
                      }}
                      itemStyle={{ color: tokens.title }}
                    />
                    <Legend />
                    <Bar dataKey="monitored" name="Measured (mg/L)" fill={tokens.primary} radius={[6, 6, 0, 0]} />
                    <Bar
                      dataKey="permissible"
                      name={`Permissible Limit (${standard.code})`}
                      fill={tokens.accent}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
