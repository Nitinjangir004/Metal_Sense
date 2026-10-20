import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useSample, useRecalculateSample, useStandards } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { LODHandlingStrategy } from '@metalsense/shared';

export function SampleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeWorkspace } = useAuth();
  const { data, isLoading, isError, error, refetch } = useSample(activeWorkspace?.id, id);
  const { data: standards } = useStandards();
  const recalculateMutation = useRecalculateSample(activeWorkspace?.id);

  const [selectedStandard, setSelectedStandard] = useState('BIS_10500_2012');
  const [selectedLod, setSelectedLod] = useState<LODHandlingStrategy>('half_lod');

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-inset rounded-full w-1/3"></div>
        <div className="h-28 bg-card rounded-[28px] border border-inset"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card rounded-[28px] border border-inset"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data?.sample) {
    return (
      <div className="p-8 text-center bg-card rounded-[28px] border border-status-critical/30 space-y-4">
        <AlertTriangle className="w-10 h-10 text-status-critical mx-auto" />
        <h2 className="text-lg font-bold text-title">Sample Not Found</h2>
        <p className="text-sm text-body">
          {error instanceof Error ? error.message : 'The requested sample could not be found or has been removed.'}
        </p>
        <Link to="/app/samples">
          <Button variant="secondary" size="sm">
            Back to Sample Registry
          </Button>
        </Link>
      </div>
    );
  }

  const { sample, analysis } = data;

  const handleRecalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sample.id) return;
    try {
      await recalculateMutation.mutateAsync({
        sampleId: sample.id,
        standardCode: selectedStandard,
        lodStrategy: selectedLod,
      });
      await refetch();
    } catch (err) {
      alert('Failed to re-run calculation.');
    }
  };

  const handleDownloadPdf = () => {
    if (!activeWorkspace?.id || !sample?.id) return;
    window.open(`/api/v1/workspaces/${activeWorkspace.id}/samples/${sample.id}/report/pdf`, '_blank');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={sample.sampleCode}
        workspaceName={activeWorkspace?.name}
        description={`Tested ${new Date(sample.collectionDate).toLocaleDateString()} at ${sample.location.name}.`}
        badge={<ProvenanceBadge provenance={sample.provenance} />}
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/app/samples">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                All Samples
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadPdf}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download Audit PDF
            </Button>
          </div>
        }
      />

      {/* Metadata Overview Card */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-caption font-semibold uppercase">Sampling Location</div>
            <div className="font-bold text-title mt-1 text-sm">{sample.location.name}</div>
            <div className="text-body mt-0.5">
              {sample.location.district || 'Unspecified'}
              {sample.location.coordinates && (
                <span className="block text-[11px] font-mono text-forest-700 font-semibold mt-0.5">
                  {sample.location.coordinates.latitude.toFixed(4)}, {sample.location.coordinates.longitude.toFixed(4)}
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-caption font-semibold uppercase">Collection Date &amp; Matrix</div>
            <div className="font-bold text-title mt-1 text-sm">
              {new Date(sample.collectionDate).toLocaleString()}
            </div>
            <div className="text-body mt-0.5 capitalize">{sample.sampleMatrix.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-caption font-semibold uppercase">Testing Laboratory</div>
            <div className="font-bold text-title mt-1 text-sm">{sample.laboratory?.name || 'In-house Lab'}</div>
            <div className="text-body mt-0.5">Report: {sample.laboratory?.reportNumber || 'N/A'}</div>
          </div>
          <div>
            <div className="text-caption font-semibold uppercase">Active Standard</div>
            <div className="font-bold text-forest-700 mt-1 text-sm">
              {analysis?.standardUsed?.code || 'BIS_10500_2012'}
            </div>
            <div className="text-body mt-0.5 capitalize">LOD Strategy: {analysis?.lodStrategy || 'half_lod'}</div>
          </div>
        </div>
      </Card>

      {/* Calculated Pollution Indices Grid */}
      {analysis && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-caption">
                Heavy Metal Pollution Index (HPI)
              </span>
              <StatusBadge status={analysis.hpi.classification} />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-title">
              {analysis.hpi.value.toFixed(1)}
            </div>
            <div className="mt-1 text-xs text-body font-medium">
              Critical threshold: &ge; {analysis.hpi.thresholdValue}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-caption">
                Heavy Metal Evaluation Index (HEI)
              </span>
              <StatusBadge status={analysis.hei.classification} />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-title">
              {analysis.hei.value.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-body font-medium">
              Classification: {analysis.hei.classification} contamination
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-caption">
                Degree of Contamination (C<sub>d</sub>)
              </span>
              <StatusBadge status={analysis.cd.classification} />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-title">
              {analysis.cd.value.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-body font-medium">
              Classification: {analysis.cd.classification} contamination
            </div>
          </Card>
        </div>
      )}

      {/* Recalculate Toolbar */}
      <Card className="p-4">
        <form onSubmit={handleRecalculate} className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-title">Re-evaluate with alternate standard:</span>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="rounded-full bg-raised border border-inset px-4 py-2 text-xs text-title font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer shadow-sm"
            >
              {standards?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.title} ({s.code})
                </option>
              )) || (
                <>
                  <option value="BIS_10500_2012">BIS IS 10500:2012 (India)</option>
                  <option value="WHO_GDWQ_4TH">WHO Guidelines 4th Edition</option>
                </>
              )}
            </select>

            <select
              value={selectedLod}
              onChange={(e) => setSelectedLod(e.target.value as any)}
              className="rounded-full bg-raised border border-inset px-4 py-2 text-xs text-title font-semibold focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer shadow-sm"
            >
              <option value="half_lod">Half LOD (0.5 × LOD)</option>
              <option value="zero">Zero (0)</option>
              <option value="full_lod">Full LOD (1.0 × LOD)</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={recalculateMutation.isPending}
            leftIcon={
              recalculateMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-700" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )
            }
          >
            {recalculateMutation.isPending ? 'Calculating...' : 'Recalculate Indices'}
          </Button>
        </form>
      </Card>

      {/* Measured Heavy Metal Concentrations Table */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="p-5 border-b border-inset bg-inset/30">
          <CardTitle>Laboratory Metal Concentrations</CardTitle>
          <CardDescription>
            Measured analyte levels evaluated against selected reference standard baseline limits
          </CardDescription>
        </CardHeader>

        <Table>
          <TableHeader>
            <tr>
              <TableHead>Analyte</TableHead>
              <TableHead>Qualifier</TableHead>
              <TableHead>Concentration</TableHead>
              <TableHead>Standard Limit (S<sub>i</sub>)</TableHead>
              <TableHead>Sub-index (Q<sub>i</sub>)</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {sample.measurements.map((m) => {
              const isExceeded = analysis?.exceededAnalytes?.some((e) => e.symbol === m.symbol);
              const trace = analysis?.hpi?.traces?.find((t) => t.symbol === m.symbol);

              return (
                <TableRow key={m.symbol}>
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-forest-700 w-6">{m.symbol}</span>
                      <span className="text-title font-semibold text-xs">{m.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-body">{m.qualifier || '='}</TableCell>
                  <TableCell className="font-mono font-bold text-title">
                    {m.value} {m.unit}
                  </TableCell>
                  <TableCell className="font-mono text-body">
                    {trace ? `${trace.permissibleLimit} mg/L` : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-body">
                    {trace ? trace.subIndex.toFixed(1) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {isExceeded ? (
                      <Badge variant="high" size="sm">
                        Exceeds Limit
                      </Badge>
                    ) : (
                      <Badge variant="safe" size="sm">
                        Within Limit
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
