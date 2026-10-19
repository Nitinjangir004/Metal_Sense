import React, { useState } from 'react';
import { Scale, ExternalLink, Search, CheckCircle2, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { BIS_10500_2012, WHO_GDWQ_4TH_ED, CANONICAL_METALS } from '@metalsense/shared';

export function StandardsRegistryPage() {
  const [selectedStandard, setSelectedStandard] = useState<'BIS' | 'WHO'>('BIS');
  const [search, setSearch] = useState('');

  const currentStandard = selectedStandard === 'BIS' ? BIS_10500_2012 : WHO_GDWQ_4TH_ED;

  const filteredAnalytes = Object.entries(currentStandard.limits).filter(([symbol, limit]) => {
    const meta = CANONICAL_METALS[symbol as keyof typeof CANONICAL_METALS];
    const q = search.toLowerCase();
    return (
      symbol.toLowerCase().includes(q) ||
      (meta && meta.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Regulatory Standards Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative, traceable regulatory limits for heavy metals in water.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedStandard('BIS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedStandard === 'BIS'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            BIS 10500:2012 (India)
          </button>
          <button
            type="button"
            onClick={() => setSelectedStandard('WHO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedStandard === 'WHO'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            WHO Guidelines (4th Ed)
          </button>
        </div>
      </div>

      {/* Standard Header & Metadata */}
      <Card className="border-slate-800 bg-slate-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">{currentStandard.title}</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Issued by: {currentStandard.issuingOrganization} • Jurisdiction: {currentStandard.jurisdiction}
            </div>
          </div>
          <a
            href={currentStandard.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:underline font-medium"
          >
            <span>Primary Source Document</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="pt-3 text-xs text-slate-400 italic">
          Citation: {currentStandard.citation}
        </div>
      </Card>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Filter by analyte name or symbol (e.g. Arsenic, Pb)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Limits Table */}
      <Card className="border-slate-800 bg-slate-900/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Analyte</th>
                <th className="py-3 px-4 font-semibold">Symbol</th>
                <th className="py-3 px-4 font-semibold">Acceptable / Desirable Limit</th>
                <th className="py-3 px-4 font-semibold">Permissible Max Limit</th>
                <th className="py-3 px-4 font-semibold">Unit</th>
                <th className="py-3 px-4 font-semibold">Regulatory Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAnalytes.map(([symbol, limit]) => {
                const meta = CANONICAL_METALS[symbol as keyof typeof CANONICAL_METALS];
                return (
                  <tr key={symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{meta?.name || symbol}</td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-300">{symbol}</td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {limit.acceptableLimit} {limit.unit}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {limit.permissibleLimit === limit.acceptableLimit
                        ? `${limit.permissibleLimit} ${limit.unit} (No relaxation)`
                        : `${limit.permissibleLimit} ${limit.unit}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{limit.unit}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{limit.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
