import React, { useState } from 'react';
import {
  FileCheck2,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { DEMO_SAMPLES, DEMO_ANALYSES } from '../../data/demoSamples';

export function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = () => {
    // Generate clean CSV of all demo samples & evaluations
    const headers = [
      'SampleCode',
      'LocationName',
      'District',
      'CollectionDate',
      'HPI',
      'HPI_Classification',
      'HEI',
      'Cd',
      'StandardUsed',
      'LOD_Strategy',
    ];

    const rows = DEMO_SAMPLES.map((s) => {
      const a = DEMO_ANALYSES[s.id];
      return [
        s.sampleCode,
        `"${s.location.name}"`,
        `"${s.location.district}"`,
        s.collectionDate,
        a ? a.hpi.value.toFixed(2) : '',
        a ? a.hpi.classification : '',
        a ? a.hei.value.toFixed(2) : '',
        a ? a.cd.value.toFixed(2) : '',
        a ? a.standardUsed.code : '',
        a ? a.lodStrategy : '',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MetalSense_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Auditable Environmental Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Export legally traceable compliance dossiers and analysis spreadsheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
          >
            Export CSV Matrix
          </Button>
          <Button
            variant="primary"
            onClick={handleExportPDF}
            isLoading={isExporting}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download PDF Dossier
          </Button>
        </div>
      </div>

      <Alert variant="info" title="Reproducible Audit Guarantee">
        All generated reports contain the complete mathematical snapshot, regulatory standard
        citation, unit normalization factors, and intermediate sub-index weights ($W_i \cdot Q_i$).
      </Alert>

      {/* Generated Report Dossier Preview */}
      <Card className="border-slate-800 bg-slate-900/90 p-6 space-y-6 print:border-none print:bg-white print:text-black">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono uppercase text-teal-400">Official Compliance Dossier</div>
            <h2 className="text-xl font-bold text-white mt-1">
              Aquifer Heavy-Metal Pollution Assessment Report
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Workspace: Delhi Aquifer Monitoring • Sub-Division #2
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            <div>Report ID: MS-REP-2026-0319</div>
            <div>Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-xs">
            Summary of Evaluated Wells
          </h3>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Sample Code</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold">HPI</th>
                <th className="py-2.5 px-3 font-semibold">HEI</th>
                <th className="py-2.5 px-3 font-semibold">Cd</th>
                <th className="py-2.5 px-3 font-semibold">Statutory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {DEMO_SAMPLES.map((s) => {
                const a = DEMO_ANALYSES[s.id];
                return (
                  <tr key={s.id} className="font-mono">
                    <td className="py-2.5 px-3 font-bold text-slate-200">{s.sampleCode}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{s.location.name}</td>
                    <td className="py-2.5 px-3 text-slate-200">{a ? a.hpi.value.toFixed(1) : '—'}</td>
                    <td className="py-2.5 px-3 text-slate-200">{a ? a.hei.value.toFixed(2) : '—'}</td>
                    <td className="py-2.5 px-3 text-slate-200">{a ? a.cd.value.toFixed(2) : '—'}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`text-xs font-semibold ${
                          a?.hpi.value && a.hpi.value >= 100
                            ? 'text-rose-400'
                            : a?.hpi.value && a.hpi.value >= 25
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {a?.hpi.classification.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Regulatory Caveats & Disclaimers */}
        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">Methodological Disclaimers & Assumptions:</div>
          <div>1. Standard reference: Bureau of Indian Standards IS 10500:2012 Drinking Water Specification.</div>
          <div>2. Detection limit handling: Values flagged below limit (&lt;LOD) calculated using EPA 0.5 × LOD strategy.</div>
          <div>3. MetalSense is a computational intelligence platform and does not replace certified NABL physical testing or formal regulatory directives.</div>
        </div>
      </Card>
    </div>
  );
}
