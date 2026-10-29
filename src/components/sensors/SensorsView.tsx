import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { SensorDevice } from '../../types';
import {
  Activity,
  Sliders,
  Wifi,
  Radio,
  CheckCircle2,
  Clock,
  TrendingUp,
  Cpu,
  Save,
  X
} from 'lucide-react';

export const SensorsView: React.FC = () => {
  const { sensors, updateSensorCalibration, t } = useTelemetry();
  const [calibratingSensor, setCalibratingSensor] = useState<SensorDevice | null>(null);
  const [tankHeight, setTankHeight] = useState<number>(150);
  const [zeroOffset, setZeroOffset] = useState<number>(15);
  const [pulseFactor, setPulseFactor] = useState<number>(450);

  const handleOpenCalibrate = (sensor: SensorDevice) => {
    setCalibratingSensor(sensor);
    setTankHeight(sensor.calibration.tankHeightCm || 150);
    setZeroOffset(sensor.calibration.zeroOffsetCm || 15);
    setPulseFactor(sensor.calibration.pulseFactor || 450);
  };

  const handleSaveCalibration = () => {
    if (!calibratingSensor) return;
    updateSensorCalibration(calibratingSensor.id, {
      tankHeightCm: Number(tankHeight),
      zeroOffsetCm: Number(zeroOffset),
      pulseFactor: Number(pulseFactor)
    });
    setCalibratingSensor(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {t('sensorDetails')}
            </h2>
            <p className="text-xs text-slate-400">
              8 Real-time hardware telemetry channels connected to ESP32
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          All Online
        </span>
      </div>

      {/* Grid of Sensors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sensors.map(sensor => {
          return (
            <div
              key={sensor.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                {/* Header: Name, Pin, Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-white">
                        {sensor.englishName}
                      </h4>
                    </div>
                    <p className="text-xs font-mono text-sky-400 mt-0.5">
                      {sensor.pin}
                    </p>
                  </div>

                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                    Online
                  </span>
                </div>

                {/* Big Live Value Display */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                      {t('sensorLive')}
                    </span>
                    <span className="text-2xl font-black text-white">
                      {sensor.liveValue}
                    </span>
                  </div>

                  <div className="text-right text-xs text-slate-400 font-medium">
                    <div className="flex items-center justify-end gap-1 text-slate-300">
                      <Radio className="w-3.5 h-3.5 text-sky-400" />
                      <span>{sensor.signalOrBattery}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{sensor.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                {/* History Sparkline */}
                {sensor.history && sensor.history.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-sky-400" />
                        Today's Trend
                      </span>
                      <span>5 samples</span>
                    </div>
                    <div className="h-10 flex items-end gap-1.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800">
                      {sensor.history.map((h, i) => {
                        const maxVal = Math.max(...sensor.history.map(x => x.value), 1);
                        const pct = Math.max(15, (h.value / maxVal) * 100);
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-sky-500/40 hover:bg-sky-400 rounded-t transition-all group relative cursor-pointer"
                            style={{ height: `${pct}%` }}
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {h.time}: {h.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Calibration Button */}
              <button
                onClick={() => handleOpenCalibrate(sensor)}
                className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>{t('calibrate')}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Sensor Calibration Modal */}
      {calibratingSensor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-base">
                  Calibrate: {calibratingSensor.englishName}
                </h3>
              </div>
              <button
                onClick={() => setCalibratingSensor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {calibratingSensor.type === 'ultrasonic' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      {t('tankHeightCm')}:
                    </label>
                    <input
                      type="number"
                      value={tankHeight}
                      onChange={(e) => setTankHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Physical height of the overhead tank from base to top lid.</p>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      {t('zeroOffsetCm')}:
                    </label>
                    <input
                      type="number"
                      value={zeroOffset}
                      onChange={(e) => setZeroOffset(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Distance between JSN-SR04T transducer face and maximum full water level mark (minimum 15-20cm).</p>
                  </div>
                </>
              )}

              {calibratingSensor.type === 'flow' && (
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">
                    {t('pulsesPerLiter')}:
                  </label>
                  <input
                    type="number"
                    value={pulseFactor}
                    onChange={(e) => setPulseFactor(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">YF-S201 nominal calibration is 450 pulses per liter (7.5 Hz per L/min).</p>
                </div>
              )}

              {(calibratingSensor.type !== 'ultrasonic' && calibratingSensor.type !== 'flow') && (
                <div className="p-3 bg-slate-800 rounded-xl text-slate-300">
                  This sensor uses factory zero-current / interrupt threshold mapping. No manual offset adjustments required.
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveCalibration}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>{t('saveCalibration')}</span>
              </button>
              <button
                onClick={() => setCalibratingSensor(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
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
