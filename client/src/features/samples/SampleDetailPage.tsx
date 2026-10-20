import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  FileCheck2,
  Scale,
  Calculator,
  Download,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
  RefreshCw,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useSample, useRecalculateSample, useStandards } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { Alert } from '../../components/ui/Alert';
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
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="h-28 bg-slate-900 rounded-2xl border border-slate-800"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-2xl border border-slate-800"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data?.sample) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-rose-900/40 space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Sample Not Found</h2>
        <p className="text-sm text-slate-400">
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

  const { sample, analysis, history } = data;

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
      {/* Top Header / Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/app/samples">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              All Samples
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span>{sample.sampleCode}</span>
            <ProvenanceBadge provenance={sample.provenance} />
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPdf}
            leftIcon={<Download className="w-4 h-4 text-teal-400" />}
          >
            Download Audit PDF
          </Button>
        </div>
      </div>

      {/* Metadata Overview Card */}
      <Card className="border-slate-800 bg-slate-900/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Sampling Location</div>
            <div className="font-semibold text-white mt-1">{sample.location.name}</div>
            <div className="text-slate-500 mt-0.5">
              {sample.location.district || 'Unspecified'}
              {sample.location.coordinates && (
                <span className="block text-[11px] font-mono text-teal-400">
                  {sample.location.coordinates.latitude.toFixed(4)}, {sample.location.coordinates.longitude.toFixed(4)}
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Collection Date &amp; Matrix</div>
            <div className="font-semibold text-white mt-1">
              {new Date(sample.collectionDate).toLocaleString()}
            </div>
            <div className="text-slate-500 mt-0.5 capitalize">{sample.sampleMatrix.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Testing Laboratory</div>
            <div className="font-semibold text-white mt-1">{sample.laboratory?.name || 'In-house Lab'}</div>
            <div className="text-slate-500 mt-0.5">Report: {sample.laboratory?.reportNumber || 'N/A'}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Active Standard</div>
            <div className="font-semibold text-teal-400 mt-1">
              {analysis?.standardUsed?.code || 'BIS_10500_2012'}
            </div>
            <div className="text-slate-500 mt-0.5 capitalize">LOD: {analysis?.lodStrategy || 'half_lod'}</div>
          </div>
        </div>
      </Card>

      {/* Calculated Pollution Indices Grid */}
      {analysis && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Heavy Metal Pollution Index (HPI)</span>
              <StatusBadge status={analysis.hpi.classification} />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">
              {analysis.hpi.value.toFixed(1)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Critical threshold: &ge; {analysis.hpi.thresholdValue}
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Heavy Metal Evaluation Index (HEI)</span>
              <StatusBadge status={analysis.hei.classification} />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">
              {analysis.hei.value.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Classification: {analysis.hei.classification} contamination
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Degree of Contamination (C<sub>d</sub>)</span>
              <StatusBadge status={analysis.cd.classification} />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">
              {analysis.cd.value.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Classification: {analysis.cd.classification} contamination
            </div>
          </Card>
        </div>
      )}

      {/* Recalculate Toolbar */}
      <Card className="border-slate-800 bg-slate-900/60 p-4">
        <form onSubmit={handleRecalculate} className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-300">Re-evaluate with alternate standard:</span>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
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
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
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
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
              )
            }
          >
            {recalculateMutation.isPending ? 'Calculating...' : 'Recalculate Indices'}
          </Button>
        </form>
      </Card>

      {/* Measured Heavy Metal Concentrations Table */}
      <Card className="border-slate-800 bg-slate-900/80 p-0 overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-800 bg-slate-950/40">
          <CardTitle className="text-base font-bold text-white">Laboratory Metal Concentrations</CardTitle>
          <CardDescription>
            Measured analyte levels evaluated against standard baseline limits
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Analyte</th>
                <th className="py-3 px-4 font-semibold">Qualifier</th>
                <th className="py-3 px-4 font-semibold">Concentration</th>
                <th className="py-3 px-4 font-semibold">Standard Limit (S<sub>i</sub>)</th>
                <th className="py-3 px-4 font-semibold">Sub-index (Q<sub>i</sub>)</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sample.measurements.map((m) => {
                const isExceeded = analysis?.exceededAnalytes?.some((e) => e.symbol === m.symbol);
                const trace = analysis?.hpi?.traces?.find((t) => t.symbol === m.symbol);

                return (
                  <tr key={m.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-teal-300 w-6">{m.symbol}</span>
                        <span className="text-slate-300 text-xs">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{m.qualifier || '='}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {m.value} {m.unit}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {trace ? `${trace.permissibleLimit} mg/L` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {trace ? trace.subIndex.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isExceeded ? (
                        <Badge variant="high" size="sm">
                          Exceeds Limit
                        </Badge>
                      ) : (
                        <Badge variant="safe" size="sm">
                          Within Limit
                        </Badge>
                      )}
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
