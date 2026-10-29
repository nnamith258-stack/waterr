import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { PumpQuickWidget } from '../dashboard/PumpQuickWidget';
import {
  ShieldCheck,
  Clock,
  Zap,
  Sliders,
  Settings2,
  AlertTriangle,
  History,
  Lock,
  UserCheck
} from 'lucide-react';

export const PumpDetailsView: React.FC = () => {
  const { telemetry, t } = useTelemetry();
  const pump = telemetry.pump;

  // Automation rule states
  const [autoRefill, setAutoRefill] = useState(true);
  const [autoRefillThreshold, setAutoRefillThreshold] = useState(20);
  const [maxRuntimeMinutes, setMaxRuntimeMinutes] = useState(45);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'family'>('admin');

  // Simulated pump log
  const pumpLogs = [
    { time: '08:00 AM - 08:35 AM', duration: '35 mins', litres: '875 L', status: 'Completed (Auto-Stop 98%)' },
    { time: 'Yesterday 06:15 PM', duration: '28 mins', litres: '700 L', status: 'Completed (Manual Off)' },
    { time: '27 Oct 07:00 AM', duration: '40 mins', litres: '1,000 L', status: 'Completed (Full Refill)' }
  ];

  return (
    <div className="space-y-4">
      {/* Top Pump Control Widget */}
      <PumpQuickWidget />

      {/* User Role & Permission Control */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            {currentUserRole === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs text-slate-400">Current Operator Role:</div>
            <div className="text-sm font-bold text-white capitalize">
              {currentUserRole === 'admin' ? 'Master Admin (Namith)' : 'Family Member (Guest)'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setCurrentUserRole(r => r === 'admin' ? 'family' : 'admin')}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-700 text-slate-300"
        >
          Switch to {currentUserRole === 'admin' ? 'Family Member' : 'Admin'}
        </button>
      </div>

      {/* Intelligent Automation & Protection Settings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Settings2 className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Intelligent Automation & Interlocks
            </h3>
            <p className="text-xs text-slate-400">
              Hardware firmware safety rules active in ESP32 controller
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* Auto-Refill Rule */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Auto-Start Refill when below {autoRefillThreshold}%</span>
              <span className="text-slate-400 text-[11px]">Turns pump ON safely if source water is confirmed</span>
            </div>
            <input
              type="checkbox"
              checked={autoRefill}
              onChange={(e) => setAutoRefill(e.target.checked)}
              className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          {/* Dry Run Lockout */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Dry-Run Protection (ACS712 + Inlet Flow)
              </span>
              <span className="text-slate-400 text-[11px]">
                Immediately disconnects motor if current &lt; 0.2A or no flow detected for 25s
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
              LOCKED ACTIVE
            </span>
          </div>

          {/* Max continuous runtime */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Max Continuous Runtime Lockout</span>
              <span className="text-slate-400 text-[11px]">Protects motor coils against overheating</span>
            </div>
            <span className="text-sm font-mono font-bold text-sky-400">
              {maxRuntimeMinutes} mins
            </span>
          </div>

          {/* Float Switch Emergency Backup */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Physical Float Switch (GPIO 22)</span>
              <span className="text-slate-400 text-[11px]">Hardware interrupt trip override (Bypasses CPU)</span>
            </div>
            <span className="text-emerald-400 font-semibold text-[11px]">
              Normal (Armed)
            </span>
          </div>
        </div>
      </div>

      {/* Pump Run History */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm sm:text-base font-bold text-white">
            Recent Pump Activity Logs
          </h3>
        </div>

        <div className="space-y-2">
          {pumpLogs.map((log, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-white block">{log.time}</span>
                <span className="text-[11px] text-slate-400">{log.status}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-sky-400 block">{log.litres}</span>
                <span className="text-[11px] text-slate-400">{log.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
