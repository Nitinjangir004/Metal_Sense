import React from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Scale,
  ShieldCheck,
  Calculator,
  MapPin,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck2,
  Binary,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';

export function LandingPage() {
  const indices = [
    {
      code: 'HPI',
      name: 'Heavy Metal Pollution Index',
      citation: 'Mohan et al. (1996); Prasad & Bose (2001)',
      description:
        'Weighted composite index where each analyte is weighted inversely to its permissible drinking water threshold. Threshold value of 100 separates safe from critical contamination.',
      formula: 'HPI = (Σ Wi · Qi) / (Σ Wi)',
      application: 'Overall aquifer suitability for drinking and domestic supply.',
    },
    {
      code: 'HEI',
      name: 'Heavy Metal Evaluation Index',
      citation: 'Edet & Offiong (2002)',
      description:
        'Cumulative evaluation ratio measuring monitored concentration against the maximum admissible concentration (MAC). Classifies water into Low (<10), Medium (10–20), and High (>20) pollution.',
      formula: 'HEI = Σ (Hc / Hmac)',
      application: 'Rapid screening against maximum statutory toxicological limits.',
    },
    {
      code: 'Cd',
      name: 'Degree of Contamination',
      citation: 'Backman et al. (1998)',
      description:
        'Aggregated contamination factor summing individual excesses over baseline background values: Cfi = (CAi / CNi) - 1. Low (<1), Medium (1–3), High (>3).',
      formula: 'Cd = Σ Cfi = Σ ((CAi / CNi) - 1)',
      application: 'Quantifying progressive aquifer degradation over natural baseline.',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Ingest Lab Data',
      desc: 'Enter measured parameters manually, upload CSV matrices, or ingest laboratory PDF/image certificates.',
      icon: FileSpreadsheet,
    },
    {
      step: '02',
      title: 'Human-in-the-Loop Review',
      desc: 'Verify OCR-proposed values, detection limits, and qualifiers before any calculation is executed.',
      icon: FileCheck2,
    },
    {
      step: '03',
      title: 'Deterministic Calculation',
      desc: 'Zero black-box LLM arithmetic. Exact TypeScript engine executes peer-reviewed formulas.',
      icon: Calculator,
    },
    {
      step: '04',
      title: 'Regulatory Cross-Audit',
      desc: 'Compare every analyte against traceable standards (BIS 10500:2012, WHO Guidelines).',
      icon: Scale,
    },
    {
      step: '05',
      title: 'Map & Auditable Export',
      desc: 'View geocoded hotspot distributions and generate cryptographic/versioned PDF compliance reports.',
      icon: MapPin,
    },
  ];

  const faqs = [
    {
      q: 'Does MetalSense use AI to calculate pollution scores?',
      a: 'No. AI is never permitted to perform numerical arithmetic or compute index scores. Pollution indices (HPI, HEI, Cd) are evaluated entirely by deterministic, unit-tested mathematical algorithms. AI is strictly utilized for document layout extraction proposals and natural-language summaries of verified results.',
    },
    {
      q: 'Which water quality standards are currently supported?',
      a: 'MetalSense ships with the Bureau of Indian Standards (BIS 10500:2012 Drinking Water Specification, including 2015 amendments) and the World Health Organization (WHO Guidelines for Drinking-water Quality, 4th Edition). Every standard value is directly cited from official regulatory texts.',
    },
    {
      q: 'How are measurements below detection limit (<LOD) handled?',
      a: 'The engine provides transparent, selectable LOD strategies: 0, half-LOD (0.5 × LOD, EPA standard convention), or full LOD. Every calculation report explicitly prints the strategy applied and intermediate calculation tables.',
    },
    {
      q: 'Can laboratory reports with scanned tables be uploaded?',
      a: 'Yes. MetalSense includes a document ingestion pipeline that extracts candidate analyte concentrations from PDFs and images. However, to guarantee scientific rigor, no extracted data is saved until confirmed by a human analyst.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Top Warning Banner: Scientific Integrity */}
      <div className="border-b border-teal-900/50 bg-teal-950/40 px-4 py-2 text-center text-xs text-teal-300">
        <span className="font-semibold text-teal-200">Scientific Integrity Notice:</span> Calculations
        are performed using deterministic algorithms referencing BIS 10500:2012 & WHO standards. AI
        never executes arithmetic.
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.15),rgba(255,255,255,0))]" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/60 px-3.5 py-1 text-xs font-medium text-teal-300 backdrop-blur-sm mb-6">
            <Binary className="h-3.5 w-3.5 text-teal-400" />
            <span>Deterministic Environmental Analytics SaaS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Heavy-Metal Pollution Intelligence for{' '}
            <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-200 bg-clip-text text-transparent">
              Auditable Water Safety
            </span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Ingest lab certificates, validate detection qualifiers, compute peer-reviewed indices
            (HPI, HEI, C<sub>d</sub>), compare against versioned BIS & WHO standards, and export
            reproducible compliance dossiers.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/app/samples/new">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Analyze a Sample
              </Button>
            </Link>
            <Link to="/app">
              <Button size="lg" variant="secondary" leftIcon={<FlaskConical className="w-4 h-4 text-teal-400" />}>
                Explore Demo Workspace
              </Button>
            </Link>
          </div>

          {/* Live System Capabilities Pill */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              BIS 10500:2012 Certified Limits
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              HPI, HEI & C<sub>d</sub> Deterministic Solvers
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              Mandatory Human-in-the-Loop OCR Verification
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Sample Preview Card */}
      <section className="py-12 bg-slate-900/40 border-y border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Badge variant="cyan" size="sm">PREVIEW</Badge>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              Instant Mathematical & Statutory Transparency
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Every computed index reveals unit weightings, sub-indices, and regulatory thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-teal-500/30 bg-slate-900/90">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-400">Benchmark Sample</span>
                <Badge variant="safe">Low Pollution (Safe)</Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white">HPI: 14.2</div>
                <div className="text-xs text-slate-400 mt-1">
                  Threshold: 100 • Evaluated against BIS 10500:2012
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Arsenic (As)</span>
                    <span className="font-mono text-emerald-400">&lt; 0.002 mg/L (Pass)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Lead (Pb)</span>
                    <span className="font-mono text-emerald-400">&lt; 0.002 mg/L (Pass)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Cadmium (Cd)</span>
                    <span className="font-mono text-emerald-400">&lt; 0.0005 mg/L (Pass)</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-amber-500/30 bg-slate-900/90">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-400">Benchmark Sample</span>
                <Badge variant="moderate">Moderate Pollution</Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-amber-300">HPI: 38.6</div>
                <div className="text-xs text-slate-400 mt-1">
                  Threshold: 100 • Agricultural Aquifer Sub-division
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Arsenic (As)</span>
                    <span className="font-mono text-slate-200">0.008 mg/L</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Iron (Fe)</span>
                    <span className="font-mono text-amber-400">0.45 mg/L (&gt; Acceptable)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Zinc (Zn)</span>
                    <span className="font-mono text-slate-200">1.10 mg/L</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-rose-500/30 bg-slate-900/90">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-400">Benchmark Sample</span>
                <Badge variant="high">Critical Pollution</Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-rose-400">HPI: 128.4</div>
                <div className="text-xs text-slate-400 mt-1">
                  Threshold: 100 • Down-gradient Industrial Well
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Lead (Pb)</span>
                    <span className="font-mono text-rose-400">0.028 mg/L (2.8× Limit)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Cadmium (Cd)</span>
                    <span className="font-mono text-rose-400">0.0045 mg/L (1.5× Limit)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-300">Chromium (Cr)</span>
                    <span className="font-mono text-rose-400">0.065 mg/L (1.3× Limit)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Supported Scientific Indices */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-teal-400 text-xs font-mono uppercase tracking-wider">
              Mathematical Formulations
            </span>
            <h2 className="text-3xl font-bold text-white mt-2">
              Peer-Reviewed Water Quality Indices
            </h2>
            <p className="text-slate-300 text-sm mt-2">
              All calculations use documented formulas verified against authoritative hydrological
              literature.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {indices.map((idx) => (
              <Card key={idx.code} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="cyan" size="sm" className="font-mono">
                      {idx.code}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white">{idx.name}</h3>
                  <div className="text-xs font-mono text-teal-400 mt-0.5">{idx.citation}</div>
                  <div className="mt-4 rounded-md bg-slate-950 p-2.5 font-mono text-xs text-slate-200 border border-slate-800">
                    {idx.formula}
                  </div>
                  <p className="mt-4 text-xs text-slate-300 leading-relaxed">{idx.description}</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Application:</span> {idx.application}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="py-16 bg-slate-900/50 border-t border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-teal-400 text-xs font-mono uppercase tracking-wider">
              End-to-End Integrity
            </span>
            <h2 className="text-3xl font-bold text-white mt-2">How MetalSense Works</h2>
            <p className="text-slate-300 text-sm mt-2">
              From raw laboratory reports to auditable compliance dossiers with zero invented data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {workflowSteps.map((ws) => {
              const Icon = ws.icon;
              return (
                <div
                  key={ws.step}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-teal-400">{ws.step}</span>
                      <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="mt-4 font-semibold text-white text-sm">{ws.title}</h4>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">{ws.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm mt-1">
              Methodology, validation parameters, and regulatory compliance details.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-800/80 bg-slate-900/70 p-5"
              >
                <h4 className="font-medium text-white text-sm sm:text-base">{faq.q}</h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to audit groundwater data?</h2>
          <p className="text-slate-300 mt-2 max-w-xl mx-auto text-sm">
            Launch the pre-configured demo workspace to view live evaluations, or enter measured
            samples directly.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/app">
              <Button size="lg" variant="primary">
                Open Demo Workspace
              </Button>
            </Link>
            <Link to="/app/samples/new">
              <Button size="lg" variant="secondary">
                Add Laboratory Sample
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-teal-400" />
            <span className="font-semibold text-slate-300">MetalSense</span>
            <span>— Heavy Metal Pollution Intelligence</span>
          </div>
          <div>Standards: BIS 10500:2012 • WHO 4th Edition • Deterministic Engine v1.0</div>
        </div>
      </footer>
    </div>
  );
}
