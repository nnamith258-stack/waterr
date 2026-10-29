import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Droplet,
  CloudRain,
  Clock,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { t } = useTelemetry();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => {});
  }, []);

  const currentDataset = data ? data[timeframe] : [];

  // Export CSV function
  const handleExportCSV = () => {
    if (!currentDataset || currentDataset.length === 0) return;
    const headers = ['Period', 'Water Level (%)', 'Water Used (Litres)', 'Rainwater Harvested (Litres)', 'Pump Runtime (Mins)'];
    const rows = currentDataset.map((item: any) => [
      item.label,
      item.level,
      item.used,
      item.harvested,
      item.runtimeMins
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JalSetu_Water_Report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF function
  const handlePrint = () => {
    window.print();
  };

  const totalUsed = currentDataset.reduce((acc: number, cur: any) => acc + (cur.used || 0), 0);
  const totalHarvested = currentDataset.reduce((acc: number, cur: any) => acc + (cur.harvested || 0), 0);
  const totalRuntime = currentDataset.reduce((acc: number, cur: any) => acc + (cur.runtimeMins || 0), 0);

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {t('analytics')}
            </h2>
            <p className="text-xs text-slate-400">
              Usage patterns, conservation balance & motor runtime analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/80 text-xs font-semibold">
            {(['daily', 'weekly', 'monthly'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  timeframe === tf
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <button
            onClick={handleExportCSV}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title="Download CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title="Print or Save PDF"
          >
            <Printer className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Water Consumed</span>
            <Droplet className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {totalUsed.toLocaleString()} <span className="text-sm font-normal text-slate-400">L</span>
          </div>
          <span className="text-[11px] text-slate-400">Across {currentDataset.length} data points</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Rainwater Harvested</span>
            <CloudRain className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            +{totalHarvested.toLocaleString()} <span className="text-sm font-normal text-slate-400">L</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">
            {totalUsed > 0 ? `${Math.round((totalHarvested / totalUsed) * 100)}% of demand met` : 'Pure green water'}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pump Total Runtime</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {Math.floor(totalRuntime / 60)}h {totalRuntime % 60}m
          </div>
          <span className="text-[11px] text-slate-400">ACS712 active run tracking</span>
        </div>
      </div>

      {/* Visual Chart: Water Used vs Rainwater Harvested */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Water Balance: Consumption vs. Harvesting
            </h3>
            <p className="text-xs text-slate-400">Comparison of tap usage and rainwater offset</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-3 h-3 rounded bg-sky-500" /> Used (L)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded bg-emerald-500" /> Harvested (L)
            </span>
          </div>
        </div>

        {/* Bar chart visualisation */}
        <div className="space-y-3 pt-2">
          {currentDataset.map((item: any, idx: number) => {
            const maxVal = Math.max(...currentDataset.map((x: any) => Math.max(x.used, x.harvested)), 1);
            const usedPct = (item.used / maxVal) * 100;
            const harvestedPct = (item.harvested / maxVal) * 100;

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-semibold">
                  <span>{item.label}</span>
                  <span className="text-slate-400 text-[11px]">
                    Used: {item.used} L • Harvested: {item.harvested} L
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${harvestedPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Water Level Historical Trend */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <h3 className="text-sm sm:text-base font-bold text-white mb-1">
          Tank Water Level Stability Trend (%)
        </h3>
        <p className="text-xs text-slate-400 mb-4">Daily average overhead tank reserve</p>

        <div className="h-36 flex items-end gap-2 sm:gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          {currentDataset.map((item: any, idx: number) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <span className="text-[10px] text-slate-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {item.level}%
              </span>
              <div
                className="w-full bg-gradient-to-t from-sky-600 to-cyan-400 rounded-t-lg transition-all group-hover:brightness-125"
                style={{ height: `${item.level}%` }}
              />
              <span className="text-[10px] text-slate-400 truncate max-w-[45px]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
