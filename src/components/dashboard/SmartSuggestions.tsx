import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Sparkles, ArrowRight, Check, Droplets, CloudRain, AlertTriangle, ShieldCheck } from 'lucide-react';

export const SmartSuggestions: React.FC = () => {
  const { telemetry, sendPumpCommand, t } = useTelemetry();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const mainLevel = telemetry.mainTank.levelPercent;
  const isPumpRunning = telemetry.pump.state === 'RUNNING';
  const isRaining = telemetry.rainfall.isRaining;
  const hasLeak = telemetry.flow.leakDetected;

  // Determine current smart recommendation
  interface Suggestion {
    key: string;
    type: 'pump-on' | 'pump-off' | 'leak' | 'rain' | 'conserve';
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    variant: 'amber' | 'emerald' | 'rose' | 'sky';
    icon: any;
  }

  let currentSuggestion: Suggestion | null = null;

  if (hasLeak && dismissedKey !== 'leak') {
    currentSuggestion = {
      key: 'leak',
      type: 'leak',
      title: t('leakageAlert'),
      description: t('suggestionLeak', { val: telemetry.flow.leakLitresPerHour }),
      variant: 'rose',
      icon: AlertTriangle
    };
  } else if (mainLevel <= 25 && !isPumpRunning && dismissedKey !== 'low-tank') {
    currentSuggestion = {
      key: 'low-tank',
      type: 'pump-on',
      title: t('tankLow'),
      description: t('suggestionLow', { val: Math.round(mainLevel) }),
      actionLabel: t('turnOn'),
      onAction: () => sendPumpCommand('ON'),
      variant: 'amber',
      icon: Droplets
    };
  } else if (mainLevel >= 95 && isPumpRunning && dismissedKey !== 'full-tank') {
    currentSuggestion = {
      key: 'full-tank',
      type: 'pump-off',
      title: t('tankFull'),
      description: t('suggestionFull'),
      actionLabel: t('turnOff'),
      onAction: () => sendPumpCommand('OFF'),
      variant: 'emerald',
      icon: ShieldCheck
    };
  } else if (isRaining && dismissedKey !== 'rain') {
    currentSuggestion = {
      key: 'rain',
      type: 'rain',
      title: t('rainfall'),
      description: t('suggestionRain', { val: telemetry.rainfall.harvestedTodayLitres }),
      variant: 'sky',
      icon: CloudRain
    };
  }

  if (!currentSuggestion) return null;

  const colorStyles = {
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
    sky: 'bg-sky-500/10 border-sky-500/30 text-sky-200'
  };

  const buttonStyles = {
    amber: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    emerald: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    rose: 'bg-rose-500 hover:bg-rose-400 text-white',
    sky: 'bg-sky-500 hover:bg-sky-400 text-slate-950'
  };

  const Icon = currentSuggestion.icon;

  return (
    <div className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all animate-fadeIn ${colorStyles[currentSuggestion.variant]}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-white/10 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10">
              Smart Assistant
            </span>
            <span className="font-bold text-xs sm:text-sm">{currentSuggestion.title}</span>
          </div>
          <p className="text-xs opacity-90 mt-0.5">{currentSuggestion.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {currentSuggestion.actionLabel && currentSuggestion.onAction && (
          <button
            onClick={currentSuggestion.onAction}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 ${buttonStyles[currentSuggestion.variant]}`}
          >
            <span>{currentSuggestion.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => setDismissedKey(currentSuggestion?.key || null)}
          className="p-1.5 rounded-lg text-xs opacity-75 hover:opacity-100 transition-opacity"
          title="Dismiss"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
