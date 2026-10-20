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
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1F17]">
            Regulatory Standards Registry
          </h1>
          <p className="text-sm text-[#4B5F54] mt-1">
            Authoritative, traceable regulatory limits for heavy metals in water.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#ECF5EB] p-1 rounded-full border border-[#DFEADD]">
          <button
            type="button"
            onClick={() => setSelectedStandard('BIS')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              selectedStandard === 'BIS'
                ? 'bg-[#002F18] text-white shadow-soft'
                : 'text-[#4B5F54] hover:text-[#0F1F17]'
            }`}
          >
            BIS IS 10500:2012 (India)
          </button>
          <button
            type="button"
            onClick={() => setSelectedStandard('WHO')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              selectedStandard === 'WHO'
                ? 'bg-[#002F18] text-white shadow-soft'
                : 'text-[#4B5F54] hover:text-[#0F1F17]'
            }`}
          >
            WHO Guidelines (4th Ed)
          </button>
        </div>
      </div>

      {/* Standard Metadata Header Card */}
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#0F1F17]">{currentStandard.title}</h2>
            <Badge variant="cyan">{currentStandard.jurisdiction}</Badge>
          </div>
          <p className="text-xs text-[#4B5F54] leading-relaxed">
            {currentStandard.citation}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#2E7D55] font-semibold">
            <span>Jurisdiction: {currentStandard.jurisdiction}</span>
            <span>•</span>
            <span>Version: {currentStandard.version}</span>
            <span>•</span>
            <a
              href={currentStandard.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:underline text-[#002F18]"
            >
              <span>Official Reference Text</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Card>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7C8F84]" />
        <input
          type="text"
          placeholder="Filter limits by element name or symbol (e.g. Arsenic, Pb)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-full bg-[#ECF5EB] border border-[#DFEADD] text-xs text-[#0F1F17] placeholder-[#7C8F84] focus:outline-none focus:border-[#002F18] shadow-sm"
        />
      </div>

      {/* Analytes Limits Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#DFEADD]/50 text-[#4B5F54] border-b border-[#DFEADD] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Symbol</th>
                <th className="py-3 px-4 font-semibold">Heavy Metal Name</th>
                <th className="py-3 px-4 font-semibold">Acceptable Limit (Ideal)</th>
                <th className="py-3 px-4 font-semibold">Permissible Limit (S<sub>i</sub>)</th>
                <th className="py-3 px-4 font-semibold">Unit Weight (W<sub>i</sub> = 1/S<sub>i</sub>)</th>
                <th className="py-3 px-4 font-semibold">Regulatory Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFEADD]/80">
              {filteredAnalytes.map(([symbol, limit]) => {
                const meta = CANONICAL_METALS[symbol as keyof typeof CANONICAL_METALS];
                const wi = 1.0 / limit.permissibleLimit;

                return (
                  <tr key={symbol} className="hover:bg-[#DFEADD]/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#002F18]">{symbol}</td>
                    <td className="py-3 px-4 font-semibold text-[#0F1F17]">{meta?.name || symbol}</td>
                    <td className="py-3 px-4 font-mono text-[#002F18]">
                      {limit.acceptableLimit} {limit.unit}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#C2413B]">
                      {limit.permissibleLimit} {limit.unit}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#2E7D55]">{wi.toFixed(2)}</td>
                    <td className="py-3 px-4 text-[#4B5F54] max-w-xs">{limit.notes}</td>
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
