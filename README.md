# JalSetu (जल सेतु / ಜಲ ಸೇತು) - Smart Water Conservation & Tank Monitoring

A production-grade, mobile-first IoT water conservation and tank monitoring application built for ESP32 hardware with full offline-first local network capabilities, multi-language voice accessibility (English, Hindi, Kannada), multi-tier priority alerts, and leakage detection.

---

## 📁 Project Architecture & Folder Structure

```text
├── firmware/
│   └── JalSetu_ESP32_SmartWater.ino  # Production ESP32 C++ firmware sketch
├── server.ts                          # Express REST API & Vite middleware entrypoint
├── src/
│   ├── App.tsx                        # Master layout with bottom navigation & tabs
│   ├── context/
│   │   └── TelemetryContext.tsx       # Live IoT state, simulator physics, offline queue
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx             # Multilingual toggle, voice reader, connection modal
│   │   │   ├── BottomNav.tsx          # Mobile navigation bar with live status badges
│   │   │   └── HardwareSimulatorDock.tsx # Floating interactive IoT simulator
│   │   ├── dashboard/
│   │   │   ├── AnimatedTankVisual.tsx # SVG wave animation, Sintex ribs, RWH tank
│   │   │   ├── PumpQuickWidget.tsx    # Safety confirmation modal & Sent->Ack->Running stepper
│   │   │   ├── SmartSuggestions.tsx   # Context-aware refill & rain harvesting prompts
│   │   │   ├── LeakAlertBanner.tsx    # Critical red leak alert with loss calculation
│   │   │   └── RainfallAndConservationWidget.tsx # Rain gauge, inflow/outflow, Eco-Score
│   │   ├── pump/
│   │   │   └── PumpDetailsView.tsx    # Automation rules, dry-run interlocks, run logs
│   │   ├── alerts/
│   │   │   └── AlertsView.tsx         # Priority-filtered alerts (Critical, High, Med, Low)
│   │   ├── sensors/
│   │   │   └── SensorsView.tsx        # 8-channel diagnostic telemetry & calibration
│   │   ├── analytics/
│   │   │   └── AnalyticsView.tsx      # Daily/Weekly/Monthly charts, CSV & PDF export
│   │   └── hardware/
│   │       └── HardwareGuideView.tsx  # Interactive wiring diagrams & pinout specs
│   ├── data/
│   │   ├── firmwareCode.ts            # ESP32 sketch source code
│   │   └── wiringGuide.ts             # Pin connections, formulas, calibration guide
│   ├── i18n/
│   │   └── translations.ts            # Multi-language dictionary (EN, Hindi, Kannada)
│   ├── types/
│   │   └── index.ts                   # Core TypeScript IoT schema interfaces
│   └── utils/
│       └── audioAlerts.ts             # Web Audio API synthesizer & Web Speech synthesis
├── public/
│   ├── manifest.json                  # PWA Web App Manifest
│   └── icons/                         # PWA icons
└── package.json
```

---

## 🛠️ Hardware Requirements & Wiring Map

| Sensor / Module | Purpose | ESP32 Pin | Voltage | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **JSN-SR04T Ultrasonic** | Overhead Tank Level | TRIG: GPIO 5, ECHO: GPIO 18 | 5V Supply | Waterproof probe, 20cm blanking offset |
| **Ultrasonic / Float** | Rainwater (RWH) Tank | TRIG: GPIO 19, ECHO: GPIO 21 | 5V Supply | Measures harvested rainwater volume |
| **Rain Sensor Plate** | Rainfall Presence & Rate | D0: GPIO 34, A0: GPIO 35 | 3.3V | 45° angle mounting to shed drops |
| **Flow Sensor (Inlet)** | Pump Flow / Dry-Run | Yellow: GPIO 4 (Interrupt) | 5V (3.3V Pulled) | YF-S201 (~450 pulses/L) |
| **Flow Sensor (Outlet)**| House Water / Leak | Yellow: GPIO 16 (Interrupt) | 5V (3.3V Pulled) | Detects flow during closed tap hours |
| **ACS712 Current Sensor**| Pump Running Proof | OUT: GPIO 32 (Analog ADC) | 5V Supply | True RMS sampling distinguishes relay vs motor |
| **Float Switch (Backup)**| Dry-run / Overflow Interlock | GPIO 22 (Internal Pull-Up) | 3.3V | Mechanical failsafe cutoff |
| **Relay Module (10A/30A)**| Pump Contactor Switching | IN: GPIO 23 | 5V Supply | Switches pump starter coil |
| **Buzzer / Status LED** | Alarm Sounder | GPIO 2 | 3.3V | Audible local warning |

---

## 💧 Key Features & Safety Mechanisms

1. **Accessibility for All Users (Rural / Elderly / Uneducated friendly)**:
   - Visual color metaphors: Blue (healthy), Amber (low), Red (critical), Green (full).
   - Multi-Language support: English, Hindi (हिंदी), and Kannada (ಕನ್ನಡ).
   - "Listen Status" (Web Speech API): Tapping the speaker button reads aloud tank percentage, litres, and pump status in the chosen language.
   - Large Font option for high visibility.

2. **Pump Control with Permission & 3-Step Lifecycle**:
   - Compulsory confirmation modal before sending `ON` or `OFF`.
   - Clear multi-stage state: `Sent` ➔ `Device Acknowledged` ➔ `Running` (confirmed by ACS712 current measurement).
   - Automatic cutoff at 98% (overflow protection) with buzzer alarm.
   - Dry-run prevention: If current is 0A or flow is absent after 25s, pump automatically stops.

3. **Pipe Leakage Detection**:
   - Compares Inflow vs Outflow rates.
   - Detects unexpected water drop when taps are closed (e.g., night hours between 1 AM - 4 AM).
   - Displays estimated litres lost per hour and timestamp.

4. **Offline-First Architecture**:
   - Connects directly to ESP32 over local Wi-Fi (`http://192.168.1.xxx` or AP `192.168.4.1`) without internet.
   - Local state cached in browser storage.
   - Queues offline pump commands with warnings.

5. **Built-in Interactive IoT Hardware Simulator**:
   - Floating dock with real-time physics: test rain collection, pipe leak alerts, pump refill, and dry-run trips without needing physical hardware.

---

## 🚀 Setup & Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Start Full-Stack Dev Server (Express backend + Vite)
npm run dev
```

App will be live on `http://localhost:3000`.
