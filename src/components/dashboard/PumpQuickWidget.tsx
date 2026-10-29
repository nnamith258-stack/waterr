import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  Power,
  RotateCw,
  Zap,
  Clock,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Send,
  Radio
} from 'lucide-react';

export const PumpQuickWidget: React.FC = () => {
  const { telemetry, sendPumpCommand, t, largeFont } = useTelemetry();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetAction, setTargetAction] = useState<'ON' | 'OFF'>('ON');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pump = telemetry.pump;
  const isRunning = pump.state === 'RUNNING';
  const isTransitioning = pump.state === 'SENT' || pump.state === 'ACKNOWLEDGED';

  const handleOpenConfirm = (action: 'ON' | 'OFF') => {
    setErrorMessage(null);
    setTargetAction(action);
    setShowConfirmModal(true);
  };

  const handleExecuteCommand = async () => {
    setShowConfirmModal(false);
    const result = await sendPumpCommand(targetAction);
    if (!result.success && result.message) {
      setErrorMessage(result.message);
    }
  };

  // Stepper state indicator
  const steps = [
    { key: 'SENT', label: '1. Sent', icon: Send },
    { key: 'ACKNOWLEDGED', label: '2. Device Ack', icon: Radio },
    { key: 'RUNNING', label: '3. Running (ACS712)', icon: CheckCircle2 }
  ];

  const getStepStatus = (stepKey: string) => {
    if (pump.state === 'RUNNING') return 'completed';
    if (pump.state === 'ACKNOWLEDGED') {
      if (stepKey === 'SENT' || stepKey === 'ACKNOWLEDGED') return 'completed';
      return 'pending';
    }
    if (pump.state === 'SENT') {
      if (stepKey === 'SENT') return 'active';
      return 'pending';
    }
    return 'idle';
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
          }`}>
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-none">
              {t('pumpStatus')}
            </h3>
            <span className="text-[11px] text-slate-400">
              Contactor Relay GPIO 23 • Current Sensor GPIO 32
            </span>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
          isRunning
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
            : isTransitioning
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : pump.state === 'FAULT'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isRunning ? 'bg-emerald-400' : isTransitioning ? 'bg-amber-400 animate-ping' : 'bg-slate-500'
          }`} />
          <span>
            {pump.state === 'RUNNING'
              ? t('pumpStateRUNNING')
              : pump.state === 'SENT'
              ? t('pumpStateSENT')
              : pump.state === 'ACKNOWLEDGED'
              ? t('pumpStateACK')
              : pump.state === 'FAULT'
              ? t('pumpStateFAULT')
              : t('pumpStateOFF')}
          </span>
        </div>
      </div>

      {/* Multistage Verification Stepper (Sent -> Acknowledged -> Running) */}
      {(isRunning || isTransitioning) && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 mb-3.5">
          <div className="flex items-center justify-between text-xs">
            {steps.map((st) => {
              const status = getStepStatus(st.key);
              return (
                <div key={st.key} className="flex items-center gap-1.5 flex-1 justify-center first:justify-start last:justify-end">
                  <st.icon className={`w-3.5 h-3.5 ${
                    status === 'completed'
                      ? 'text-emerald-400'
                      : status === 'active'
                      ? 'text-amber-400 animate-spin'
                      : 'text-slate-600'
                  }`} />
                  <span className={`text-[11px] font-semibold ${
                    status === 'completed'
                      ? 'text-emerald-300'
                      : status === 'active'
                      ? 'text-amber-300'
                      : 'text-slate-500'
                  }`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Message Toast if Blocked */}
      {errorMessage && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Large Tactile Buttons (Designed for uneducated, elder, or rural users) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {!isRunning ? (
          <button
            onClick={() => handleOpenConfirm('ON')}
            disabled={isTransitioning}
            className={`w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
              largeFont ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
            }`}
          >
            <Power className="w-6 h-6 shrink-0" />
            <span>{t('turnOn')}</span>
          </button>
        ) : (
          <button
            onClick={() => handleOpenConfirm('OFF')}
            disabled={isTransitioning}
            className={`w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-extrabold shadow-lg shadow-rose-900/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
              largeFont ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
            }`}
          >
            <Power className="w-6 h-6 shrink-0" />
            <span>{t('turnOff')}</span>
          </button>
        )}

        {/* Emergency Stop Button (Always Accessible) */}
        <button
          onClick={() => sendPumpCommand('OFF')}
          className="w-full py-4 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <AlertOctagon className="w-5 h-5 text-rose-400" />
          <span>{t('emergencyStop')}</span>
        </button>
      </div>

      {/* Live Pump Diagnostics Bar */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
        <div className="bg-slate-800/40 p-2 rounded-xl">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{t('currentDraw')}</span>
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            {pump.currentAmps.toFixed(1)} {t('amps')}
          </div>
        </div>

        <div className="bg-slate-800/40 p-2 rounded-xl">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>{t('runtimeToday')}</span>
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            {pump.runtimeTodayMinutes} mins
          </div>
        </div>

        <div className="bg-slate-800/40 p-2 rounded-xl">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Safety Rule</span>
          </div>
          <div className="text-xs font-semibold text-emerald-300 mt-1 truncate">
            {t('autoCutoffNotice')}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog (ALWAYS Required Before Sending Command) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
              targetAction === 'ON'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}>
              <Power className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                {targetAction === 'ON' ? t('pumpConfirmTitleOn') : t('pumpConfirmTitleOff')}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {targetAction === 'ON' ? t('pumpConfirmMsgOn') : t('pumpConfirmMsgOff')}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleExecuteCommand}
                className={`w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-lg transition-transform active:scale-95 ${
                  targetAction === 'ON'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
                }`}
              >
                {t('confirmYes')}
              </button>

              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
