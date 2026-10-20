import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  MapPin,
  Trash2,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useSamples, useDeleteSample } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';

export function SampleListPage() {
  const { activeWorkspace, userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError, error, refetch } = useSamples(activeWorkspace?.id, {
    search: searchTerm || undefined,
    category: selectedCategory || undefined,
    limit: pageSize,
    offset: page * pageSize,
  });

  const deleteSampleMutation = useDeleteSample(activeWorkspace?.id);

  const handleDelete = async (sampleId: string, sampleCode: string) => {
    if (!confirm(`Are you sure you want to permanently delete sample ${sampleCode}?`)) return;
    try {
      await deleteSampleMutation.mutateAsync(sampleId);
    } catch (err) {
      alert('Failed to delete sample.');
    }
  };

  const samplesList = data?.samples || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sample Registry</h1>
          <p className="text-sm text-slate-400">
            Catalog of tested groundwater and drinking water monitoring locations in{' '}
            <strong className="text-slate-200">{activeWorkspace?.name || 'Workspace'}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/app/samples/new">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Add Sample / Import CSV
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by sample ID, location name, or district..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(0);
            }}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Pollution Categories</option>
            <option value="high">Critical (HPI &ge; 100)</option>
            <option value="moderate">Moderate (HPI 25–99)</option>
            <option value="low">Low (HPI &lt; 25)</option>
          </select>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900/80 p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>
              Showing {samplesList.length} of {totalCount} registered sampling points
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
            <span>Loading registered samples...</span>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-400 space-y-3">
            <AlertTriangle className="w-8 h-8 mx-auto" />
            <p className="text-xs">Failed to load samples: {error instanceof Error ? error.message : 'Unknown error'}</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : samplesList.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <FlaskConical className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <p className="text-white font-medium text-sm">No samples matched your search criteria.</p>
              <p className="text-xs text-slate-400 mt-1">
                Upload lab reports or create a new water sample to get started.
              </p>
            </div>
            <Link to="/app/samples/new">
              <Button variant="secondary" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4 text-teal-400" />}>
                Import CSV / Add Sample
              </Button>
            </Link>
          </div>
        ) : (
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
                {samplesList.map(({ sample: s, analysis: a }) => {
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-white">
                        <Link to={`/app/samples/${s.id}`} className="hover:text-teal-300">
                          {s.sampleCode}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{s.location.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {s.location.district || 'Unspecified'}
                          {s.location.coordinates ? ' • GPS mapped' : ' • No GPS'}
                        </div>
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
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/app/samples/${s.id}`}>
                            <Button variant="outline" size="sm">
                              View Dossier
                            </Button>
                          </Link>
                          {userRole === 'owner' && (
                            <button
                              onClick={() => handleDelete(s.id, s.sampleCode)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete sample"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
