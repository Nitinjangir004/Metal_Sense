import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Plus,
  Search,
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
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';

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

  const rawList: any[] = Array.isArray(data) ? data : (data as any)?.samples || [];
  const samplesList = rawList.map((item: any) => {
    const s = item.sample || item;
    const a = item.analysis || null;
    return { sample: s, analysis: a, ...s };
  });
  const totalCount = typeof (data as any)?.total === 'number' ? (data as any).total : samplesList.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sample Registry"
        workspaceName={activeWorkspace?.name || 'Workspace'}
        description="Catalog of tested groundwater and drinking water monitoring locations."
        actions={
          <Link to="/app/samples/new">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Add Sample / Import CSV
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search by sample ID, location name, or district..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Pollution Categories</option>
            <option value="high">Critical (HPI &ge; 100)</option>
            <option value="moderate">Moderate (HPI 25–99)</option>
            <option value="low">Low (HPI &lt; 25)</option>
          </Select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-inset flex flex-wrap items-center justify-between gap-3 bg-inset/40">
          <span className="text-xs font-semibold text-body">
            Showing {samplesList.length} of {totalCount} registered sampling points
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-body flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-forest-700" />
            <span>Loading registered samples...</span>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-status-critical space-y-3">
            <AlertTriangle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-semibold">
              Failed to load samples: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : samplesList.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={FlaskConical}
              title="No samples matched your search criteria"
              description="Upload lab reports or create a new water sample to populate your workspace registry."
              action={{
                label: 'Import CSV / Add Sample',
                onClick: () => {
                  window.location.href = '/app/samples/new';
                },
                icon: <FileSpreadsheet className="w-4 h-4" />,
              }}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Sample Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>HPI Score</TableHead>
                <TableHead>Exceeded Analytes</TableHead>
                <TableHead>Provenance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {samplesList.map((item: any) => {
                const s = item.sample || item;
                const a = item.analysis;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-bold text-forest-900">
                      <Link to={`/app/samples/${s.id}`} className="hover:underline">
                        {s.sampleCode}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-title">{s.location?.name || 'Unknown Location'}</div>
                      <div className="text-[11px] text-body">
                        {s.location?.district || 'Unspecified'}
                        {s.location?.coordinates ? ' • GPS mapped' : ' • No GPS'}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-body">
                      {new Date(s.collectionDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {a ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-title">
                            {a.hpi.value.toFixed(1)}
                          </span>
                          <StatusBadge status={a.hpi.classification} />
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {a && a.exceededAnalytes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {a.exceededAnalytes.map((m: any) => (
                            <Badge key={m.symbol} variant="high" size="sm">
                              {m.symbol}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-status-safe font-semibold text-xs">Within limits</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ProvenanceBadge provenance={s.provenance} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/app/samples/${s.id}`}>
                          <Button variant="secondary" size="sm">
                            View Dossier
                          </Button>
                        </Link>
                        {userRole === 'owner' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id, s.sampleCode)}
                            className="p-1.5 text-body hover:text-status-critical rounded-full hover:bg-inset transition-colors cursor-pointer"
                            title="Delete sample"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-inset flex items-center justify-between text-xs text-body">
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
