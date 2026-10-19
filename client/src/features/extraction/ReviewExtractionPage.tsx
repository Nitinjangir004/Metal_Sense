import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  FileCheck2,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';

export function ReviewExtractionPage() {
  const [candidates, setCandidates] = useState([
    {
      symbol: 'As',
      name: 'Arsenic',
      value: '0.042',
      unit: 'mg/L',
      qualifier: '=',
      page: 1,
      confidence: 0.96,
      confirmed: true,
    },
    {
      symbol: 'Pb',
      name: 'Lead',
      value: '0.028',
      unit: 'mg/L',
      qualifier: '=',
      page: 1,
      confidence: 0.94,
      confirmed: true,
    },
    {
      symbol: 'Cd',
      name: 'Cadmium',
      value: '0.0045',
      unit: 'mg/L',
      qualifier: '=',
      page: 1,
      confidence: 0.88,
      confirmed: true,
    },
    {
      symbol: 'Cr',
      name: 'Chromium (Total)',
      value: '0.065',
      unit: 'mg/L',
      qualifier: '=',
      page: 1,
      confidence: 0.91,
      confirmed: true,
    },
    {
      symbol: 'Fe',
      name: 'Iron',
      value: '1.45',
      unit: 'mg/L',
      qualifier: '=',
      page: 2,
      confidence: 0.98,
      confirmed: true,
    },
    {
      symbol: 'Ni',
      name: 'Nickel',
      value: '0.035',
      unit: 'mg/L',
      qualifier: '=',
      page: 2,
      confidence: 0.82,
      confirmed: false, // flagged for human attention
    },
  ]);

  const handleToggleConfirm = (index: number) => {
    const updated = [...candidates];
    updated[index].confirmed = !updated[index].confirmed;
    setCandidates(updated);
  };

  const handleValueChange = (index: number, val: string) => {
    const updated = [...candidates];
    updated[index].value = val;
    setCandidates(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Document Extraction Verification
            </h1>
            <Badge variant="cyan">HUMAN REVIEW REQUIRED</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Source: <span className="font-mono text-slate-300">EnviroTech_Certificate_892.pdf</span> (Extracted via OCR Adapter)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Re-run Extraction
          </Button>
          <Link to="/app/samples/demo-sample-001">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Save Verified Data
            </Button>
          </Link>
        </div>
      </div>

      <Alert variant="warning" title="Mandatory Human Review Rule">
        AI/OCR produces candidate measurements, not verified scientific evidence. You must review
        every concentration and qualifier against the document page reference before calculations can
        be generated.
      </Alert>

      {/* Two Column Layout: Document Info + Candidate Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document Metadata & Preview Card */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Source Document Metadata</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3 text-xs">
              <div>
                <span className="text-slate-400">File Name:</span>
                <div className="font-mono text-slate-200 mt-0.5">EnviroTech_Cert_892.pdf</div>
              </div>
              <div>
                <span className="text-slate-400">Detected Lab:</span>
                <div className="text-slate-200 mt-0.5">EnviroTech Analytical Labs (NABL)</div>
              </div>
              <div>
                <span className="text-slate-400">Detected Sample ID:</span>
                <div className="font-mono text-slate-200 mt-0.5">GW-IND-2026-01</div>
              </div>
              <div>
                <span className="text-slate-400">Extracted Date:</span>
                <div className="text-slate-200 mt-0.5">12 March 2026</div>
              </div>
              <div>
                <span className="text-slate-400">SHA-256 Checksum:</span>
                <div className="font-mono text-slate-400 text-[10px] break-all mt-0.5">
                  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4 text-center">
            <div className="border border-slate-800 bg-slate-950 rounded-lg p-6 text-xs text-slate-400">
              <Eye className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <span>Document Page Preview Active</span>
              <p className="text-[11px] text-slate-500 mt-1">2 Pages Ingested</p>
            </div>
          </Card>
        </div>

        {/* Right: Candidate Values Review Table */}
        <div className="lg:col-span-8">
          <Card className="border-slate-800 bg-slate-900/90 overflow-hidden">
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white">
                  Proposed Analyte Concentrations
                </CardTitle>
                <CardDescription>
                  Verify detected numerical values, detection limits, and units. Edit directly if needed.
                </CardDescription>
              </div>
              <Badge variant="safe">
                {candidates.filter((c) => c.confirmed).length} / {candidates.length} Confirmed
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Analyte</th>
                      <th className="py-3 px-4 font-semibold">Qualifier</th>
                      <th className="py-3 px-4 font-semibold">Value</th>
                      <th className="py-3 px-4 font-semibold">Unit</th>
                      <th className="py-3 px-4 font-semibold">Confidence</th>
                      <th className="py-3 px-4 font-semibold">Source Page</th>
                      <th className="py-3 px-4 font-semibold text-center">Confirm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {candidates.map((cand, idx) => (
                      <tr
                        key={cand.symbol}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !cand.confirmed ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <span className="font-mono font-bold text-white">{cand.symbol}</span>
                          <span className="text-slate-400 text-xs ml-2">({cand.name})</span>
                        </td>

                        <td className="py-2.5 px-4 font-mono text-slate-300">
                          {cand.qualifier}
                        </td>

                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={cand.value}
                            onChange={(e) => handleValueChange(idx, e.target.value)}
                            className="w-24 rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                          />
                        </td>

                        <td className="py-2.5 px-4 font-mono text-slate-300">{cand.unit}</td>

                        <td className="py-2.5 px-4 font-mono">
                          <span
                            className={
                              cand.confidence > 0.9
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }
                          >
                            {(cand.confidence * 100).toFixed(0)}%
                          </span>
                        </td>

                        <td className="py-2.5 px-4 text-slate-400">Page {cand.page}</td>

                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleConfirm(idx)}
                            className={`p-1.5 rounded-md transition-colors ${
                              cand.confirmed
                                ? 'bg-teal-950 border border-teal-600 text-teal-300'
                                : 'bg-slate-800 text-slate-500 hover:text-white'
                            }`}
                            title={cand.confirmed ? 'Confirmed' : 'Click to confirm'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
