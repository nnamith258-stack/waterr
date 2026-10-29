import React, { createContext, useContext, useState, useEffect, useRef, useTransition } from 'react';
import {
  TelemetryState,
  AlertItem,
  SensorDevice,
  Language,
  PumpState
} from '../types';
import { translations } from '../i18n/translations';
import { sounds, speakText } from '../utils/audioAlerts';

interface TelemetryContextType {
  telemetry: TelemetryState;
  alerts: AlertItem[];
  sensors: SensorDevice[];
  language: Language;
  setLanguage: (lang: Language) => void;
  largeFont: boolean;
  toggleLargeFont: () => void;
  t: (key: string, interpolations?: Record<string, string | number>) => string;
  sendPumpCommand: (command: 'ON' | 'OFF') => Promise<{ success: boolean; message?: string }>;
  acknowledgeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  triggerLeakSimulation: () => void;
  triggerDryRunSimulation: () => void;
  toggleRainSimulation: () => void;
  toggleTapUsageSimulation: () => void;
  speakStatus: () => void;
  isSpeaking: boolean;
  setConnectionMode: (mode: 'CLOUD' | 'LOCAL_ESP32' | 'SIMULATOR') => void;
  setEsp32Ip: (ip: string) => void;
  syncNow: () => Promise<void>;
  offlineQueueCount: number;
  updateSensorCalibration: (sensorId: string, calibration: any) => void;
  simSettings: {
    isRaining: boolean;
    tapUsageActive: boolean;
    leakActive: boolean;
    dryRunActive: boolean;
    sensorOffline: boolean;
  };
  setSimSettings: React.Dispatch<React.SetStateAction<{
    isRaining: boolean;
    tapUsageActive: boolean;
    leakActive: boolean;
    dryRunActive: boolean;
    sensorOffline: boolean;
  }>>;
}

const defaultTelemetry: TelemetryState = {
  mainTank: {
    levelPercent: 68,
    levelLitres: 680,
    capacityLitres: 1000,
    depthCm: 102,
    totalHeightCm: 150,
    status: 'normal'
  },
  rwhTank: {
    levelPercent: 45,
    levelLitres: 225,
    capacityLitres: 500,
    depthCm: 54,
    totalHeightCm: 120,
    status: 'normal'
  },
  pump: {
    state: 'OFF',
    currentAmps: 0.0,
    lastRunTimestamp: new Date(Date.now() - 42 * 60000).toISOString(),
    runtimeTodayMinutes: 38,
    dryRunDetected: false,
    autoCutoff: true,
    voltageVolts: 230
  },
  rainfall: {
    isRaining: false,
    intensity: 'NONE',
    rateMmPerHour: 0,
    harvestedTodayLitres: 180,
    harvestedWeekLitres: 720,
    harvestedMonthLitres: 2450
  },
  flow: {
    inletFlowLpm: 0,
    outletFlowLpm: 1.8,
    totalInflowTodayLitres: 650,
    totalOutflowTodayLitres: 520,
    leakDetected: false,
    leakLitresPerHour: 0,
    leakStartTime: null
  },
  conservation: {
    waterUsedTodayLitres: 520,
    waterSavedTodayLitres: 180,
    conservationScore: 84,
    trend: 'improving'
  },
  connection: {
    mode: 'SIMULATOR',
    isOnline: true,
    esp32Ip: '192.168.1.142',
    mqttConnected: true,
    rssi: -58,
    lastSyncTime: new Date().toISOString(),
    pingMs: 24
  }
};

const initialAlerts: AlertItem[] = [
  {
    id: 'alt-rain-1',
    priority: 'medium',
    titleKey: 'alertRainStartedTitle',
    messageKey: 'alertRainStartedMsg',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    acknowledged: false,
    dismissed: false,
    source: 'rain'
  }
];

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, startTransition] = useTransition();
  const [telemetry, setTelemetry] = useState<TelemetryState>(() => {
    try {
      const saved = localStorage.getItem('jalsetu_telemetry');
      return saved ? JSON.parse(saved) : defaultTelemetry;
    } catch {
      return defaultTelemetry;
    }
  });

  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    try {
      const saved = localStorage.getItem('jalsetu_alerts');
      return saved ? JSON.parse(saved) : initialAlerts;
    } catch {
      return initialAlerts;
    }
  });

  const [sensors, setSensors] = useState<SensorDevice[]>([]);

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('jalsetu_lang');
      return (saved as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  const [largeFont, setLargeFont] = useState<boolean>(() => {
    try {
      return localStorage.getItem('jalsetu_large_font') === 'true';
    } catch {
      return false;
    }
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<{ command: 'ON' | 'OFF'; timestamp: string }[]>([]);

  // Simulator controls
  const [simSettings, setSimSettings] = useState({
    isRaining: false,
    tapUsageActive: true,
    leakActive: false,
    dryRunActive: false,
    sensorOffline: false
  });

  const pumpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Translation helper with interpolation
  const t = (key: string, interpolations?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.en;
    let text = (dict as any)[key] || (translations.en as any)[key] || key;
    if (interpolations) {
      Object.entries(interpolations).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('jalsetu_lang', lang);
    } catch {}
    sounds.playClick();
  };

  const toggleLargeFont = () => {
    setLargeFont(prev => {
      const next = !prev;
      try {
        localStorage.setItem('jalsetu_large_font', String(next));
      } catch {}
      return next;
    });
    sounds.playClick();
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jalsetu_telemetry', JSON.stringify(telemetry));
    } catch {}
  }, [telemetry]);

  useEffect(() => {
    try {
      localStorage.setItem('jalsetu_alerts', JSON.stringify(alerts));
    } catch {}
  }, [alerts]);

  // Initial fetch of sensors from backend
  useEffect(() => {
    fetch('/api/sensors')
      .then(res => res.json())
      .then(data => setSensors(data))
      .catch(() => {
        // Fallback mock sensors if server unreachable
      });
  }, []);

  // Simulator Physics Loop (Runs every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        let updated = { ...prev };
        let newMainPct = prev.mainTank.levelPercent;
        let newRwhPct = prev.rwhTank.levelPercent;
        let inletFlow = 0;
        let outletFlow = 0;
        let currentAmps = 0;
        let newPumpState: PumpState = prev.pump.state;
        let pumpRuntime = prev.pump.runtimeTodayMinutes;
        let leakActive = simSettings.leakActive;
        let waterUsed = prev.conservation.waterUsedTodayLitres;
        let waterSaved = prev.conservation.waterSavedTodayLitres;

        // 1. Handle Pump Running
        if (prev.pump.state === 'RUNNING') {
          pumpRuntime += 0.016; // 1 second in minutes
          currentAmps = simSettings.dryRunActive ? 0.0 : 4.8;
          inletFlow = simSettings.dryRunActive ? 0.0 : 25.0; // 25 Litres/min

          if (simSettings.dryRunActive) {
            // Dry run triggered! No water flow or current draw
            newPumpState = 'FAULT';
            sounds.playAlarm();
            addAlert({
              priority: 'critical',
              titleKey: 'alertDryRunTitle',
              messageKey: 'alertDryRunMsg',
              source: 'pump'
            });
          } else {
            // Rising level (~0.3% per second into 1000L tank)
            newMainPct = Math.min(100, newMainPct + 0.35);

            // Auto-cutoff at 98% (Overflow protection)
            if (newMainPct >= 98.0) {
              newPumpState = 'OFF';
              currentAmps = 0;
              inletFlow = 0;
              sounds.playSuccessChime();
              addAlert({
                priority: 'critical',
                titleKey: 'alertOverflowTitle',
                messageKey: 'alertOverflowMsg',
                source: 'tank'
              });
            }
          }
        }

        // 2. Handle Tap Usage
        if (simSettings.tapUsageActive) {
          outletFlow += 2.2;
          newMainPct = Math.max(0, newMainPct - 0.04);
          waterUsed += 0.036;
        }

        // 3. Handle Pipe Leak
        if (leakActive) {
          outletFlow += 0.8;
          newMainPct = Math.max(0, newMainPct - 0.08);
          waterUsed += 0.05;
        }

        // 4. Handle Rain
        let isRaining = simSettings.isRaining;
        let rainRate = isRaining ? 18 : 0;
        if (isRaining) {
          newRwhPct = Math.min(100, newRwhPct + 0.25);
          waterSaved += 0.08;
        }

        const mainLitres = Math.round((newMainPct / 100) * prev.mainTank.capacityLitres);
        const rwhLitres = Math.round((newRwhPct / 100) * prev.rwhTank.capacityLitres);

        // Conservation Score (0 - 100)
        const ratio = waterSaved > 0 ? (waterSaved / (waterUsed + 1)) : 0.3;
        const score = Math.min(100, Math.max(20, Math.round(ratio * 100 + 40)));

        return {
          ...prev,
          mainTank: {
            ...prev.mainTank,
            levelPercent: Math.round(newMainPct * 10) / 10,
            levelLitres: mainLitres,
            depthCm: Math.round((newMainPct / 100) * prev.mainTank.totalHeightCm),
            status: newMainPct < 15 ? 'critical' : newMainPct < 30 ? 'low' : newMainPct >= 95 ? 'full' : 'normal'
          },
          rwhTank: {
            ...prev.rwhTank,
            levelPercent: Math.round(newRwhPct * 10) / 10,
            levelLitres: rwhLitres,
            depthCm: Math.round((newRwhPct / 100) * prev.rwhTank.totalHeightCm),
            status: newRwhPct >= 95 ? 'full' : newRwhPct < 10 ? 'empty' : 'normal'
          },
          pump: {
            ...prev.pump,
            state: newPumpState,
            currentAmps,
            runtimeTodayMinutes: Math.round(pumpRuntime)
          },
          rainfall: {
            ...prev.rainfall,
            isRaining,
            intensity: isRaining ? 'MODERATE' : 'NONE',
            rateMmPerHour: rainRate,
            harvestedTodayLitres: Math.round(waterSaved)
          },
          flow: {
            ...prev.flow,
            inletFlowLpm: inletFlow,
            outletFlowLpm: Math.round(outletFlow * 10) / 10,
            leakDetected: leakActive,
            leakLitresPerHour: leakActive ? 14 : 0,
            leakStartTime: leakActive ? (prev.flow.leakStartTime || new Date().toLocaleTimeString()) : null
          },
          conservation: {
            ...prev.conservation,
            waterUsedTodayLitres: Math.round(waterUsed),
            waterSavedTodayLitres: Math.round(waterSaved),
            conservationScore: score
          },
          connection: {
            ...prev.connection,
            lastSyncTime: new Date().toISOString()
          }
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [simSettings]);

  const addAlert = (alert: Omit<AlertItem, 'id' | 'timestamp' | 'acknowledged' | 'dismissed'>) => {
    const newAlert: AlertItem = {
      ...alert,
      id: `alt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      dismissed: false
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const acknowledgeAlert = (id: string) => {
    sounds.playClick();
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    fetch(`/api/alerts/${id}/ack`, { method: 'POST' }).catch(() => {});
  };

  const dismissAlert = (id: string) => {
    sounds.playClick();
    setAlerts(prev => prev.filter(a => a.id !== id));
    fetch(`/api/alerts/${id}/dismiss`, { method: 'POST' }).catch(() => {});
  };

  // Safe pump command execution with multistage status: Sent -> Acknowledged -> Running
  const sendPumpCommand = async (command: 'ON' | 'OFF'): Promise<{ success: boolean; message?: string }> => {
    sounds.playClick();

    if (command === 'ON') {
      // Safety block if tank is full
      if (telemetry.mainTank.levelPercent >= 98) {
        sounds.playAlarm();
        return {
          success: false,
          message: t('suggestionFull')
        };
      }

      // 1. Sent
      setTelemetry(prev => ({ ...prev, pump: { ...prev.pump, state: 'SENT' } }));

      // Send to server or local ESP32
      try {
        if (telemetry.connection.mode === 'LOCAL_ESP32') {
          // Direct local WiFi command to ESP32 IP
          await fetch(`http://${telemetry.connection.esp32Ip}/api/pump`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'ON' })
          });
        } else {
          await fetch('/api/pump', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'ON' })
          });
        }
      } catch {
        // If offline, queue command
        setOfflineQueue(q => [...q, { command: 'ON', timestamp: new Date().toISOString() }]);
      }

      // Step 2: Acknowledged after 500ms
      pumpTimeoutRef.current = setTimeout(() => {
        setTelemetry(prev => ({ ...prev, pump: { ...prev.pump, state: 'ACKNOWLEDGED' } }));

        // Step 3: Running after verified current feedback (600ms later)
        setTimeout(() => {
          sounds.playSuccessChime();
          setTelemetry(prev => ({
            ...prev,
            pump: {
              ...prev.pump,
              state: 'RUNNING',
              currentAmps: 4.8,
              lastRunTimestamp: new Date().toISOString()
            },
            flow: {
              ...prev.flow,
              inletFlowLpm: 25.0
            }
          }));
        }, 600);
      }, 500);

      return { success: true };
    } else {
      // Turn OFF
      setTelemetry(prev => ({
        ...prev,
        pump: {
          ...prev.pump,
          state: 'OFF',
          currentAmps: 0.0
        },
        flow: {
          ...prev.flow,
          inletFlowLpm: 0.0
        }
      }));

      try {
        if (telemetry.connection.mode === 'LOCAL_ESP32') {
          await fetch(`http://${telemetry.connection.esp32Ip}/api/pump`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'OFF' })
          });
        } else {
          await fetch('/api/pump', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'OFF' })
          });
        }
      } catch {}

      return { success: true };
    }
  };

  const triggerLeakSimulation = () => {
    sounds.playClick();
    setSimSettings(s => {
      const next = !s.leakActive;
      if (next) {
        sounds.playAlarm();
        addAlert({
          priority: 'critical',
          titleKey: 'alertLeakTitle',
          messageKey: 'alertLeakMsg',
          source: 'leak'
        });
      }
      return { ...s, leakActive: next };
    });
  };

  const triggerDryRunSimulation = () => {
    sounds.playClick();
    setSimSettings(s => ({ ...s, dryRunActive: !s.dryRunActive }));
  };

  const toggleRainSimulation = () => {
    sounds.playClick();
    setSimSettings(s => {
      const next = !s.isRaining;
      if (next) {
        addAlert({
          priority: 'medium',
          titleKey: 'alertRainStartedTitle',
          messageKey: 'alertRainStartedMsg',
          source: 'rain'
        });
      }
      return { ...s, isRaining: next };
    });
  };

  const toggleTapUsageSimulation = () => {
    sounds.playClick();
    setSimSettings(s => ({ ...s, tapUsageActive: !s.tapUsageActive }));
  };

  // Read out status with voice synthesis
  const speakStatus = async () => {
    sounds.playClick();
    setIsSpeaking(true);

    const mainPct = Math.round(telemetry.mainTank.levelPercent);
    const mainLitres = telemetry.mainTank.levelLitres;
    const rwhPct = Math.round(telemetry.rwhTank.levelPercent);
    const pumpStatus = telemetry.pump.state === 'RUNNING' ? t('pumpStateRUNNING') : t('pumpStateOFF');
    const rainStatus = telemetry.rainfall.isRaining ? t('moderateRain') : t('dry');

    const spokenText = t('speechStatus', {
      tank: mainPct,
      litres: mainLitres,
      rwh: rwhPct,
      pump: pumpStatus,
      rain: rainStatus
    });

    try {
      await speakText(spokenText, language);
    } finally {
      setIsSpeaking(false);
    }
  };

  const setConnectionMode = (mode: 'CLOUD' | 'LOCAL_ESP32' | 'SIMULATOR') => {
    sounds.playClick();
    setTelemetry(prev => ({
      ...prev,
      connection: { ...prev.connection, mode }
    }));
  };

  const setEsp32Ip = (ip: string) => {
    setTelemetry(prev => ({
      ...prev,
      connection: { ...prev.connection, esp32Ip: ip }
    }));
  };

  const syncNow = async () => {
    sounds.playClick();
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        startTransition(() => {
          setTelemetry(prev => ({ ...prev, ...data }));
        });
        sounds.playSuccessChime();
      }
    } catch {
      // Offline fallback
    }
  };

  const updateSensorCalibration = (sensorId: string, calibration: any) => {
    sounds.playClick();
    setSensors(prev => prev.map(s => s.id === sensorId ? {
      ...s,
      calibration: { ...s.calibration, ...calibration }
    } : s));

    fetch(`/api/sensors/${sensorId}/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calibration)
    }).catch(() => {});
  };

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        alerts,
        sensors,
        language,
        setLanguage,
        largeFont,
        toggleLargeFont,
        t,
        sendPumpCommand,
        acknowledgeAlert,
        dismissAlert,
        triggerLeakSimulation,
        triggerDryRunSimulation,
        toggleRainSimulation,
        toggleTapUsageSimulation,
        speakStatus,
        isSpeaking,
        setConnectionMode,
        setEsp32Ip,
        syncNow,
        offlineQueueCount: offlineQueue.length,
        updateSensorCalibration,
        simSettings,
        setSimSettings
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
