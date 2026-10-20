import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
  Cell,
} from 'recharts';
import { Filter, AlertTriangle, RefreshCw, FlaskConical } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useWorkspaceAnalytics, useStandards } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { tokens } from '../../lib/tokens';
import { BIS_10500_2012, WHO_GDWQ_4TH_ED, RegulatoryStandard } from '@metalsense/shared';
import { cn } from '../../lib/utils';

export function AnalyticsPage() {
  const { activeWorkspace } = useAuth();
  const { data, isLoading, isError, error, refetch } = useWorkspaceAnalytics(activeWorkspace?.id);
  const { data: standards } = useStandards();

  const [selectedStandardCode, setSelectedStandardCode] = useState<string>('BIS_10500_2012');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [selectedMetric, setSelectedMetric] = useState<'hpi' | 'hei' | 'cd'>('hpi');

  const standard: RegulatoryStandard =
    standards?.find((s) => s.code === selectedStandardCode) ||
    (selectedStandardCode === 'WHO_GDWQ_4TH' ? WHO_GDWQ_4TH_ED : BIS_10500_2012);

  const samplesWithAnalysis = data?.samplesWithAnalysis || [];
  const currentItem = samplesWithAnalysis[selectedSampleIndex] || samplesWithAnalysis[0];

  // Cross-sample metric comparison data
  const metricChartData = samplesWithAnalysis.map(({ sample: s, analysis: a }) => {
    let val = 0;
    let threshold = 100;

    if (selectedMetric === 'hpi') {
      val = a ? a.hpi.value : 0;
      threshold = 100;
    } else if (selectedMetric === 'hei') {
      val = a ? a.hei.value : 0;
      threshold = 20;
    } else {
      val = a ? a.cd.value : 0;
      threshold = 3;
    }

    return {
      code: s.sampleCode,
      name: s.location.name,
      value: Number(val.toFixed(2)),
      threshold,
      status: a?.hpi.classification || 'low',
    };
  });

  // Metal concentrations comparison for selected sample
  const metalsComparisonData = currentItem?.sample?.measurements?.map((m) => {
    const limitDef = standard.limits[m.symbol];
    const permissible = limitDef ? limitDef.permissibleLimit : 0.05;
    const isExceeded = m.value > permissible;

    return {
      analyte: m.symbol,
      name: m.name,
      monitored: m.value,
      permissible,
      isExceeded,
    };
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-inset rounded-full w-1/3"></div>
        <div className="h-64 bg-card rounded-[28px] border border-inset"></div>
        <div className="h-64 bg-card rounded-[28px] border border-inset"></div>
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
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (samplesWithAnalysis.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={FlaskConical}
          title="No Analytics Data Available"
          description="Add or import water samples in this workspace to see comparative charts and heavy metal distribution trends."
          action={{
            label: 'Import Samples',
            onClick: () => {
              window.location.href = '/app/samples/new';
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytical Comparison &amp; Trends"
        workspaceName={activeWorkspace?.name}
        description={`Deterministic index comparisons and analyte limit benchmarks across ${samplesWithAnalysis.length} monitored aquifers.`}
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

      {/* Cross-Sample Pollution Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>Aquifer Cross-Section: {selectedMetric.toUpperCase()} Index Profile</span>
                <Badge variant="safe" size="sm">
                  {selectedMetric.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                Deterministic numerical index computed for each monitored sampling station
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
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
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Selected Sample Analyte Breakdown vs Limits */}
      {currentItem && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>
                Analyte Concentrations vs Permissible Limits (S<sub>i</sub>)
              </CardTitle>
              <CardDescription>
                Station: <strong className="text-title">{currentItem.sample.sampleCode}</strong> ({currentItem.sample.location.name})
              </CardDescription>
            </div>
            <select
              aria-label="Select Monitoring Point"
              value={selectedSampleIndex}
              onChange={(e) => setSelectedSampleIndex(Number(e.target.value))}
              className="rounded-full bg-raised border border-inset px-4 py-2 text-xs text-title font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer shadow-sm"
            >
              {samplesWithAnalysis.map(({ sample: s }, idx) => (
                <option key={s.id} value={idx}>
                  {s.sampleCode} — {s.location.name}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
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
                  <Bar dataKey="permissible" name="Permissible Limit (mg/L)" fill={tokens.accent} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
