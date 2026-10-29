import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  LayoutDashboard,
  Power,
  Bell,
  Activity,
  BarChart3,
  Cpu
} from 'lucide-react';

export type NavTab = 'dashboard' | 'pump' | 'alerts' | 'sensors' | 'analytics' | 'hardware';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const { t, alerts, telemetry } = useTelemetry();

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;
  const isPumpRunning = telemetry.pump.state === 'RUNNING';

  const navItems = [
    { id: 'dashboard' as NavTab, labelKey: 'dashboard', icon: LayoutDashboard },
    {
      id: 'pump' as NavTab,
      labelKey: 'pumpControl',
      icon: Power,
      indicator: isPumpRunning ? 'bg-emerald-400 animate-ping' : undefined
    },
    {
      id: 'alerts' as NavTab,
      labelKey: 'alerts',
      icon: Bell,
      badge: unacknowledgedAlerts > 0 ? unacknowledgedAlerts : undefined
    },
    { id: 'sensors' as NavTab, labelKey: 'sensors', icon: Activity },
    { id: 'analytics' as NavTab, labelKey: 'analytics', icon: BarChart3 },
    { id: 'hardware' as NavTab, labelKey: 'hardwareGuide', icon: Cpu }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 py-1.5 px-2 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-around">
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive
                  ? 'text-sky-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.indicator && (
                  <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${item.indicator}`} />
                )}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 truncate max-w-[60px] leading-tight">
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
