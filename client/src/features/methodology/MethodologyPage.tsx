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
import { MathBlock, MathInline } from '../../components/ui/Math';

export function MethodologyPage() {
  return (
    <div className="min-h-screen bg-[#E9F4EA] text-[#0F1F17] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
          <Badge variant="cyan" size="md">
            METHODOLOGY SPECIFICATION v1.1
          </Badge>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F1F17]">
            Scientific Methodology &amp; Formula Specification
          </h1>
          <p className="mt-2 text-base text-[#4B5F54]">
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
        <Card className="p-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="cyan">INDEX 01</Badge>
              <span className="text-xs font-mono text-[#2E7D55]">
                Mohan et al. (1996) • Prasad &amp; Bose (2001)
              </span>
            </div>
            <CardTitle className="text-xl font-bold text-[#0F1F17] mt-2">
              Heavy Metal Pollution Index (HPI)
            </CardTitle>
            <CardDescription>
              A weighted composite rating system representing the total heavy metal burden in drinking water.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#4B5F54]">
            <div className="rounded-[20px] bg-[#F0FCEF] p-4 border border-[#DFEADD]">
              <MathBlock formula="\text{HPI} = \frac{\sum_{i=1}^{n} (W_i \cdot Q_i)}{\sum_{i=1}^{n} W_i}" />
            </div>

            <p>
              where <MathInline formula="W_i" /> is the unit weightage for the <MathInline formula="i" />-th parameter, inversely proportional to the maximum permissible concentration <MathInline formula="S_i" />:
            </p>
            <div className="rounded-[20px] bg-[#F0FCEF] p-4 border border-[#DFEADD]">
              <MathBlock formula="W_i = \frac{k}{S_i} \quad (k = 1)" />
            </div>

            <p>
              and <MathInline formula="Q_i" /> is the individual sub-index rating of the <MathInline formula="i" />-th heavy metal:
            </p>
            <div className="rounded-[20px] bg-[#F0FCEF] p-4 border border-[#DFEADD]">
              <MathBlock formula="Q_i = \frac{|M_i - I_i|}{S_i - I_i} \times 100" />
            </div>
            <p className="text-xs leading-relaxed">
              where <MathInline formula="M_i" /> is the monitored concentration, <MathInline formula="I_i" /> is the ideal desirable value (0 for toxic heavy metals), and <MathInline formula="S_i" /> is the standard permissible limit.
            </p>
            <div className="p-3 bg-[#DDF3E6] rounded-[20px] text-xs text-[#1F8A5B] font-semibold">
              Critical Classification Threshold: HPI &ge; 100 denotes water critically contaminated with heavy metals.
            </div>
          </CardContent>
        </Card>

        {/* 2. Heavy Metal Evaluation Index (HEI) */}
        <Card className="p-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="cyan">INDEX 02</Badge>
              <span className="text-xs font-mono text-[#2E7D55]">Edet &amp; Offiong (2002)</span>
            </div>
            <CardTitle className="text-xl font-bold text-[#0F1F17] mt-2">
              Heavy Metal Evaluation Index (HEI)
            </CardTitle>
            <CardDescription>
              A cumulative toxicological ratio comparing measured concentrations against maximum admissible concentrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#4B5F54]">
            <div className="rounded-[20px] bg-[#F0FCEF] p-4 border border-[#DFEADD]">
              <MathBlock formula="\text{HEI} = \sum_{i=1}^{n} \frac{H_c}{H_{\text{mac}}}" />
            </div>
            <p>
              where <MathInline formula="H_c" /> is the monitored concentration and <MathInline formula="H_{\text{mac}}" /> is the maximum admissible concentration specified by the regulatory standard.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-3 rounded-[20px] bg-[#DDF3E6] text-[#1F8A5B] font-semibold">
                Low Pollution: HEI &lt; 10
              </div>
              <div className="p-3 rounded-[20px] bg-[#FBF0D6] text-[#B7791F] font-semibold">
                Medium Pollution: 10 &le; HEI &le; 20
              </div>
              <div className="p-3 rounded-[20px] bg-[#FBE3E1] text-[#C2413B] font-semibold">
                High Pollution: HEI &gt; 20
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Degree of Contamination (Cd) */}
        <Card className="p-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="cyan">INDEX 03</Badge>
              <span className="text-xs font-mono text-[#2E7D55]">Backman et al. (1998)</span>
            </div>
            <CardTitle className="text-xl font-bold text-[#0F1F17] mt-2">
              Degree of Contamination (C<sub>d</sub>)
            </CardTitle>
            <CardDescription>
              Evaluates the degree of contamination by summing the contamination factors of all exceeded elements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#4B5F54]">
            <div className="rounded-[20px] bg-[#F0FCEF] p-4 border border-[#DFEADD]">
              <MathBlock formula="C_d = \sum_{i=1}^{n} C_{fi} \quad \text{where} \quad C_{fi} = \frac{C_{Ai}}{C_{Ni}} - 1" />
            </div>
            <p>
              where <MathInline formula="C_{Ai}" /> is the monitored concentration and <MathInline formula="C_{Ni}" /> is the upper permissible limit (<MathInline formula="S_i" />).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-3 rounded-[20px] bg-[#DDF3E6] text-[#1F8A5B] font-semibold">
                Low Contamination: C<sub>d</sub> &lt; 1
              </div>
              <div className="p-3 rounded-[20px] bg-[#FBF0D6] text-[#B7791F] font-semibold">
                Medium Contamination: 1 &le; C<sub>d</sub> &le; 3
              </div>
              <div className="p-3 rounded-[20px] bg-[#FBE3E1] text-[#C2413B] font-semibold">
                High Contamination: C<sub>d</sub> &gt; 3
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Traceable Literature Citations */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F1F17]">
              Peer-Reviewed Scientific Citations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-[#4B5F54] leading-relaxed">
            <div>
              <strong>Mohan, S. V., Nithila, P., &amp; Reddy, S. J. (1996).</strong> Estimation of heavy metal in drinking water and development of heavy metal pollution index. <em>Journal of Environmental Science &amp; Health Part A</em>, 31(2), 283–289.
            </div>
            <div>
              <strong>Prasad, B., &amp; Bose, J. M. (2001).</strong> Evaluation of the heavy metal pollution index for ground water of an active mining area. <em>Environmental Monitoring and Assessment</em>, 68(3), 273–283.
            </div>
            <div>
              <strong>Edet, A. E., &amp; Offiong, O. E. (2002).</strong> Evaluation of water quality pollution indices for heavy metal contamination monitoring. A study case from Akpabuyo-Odukpani area, Lower Cross River Basin (southeastern Nigeria). <em>GeoJournal</em>, 57(4), 295–304.
            </div>
            <div>
              <strong>Backman, B., Bodiš, D., Lahermo, P., Rapant, S., &amp; Tarvainen, T. (1998).</strong> Application of a summary environmental index in evaluating water quality. <em>Environmental Geology</em>, 36(1-2), 107–113.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
