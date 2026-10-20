import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, AlertCircle, ArrowUpRight, Info, Loader2, FlaskConical } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useSamples } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';

export function MapPage() {
  const { activeWorkspace } = useAuth();
  const { data, isLoading, isError, error, refetch } = useSamples(activeWorkspace?.id, { limit: 200 });
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const samplesList = data?.samples || [];

  // Filter only samples with valid GPS coordinates
  const geocodedSamples = samplesList.filter(
    (item) =>
      item.sample.location.coordinates &&
      typeof item.sample.location.coordinates.latitude === 'number' &&
      typeof item.sample.location.coordinates.longitude === 'number' &&
      !isNaN(item.sample.location.coordinates.latitude) &&
      !isNaN(item.sample.location.coordinates.longitude)
  );

  const nonGeocodedSamples = samplesList.filter(
    (item) =>
      !item.sample.location.coordinates ||
      typeof item.sample.location.coordinates.latitude !== 'number' ||
      typeof item.sample.location.coordinates.longitude !== 'number'
  );

  // Compute center from coordinates or default
  let defaultCenter: [number, number] = [20.5937, 78.9629];
  if (geocodedSamples.length > 0) {
    const avgLat =
      geocodedSamples.reduce((sum, item) => sum + item.sample.location.coordinates!.latitude, 0) /
      geocodedSamples.length;
    const avgLng =
      geocodedSamples.reduce((sum, item) => sum + item.sample.location.coordinates!.longitude, 0) /
      geocodedSamples.length;
    defaultCenter = [avgLat, avgLng];
  }

  const selectedItem =
    geocodedSamples.find((i) => i.sample.id === selectedSampleId) || geocodedSamples[0];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="h-[520px] bg-slate-900 rounded-2xl border border-slate-800"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-rose-900/40 space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-xs text-white">Failed to load map data: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Geospatial Aquifer Map</h1>
          <p className="text-sm text-slate-400 mt-1">
            Displaying geocoded monitoring points colored strictly by calculated HPI pollution category.
          </p>
        </div>
        <Badge variant="cyan">{geocodedSamples.length} VALID GPS LOCATIONS</Badge>
      </div>

      {geocodedSamples.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/70 rounded-3xl border border-slate-800 space-y-4">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-xl font-bold text-white">No Geocoded Samples Found</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            None of the recorded samples in this workspace have valid latitude/longitude coordinates.
            Include Latitude and Longitude columns when importing CSV or adding samples.
          </p>
          <Link to="/app/samples/new">
            <Button variant="primary" size="md">
              Add Mapped Sample
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Map Container */}
          <div className="lg:col-span-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-[520px] relative shadow-elevated">
            <MapContainer
              center={defaultCenter}
              zoom={geocodedSamples.length === 1 ? 12 : 7}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', background: '#0b1329' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {geocodedSamples.map(({ sample, analysis }) => {
                const hpiVal = analysis?.hpi.value || 0;
                const coords = sample.location.coordinates!;

                // Deterministic color assignment based on HPI thresholds
                const markerColor =
                  hpiVal >= 100 ? '#f43f5e' : hpiVal >= 25 ? '#f59e0b' : '#10b981';

                return (
                  <CircleMarker
                    key={sample.id}
                    center={[coords.latitude, coords.longitude]}
                    radius={10}
                    pathOptions={{
                      fillColor: markerColor,
                      fillOpacity: 0.85,
                      color: '#ffffff',
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedSampleId(sample.id),
                    }}
                  >
                    <Popup className="text-slate-900 font-sans">
                      <div className="p-1 space-y-1 text-xs">
                        <div className="font-bold text-slate-900 font-mono">{sample.sampleCode}</div>
                        <div className="text-slate-700">{sample.location.name}</div>
                        <div className="font-semibold text-slate-900">
                          HPI: {hpiVal.toFixed(1)}{' '}
                          <span className="font-normal text-slate-600">
                            ({analysis?.hpi.classification.toUpperCase()})
                          </span>
                        </div>
                        <div className="pt-1">
                          <Link
                            to={`/app/samples/${sample.id}`}
                            className="text-teal-700 font-bold hover:underline"
                          >
                            View Full Dossier &rarr;
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg p-3 text-xs z-[1000] space-y-2 pointer-events-auto">
              <div className="font-semibold text-white text-[11px] uppercase tracking-wider">
                HPI Index Legend
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-300">HPI &ge; 100 (Critical)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-300">HPI 25–99 (Moderate)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-300">HPI &lt; 25 (Low / Safe)</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Selected Point Details & Non-geocoded notices */}
          <div className="lg:col-span-4 space-y-4">
            {selectedItem ? (
              <Card className="border-slate-800 bg-slate-900/80">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-teal-400">
                      {selectedItem.sample.sampleCode}
                    </span>
                    <StatusBadge status={selectedItem.analysis?.hpi.classification || 'low'} />
                  </div>
                  <CardTitle className="text-base text-white mt-1">
                    {selectedItem.sample.location.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedItem.sample.location.district || 'Unspecified District'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                    <div>
                      <div className="text-slate-400">Calculated HPI</div>
                      <div className="font-mono text-base font-bold text-white mt-0.5">
                        {selectedItem.analysis?.hpi.value.toFixed(1) || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Calculated HEI</div>
                      <div className="font-mono text-base font-bold text-white mt-0.5">
                        {selectedItem.analysis?.hei.value.toFixed(2) || '—'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-semibold mb-1.5">Exceeded Metals</div>
                    {selectedItem.analysis && selectedItem.analysis.exceededAnalytes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.analysis.exceededAnalytes.map((m) => (
                          <Badge key={m.symbol} variant="high" size="sm">
                            {m.symbol} ({m.monitored} mg/L)
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-400 text-xs">All metals within limits</span>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link to={`/app/samples/${selectedItem.sample.id}`} className="w-full">
                      <Button variant="primary" size="sm" className="w-full">
                        Open Full Lab Dossier
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Non-geocoded Notice */}
            {nonGeocodedSamples.length > 0 && (
              <Card className="border-amber-900/40 bg-amber-950/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>{nonGeocodedSamples.length} Samples Missing GPS Coordinates</span>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-slate-400">
                  <p>
                    These samples cannot be plotted on the map. You can edit each sample to supply
                    verified latitude/longitude.
                  </p>
                  <div className="mt-2 space-y-1">
                    {nonGeocodedSamples.slice(0, 3).map(({ sample }) => (
                      <div key={sample.id} className="text-[11px] font-mono text-slate-300">
                        • {sample.sampleCode} ({sample.location.name})
                      </div>
                    ))}
                    {nonGeocodedSamples.length > 3 && (
                      <div className="text-[10px] text-slate-500">
                        +{nonGeocodedSamples.length - 3} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
