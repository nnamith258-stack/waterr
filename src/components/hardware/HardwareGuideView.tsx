import React, { useState } from 'react';
import { esp32FirmwareCode } from '../../data/firmwareCode';
import { wiringGuideData, calibrationGuide } from '../../data/wiringGuide';
import {
  Cpu,
  Code2,
  Copy,
  Check,
  Download,
  Sliders,
  Radio,
  FileCode2,
  Zap,
  Shield,
  Layers
} from 'lucide-react';

export const HardwareGuideView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'firmware' | 'wiring' | 'calibration' | 'api'>('firmware');
  const [copied, setCopied] = useState(false);

  const handleCopyFirmware = () => {
    navigator.clipboard.writeText(esp32FirmwareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([esp32FirmwareCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'JalSetu_ESP32_SmartWater.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              ESP32 IoT Hardware Architecture & Firmware
            </h2>
            <p className="text-xs text-slate-400">
              Pinouts, Arduino C++ firmware, wiring diagrams & sensor calibration
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/80 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'firmware', label: 'ESP32 Firmware (.ino)', icon: FileCode2 },
            { id: 'wiring', label: 'Wiring & Pinout', icon: Zap },
            { id: 'calibration', label: 'Calibration Steps', icon: Sliders },
            { id: 'api', label: 'API & MQTT Topics', icon: Radio },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Firmware Code View */}
      {activeTab === 'firmware' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                JalSetu_ESP32_SmartWater.ino
              </h3>
              <p className="text-xs text-slate-400">
                Production-ready sketch for Arduino IDE / PlatformIO with local HTTP REST and MQTT
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyFirmware}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleDownloadIno}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ino</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
            <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-slate-800">
              <code>{esp32FirmwareCode}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Wiring & Pinout */}
      {activeTab === 'wiring' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wiringGuideData.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{item.component}</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {item.pins.map((pin, pIdx) => (
                    <div
                      key={pIdx}
                      className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">
                          {pin.sensorPin}
                        </span>
                        <span className="text-slate-500">➔</span>
                        <span className="font-mono font-bold text-sky-400">
                          {pin.esp32Pin}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {pin.voltage}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-400 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                  <span className="font-semibold text-slate-300">Notes:</span> {item.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Calibration Steps */}
      {activeTab === 'calibration' && (
        <div className="space-y-4">
          {calibrationGuide.map((step) => (
            <div
              key={step.step}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-black flex items-center justify-center text-xs border border-sky-500/30">
                  0{step.step}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {step.title}
                </h4>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-mono text-amber-300">
                Formula: {step.formula}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {step.instructions}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: API & MQTT Topics */}
      {activeTab === 'api' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">MQTT Broker Topics</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-emerald-400">jalsetu/telemetry</span>
                <span className="text-slate-400">ESP32 Publishes every 2s</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-sky-400">jalsetu/pump/cmd</span>
                <span className="text-slate-400">App Publishes ("ON" / "OFF")</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-amber-400">jalsetu/pump/ack</span>
                <span className="text-slate-400">ESP32 Device Confirmation</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-2">Local REST Endpoints (Offline WiFi)</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-emerald-400">GET http://&lt;esp32_ip&gt;/api/telemetry</span>
                <span className="text-slate-400">Returns full live JSON</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-sky-400">POST http://&lt;esp32_ip&gt;/api/pump</span>
                <span className="text-slate-400">Payload: &#123; "command": "ON" | "OFF" &#125;</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
