import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Droplets, CloudRain, ShieldCheck, AlertTriangle } from 'lucide-react';

export const AnimatedTankVisual: React.FC = () => {
  const { telemetry, t, largeFont } = useTelemetry();
  const [selectedTank, setSelectedTank] = useState<'main' | 'rwh'>('main');

  const main = telemetry.mainTank;
  const rwh = telemetry.rwhTank;

  const currentTank = selectedTank === 'main' ? main : rwh;
  const isMain = selectedTank === 'main';

  // Determine status color palette
  const getTheme = (pct: number) => {
    if (pct < 20) {
      return {
        bgGradient: 'from-rose-950/40 via-slate-900 to-slate-900',
        waterColor: '#f43f5e',
        waterSecondary: '#e11d48',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        label: t('tankCritical')
      };
    }
    if (pct < 35) {
      return {
        bgGradient: 'from-amber-950/40 via-slate-900 to-slate-900',
        waterColor: '#f59e0b',
        waterSecondary: '#d97706',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        label: t('tankLow')
      };
    }
    if (pct >= 95) {
      return {
        bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-900',
        waterColor: '#10b981',
        waterSecondary: '#059669',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        label: t('tankFull')
      };
    }
    return {
      bgGradient: 'from-sky-950/40 via-slate-900 to-slate-900',
      waterColor: '#0284c7',
      waterSecondary: '#0369a1',
      border: 'border-sky-500/30',
      text: 'text-sky-400',
      badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      label: t('tankNormal')
    };
  };

  const theme = getTheme(currentTank.levelPercent);

  // SVG wave calculation
  const fillPct = Math.min(100, Math.max(0, currentTank.levelPercent));
  const waterHeight = (fillPct / 100) * 220; // 220px inner tank height
  const waterY = 250 - waterHeight; // 250 is bottom level inside SVG

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: theme.waterColor }}
      />

      {/* Tank Switcher Tabs (Main vs Rainwater) */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setSelectedTank('main')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isMain
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>{t('mainTank')}</span>
          </button>
          <button
            onClick={() => setSelectedTank('rwh')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isMain
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>{t('rainwaterTank')}</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${theme.badge}`}>
          {currentTank.levelPercent < 20 ? (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{theme.label}</span>
        </div>
      </div>

      {/* Main Tank Visual and Metrics Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Left Column: Visual Animated Water Tank */}
        <div className="sm:col-span-5 flex justify-center py-1">
          <div className="relative w-48 sm:w-52 h-64 flex items-center justify-center">
            <svg
              viewBox="0 0 160 270"
              className="w-full h-full drop-shadow-2xl"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Tank clip path with rounded corners & top lid shape */}
                <clipPath id="tankInnerClip">
                  <rect x="25" y="30" width="110" height="220" rx="14" />
                </clipPath>

                {/* Water vertical gradient */}
                <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={theme.waterColor} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={theme.waterSecondary} stopOpacity="0.95" />
                </linearGradient>

                {/* Subsurface shimmer */}
                <linearGradient id="shimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Tank Lid / Rim (Sintex style) */}
              <rect x="40" y="16" width="80" height="14" rx="4" fill="#334155" stroke="#475569" strokeWidth="2" />
              <rect x="60" y="10" width="40" height="8" rx="2" fill="#1e293b" />

              {/* Tank Outer Shell (Ribbed cylindrical body) */}
              <rect
                x="23"
                y="28"
                width="114"
                height="224"
                rx="16"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="3"
              />

              {/* Tank Molded Ribs (Sintex realistic structural rings) */}
              <line x1="24" y1="75" x2="136" y2="75" stroke="#1e293b" strokeWidth="3" opacity="0.8" />
              <line x1="24" y1="125" x2="136" y2="125" stroke="#1e293b" strokeWidth="3" opacity="0.8" />
              <line x1="24" y1="175" x2="136" y2="175" stroke="#1e293b" strokeWidth="3" opacity="0.8" />
              <line x1="24" y1="225" x2="136" y2="225" stroke="#1e293b" strokeWidth="3" opacity="0.8" />

              {/* Water Content Area (Clipped to tank) */}
              <g clipPath="url(#tankInnerClip)">
                {/* Background water tank glass */}
                <rect x="25" y="30" width="110" height="220" fill="#090d16" />

                {/* Animated Water Body */}
                <rect
                  x="25"
                  y={waterY}
                  width="110"
                  height={waterHeight + 10}
                  fill="url(#waterGrad)"
                  className="transition-all duration-700 ease-out"
                />

                {/* Animated Wave Top Layer */}
                {fillPct > 0 && fillPct < 100 && (
                  <path
                    d={`M 20 ${waterY} Q 40 ${waterY - 4} 60 ${waterY} T 100 ${waterY} T 140 ${waterY} L 140 ${waterY + 10} L 20 ${waterY + 10} Z`}
                    fill={theme.waterColor}
                    opacity="0.7"
                    className="animate-pulse"
                  />
                )}

                {/* Water Shimmer Highlight */}
                <rect
                  x="28"
                  y={waterY}
                  width="18"
                  height={waterHeight}
                  fill="url(#shimmerGrad)"
                  opacity="0.4"
                />

                {/* Graduation / Measurement Markings Inside Tank */}
                <g stroke="#ffffff" strokeWidth="1" opacity="0.35">
                  <line x1="122" y1="52" x2="132" y2="52" />
                  <line x1="126" y1="102" x2="132" y2="102" />
                  <line x1="122" y1="152" x2="132" y2="152" />
                  <line x1="126" y1="202" x2="132" y2="202" />
                  <line x1="122" y1="240" x2="132" y2="240" />
                </g>
              </g>

              {/* Percentage Label Inside SVG */}
              <text
                x="80"
                y="150"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="24"
                fontWeight="900"
                letterSpacing="-0.5"
                filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.8))"
              >
                {Math.round(currentTank.levelPercent)}%
              </text>
            </svg>
          </div>
        </div>

        {/* Right Column: Clear, High-Contrast Metrics for Everyone */}
        <div className="sm:col-span-7 space-y-3.5">
          {/* Huge Level Header */}
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              {isMain ? t('sintexTank') : t('rainwaterTank')}
            </div>
            <div className="flex items-baseline gap-3">
              <span className={`font-black tracking-tight ${largeFont ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'} ${theme.text}`}>
                {Math.round(currentTank.levelPercent)}%
              </span>
              <span className="text-slate-300 text-sm font-semibold">
                {currentTank.levelLitres.toLocaleString()} {t('litres')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('capacity')}: <span className="text-white font-medium">{currentTank.capacityLitres} {t('litres')}</span> • {t('waterDepth')}: <span className="text-white font-medium">{currentTank.depthCm} cm</span>
            </p>
          </div>

          {/* Visual Progress Bar (Touch-friendly reference) */}
          <div className="space-y-1">
            <div className="h-3.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(3, currentTank.levelPercent))}%`,
                  backgroundColor: theme.waterColor
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
              <span>0% ({t('tankEmpty')})</span>
              <span>50%</span>
              <span>100% ({t('tankFull')})</span>
            </div>
          </div>

          {/* Quick Informational Highlights */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <div className="text-[11px] text-slate-400">{t('waterDepth')}</div>
              <div className="text-base font-bold text-white mt-0.5">
                {currentTank.depthCm} <span className="text-xs font-normal text-slate-400">/ {currentTank.totalHeightCm} cm</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <div className="text-[11px] text-slate-400">{t('waterUsed')}</div>
              <div className="text-base font-bold text-sky-400 mt-0.5">
                {telemetry.conservation.waterUsedTodayLitres} <span className="text-xs font-normal text-slate-400">{t('litres')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
