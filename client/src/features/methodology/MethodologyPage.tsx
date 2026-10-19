import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calculator,
  Scale,
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';

export function MethodologyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
          <Badge variant="cyan" size="md">
            METHODOLOGY SPECIFICATION v1.0
          </Badge>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Scientific Methodology &amp; Formula Specification
          </h1>
          <p className="mt-2 text-base text-slate-300">
            Mathematical equations, regulatory standards, parameters, and authoritative citations
            governing deterministic calculations in MetalSense.
          </p>
        </div>

        {/* Scientific Integrity Statement */}
        <Alert variant="info" title="Mandatory Scientific Integrity Standard">
          Pollution indices are strictly mathematical functions of measured concentrations,
          documented formulas, units, and selected reference limits. MetalSense never delegates
          arithmetic to large language models. All calculations are executed by auditable,
          deterministic code.
        </Alert>

        {/* 1. Heavy Metal Pollution Index (HPI) */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="cyan">INDEX 01</Badge>
              <span className="text-xs font-mono text-teal-400">Mohan et al. (1996) • Prasad &amp; Bose (2001)</span>
            </div>
            <CardTitle className="text-xl font-bold text-white mt-2">
              Heavy Metal Pollution Index (HPI)
            </CardTitle>
            <CardDescription>
              A weighted composite rating system representing the total heavy metal burden in drinking water.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm border border-slate-800 text-teal-200">
              {'HPI = ( Σ (Wi · Qi) ) / ( Σ Wi )'}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Formula Variables:</h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                <li>
                  <strong className="text-slate-100">Wi (Unit Weightage):</strong> Calculated as Wi = k / Si, where Si is the maximum permissible limit for the i-th heavy metal, and k is the proportionality constant (k = 1). Analytes with lower toxicity thresholds receive higher weights.
                </li>
                <li>
                  <strong className="text-slate-100">Qi (Sub-index):</strong> Evaluated as:
                  <div className="my-1.5 p-2 bg-slate-950 rounded border border-slate-800 font-mono text-xs">
                    {'Qi = ( |Mi - Ii| / (Si - Ii) ) × 100'}
                  </div>
                  Where Mi is the monitored concentration, Ii is the ideal/acceptable value (defaulting to 0 for toxic heavy metals), and Si is the permissible standard limit.
                </li>
                <li>
                  <strong className="text-slate-100">Threshold Classification:</strong> HPI &ge; 100 indicates critical threshold pollution requiring intervention. Values &lt; 25 denote low pollution, and 25–100 denote moderate pollution (Prasad &amp; Bose, 2001).
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 2. Heavy Metal Evaluation Index (HEI) */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="cyan">INDEX 02</Badge>
              <span className="text-xs font-mono text-teal-400">Edet &amp; Offiong (2002)</span>
            </div>
            <CardTitle className="text-xl font-bold text-white mt-2">
              Heavy Metal Evaluation Index (HEI)
            </CardTitle>
            <CardDescription>
              Direct evaluation of monitored heavy metals against Maximum Admissible Concentrations (MAC).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm border border-slate-800 text-teal-200">
              {'HEI = Σ ( Hc / Hmac )'}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Formula Variables:</h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                <li>
                  <strong className="text-slate-100">Hc:</strong> Monitored concentration of the i-th metal in identical units.
                </li>
                <li>
                  <strong className="text-slate-100">Hmac:</strong> Maximum Admissible Concentration prescribed by the active regulatory standard.
                </li>
                <li>
                  <strong className="text-slate-100">Classification Scale:</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-200">
                      <strong>Low Contamination:</strong> HEI &lt; 10
                    </div>
                    <div className="p-2 rounded bg-amber-950/40 border border-amber-800/80 text-xs text-amber-200">
                      <strong>Medium Contamination:</strong> 10 &le; HEI &le; 20
                    </div>
                    <div className="p-2 rounded bg-rose-950/40 border border-rose-800/80 text-xs text-rose-200">
                      <strong>High Contamination:</strong> HEI &gt; 20
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 3. Degree of Contamination (Cd) */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="cyan">INDEX 03</Badge>
              <span className="text-xs font-mono text-teal-400">Backman et al. (1998)</span>
            </div>
            <CardTitle className="text-xl font-bold text-white mt-2">
              Degree of Contamination (Cd)
            </CardTitle>
            <CardDescription>
              Cumulative sum of contamination factors exceeding natural baseline or upper allowable limits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-lg bg-slate-950 p-4 font-mono text-sm border border-slate-800 text-teal-200">
              {'Cd = Σ Cfi, where Cfi = ( CAi / CNi ) - 1'}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Formula Variables:</h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                <li>
                  <strong className="text-slate-100">Cfi:</strong> Contamination factor for the i-th analyte.
                </li>
                <li>
                  <strong className="text-slate-100">CAi:</strong> Monitored analytical concentration.
                </li>
                <li>
                  <strong className="text-slate-100">CNi:</strong> Upper baseline reference concentration (acceptable drinking limit).
                </li>
                <li>
                  <strong className="text-slate-100">Classification Scale:</strong> Cd &lt; 1 (Low), 1 &le; Cd &le; 3 (Medium), Cd &gt; 3 (High).
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 4. Units & LOD Strategy */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">
              Unit Normalization &amp; Detection Limit Handling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm text-slate-300">
            <p>
              For aqueous solutions, standard density approximations apply:
              1 mg/L = 1000 &mu;g/L = 1 ppm, and 1 &mu;g/L = 1 ppb.
              The calculation engine converts all analyte inputs to the regulatory standard unit prior to index summation.
            </p>
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-white">Selectable LOD Strategies:</div>
              <div>• <strong>Half LOD (Default):</strong> Value substituted with 0.5 &times; LOD (Standard US EPA guideline for environmental risk).</div>
              <div>• <strong>Zero:</strong> Value substituted with 0.</div>
              <div>• <strong>Full LOD:</strong> Conservative upper bound assuming analyte is present at detection threshold.</div>
            </div>
          </CardContent>
        </Card>

        {/* References & Citations */}
        <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-400">
          <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-xs">
            Authoritative References:
          </h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              Bureau of Indian Standards (BIS). <em>IS 10500: 2012 Drinking Water — Specification (Second Revision)</em>. New Delhi: BIS, 2012.
            </li>
            <li>
              World Health Organization. <em>Guidelines for drinking-water quality: fourth edition incorporating the first and second addenda</em>. Geneva: WHO, 2022.
            </li>
            <li>
              Prasad, B., &amp; Bose, J. M. (2001). Evaluation of heavy metal pollution in surface and ground water of an industrial area. <em>Environmental Monitoring and Assessment</em>, 67(3), 323-333.
            </li>
            <li>
              Edet, A. E., &amp; Offiong, O. E. (2002). Evaluation of water quality index for heavy metal in groundwaters of Calabar, SE Nigeria. <em>Environmental Geology</em>, 42(7), 776-783.
            </li>
            <li>
              Backman, B., Bodiš, D., Lahermo, P., Rapant, S., &amp; Tarvainen, T. (1998). Application of a summary environmental and quality index for contaminated waters. <em>Environmental Geology</em>, 36(1-2), 55-64.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
