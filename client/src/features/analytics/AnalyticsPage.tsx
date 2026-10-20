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
import { Filter, Layers, AlertTriangle, CheckCircle2, Info, Loader2, FlaskConical } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useWorkspaceAnalytics, useStandards } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { BIS_10500_2012, WHO_GDWQ_4TH_ED, RegulatoryStandard } from '@metalsense/shared';

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
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800"></div>
        <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-rose-900/40 space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-xs text-white">Failed to load analytics: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (samplesWithAnalysis.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/70 rounded-3xl border border-slate-800 space-y-4">
        <FlaskConical className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Analytics Data Available</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Add or import water samples in this workspace to see comparative charts and heavy metal distribution trends.
        </p>
        <Link to="/app/samples/new">
          <Button variant="primary" size="md">
            Import Samples
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Analytical Comparison &amp; Trends
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic index comparisons and analyte limit benchmarks across {samplesWithAnalysis.length} monitored aquifers.
          </p>
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Standard:</span>
            <select
              aria-label="Select Regulatory Standard"
              value={selectedStandardCode}
              onChange={(e) => setSelectedStandardCode(e.target.value)}
              className="bg-transparent text-teal-300 font-semibold focus:outline-none cursor-pointer"
            >
              {standards?.map((s) => (
                <option key={s.code} value={s.code} className="bg-slate-900 text-white">
                  {s.title}
                </option>
              )) || (
                <>
                  <option value="BIS_10500_2012" className="bg-slate-900 text-white">
                    BIS IS 10500:2012
                  </option>
                  <option value="WHO_GDWQ_4TH" className="bg-slate-900 text-white">
                    WHO GDWQ 4th Ed
                  </option>
                </>
              )}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setSelectedMetric('hpi')}
              className={`px-2.5 py-1 rounded font-mono uppercase transition-colors ${
                selectedMetric === 'hpi' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              HPI
            </button>
            <button
              onClick={() => setSelectedMetric('hei')}
              className={`px-2.5 py-1 rounded font-mono uppercase transition-colors ${
                selectedMetric === 'hei' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              HEI
            </button>
            <button
              onClick={() => setSelectedMetric('cd')}
              className={`px-2.5 py-1 rounded font-mono uppercase transition-colors ${
                selectedMetric === 'cd' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              C<sub>d</sub>
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Sample Pollution Comparison Bar Chart */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <span>Aquifer Cross-Section: {selectedMetric.toUpperCase()} Index Profile</span>
                <Badge variant="outline" className="text-xs uppercase text-teal-400 border-teal-500/30">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="code" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <ReferenceLine
                  y={selectedMetric === 'hpi' ? 100 : selectedMetric === 'hei' ? 20 : 3}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Critical Threshold',
                    fill: '#f43f5e',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {metricChartData.map((entry, index) => {
                    let color = '#10b981';
                    if (entry.status === 'high') color = '#f43f5e';
                    else if (entry.status === 'medium') color = '#f59e0b';
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
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <span>Analyte Concentrations vs Permissible Limits (S<sub>i</sub>)</span>
              </CardTitle>
              <CardDescription>
                Station: <strong className="text-slate-200">{currentItem.sample.sampleCode}</strong> ({currentItem.sample.location.name})
              </CardDescription>
            </div>
            <select
              aria-label="Select Monitoring Point"
              value={selectedSampleIndex}
              onChange={(e) => setSelectedSampleIndex(Number(e.target.value))}
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="analyte" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="monitored" name="Measured (mg/L)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="permissible" name="Permissible Limit (mg/L)" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
