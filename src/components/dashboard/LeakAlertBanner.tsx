import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { AlertTriangle, Clock, Droplet, ShieldAlert, Check } from 'lucide-react';

export const LeakAlertBanner: React.FC = () => {
  const { telemetry, t, triggerLeakSimulation } = useTelemetry();
  const flow = telemetry.flow;

  if (!flow.leakDetected) {
    return null;
  }

  return (
    <div className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 shadow-2xl text-rose-100 relative overflow-hidden animate-pulse">
      {/* Visual background indicator */}
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-rose-400 animate-bounce" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-rose-600 text-white">
                CRITICAL ALERT
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                {t('leakageAlert')}
              </h3>
            </div>
            <p className="text-xs text-rose-200 mt-1 max-w-xl">
              {t('leakageDesc')} Inflow: {flow.inletFlowLpm} L/m vs Outflow: {flow.outletFlowLpm} L/m.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-semibold">
              <span className="flex items-center gap-1 bg-rose-900/60 px-2.5 py-1 rounded-lg border border-rose-700/60">
                <Droplet className="w-3.5 h-3.5 text-rose-400" />
                {t('estimatedLoss')}: ~{flow.leakLitresPerHour} L/hr
              </span>
              <span className="flex items-center gap-1 bg-rose-900/60 px-2.5 py-1 rounded-lg border border-rose-700/60">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                {t('leakStartedAt')}: {flow.leakStartTime || '02:15 AM'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={triggerLeakSimulation}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Mark Resolved</span>
          </button>
        </div>
      </div>
    </div>
  );
};
