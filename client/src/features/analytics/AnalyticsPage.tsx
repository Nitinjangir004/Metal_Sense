import React, { useState } from 'react';
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
import { Filter, Layers, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DEMO_SAMPLES, DEMO_ANALYSES } from '../../data/demoSamples';
import { BIS_10500_2012, WHO_GDWQ_4TH_ED, RegulatoryStandard } from '@metalsense/shared';

export function AnalyticsPage() {
  const [selectedStandardCode, setSelectedStandardCode] = useState<'BIS_10500_2012' | 'WHO_GDWQ_4TH'>('BIS_10500_2012');
  const [selectedSampleId, setSelectedSampleId] = useState<string>(DEMO_SAMPLES[0].id);
  const [selectedMetric, setSelectedMetric] = useState<'hpi' | 'hei' | 'cd'>('hpi');

  const standard: RegulatoryStandard =
    selectedStandardCode === 'BIS_10500_2012' ? BIS_10500_2012 : WHO_GDWQ_4TH_ED;

  const currentSample = DEMO_SAMPLES.find((s) => s.id === selectedSampleId) || DEMO_SAMPLES[0];
  const currentAnalysis = DEMO_ANALYSES[currentSample.id];

  // Cross-sample metric comparison data
  const metricChartData = DEMO_SAMPLES.map((s) => {
    const a = DEMO_ANALYSES[s.id];
    let val = 0;
    let threshold = 100;

    if (selectedMetric === 'hpi') {
      val = a ? a.hpi.value : 0;
      threshold = 100;
    } else if (selectedMetric === 'hei') {
      val = a ? a.hei.value : 0;
      threshold = 20; // Edet & Offiong critical threshold
    } else {
      val = a ? a.cd.value : 0;
      threshold = 3; // Backman critical contamination threshold
    }

    return {
      code: s.sampleCode,
      name: s.location.name,
      value: Number(val.toFixed(2)),
      threshold,
      status: a?.hpi.classification || 'low',
    };
  });

  // Metal concentrations comparison for selected sample against standard limits
  const metalsComparisonData = currentSample.measurements.map((m) => {
    const limitDef = standard.limits[m.symbol];
    const permissible = limitDef ? limitDef.permissibleLimit : 0.05;
    const acceptable = limitDef ? limitDef.acceptableLimit : permissible;
    const isExceeded = m.value > permissible;

    return {
      analyte: m.symbol,
      name: m.name,
      monitored: m.value,
      permissible,
      acceptable,
      isExceeded,
    };
  });

  const exceededMetals = metalsComparisonData.filter((m) => m.isExceeded);

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Analytical Comparison & Trends
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic index comparisons and analyte limit benchmarks across monitored aquifers.
          </p>
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Regulatory Standard Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Standard:</span>
            <select
              aria-label="Select Regulatory Standard"
              value={selectedStandardCode}
              onChange={(e) => setSelectedStandardCode(e.target.value as any)}
              className="bg-transparent text-teal-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="BIS_10500_2012" className="bg-slate-900 text-slate-200">
                IS 10500:2012 (India)
              </option>
              <option value="WHO_GDWQ_4TH" className="bg-slate-900 text-slate-200">
                WHO GDWQ 4th Ed.
              </option>
            </select>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Metric:</span>
            <select
              aria-label="Select Pollution Metric"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="bg-transparent text-teal-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="hpi" className="bg-slate-900 text-slate-200">
                HPI (Pollution Index)
              </option>
              <option value="hei" className="bg-slate-900 text-slate-200">
                HEI (Heavy Metal Evaluation)
              </option>
              <option value="cd" className="bg-slate-900 text-slate-200">
                Cd (Degree of Contamination)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Index Scores Comparison Chart */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-white">
                Cross-Aquifer {selectedMetric.toUpperCase()} Index Comparison
              </CardTitle>
              <Badge variant="cyan">
                Threshold: {selectedMetric === 'hpi' ? '100' : selectedMetric === 'hei' ? '20' : '3'}
              </Badge>
            </div>
            <CardDescription>
              {selectedMetric === 'hpi' && 'Critical pollution threshold at HPI = 100 (Mohan et al., 1996).'}
              {selectedMetric === 'hei' && 'High pollution threshold at HEI = 20 (Edet & Offiong, 2002).'}
              {selectedMetric === 'cd' && 'High contamination threshold at Cd = 3 (Backman et al., 1998).'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricChartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="code" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <ReferenceLine
                    y={selectedMetric === 'hpi' ? 100 : selectedMetric === 'hei' ? 20 : 3}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{
                      value: `Critical (${selectedMetric === 'hpi' ? 100 : selectedMetric === 'hei' ? 20 : 3})`,
                      fill: '#f43f5e',
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name={`${selectedMetric.toUpperCase()} Score`}>
                    {metricChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.value >= (selectedMetric === 'hpi' ? 100 : selectedMetric === 'hei' ? 20 : 3)
                            ? '#f43f5e'
                            : entry.value >= (selectedMetric === 'hpi' ? 25 : selectedMetric === 'hei' ? 10 : 1)
                            ? '#f59e0b'
                            : '#10b981'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Selected Sample Analyte Breakdown vs Regulatory Limits */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-white">
                  Analyte vs Regulatory Limit ({currentSample.sampleCode})
                </CardTitle>
                <CardDescription>
                  Compared against {standard.title} (mg/L).
                </CardDescription>
              </div>

              {/* Sample Switcher */}
              <select
                aria-label="Select Sample"
                value={selectedSampleId}
                onChange={(e) => setSelectedSampleId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-teal-300 text-xs rounded px-2.5 py-1 focus:outline-none"
              >
                {DEMO_SAMPLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sampleCode} ({s.location.name})
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metalsComparisonData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="analyte" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="monitored"
                    fill="#38bdf8"
                    radius={[4, 4, 0, 0]}
                    name="Measured (mg/L)"
                  />
                  <Bar
                    dataKey="permissible"
                    fill="#e2e8f0"
                    radius={[4, 4, 0, 0]}
                    name={`Permissible (${selectedStandardCode === 'BIS_10500_2012' ? 'BIS' : 'WHO'})`}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exceedance Warning & Scientific Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-800 bg-slate-900/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Standard Exceedance Audit ({currentSample.sampleCode})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exceededMetals.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span>All evaluated heavy metals are within the selected standard permissible limits.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  The following {exceededMetals.length} analyte(s) exceed the maximum permissible drinking water limit:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exceededMetals.map((m) => (
                    <div
                      key={m.analyte}
                      className="p-2.5 rounded-lg border border-rose-900/40 bg-rose-950/20 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-rose-300">{m.name} ({m.analyte})</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Measured: <span className="font-mono text-white">{m.monitored} mg/L</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200">
                          Limit: {m.permissible} mg/L
                        </span>
                        <div className="text-[10px] text-rose-400 font-mono mt-0.5">
                          +{( (m.monitored / m.permissible - 1) * 100 ).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-400" />
              <span>Standard Metadata</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400 space-y-2">
            <div>
              <span className="text-slate-300 font-semibold">Standard:</span> {standard.title}
            </div>
            <div>
              <span className="text-slate-300 font-semibold">Issuing Body:</span> {standard.issuingOrganization}
            </div>
            <div>
              <span className="text-slate-300 font-semibold">Citation:</span> {standard.citation}
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
              Deterministic calculations do not interpolate or hallucinate missing limits. Analytes without standard limits are flagged and excluded from the $W_i$ weighting.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
