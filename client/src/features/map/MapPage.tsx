import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useSamples } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { tokens } from '../../lib/tokens';

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
        <div className="h-8 bg-inset rounded-full w-1/3"></div>
        <div className="h-[520px] bg-card rounded-[28px] border border-inset"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-card rounded-[28px] border border-status-critical/30 space-y-3">
        <AlertCircle className="w-8 h-8 text-status-critical mx-auto" />
        <p className="text-sm font-semibold text-title">
          Failed to load map data: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geospatial Aquifer Map"
        workspaceName={activeWorkspace?.name}
        description="Displaying geocoded monitoring points colored strictly by calculated HPI pollution category."
        badge={<Badge variant="safe">{geocodedSamples.length} VALID GPS LOCATIONS</Badge>}
      />

      {geocodedSamples.length === 0 ? (
        <div className="py-8">
          <EmptyState
            icon={MapPin}
            title="No Geocoded Samples Found"
            description="None of the recorded samples in this workspace have valid latitude/longitude coordinates. Include Latitude and Longitude columns when importing CSV or adding samples."
            action={{
              label: 'Add Mapped Sample',
              onClick: () => {
                window.location.href = '/app/samples/new';
              },
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Map Container */}
          <div className="lg:col-span-8 rounded-[28px] overflow-hidden border border-inset bg-card h-[520px] relative shadow-soft">
            <MapContainer
              center={defaultCenter}
              zoom={geocodedSamples.length === 1 ? 12 : 7}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', background: tokens.page }}
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
                  hpiVal >= 100
                    ? tokens.status.critical
                    : hpiVal >= 25
                    ? tokens.status.warning
                    : tokens.status.safe;

                return (
                  <CircleMarker
                    key={sample.id}
                    center={[coords.latitude, coords.longitude]}
                    radius={10}
                    pathOptions={{
                      fillColor: markerColor,
                      fillOpacity: 0.85,
                      color: tokens.primary,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedSampleId(sample.id),
                    }}
                  >
                    <Popup className="font-sans">
                      <div className="p-1 space-y-1 text-xs">
                        <div className="font-bold text-title font-mono">{sample.sampleCode}</div>
                        <div className="text-body">{sample.location.name}</div>
                        <div className="font-semibold text-title">
                          HPI: {hpiVal.toFixed(1)}{' '}
                          <span className="font-normal text-body">
                            ({analysis?.hpi.classification.toUpperCase()})
                          </span>
                        </div>
                        <div className="pt-1">
                          <Link
                            to={`/app/samples/${sample.id}`}
                            className="text-forest-700 font-bold hover:underline"
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
            <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-md border border-inset rounded-[20px] p-4 text-xs z-[1000] space-y-2 pointer-events-auto shadow-soft">
              <div className="font-bold text-title text-[11px] uppercase tracking-wider">
                HPI Index Legend
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-status-critical" />
                <span className="text-body font-medium">HPI &ge; 100 (Critical)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-status-warning" />
                <span className="text-body font-medium">HPI 25–99 (Moderate)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-status-safe" />
                <span className="text-body font-medium">HPI &lt; 25 (Low / Safe)</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Selected Point Details & Non-geocoded notices */}
          <div className="lg:col-span-4 space-y-4">
            {selectedItem ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-forest-700">
                      {selectedItem.sample.sampleCode}
                    </span>
                    <StatusBadge status={selectedItem.analysis?.hpi.classification || 'low'} />
                  </div>
                  <CardTitle className="mt-1">
                    {selectedItem.sample.location.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedItem.sample.location.district || 'Unspecified District'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-3 bg-raised rounded-[20px] border border-inset">
                    <div>
                      <div className="text-caption font-semibold">Calculated HPI</div>
                      <div className="font-mono text-base font-bold text-title mt-0.5">
                        {selectedItem.analysis?.hpi.value.toFixed(1) || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-caption font-semibold">Calculated HEI</div>
                      <div className="font-mono text-base font-bold text-title mt-0.5">
                        {selectedItem.analysis?.hei.value.toFixed(2) || '—'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-caption font-semibold mb-1.5 uppercase">Exceeded Metals</div>
                    {selectedItem.analysis && selectedItem.analysis.exceededAnalytes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.analysis.exceededAnalytes.map((m) => (
                          <Badge key={m.symbol} variant="high" size="sm">
                            {m.symbol} ({m.monitored} mg/L)
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-status-safe font-semibold text-xs">All metals within limits</span>
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
              <Card className="border-status-warning/40 bg-status-warning-bg/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-status-warning text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{nonGeocodedSamples.length} Samples Missing GPS Coordinates</span>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-body">
                  <p>
                    These samples cannot be plotted on the map. You can edit each sample to supply
                    verified latitude/longitude.
                  </p>
                  <div className="mt-2 space-y-1">
                    {nonGeocodedSamples.slice(0, 3).map(({ sample }) => (
                      <div key={sample.id} className="text-[11px] font-mono text-title font-semibold">
                        • {sample.sampleCode} ({sample.location.name})
                      </div>
                    ))}
                    {nonGeocodedSamples.length > 3 && (
                      <div className="text-[10px] text-caption">
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
