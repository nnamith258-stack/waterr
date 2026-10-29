import React, { useState } from 'react';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { Header } from './components/common/Header';
import { BottomNav, NavTab } from './components/common/BottomNav';
import { AnimatedTankVisual } from './components/dashboard/AnimatedTankVisual';
import { PumpQuickWidget } from './components/dashboard/PumpQuickWidget';
import { SmartSuggestions } from './components/dashboard/SmartSuggestions';
import { LeakAlertBanner } from './components/dashboard/LeakAlertBanner';
import { RainfallAndConservationWidget } from './components/dashboard/RainfallAndConservationWidget';
import { PumpDetailsView } from './components/pump/PumpDetailsView';
import { AlertsView } from './components/alerts/AlertsView';
import { SensorsView } from './components/sensors/SensorsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { HardwareGuideView } from './components/hardware/HardwareGuideView';
import { HardwareSimulatorDock } from './components/common/HardwareSimulatorDock';
import { WifiOff, Info } from 'lucide-react';

const MainContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const { telemetry, t, largeFont } = useTelemetry();

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 ${largeFont ? 'text-base' : 'text-sm'}`}>
      {/* Top Header */}
      <Header onOpenSimulator={() => setSimulatorOpen(prev => !prev)} />

      {/* Offline Alert Bar if offline */}
      {!telemetry.connection.isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span>
              {t('offlineNotice')} • Direct local control active via {telemetry.connection.esp32Ip}
            </span>
          </div>
          <span className="text-[11px] opacity-75">
            {t('lastSynced')}: {new Date(telemetry.connection.lastSyncTime).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {currentTab === 'dashboard' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Leak alert banner if pipe leak detected */}
            <LeakAlertBanner />

            {/* Smart suggestions bar */}
            <SmartSuggestions />

            {/* Animated Liquid Tank Visual */}
            <AnimatedTankVisual />

            {/* Pump Control Widget */}
            <PumpQuickWidget />

            {/* Rainfall & Water Conservation Eco-score */}
            <RainfallAndConservationWidget />
          </div>
        )}

        {currentTab === 'pump' && (
          <div className="animate-fadeIn">
            <PumpDetailsView />
          </div>
        )}

        {currentTab === 'alerts' && (
          <div className="animate-fadeIn">
            <AlertsView />
          </div>
        )}

        {currentTab === 'sensors' && (
          <div className="animate-fadeIn">
            <SensorsView />
          </div>
        )}

        {currentTab === 'analytics' && (
          <div className="animate-fadeIn">
            <AnalyticsView />
          </div>
        )}

        {currentTab === 'hardware' && (
          <div className="animate-fadeIn">
            <HardwareGuideView />
          </div>
        )}
      </main>

      {/* Bottom Navigation for Mobile-First layout */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Hardware Simulator Floating Dock */}
      <HardwareSimulatorDock
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <TelemetryProvider>
      <MainContent />
    </TelemetryProvider>
  );
}
