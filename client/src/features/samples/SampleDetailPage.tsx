import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  FileCheck2,
  Scale,
  Calculator,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { Alert } from '../../components/ui/Alert';
import { DEMO_SAMPLES, DEMO_ANALYSES } from '../../data/demoSamples';

export function SampleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sample = DEMO_SAMPLES.find((s) => s.id === id) || DEMO_SAMPLES[0];
  const analysis = DEMO_ANALYSES[sample.id];

  const [isExplaining, setIsExplaining] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);

  return (
    <div className="space-y-6">
      {/* Top Header / Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/app/samples">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              All Samples
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span>{sample.sampleCode}</span>
            <ProvenanceBadge provenance={sample.provenance} />
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/app/reports">
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4 text-teal-400" />}>
              Download Audit PDF
            </Button>
          </Link>
        </div>
      </div>

      {/* Metadata Overview Card */}
      <Card className="border-slate-800 bg-slate-900/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Sampling Location</div>
            <div className="font-semibold text-white mt-1">{sample.location.name}</div>
            <div className="text-slate-500 mt-0.5">{sample.location.district}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Collection Date &amp; Matrix</div>
            <div className="font-semibold text-white mt-1">
              {new Date(sample.collectionDate).toLocaleString()}
            </div>
            <div className="text-slate-500 mt-0.5 capitalize">{sample.sampleMatrix.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Testing Laboratory</div>
            <div className="font-semibold text-white mt-1">{sample.laboratory?.name || 'In-house Lab'}</div>
            <div className="text-slate-500 mt-0.5">Accreditation: {sample.laboratory?.accreditationNumber || 'N/A'}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Regulatory Standard Applied</div>
            <div className="font-semibold text-teal-400 mt-1">BIS 10500:2012</div>
            <div className="text-slate-500 mt-0.5">LOD Strategy: EPA Half-LOD</div>
          </div>
        </div>
      </Card>

      {/* Calculated Pollution Indices Grid */}
      {analysis && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">HPI (Heavy Metal Pollution Index)</span>
              <StatusBadge status={analysis.hpi.classification} />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">
              {analysis.hpi.value.toFixed(1)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Critical Threshold: 100 • Evaluated metals: {analysis.hpi.evaluatedAnalytesCount}
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">HEI (Evaluation Index)</span>
              <StatusBadge status={analysis.hei.classification} />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">
              {analysis.hei.value.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Scale: &lt;10 Low, 10–20 Medium, &gt;20 High
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Cd (Contamination Degree)</span>
              <StatusBadge status={analysis.cd.classification} />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">
              {analysis.cd.value.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Scale: &lt;1 Low, 1–3 Medium, &gt;3 High
            </div>
          </Card>
        </div>
      )}

      {/* Grounded AI Explanation & Follow-up Section */}
      {analysis && showExplanation && (
        <Card className="border-teal-800/60 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/30">
          <CardHeader className="border-b border-slate-800/80 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>AI-Assisted Interpretation &amp; Follow-up Recommendations</span>
              </CardTitle>
              <CardDescription>
                Strictly grounded in deterministic calculation outputs • Zero arithmetic hallucination.
              </CardDescription>
            </div>
            <Badge variant="cyan" size="sm" className="font-mono">
              GROUNDED IN BIS 10500:2012
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs sm:text-sm text-slate-300">
            {/* Executive Narrative */}
            <div className="rounded-lg bg-slate-950/70 p-4 border border-slate-800 leading-relaxed text-slate-200">
              {analysis.hpi.value >= 100 ? (
                <span>
                  Sample <strong>{sample.sampleCode}</strong> demonstrates{' '}
                  <span className="text-rose-400 font-bold">critical heavy-metal contamination</span>{' '}
                  with an HPI score of <strong>{analysis.hpi.value.toFixed(1)}</strong>, well above the
                  statutory threshold of 100 under BIS 10500:2012. Contamination is primarily driven by{' '}
                  {analysis.exceededAnalytes.map((m) => `${m.symbol} (${m.ratio.toFixed(1)}× permissible limit)`).join(', ')}.
                </span>
              ) : analysis.hpi.value >= 25 ? (
                <span>
                  Sample <strong>{sample.sampleCode}</strong> demonstrates{' '}
                  <span className="text-amber-400 font-bold">moderate heavy-metal burden</span> with an
                  HPI of <strong>{analysis.hpi.value.toFixed(1)}</strong>. While remaining within overall
                  permissible drinking limits, elevated individual parameters warrant monitoring.
                </span>
              ) : (
                <span>
                  Sample <strong>{sample.sampleCode}</strong> demonstrates{' '}
                  <span className="text-emerald-400 font-bold">pristine aquifer quality</span> with an
                  HPI score of <strong>{analysis.hpi.value.toFixed(1)}</strong>, comfortably below the
                  threshold of 100. All monitored metals satisfy acceptable drinking water guidelines.
                </span>
              )}
            </div>

            {/* Exceeded Metals Risk Context */}
            {analysis.exceededAnalytes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Toxicological &amp; Statutory Risk Profile</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysis.exceededAnalytes.map((m) => (
                    <div
                      key={m.symbol}
                      className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-white">{m.symbol}</span>
                        <Badge variant="high" size="sm">
                          {m.ratio.toFixed(1)}× Permissible Limit
                        </Badge>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Measured: {m.monitored} mg/L vs Permissible: {m.permissible} mg/L
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Environmental Checks */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Actionable Follow-up Checks</span>
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                {analysis.exceededAnalytes.length > 0 ? (
                  <>
                    <li>Perform confirmatory re-testing with ICP-MS or AAS instrumentation.</li>
                    <li>Survey up-gradient boreholes within 500 meters to isolate industrial discharge point sources.</li>
                    <li>Inspect groundwater abstraction depth and casing integrity against shallow seepage.</li>
                  </>
                ) : (
                  <>
                    <li>Maintain scheduled seasonal baseline groundwater monitoring.</li>
                    <li>Archive digital audit trace in workspace compliance records.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Scientific Caveat / Disclaimer */}
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 italic">
              Disclaimer: This AI summary is strictly grounded in deterministic indices (HPI, HEI, Cd).
              It does not assess microbiological, pesticide, or radiological potability and does not
              substitute for certified regulatory or medical inspection.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Breakdown Table: Wi, Qi, Sub-Index Calculations */}
      <Card className="border-slate-800 bg-slate-900/90 overflow-hidden">
        <CardHeader className="border-b border-slate-800 pb-3">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-teal-400" />
            <span>Deterministic Traceability Matrix (HPI Breakdown)</span>
          </CardTitle>
          <CardDescription>
            Intermediate mathematical values used to calculate the HPI score according to Mohan et al. (1996) and Prasad &amp; Bose (2001).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Analyte</th>
                  <th className="py-3 px-4 font-semibold">Monitored Conc. (M<sub>i</sub>)</th>
                  <th className="py-3 px-4 font-semibold">Acceptable (I<sub>i</sub>)</th>
                  <th className="py-3 px-4 font-semibold">Permissible (S<sub>i</sub>)</th>
                  <th className="py-3 px-4 font-semibold">Unit Weight (W<sub>i</sub>)</th>
                  <th className="py-3 px-4 font-semibold">Sub-index (Q<sub>i</sub>)</th>
                  <th className="py-3 px-4 font-semibold">W<sub>i</sub> &middot; Q<sub>i</sub></th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {analysis?.hpi.traces.map((trace) => (
                  <tr key={trace.symbol} className="hover:bg-slate-800/30 font-mono">
                    <td className="py-2.5 px-4 font-bold text-white">{trace.symbol}</td>
                    <td className="py-2.5 px-4 text-slate-200">{trace.monitoredConcentration} mg/L</td>
                    <td className="py-2.5 px-4 text-slate-400">{trace.acceptableLimit} mg/L</td>
                    <td className="py-2.5 px-4 text-slate-400">{trace.permissibleLimit} mg/L</td>
                    <td className="py-2.5 px-4 text-slate-300">{trace.unitWeight.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-slate-300">{trace.subIndex.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-teal-300 font-semibold">
                      {trace.weightedSubIndex.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <StatusBadge status={trace.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail & Reproducibility Footnote */}
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 space-y-1 font-mono">
        <div>Algorithm: {analysis?.auditTrail.formulaVersion}</div>
        <div>Engine: {analysis?.auditTrail.engineVersion}</div>
        <div>Calculated Timestamp: {analysis?.auditTrail.calculatedAt}</div>
      </div>
    </div>
  );
}
