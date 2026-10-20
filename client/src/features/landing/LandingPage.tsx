import React, { useState } from 'react';
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
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const indices = [
    {
      code: 'HPI',
      name: 'Heavy Metal Pollution Index',
      citation: 'Mohan et al. (1996); Prasad & Bose (2001)',
      desc: 'Evaluates aggregate aquifer suitability by weighting each heavy metal inversely to its statutory permissible threshold. Score ≥ 100 flags critical contamination.',
      formula: 'HPI = (\\sum W_i \\cdot Q_i) / (\\sum W_i)',
    },
    {
      code: 'HEI',
      name: 'Heavy Metal Evaluation Index',
      citation: 'Edet & Offiong (2002)',
      desc: 'Cumulative ratio measuring monitored metal levels against the maximum admissible concentration (MAC). Classifies water into Low (<10), Medium (10–20), and High (>20) pollution.',
      formula: 'HEI = \\sum (H_c / H_{mac})',
    },
    {
      code: 'Cd',
      name: 'Degree of Contamination',
      citation: 'Backman et al. (1998)',
      desc: 'Quantifies cumulative environmental degradation over normative baseline values: Cfi = (CAi / CNi) - 1. Classifies into Low (<1), Medium (1–3), and High (>3).',
      formula: 'C_d = \\sum C_{fi} = \\sum ((C_{Ai} / C_{Ni}) - 1)',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Upload or Enter Data',
      desc: 'Import multi-station laboratory CSVs, paste matrices, or upload scanned certificates (PDF/Images).',
      icon: FileSpreadsheet,
    },
    {
      step: '02',
      title: 'Deterministic Calculation',
      desc: 'Zero LLM arithmetic. Exact TypeScript algorithms execute peer-reviewed formulas with transparent LOD substitution.',
      icon: Calculator,
    },
    {
      step: '03',
      title: 'Compliance Audit & Export',
      desc: 'Cross-reference statutory limits (BIS 10500:2012, WHO) and generate versioned, cryptographic PDF dossiers.',
      icon: FileCheck2,
    },
  ];

  const faqs = [
    {
      q: 'Does MetalSense use AI to calculate pollution scores?',
      a: 'No. AI is never permitted to perform numerical arithmetic or compute index scores. Pollution indices (HPI, HEI, Cd) are evaluated entirely by deterministic, unit-tested mathematical algorithms. AI is strictly utilized for document layout extraction proposals and natural-language summaries of verified results.',
    },
    {
      q: 'Which water quality standards are currently supported?',
      a: 'MetalSense ships with the Bureau of Indian Standards (BIS IS 10500:2012 Drinking Water Specification, including 2015 amendments) and the World Health Organization (WHO Guidelines for Drinking-water Quality, 4th Edition). Every standard value is directly cited from official regulatory texts.',
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
    <div className="flex min-h-screen flex-col bg-[#E9F4EA] text-[#0F1F17]">
      {/* Top Banner */}
      <div className="border-b border-[#BED4BC]/60 bg-[#ECF5EB] px-4 py-2 text-center text-xs text-[#002F18] font-semibold">
        <span>Scientific Integrity Notice: Calculations are deterministic pure functions referencing BIS 10500:2012 &amp; WHO standards. AI never executes arithmetic.</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#DFEADD] bg-[#E9F4EA]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#002F18]">
              <FlaskConical className="h-4 w-4 text-[#E9F4EA]" />
            </div>
            <span className="font-extrabold tracking-tight text-[#0F1F17] text-lg">
              Metal<span className="text-[#2E7D55]">Sense</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/app/methodology" className="text-xs font-semibold text-[#4B5F54] hover:text-[#002F18] hidden sm:inline">
              Methodology
            </Link>
            <Link to="/app/standards" className="text-xs font-semibold text-[#4B5F54] hover:text-[#002F18] hidden sm:inline">
              Standards
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Get started free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#BED4BC] bg-[#ECF5EB] px-4 py-1.5 text-xs font-semibold text-[#002F18] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#2E7D55]" />
            <span>Auditable Groundwater Heavy Metal Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#0F1F17] leading-[1.15]">
            Heavy Metal Pollution Intelligence with <span className="text-[#2E7D55]">Mathematical Rigor</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#4B5F54] leading-relaxed">
            Ingest laboratory water quality test reports, validate detection limits, calculate peer-reviewed pollution indices (HPI, HEI, C<sub>d</sub>), and generate statutory compliance dossiers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/signup">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Get started free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign in to workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Step "How It Works" Section */}
      <section className="py-16 bg-[#ECF5EB] border-y border-[#DFEADD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1F17]">
              Three Steps from Lab Certificate to Audit Dossier
            </h2>
            <p className="text-sm text-[#4B5F54] mt-2">
              Engineered specifically for hydrologists, environmental laboratories, and municipal water authorities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflowSteps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="rounded-[28px] border border-[#DFEADD] bg-[#F0FCEF] p-8 shadow-card flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-full bg-[#002F18] text-white flex items-center justify-center font-bold text-sm">
                        {s.step}
                      </div>
                      <Icon className="w-6 h-6 text-[#2E7D55]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0F1F17]">{s.title}</h3>
                    <p className="text-xs text-[#4B5F54] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Supported Scientific Indices */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1F17]">
              Peer-Reviewed Mathematical Indices
            </h2>
            <p className="text-sm text-[#4B5F54] mt-2">
              Every index is executed via pure TypeScript functions independent of LLMs, adhering strictly to published environmental literature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {indices.map((idx) => (
              <Card key={idx.code} className="p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="cyan" size="sm">
                      {idx.code}
                    </Badge>
                    <span className="text-[11px] text-[#7C8F84] font-medium">{idx.citation}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#0F1F17]">{idx.name}</h3>
                  <p className="text-xs text-[#4B5F54] leading-relaxed">{idx.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#DFEADD]">
                  <div className="text-[11px] font-mono text-[#002F18] bg-[#DFEADD]/50 px-3 py-1.5 rounded-full font-bold">
                    {idx.formula}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 bg-[#ECF5EB] border-t border-[#DFEADD]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#0F1F17]">Frequently Asked Questions</h2>
            <p className="text-xs text-[#4B5F54] mt-1">Transparency on our methodology and security model.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-[20px] border border-[#DFEADD] bg-[#F0FCEF] p-4 cursor-pointer transition-colors"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-sm text-[#0F1F17]">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#2E7D55] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {isOpen && (
                    <p className="text-xs text-[#4B5F54] leading-relaxed mt-2 pt-2 border-t border-[#DFEADD]">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[#DFEADD] bg-[#E9F4EA] text-center text-xs text-[#7C8F84]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[#2E7D55]" />
            <span className="font-bold text-[#0F1F17]">MetalSense Platform</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-4 font-semibold text-[#4B5F54]">
            <Link to="/app/methodology" className="hover:text-[#002F18]">
              Methodology
            </Link>
            <Link to="/app/standards" className="hover:text-[#002F18]">
              Standards
            </Link>
            <Link to="/login" className="hover:text-[#002F18]">
              Sign in
            </Link>
            <Link to="/signup" className="hover:text-[#002F18]">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
