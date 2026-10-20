import React, { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { BIS_10500_2012, WHO_GDWQ_4TH_ED, CANONICAL_METALS } from '@metalsense/shared';
import { cn } from '../../lib/utils';

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
      <PageHeader
        title="Regulatory Standards Registry"
        description="Authoritative, traceable regulatory limits for heavy metals in drinking and groundwater."
        actions={
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-pill-unselected border border-inset">
            <button
              type="button"
              onClick={() => setSelectedStandard('BIS')}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer',
                selectedStandard === 'BIS'
                  ? 'bg-forest-900 text-white shadow-soft'
                  : 'text-body hover:text-title'
              )}
            >
              BIS IS 10500:2012 (India)
            </button>
            <button
              type="button"
              onClick={() => setSelectedStandard('WHO')}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer',
                selectedStandard === 'WHO'
                  ? 'bg-forest-900 text-white shadow-soft'
                  : 'text-body hover:text-title'
              )}
            >
              WHO Guidelines (4th Ed)
            </button>
          </div>
        }
      />

      {/* Standard Metadata Header Card */}
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-title">{currentStandard.title}</h2>
            <Badge variant="cyan">{currentStandard.jurisdiction}</Badge>
          </div>
          <p className="text-xs text-body leading-relaxed">
            {currentStandard.citation}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-forest-700 font-semibold">
            <span>Jurisdiction: {currentStandard.jurisdiction}</span>
            <span>•</span>
            <span>Version: {currentStandard.version}</span>
            <span>•</span>
            <a
              href={currentStandard.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:underline text-forest-900"
            >
              <span>Official Reference Text</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Card>

      {/* Search Input */}
      <div className="relative">
        <Input
          icon={<Search className="w-4 h-4" />}
          placeholder="Filter limits by element name or symbol (e.g. Arsenic, Pb)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Analytes Limits Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Symbol</TableHead>
              <TableHead>Heavy Metal Name</TableHead>
              <TableHead>Acceptable Limit (Ideal)</TableHead>
              <TableHead>Permissible Limit (S<sub>i</sub>)</TableHead>
              <TableHead>Unit Weight (W<sub>i</sub> = 1/S<sub>i</sub>)</TableHead>
              <TableHead>Regulatory Notes</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredAnalytes.map(([symbol, limit]) => {
              const meta = CANONICAL_METALS[symbol as keyof typeof CANONICAL_METALS];
              const wi = 1.0 / limit.permissibleLimit;

              return (
                <TableRow key={symbol}>
                  <TableCell className="font-mono font-bold text-forest-900">{symbol}</TableCell>
                  <TableCell className="font-semibold text-title">{meta?.name || symbol}</TableCell>
                  <TableCell className="font-mono text-body">
                    {limit.acceptableLimit} {limit.unit}
                  </TableCell>
                  {/* Directive 7: permissible limits in normal text colour; red only for exceedances */}
                  <TableCell className="font-mono font-bold text-title">
                    {limit.permissibleLimit} {limit.unit}
                  </TableCell>
                  <TableCell className="font-mono text-forest-700 font-semibold">{wi.toFixed(2)}</TableCell>
                  <TableCell className="text-body max-w-xs">{limit.notes}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
