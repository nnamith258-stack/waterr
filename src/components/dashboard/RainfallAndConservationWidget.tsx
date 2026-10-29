import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { CloudRain, Award, ArrowDownLeft, ArrowUpRight, Droplet, Star } from 'lucide-react';

export const RainfallAndConservationWidget: React.FC = () => {
  const { telemetry, t, largeFont } = useTelemetry();
  const rain = telemetry.rainfall;
  const flow = telemetry.flow;
  const cons = telemetry.conservation;

  // Rain status label
  const getRainLabel = () => {
    if (!rain.isRaining) return t('dry');
    if (rain.intensity === 'LIGHT') return t('lightRain');
    if (rain.intensity === 'MODERATE') return t('moderateRain');
    return t('heavyRain');
  };

  // Conservation score star rating
  const getRating = (score: number) => {
    if (score >= 80) return { stars: 5, label: t('conservationGood'), color: 'text-emerald-400' };
    if (score >= 60) return { stars: 4, label: t('conservationAvg'), color: 'text-sky-400' };
    return { stars: 3, label: t('conservationPoor'), color: 'text-amber-400' };
  };

  const rating = getRating(cons.conservationScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Rainwater Harvesting Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              rain.isRaining ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 'bg-slate-800 text-slate-400'
            }`}>
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-none">
                {t('rainfall')}
              </h3>
              <span className="text-[11px] text-slate-400">
                Tipping Bucket Sensor • GPIO 34 / 35
              </span>
            </div>
          </div>

          <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
            rain.isRaining
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${rain.isRaining ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{getRainLabel()}</span>
          </div>
        </div>

        {/* Rain Harvest Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center my-3">
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400">{t('harvestedToday')}</div>
            <div className="text-base sm:text-lg font-black text-cyan-400 mt-0.5">
              {rain.harvestedTodayLitres} <span className="text-xs font-normal text-slate-400">L</span>
            </div>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400">{t('harvestedWeek')}</div>
            <div className="text-base sm:text-lg font-black text-sky-400 mt-0.5">
              {rain.harvestedWeekLitres} <span className="text-xs font-normal text-slate-400">L</span>
            </div>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400">{t('harvestedMonth')}</div>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
              {rain.harvestedMonthLitres} <span className="text-xs font-normal text-slate-400">L</span>
            </div>
          </div>
        </div>

        {/* Flow Rates (Inflow vs Outflow) */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">{t('flowRateInlet')}</span>
              <span className="font-bold text-white">{flow.inletFlowLpm} L/min</span>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-sky-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">{t('flowRateOutlet')}</span>
              <span className="font-bold text-white">{flow.outletFlowLpm} L/min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conservation Score & Water Saved Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-none">
                {t('waterConservation')}
              </h3>
              <span className="text-[11px] text-slate-400">
                Eco-Efficiency Index
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < rating.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Score & Ranking Visual */}
        <div className="flex items-center justify-between gap-4 my-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`font-black tracking-tight text-white ${largeFont ? 'text-4xl' : 'text-3xl sm:text-4xl'}`}>
                {cons.conservationScore}
              </span>
              <span className="text-slate-400 text-sm font-semibold">/ 100</span>
            </div>
            <span className={`text-xs font-bold ${rating.color}`}>
              {rating.label}
            </span>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-400">{t('waterSaved')}</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center justify-end gap-1">
              <Droplet className="w-4 h-4 fill-emerald-400" />
              <span>+{cons.waterSavedTodayLitres} L</span>
            </div>
          </div>
        </div>

        {/* Balance Ratio Bar */}
        <div className="space-y-1.5 mt-4">
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, cons.conservationScore))}%` }}
              title="Water Saved"
            />
            <div
              className="bg-sky-500 h-full transition-all duration-500"
              style={{ width: `${100 - Math.min(100, Math.max(10, cons.conservationScore))}%` }}
              title="Water Consumed"
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span className="text-emerald-400">Saved: {cons.waterSavedTodayLitres} L</span>
            <span className="text-sky-400">Used: {cons.waterUsedTodayLitres} L</span>
          </div>
        </div>
      </div>
    </div>
  );
};
