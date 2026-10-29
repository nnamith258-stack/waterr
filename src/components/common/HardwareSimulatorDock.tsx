import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  Layers,
  CloudRain,
  Droplet,
  ShieldAlert,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  RotateCcw
} from 'lucide-react';

interface HardwareSimulatorDockProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareSimulatorDock: React.FC<HardwareSimulatorDockProps> = ({ isOpen, onClose }) => {
  const {
    simSettings,
    toggleRainSimulation,
    toggleTapUsageSimulation,
    triggerLeakSimulation,
    triggerDryRunSimulation,
    sendPumpCommand,
    telemetry
  } = useTelemetry();

  const [minimized, setMinimized] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-2 sm:right-6 z-50 max-w-sm w-[calc(100vw-1rem)] sm:w-96 shadow-2xl animate-slideUp">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl overflow-hidden shadow-amber-950/40">
        {/* Header */}
        <div className="bg-amber-500/10 px-4 py-2.5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              ESP32 IoT Simulator
            </h4>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!minimized && (
          <div className="p-4 space-y-3 text-xs bg-slate-900/95">
            <p className="text-slate-400 text-[11px]">
              Toggle simulated hardware events to test app alerts, pump cutoffs, and safety rules in real time:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {/* Rain Toggle */}
              <button
                onClick={toggleRainSimulation}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  simSettings.isRaining
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <CloudRain className={`w-4 h-4 ${simSettings.isRaining ? 'text-cyan-400 animate-bounce' : ''}`} />
                <div>
                  <div className="font-bold">Rainfall</div>
                  <div className="text-[10px] opacity-75">{simSettings.isRaining ? 'Raining (18mm/h)' : 'Dry'}</div>
                </div>
              </button>

              {/* Tap Usage Toggle */}
              <button
                onClick={toggleTapUsageSimulation}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  simSettings.tapUsageActive
                    ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Droplet className={`w-4 h-4 ${simSettings.tapUsageActive ? 'text-sky-400 animate-pulse' : ''}`} />
                <div>
                  <div className="font-bold">House Taps</div>
                  <div className="text-[10px] opacity-75">{simSettings.tapUsageActive ? 'Taps Open (2.2 L/m)' : 'Closed'}</div>
                </div>
              </button>

              {/* Pipe Leak Toggle */}
              <button
                onClick={triggerLeakSimulation}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  simSettings.leakActive
                    ? 'bg-rose-500/20 border-rose-500 text-rose-200 animate-pulse'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="font-bold">Pipe Leak</div>
                  <div className="text-[10px] opacity-75">{simSettings.leakActive ? 'Active (-14 L/h)' : 'No Leaks'}</div>
                </div>
              </button>

              {/* Dry-Run Fault Trigger */}
              <button
                onClick={triggerDryRunSimulation}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  simSettings.dryRunActive
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-bold">Dry Run Trap</div>
                  <div className="text-[10px] opacity-75">{simSettings.dryRunActive ? 'Source Empty' : 'Water Present'}</div>
                </div>
              </button>
            </div>

            {/* Quick Level Presets */}
            <div className="pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Tank Level Presets:
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    telemetry.mainTank.levelPercent = 12;
                    telemetry.mainTank.levelLitres = 120;
                  }}
                  className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold"
                >
                  12% (Low)
                </button>
                <button
                  onClick={() => {
                    telemetry.mainTank.levelPercent = 65;
                    telemetry.mainTank.levelLitres = 650;
                  }}
                  className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold"
                >
                  65% (Med)
                </button>
                <button
                  onClick={() => {
                    telemetry.mainTank.levelPercent = 97;
                    telemetry.mainTank.levelLitres = 970;
                  }}
                  className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold"
                >
                  97% (Full)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
