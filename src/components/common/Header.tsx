import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  Droplets,
  Volume2,
  VolumeX,
  Type,
  Wifi,
  WifiOff,
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';
import { Language } from '../../types';

interface HeaderProps {
  onOpenSimulator: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSimulator }) => {
  const {
    t,
    language,
    setLanguage,
    largeFont,
    toggleLargeFont,
    speakStatus,
    isSpeaking,
    telemetry,
    syncNow,
    setConnectionMode,
    setEsp32Ip,
    offlineQueueCount
  } = useTelemetry();

  const [isSyncing, setIsSyncing] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [tempIp, setTempIp] = useState(telemetry.connection.esp32Ip);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncNow();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'EN', native: 'English' },
    { code: 'hi', label: 'हिंदी', native: 'हिंदी' },
    { code: 'kn', label: 'ಕನ್ನಡ', native: 'ಕನ್ನಡ' }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 py-2.5 sm:px-4 sm:py-3 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Droplets className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                  {t('appName')}
                </h1>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 shrink-0">
                  ESP32 IoT
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden xs:block">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                    language === lang.code
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={lang.native}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Listen / Voice Readout (Vital for uneducated/rural users) */}
            <button
              onClick={speakStatus}
              disabled={isSpeaking}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isSpeaking
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={t('speakStatus')}
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <span className="hidden md:inline">
                {isSpeaking ? t('speaking') : t('speakStatus')}
              </span>
            </button>

            {/* Accessibility: Large Text Toggle */}
            <button
              onClick={toggleLargeFont}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                largeFont
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={t('largeText')}
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Connection Mode / Status Pill */}
            <button
              onClick={() => setShowNetworkModal(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs bg-slate-800/90 border border-slate-700 text-slate-300 hover:border-slate-600 transition-colors"
              title="Connection & Network Settings"
            >
              {telemetry.connection.mode === 'SIMULATOR' ? (
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
              ) : telemetry.connection.isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="font-medium hidden sm:inline">
                {telemetry.connection.mode === 'SIMULATOR'
                  ? 'Simulator'
                  : telemetry.connection.mode === 'LOCAL_ESP32'
                  ? 'Local WiFi'
                  : 'Cloud'}
              </span>
            </button>

            {/* Quick Sync Button */}
            <button
              onClick={handleSync}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Sync Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Simulator Toggle Button */}
            <button
              onClick={onOpenSimulator}
              className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
              title="Hardware Simulator Controls"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Network / Connection Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-sky-400" />
              Connection & Offline Settings
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              JalSetu works completely without internet by speaking directly to the ESP32 on your local WiFi network.
            </p>

            <div className="space-y-3 mb-5">
              <button
                onClick={() => setConnectionMode('SIMULATOR')}
                className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                  telemetry.connection.mode === 'SIMULATOR'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Interactive Hardware Simulator</div>
                  <div className="text-xs opacity-75">Demo tank levels, rain, pump physics, leaks, and alarms without hardware</div>
                </div>
              </button>

              <button
                onClick={() => setConnectionMode('LOCAL_ESP32')}
                className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                  telemetry.connection.mode === 'LOCAL_ESP32'
                    ? 'bg-sky-500/10 border-sky-500 text-sky-200'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Wifi className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">ESP32 Local Direct WiFi (Offline First)</div>
                  <div className="text-xs opacity-75">Connects directly to ESP32 IP address on your home router with zero internet</div>
                </div>
              </button>

              <button
                onClick={() => setConnectionMode('CLOUD')}
                className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                  telemetry.connection.mode === 'CLOUD'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Cloud Server Sync</div>
                  <div className="text-xs opacity-75">Full telemetry sync via Express backend and MQTT broker</div>
                </div>
              </button>
            </div>

            {telemetry.connection.mode === 'LOCAL_ESP32' && (
              <div className="mb-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <label className="text-xs text-slate-300 block mb-1 font-medium">
                  ESP32 Local IP Address:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempIp}
                    onChange={(e) => setTempIp(e.target.value)}
                    placeholder="192.168.1.142"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono"
                  />
                  <button
                    onClick={() => setEsp32Ip(tempIp)}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Save IP
                  </button>
                </div>
              </div>
            )}

            {offlineQueueCount > 0 && (
              <div className="mb-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                <span>Queued offline commands:</span>
                <span className="font-bold">{offlineQueueCount} action(s) pending</span>
              </div>
            )}

            <button
              onClick={() => setShowNetworkModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
