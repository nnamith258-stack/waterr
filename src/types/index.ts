export type Language = 'en' | 'hi' | 'kn';

export type PumpState = 'OFF' | 'SENT' | 'ACKNOWLEDGED' | 'RUNNING' | 'FAULT';

export interface TankData {
  levelPercent: number;
  levelLitres: number;
  capacityLitres: number;
  depthCm: number;
  totalHeightCm: number;
  status: 'critical' | 'low' | 'normal' | 'full';
}

export interface RainwaterTankData {
  levelPercent: number;
  levelLitres: number;
  capacityLitres: number;
  depthCm: number;
  totalHeightCm: number;
  status: 'empty' | 'normal' | 'full';
}

export interface PumpData {
  state: PumpState;
  currentAmps: number;
  lastRunTimestamp: string;
  runtimeTodayMinutes: number;
  dryRunDetected: boolean;
  autoCutoff: boolean;
  voltageVolts: number;
  faultReason?: string;
}

export interface RainData {
  isRaining: boolean;
  intensity: 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY';
  rateMmPerHour: number;
  harvestedTodayLitres: number;
  harvestedWeekLitres: number;
  harvestedMonthLitres: number;
}

export interface FlowData {
  inletFlowLpm: number;
  outletFlowLpm: number;
  totalInflowTodayLitres: number;
  totalOutflowTodayLitres: number;
  leakDetected: boolean;
  leakLitresPerHour: number;
  leakStartTime: string | null;
}

export interface ConservationData {
  waterUsedTodayLitres: number;
  waterSavedTodayLitres: number;
  conservationScore: number; // 0 to 100
  trend: 'improving' | 'steady' | 'warning';
}

export interface ConnectionData {
  mode: 'CLOUD' | 'LOCAL_ESP32' | 'SIMULATOR';
  isOnline: boolean;
  esp32Ip: string;
  mqttConnected: boolean;
  rssi: number; // dBm
  lastSyncTime: string;
  pingMs: number;
}

export interface TelemetryState {
  mainTank: TankData;
  rwhTank: RainwaterTankData;
  pump: PumpData;
  rainfall: RainData;
  flow: FlowData;
  conservation: ConservationData;
  connection: ConnectionData;
}

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AlertItem {
  id: string;
  priority: AlertPriority;
  titleKey: string;
  messageKey: string;
  customMessage?: string;
  timestamp: string;
  acknowledged: boolean;
  dismissed: boolean;
  source: 'tank' | 'pump' | 'leak' | 'rain' | 'sensor';
  metadata?: Record<string, any>;
}

export interface SensorDevice {
  id: string;
  nameKey: string;
  englishName: string;
  type: 'ultrasonic' | 'flow' | 'rain' | 'current' | 'float' | 'relay';
  pin: string;
  liveValue: string;
  unit: string;
  status: 'online' | 'offline' | 'calibrating';
  signalOrBattery: string;
  lastUpdated: string;
  calibration: {
    zeroOffsetCm?: number;
    tankHeightCm?: number;
    pulseFactor?: number;
    zeroCurrentMv?: number;
    sensitivityMvPerA?: number;
  };
  history: { time: string; value: number }[];
}

export interface HistoryDataPoint {
  time: string;
  mainTankLevel: number;
  rwhTankLevel: number;
  inflow: number;
  outflow: number;
  pumpRunning: boolean;
  rainIntensity: number;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'family';
  canControlPump: boolean;
}
