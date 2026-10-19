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
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DEMO_SAMPLES, DEMO_ANALYSES } from '../../data/demoSamples';

export function AnalyticsPage() {
  const [selectedStandard, setSelectedStandard] = useState('BIS_10500_2012');

  // Chart data: HPI comparison across demo wells
  const hpiChartData = DEMO_SAMPLES.map((s) => {
    const a = DEMO_ANALYSES[s.id];
    return {
      code: s.sampleCode,
      name: s.location.name,
      hpi: a ? a.hpi.value : 0,
      threshold: 100,
    };
  });

  // Chart data: Metal concentrations for Industrial Well GW-IND-2026-01 vs BIS acceptable limit
  const sample1 = DEMO_SAMPLES[0];
  const metalsComparisonData = sample1.measurements.map((m) => {
    return {
      analyte: m.symbol,
      monitored: m.value,
      // BIS 10500:2012 acceptable bounds
      bisLimit:
        m.symbol === 'As'
          ? 0.01
          : m.symbol === 'Pb'
          ? 0.01
          : m.symbol === 'Cd'
          ? 0.003
          : m.symbol === 'Cr'
          ? 0.05
          : m.symbol === 'Cu'
          ? 0.05
          : m.symbol === 'Fe'
          ? 0.3
          : m.symbol === 'Zn'
          ? 5.0
          : m.symbol === 'Ni'
          ? 0.02
          : 0.05,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Analytical Comparison & Trends
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Comparative visualization of heavy metal distributions across monitored aquifers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="cyan">BENCHMARK DATA</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HPI Scores Comparison Chart */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">
              Heavy Metal Pollution Index (HPI) Comparison
            </CardTitle>
            <CardDescription>
              Red reference line marks critical pollution threshold ($HPI = 100$).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hpiChartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="code" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 150]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{ value: 'Critical Threshold (100)', fill: '#f43f5e', fontSize: 11 }}
                  />
                  <Bar dataKey="hpi" fill="#14b8a6" radius={[4, 4, 0, 0]} name="HPI Value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Industrial Well Metals vs BIS Limit */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">
              Analyte Concentrations vs BIS Limit (GW-IND-2026-01)
            </CardTitle>
            <CardDescription>
              Evaluated in mg/L against IS 10500:2012 acceptable drinking water bounds.
            </CardDescription>
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
                    dataKey="bisLimit"
                    fill="#e2e8f0"
                    radius={[4, 4, 0, 0]}
                    name="BIS Acceptable Limit (mg/L)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
