import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { AlertItem, AlertPriority } from '../../types';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  Bell,
  Trash2,
  Check,
  Filter
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { alerts, acknowledgeAlert, dismissAlert, t } = useTelemetry();
  const [priorityFilter, setPriorityFilter] = useState<'all' | AlertPriority>('all');

  const priorityOrder: Record<AlertPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  // Filter & sort
  const filteredAlerts = alerts
    .filter(a => priorityFilter === 'all' || a.priority === priorityFilter)
    .sort((a, b) => {
      const pDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const getPriorityBadge = (priority: AlertPriority) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: AlertOctagon,
          label: t('criticalAlerts')
        };
      case 'high':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: AlertTriangle,
          label: t('highAlerts')
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          icon: Info,
          label: t('mediumAlerts')
        };
      case 'low':
        return {
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          icon: CheckCircle,
          label: t('lowAlerts')
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {t('alerts')}
            </h2>
            <p className="text-xs text-slate-400">
              Priority-based safety monitoring & push notifications
            </p>
          </div>
        </div>

        {/* Priority Filter Tabs */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80 overflow-x-auto text-xs">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all capitalize whitespace-nowrap ${
                priorityFilter === p
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'all' ? t('allAlerts') : p}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
          <h4 className="text-base font-semibold text-slate-200">{t('noAlerts')}</h4>
          <p className="text-xs">All tank levels, pumps, sensors, and water flow lines are operating normally.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map(alert => {
            const badge = getPriorityBadge(alert.priority);
            const Icon = badge.icon;
            const timeStr = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  alert.priority === 'critical'
                    ? 'bg-rose-950/40 border-rose-500/40'
                    : alert.priority === 'high'
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-slate-900/80 border-slate-800'
                } ${alert.acknowledged ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${badge.bg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400">{timeStr}</span>
                      {alert.acknowledged && (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Acknowledged
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">
                      {t(alert.titleKey) !== alert.titleKey ? t(alert.titleKey) : alert.titleKey}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {alert.customMessage || (t(alert.messageKey) !== alert.messageKey ? t(alert.messageKey) : alert.messageKey)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('acknowledge')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    title={t('dismiss')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
