import React from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Plus, Search, Filter, ArrowUpRight, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { DEMO_SAMPLES, DEMO_ANALYSES } from '../../data/demoSamples';

export function SampleListPage() {
  const samples = DEMO_SAMPLES;
  const analyses = DEMO_ANALYSES;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sample Registry</h1>
          <p className="text-sm text-slate-400">
            Catalog of tested groundwater and drinking water samples.
          </p>
        </div>
        <Link to="/app/samples/new">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Create New Sample
          </Button>
        </Link>
      </div>

      <Card className="border-slate-800 bg-slate-900/80 p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Showing {samples.length} registered sampling points</span>
            <Badge variant="cyan" size="sm">DEMO WORKSPACE</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Sample Code</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">HPI Score</th>
                <th className="py-3 px-4 font-semibold">Exceeded Analytes</th>
                <th className="py-3 px-4 font-semibold">Provenance</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {samples.map((s) => {
                const a = analyses[s.id];
                return (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      <Link to={`/app/samples/${s.id}`} className="hover:text-teal-300">
                        {s.sampleCode}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{s.location.name}</div>
                      <div className="text-[11px] text-slate-500">{s.location.district}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(s.collectionDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {a ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200">
                            {a.hpi.value.toFixed(1)}
                          </span>
                          <StatusBadge status={a.hpi.classification} />
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {a && a.exceededAnalytes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {a.exceededAnalytes.map((m) => (
                            <Badge key={m.symbol} variant="high" size="sm">
                              {m.symbol}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-400 text-xs">Within limits</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <ProvenanceBadge provenance={s.provenance} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/app/samples/${s.id}`}>
                        <Button variant="outline" size="sm">
                          View Dossier
                        </Button>
                      </Link>
                    </td>
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
