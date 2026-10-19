import React, { useState } from 'react';
import { Settings, Shield, Database, User, Scale } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';

export function SettingsPage() {
  const [defaultStandard, setDefaultStandard] = useState('BIS_10500_2012');
  const [lodStrategy, setLodStrategy] = useState('half_lod');
  const [dataRetentionDays, setDataRetentionDays] = useState('90');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure default regulatory standards, LOD calculations, and workspace privacy policies.
        </p>
      </div>

      {/* Scientific Calculation Preferences */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-teal-400" />
            <span>Calculation &amp; Standards Preferences</span>
          </CardTitle>
          <CardDescription>
            Choose the baseline regulatory standard and detection limit substitution logic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Default Regulatory Standard
            </label>
            <select
              value={defaultStandard}
              onChange={(e) => setDefaultStandard(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
            >
              <option value="BIS_10500_2012">
                Bureau of Indian Standards (BIS IS 10500:2012 Drinking Water Specification)
              </option>
              <option value="WHO_GDWQ_4TH">
                World Health Organization (WHO Guidelines for Drinking-water Quality 4th Ed)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Limit of Detection (&lt;LOD) Substitution Strategy
            </label>
            <select
              value={lodStrategy}
              onChange={(e) => setLodStrategy(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
            >
              <option value="half_lod">
                Half LOD (0.5 × LOD) — US EPA Standard Environmental Convention
              </option>
              <option value="zero">Zero (0) — Optimistic lower bound</option>
              <option value="full_lod">Full LOD (1.0 × LOD) — Conservative upper bound</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention & Privacy */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span>Data Privacy &amp; Retention Policies</span>
          </CardTitle>
          <CardDescription>
            Control uploaded document retention, OCR data persistence, and workspace access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Uploaded Lab Certificate Retention
            </label>
            <select
              value={dataRetentionDays}
              onChange={(e) => setDataRetentionDays(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
            >
              <option value="30">Retain original PDFs for 30 days</option>
              <option value="90">Retain original PDFs for 90 days (Recommended)</option>
              <option value="365">Retain original PDFs for 1 year</option>
              <option value="0">Delete immediately after verified extraction</option>
            </select>
          </div>

          <div className="pt-2">
            <Button variant="primary" size="sm">
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
