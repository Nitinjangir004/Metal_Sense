import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, AlertCircle, ArrowUpRight, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { DEMO_SAMPLES, DEMO_ANALYSES } from '../../data/demoSamples';

export function MapPage() {
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // Filter only samples with valid GPS coordinates
  const geocodedSamples = DEMO_SAMPLES.filter(
    (s) => s.location.coordinates && s.location.coordinates.latitude && s.location.coordinates.longitude
  );

  const nonGeocodedSamples = DEMO_SAMPLES.filter(
    (s) => !s.location.coordinates || !s.location.coordinates.latitude || !s.location.coordinates.longitude
  );

  // Center on Delhi NCR
  const defaultCenter: [number, number] = [28.55, 77.15];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Geospatial Aquifer Map</h1>
          <p className="text-sm text-slate-400 mt-1">
            Displaying geocoded monitoring points colored by calculated HPI pollution category.
          </p>
        </div>
        <Badge variant="cyan">3 VALID GPS LOCATIONS</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Map Container */}
        <div className="lg:col-span-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-[520px] relative shadow-elevated">
          <MapContainer
            center={defaultCenter}
            zoom={11}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', background: '#0b1329' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {geocodedSamples.map((sample) => {
              const a = DEMO_ANALYSES[sample.id];
              const hpiVal = a?.hpi.value || 0;
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
                          ({a?.hpi.classification.toUpperCase()})
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

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/90 border border-slate-800 p-3 rounded-lg text-xs space-y-1.5 backdrop-blur-md shadow-elevated">
            <div className="font-semibold text-white uppercase text-[10px] tracking-wider mb-1">
              HPI Classification Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-300">Low (&lt; 25) — Pristine</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="text-slate-300">Moderate (25 – 100) — Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="text-slate-300">Critical (&ge; 100) — Exceeds Standard</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Location List & Honest Empty States */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span>Geocoded Monitoring Stations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {geocodedSamples.map((s) => {
                const a = DEMO_ANALYSES[s.id];
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSampleId(s.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedSampleId === s.id
                        ? 'border-teal-500 bg-teal-950/30'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white">{s.sampleCode}</span>
                      <StatusBadge status={a?.hpi.classification || 'low'} />
                    </div>
                    <div className="mt-1 font-medium text-slate-300">{s.location.name}</div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      GPS: {s.location.coordinates?.latitude.toFixed(4)},{' '}
                      {s.location.coordinates?.longitude.toFixed(4)}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Non-geocoded Samples (Honest Empty State as required by prompt) */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Non-Geocoded Samples</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              {nonGeocodedSamples.length === 0 ? (
                <p>All active samples have confirmed coordinates. No points are hidden.</p>
              ) : (
                <p>{nonGeocodedSamples.length} samples lack coordinates and are omitted from the map.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
