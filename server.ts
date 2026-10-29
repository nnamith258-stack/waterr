import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory persistent IoT state
let telemetryState = {
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
    state: 'OFF', // 'OFF' | 'SENT' | 'ACKNOWLEDGED' | 'RUNNING' | 'FAULT'
    currentAmps: 0.0,
    lastRunTimestamp: new Date(Date.now() - 42 * 60000).toISOString(),
    runtimeTodayMinutes: 38,
    dryRunDetected: false,
    autoCutoff: true,
    voltageVolts: 228
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
    mode: 'CLOUD',
    isOnline: true,
    esp32Ip: '192.168.1.142',
    mqttConnected: true,
    rssi: -58,
    lastSyncTime: new Date().toISOString(),
    pingMs: 24
  }
};

let alertsList = [
  {
    id: 'alt-1',
    priority: 'medium',
    titleKey: 'alertRainStartedTitle',
    messageKey: 'alertRainStartedMsg',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    acknowledged: false,
    dismissed: false,
    source: 'rain'
  },
  {
    id: 'alt-2',
    priority: 'low',
    titleKey: 'Water Saved Notice',
    customMessage: 'Overhead tank reached optimum reserve. Rainwater diverter flushed cleanly.',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    acknowledged: true,
    dismissed: false,
    source: 'tank'
  }
];

let sensorsList = [
  {
    id: 'sensor-1',
    nameKey: 'mainTank',
    englishName: 'JSN-SR04T Waterproof Ultrasonic (Main Tank)',
    type: 'ultrasonic',
    pin: 'GPIO 5 (Trig) / GPIO 18 (Echo)',
    liveValue: '68%',
    unit: '%',
    status: 'online',
    signalOrBattery: '-58 dBm',
    lastUpdated: 'Just now',
    calibration: { zeroOffsetCm: 15, tankHeightCm: 150 },
    history: [
      { time: '06:00', value: 45 },
      { time: '08:00', value: 85 },
      { time: '10:00', value: 78 },
      { time: '12:00', value: 72 },
      { time: '14:00', value: 68 }
    ]
  },
  {
    id: 'sensor-2',
    nameKey: 'rainwaterTank',
    englishName: 'RWH Tank Level Sensor (Rainwater)',
    type: 'ultrasonic',
    pin: 'GPIO 19 (Trig) / GPIO 21 (Echo)',
    liveValue: '45%',
    unit: '%',
    status: 'online',
    signalOrBattery: '-62 dBm',
    lastUpdated: 'Just now',
    calibration: { zeroOffsetCm: 10, tankHeightCm: 120 },
    history: [
      { time: '06:00', value: 30 },
      { time: '08:00', value: 40 },
      { time: '10:00', value: 45 },
      { time: '12:00', value: 45 },
      { time: '14:00', value: 45 }
    ]
  },
  {
    id: 'sensor-3',
    nameKey: 'flowRateInlet',
    englishName: 'Inlet Flow Sensor (YF-S201)',
    type: 'flow',
    pin: 'GPIO 4 (Interrupt)',
    liveValue: '0.0',
    unit: 'L/min',
    status: 'online',
    signalOrBattery: '100% Wired',
    lastUpdated: 'Just now',
    calibration: { pulseFactor: 450 },
    history: [
      { time: '06:00', value: 0 },
      { time: '07:30', value: 24.5 },
      { time: '08:00', value: 25.0 },
      { time: '10:00', value: 0 },
      { time: '14:00', value: 0 }
    ]
  },
  {
    id: 'sensor-4',
    nameKey: 'flowRateOutlet',
    englishName: 'Outlet Flow Sensor (YF-S201)',
    type: 'flow',
    pin: 'GPIO 16 (Interrupt)',
    liveValue: '1.8',
    unit: 'L/min',
    status: 'online',
    signalOrBattery: '100% Wired',
    lastUpdated: 'Just now',
    calibration: { pulseFactor: 450 },
    history: [
      { time: '06:00', value: 0 },
      { time: '07:00', value: 6.2 },
      { time: '08:30', value: 4.8 },
      { time: '12:00', value: 2.1 },
      { time: '14:00', value: 1.8 }
    ]
  },
  {
    id: 'sensor-5',
    nameKey: 'currentDraw',
    englishName: 'ACS712 Motor Current Sensor (Pump)',
    type: 'current',
    pin: 'GPIO 32 (ADC)',
    liveValue: '0.0',
    unit: 'Amps',
    status: 'online',
    signalOrBattery: 'Normal',
    lastUpdated: 'Just now',
    calibration: { zeroCurrentMv: 1650, sensitivityMvPerA: 100 },
    history: [
      { time: '06:00', value: 0 },
      { time: '07:30', value: 4.8 },
      { time: '08:00', value: 4.9 },
      { time: '10:00', value: 0 },
      { time: '14:00', value: 0 }
    ]
  },
  {
    id: 'sensor-6',
    nameKey: 'rainfall',
    englishName: 'Tipping Bucket / Capacitive Rain Sensor',
    type: 'rain',
    pin: 'GPIO 34 (D0) / GPIO 35 (A0)',
    liveValue: 'Dry',
    unit: 'status',
    status: 'online',
    signalOrBattery: '-64 dBm',
    lastUpdated: 'Just now',
    calibration: {},
    history: [
      { time: '06:00', value: 0 },
      { time: '08:00', value: 8 },
      { time: '10:00', value: 2 },
      { time: '12:00', value: 0 },
      { time: '14:00', value: 0 }
    ]
  },
  {
    id: 'sensor-7',
    nameKey: 'pumpStatus',
    englishName: 'Solid State Relay Pump Contactor',
    type: 'relay',
    pin: 'GPIO 23',
    liveValue: 'OFF',
    unit: 'state',
    status: 'online',
    signalOrBattery: 'Armed',
    lastUpdated: 'Just now',
    calibration: {},
    history: []
  },
  {
    id: 'sensor-8',
    nameKey: 'dryRunProtected',
    englishName: 'Emergency Float Switch (Redundant Safety)',
    type: 'float',
    pin: 'GPIO 22 (Pull-up ISR)',
    liveValue: 'Safe (Closed)',
    unit: 'state',
    status: 'online',
    signalOrBattery: 'Normal',
    lastUpdated: 'Just now',
    calibration: {},
    history: []
  }
];

// Historical analytics data
const historicalData = {
  daily: [
    { label: 'Mon', level: 75, used: 480, harvested: 120, runtimeMins: 32 },
    { label: 'Tue', level: 82, used: 510, harvested: 240, runtimeMins: 35 },
    { label: 'Wed', level: 68, used: 490, harvested: 90, runtimeMins: 28 },
    { label: 'Thu', level: 90, used: 550, harvested: 310, runtimeMins: 40 },
    { label: 'Fri', level: 72, used: 460, harvested: 150, runtimeMins: 30 },
    { label: 'Sat', level: 65, used: 620, harvested: 60, runtimeMins: 45 },
    { label: 'Sun (Today)', level: 68, used: 520, harvested: 180, runtimeMins: 38 }
  ],
  weekly: [
    { label: 'Week 1', level: 78, used: 3400, harvested: 850, runtimeMins: 220 },
    { label: 'Week 2', level: 81, used: 3550, harvested: 1200, runtimeMins: 240 },
    { label: 'Week 3', level: 74, used: 3200, harvested: 680, runtimeMins: 210 },
    { label: 'Week 4', level: 79, used: 3600, harvested: 1400, runtimeMins: 250 }
  ],
  monthly: [
    { label: 'May', level: 62, used: 14200, harvested: 1100, runtimeMins: 980 },
    { label: 'Jun', level: 78, used: 13800, harvested: 4200, runtimeMins: 890 },
    { label: 'Jul', level: 88, used: 13500, harvested: 6800, runtimeMins: 820 },
    { label: 'Aug', level: 85, used: 14000, harvested: 5900, runtimeMins: 840 },
    { label: 'Sep', level: 80, used: 13900, harvested: 4300, runtimeMins: 860 },
    { label: 'Oct', level: 76, used: 14100, harvested: 3800, runtimeMins: 880 }
  ]
};

// API Routes
app.get('/api/telemetry', (_req, res) => {
  telemetryState.connection.lastSyncTime = new Date().toISOString();
  res.json(telemetryState);
});

app.post('/api/telemetry', (req, res) => {
  const incoming = req.body;
  telemetryState = {
    ...telemetryState,
    ...incoming,
    connection: {
      ...telemetryState.connection,
      lastSyncTime: new Date().toISOString()
    }
  };
  res.json({ success: true, updated: telemetryState });
});

app.post('/api/pump', (req, res) => {
  const { command } = req.body; // 'ON' | 'OFF'

  if (command === 'ON') {
    // Safety check: Dry-run & Overflow prevention
    if (telemetryState.mainTank.levelPercent >= 98) {
      return res.status(400).json({
        success: false,
        error: 'Overflow safety block: Tank is already full at 98%.'
      });
    }

    // Step 1: SENT
    telemetryState.pump.state = 'SENT';
    
    // Simulate device handshake
    setTimeout(() => {
      telemetryState.pump.state = 'ACKNOWLEDGED';
      
      // Step 2: Running with current verification
      setTimeout(() => {
        telemetryState.pump.state = 'RUNNING';
        telemetryState.pump.currentAmps = 4.8;
        telemetryState.pump.lastRunTimestamp = new Date().toISOString();
        telemetryState.flow.inletFlowLpm = 25.0;
        
        // Update sensor
        const currentSensor = sensorsList.find(s => s.id === 'sensor-5');
        if (currentSensor) currentSensor.liveValue = '4.8';
        const relaySensor = sensorsList.find(s => s.id === 'sensor-7');
        if (relaySensor) relaySensor.liveValue = 'RUNNING';
      }, 700);
    }, 600);

    return res.json({
      success: true,
      command: 'ON',
      state: 'SENT',
      message: 'Command sent to ESP32 controller.'
    });
  } else if (command === 'OFF') {
    telemetryState.pump.state = 'OFF';
    telemetryState.pump.currentAmps = 0.0;
    telemetryState.flow.inletFlowLpm = 0.0;

    const currentSensor = sensorsList.find(s => s.id === 'sensor-5');
    if (currentSensor) currentSensor.liveValue = '0.0';
    const relaySensor = sensorsList.find(s => s.id === 'sensor-7');
    if (relaySensor) relaySensor.liveValue = 'OFF';

    return res.json({
      success: true,
      command: 'OFF',
      state: 'OFF',
      message: 'Pump turned off.'
    });
  }

  res.status(400).json({ success: false, error: 'Unknown command' });
});

app.get('/api/sensors', (_req, res) => {
  // Synchronize sensor live values
  sensorsList = sensorsList.map(sensor => {
    if (sensor.id === 'sensor-1') sensor.liveValue = `${telemetryState.mainTank.levelPercent}%`;
    if (sensor.id === 'sensor-2') sensor.liveValue = `${telemetryState.rwhTank.levelPercent}%`;
    if (sensor.id === 'sensor-3') sensor.liveValue = `${telemetryState.flow.inletFlowLpm.toFixed(1)}`;
    if (sensor.id === 'sensor-4') sensor.liveValue = `${telemetryState.flow.outletFlowLpm.toFixed(1)}`;
    if (sensor.id === 'sensor-5') sensor.liveValue = `${telemetryState.pump.currentAmps.toFixed(1)}`;
    if (sensor.id === 'sensor-6') sensor.liveValue = telemetryState.rainfall.isRaining ? telemetryState.rainfall.intensity : 'Dry';
    if (sensor.id === 'sensor-7') sensor.liveValue = telemetryState.pump.state;
    return sensor;
  });
  res.json(sensorsList);
});

app.post('/api/sensors/:id/calibrate', (req, res) => {
  const { id } = req.params;
  const calibration = req.body;
  const sensor = sensorsList.find(s => s.id === id);
  if (sensor) {
    sensor.calibration = { ...sensor.calibration, ...calibration };
    return res.json({ success: true, sensor });
  }
  res.status(404).json({ success: false, error: 'Sensor not found' });
});

app.get('/api/alerts', (_req, res) => {
  res.json(alertsList);
});

app.post('/api/alerts/:id/ack', (req, res) => {
  const { id } = req.params;
  const alert = alertsList.find(a => a.id === id);
  if (alert) {
    alert.acknowledged = true;
    return res.json({ success: true, alert });
  }
  res.status(404).json({ success: false });
});

app.post('/api/alerts/:id/dismiss', (req, res) => {
  const { id } = req.params;
  alertsList = alertsList.filter(a => a.id !== id);
  res.json({ success: true, id });
});

app.post('/api/alerts/trigger', (req, res) => {
  const newAlert = {
    id: `alt-${Date.now()}`,
    priority: req.body.priority || 'high',
    titleKey: req.body.titleKey || 'alertLowWaterTitle',
    messageKey: req.body.messageKey || 'alertLowWaterMsg',
    customMessage: req.body.customMessage,
    timestamp: new Date().toISOString(),
    acknowledged: false,
    dismissed: false,
    source: req.body.source || 'tank'
  };
  alertsList.unshift(newAlert);
  res.json({ success: true, alert: newAlert });
});

app.get('/api/analytics', (_req, res) => {
  res.json(historicalData);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JalSetu] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
