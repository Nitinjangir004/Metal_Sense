import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './features/landing/LandingPage';
import { MethodologyPage } from './features/methodology/MethodologyPage';
import { AppShell } from './components/layout/AppShell';
import { OverviewDashboard } from './features/dashboard/OverviewDashboard';
import { SampleListPage } from './features/samples/SampleListPage';
import { SampleDetailPage } from './features/samples/SampleDetailPage';
import { NewSampleWizard } from './features/samples/NewSampleWizard';
import { ReviewExtractionPage } from './features/extraction/ReviewExtractionPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { MapPage } from './features/map/MapPage';
import { StandardsRegistryPage } from './features/standards/StandardsRegistryPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';

export function App() {
  return (
    <Routes>
      {/* Public Marketing & Methodology Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/methodology" element={<MethodologyPage />} />

      {/* Authenticated / Demo App Shell */}
      <Route path="/app" element={<AppShell />}>
        <Route index element={<OverviewDashboard />} />
        <Route path="samples" element={<SampleListPage />} />
        <Route path="samples/new" element={<NewSampleWizard />} />
        <Route path="samples/:id" element={<SampleDetailPage />} />
        <Route path="import/review" element={<ReviewExtractionPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="standards" element={<StandardsRegistryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="methodology" element={<MethodologyPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;
