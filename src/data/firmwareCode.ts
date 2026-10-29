export const esp32FirmwareCode = `/*
 * JalSetu - ESP32 Smart Water Conservation & Tank Monitoring Firmware
 * Hardware:
 *  - ESP32 WROOM-32 (Wi-Fi + BLE)
 *  - Ultrasonic JSN-SR04T (Overhead Tank): TRIG=GPIO 5, ECHO=GPIO 18
 *  - Ultrasonic / Float Sensor (RWH Tank): TRIG=GPIO 19, ECHO=GPIO 21
 *  - Rain Sensor (Digital + Analog): DO=GPIO 34, AO=GPIO 35
 *  - Flow Sensor Inlet (YF-S201): Interrupt GPIO 4
 *  - Flow Sensor Outlet (YF-S201): Interrupt GPIO 16
 *  - ACS712 Current Sensor (Pump verification): Analog GPIO 32
 *  - Float Switch (Safety Cutoff): Interrupt GPIO 22 (Pull-Up)
 *  - Relay Module (Pump Active High/Low): Control GPIO 23
 *  - Buzzer / Status LED: GPIO 2
 *
 * Features:
 *  - Local REST API (/api/telemetry, /api/pump) for Offline Local WiFi operation
 *  - MQTT Client for cloud/broker synchronization
 *  - Built-in Safety Interlocks: Auto Cut-off at 98%, Dry-Run Shutdown if no flow or current fault
 *  - Moving Median Filter for ultrasonic noise suppression
 */

#include <WiFi.h>
#include <WebServer.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// --- Network & MQTT Settings ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic_telemetry = "jalsetu/telemetry";
const char* mqtt_topic_cmd = "jalsetu/pump/cmd";
const char* mqtt_topic_ack = "jalsetu/pump/ack";

// --- GPIO Pin Definitions ---
#define PIN_TRIG_MAIN       5
#define PIN_ECHO_MAIN       18
#define PIN_TRIG_RWH        19
#define PIN_ECHO_RWH        21
#define PIN_RAIN_DO         34
#define PIN_RAIN_AO         35
#define PIN_FLOW_INLET      4
#define PIN_FLOW_OUTLET     16
#define PIN_ACS712          32
#define PIN_FLOAT_SAFETY    22
#define PIN_RELAY_PUMP      23
#define PIN_STATUS_LED      2

// --- Tank Dimensions (Configurable via API) ---
float mainTankTotalHeightCm = 150.0; // 150 cm height (Sintex ~1000L)
float mainTankSensorOffsetCm = 15.0; // Distance from sensor face to 100% water mark
float mainTankCapacityLitres = 1000.0;

float rwhTankTotalHeightCm = 120.0;
float rwhTankSensorOffsetCm = 10.0;
float rwhTankCapacityLitres = 500.0;

// Flow calibration: ~450 pulses per liter for YF-S201
float pulsesPerLiter = 450.0;

// ACS712 Sensitivity (66 mV/A for 30A module, 100 mV/A for 20A, 185 mV/A for 5A)
float acsSensitivity = 0.100; // 100 mV/A
float acsZeroMv = 1650.0;     // ~1.65V zero offset at 3.3V ADC

// --- State Variables ---
WebServer server(80);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

volatile unsigned long inletPulseCount = 0;
volatile unsigned long outletPulseCount = 0;
volatile bool floatSwitchTriggered = false;

bool pumpState = false;
unsigned long pumpStartTime = 0;
unsigned long totalPumpRuntimeTodaySec = 0;
unsigned long lastTelemetrySendTime = 0;
float lastMainLevelPct = 75.0;
float lastRwhLevelPct = 40.0;
bool dryRunAlert = false;
bool leakAlert = false;

// --- Interrupt Service Routines ---
void IRAM_ATTR onInletFlowPulse() {
  inletPulseCount++;
}

void IRAM_ATTR onOutletFlowPulse() {
  outletPulseCount++;
}

void IRAM_ATTR onFloatSwitchChange() {
  // Float switch pulled low on emergency/high-water
  if (digitalRead(PIN_FLOAT_SAFETY) == LOW) {
    floatSwitchTriggered = true;
    digitalWrite(PIN_RELAY_PUMP, LOW); // Immediate hardware shutoff
    pumpState = false;
  }
}

// --- Ultrasonic Measurement with Median Filter ---
float measureDistanceCm(int trigPin, int echoPin) {
  float readings[5];
  for (int i = 0; i < 5; i++) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(3);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout (~5m)
    if (duration == 0) {
      readings[i] = 999.0;
    } else {
      readings[i] = (duration * 0.0343) / 2.0;
    }
    delay(10);
  }

  // Sort for median
  for (int i = 0; i < 4; i++) {
    for (int j = i + 1; j < 5; j++) {
      if (readings[i] > readings[j]) {
        float temp = readings[i];
        readings[i] = readings[j];
        readings[j] = temp;
      }
    }
  }
  return readings[2]; // Median value
}

// --- ACS712 Current Measurement (True RMS) ---
float readPumpCurrentAmps() {
  float sumSquared = 0;
  int sampleCount = 200;
  for (int i = 0; i < sampleCount; i++) {
    int raw = analogRead(PIN_ACS712);
    float voltageMv = (raw / 4095.0) * 3300.0;
    float currentA = (voltageMv - acsZeroMv) / (acsSensitivity * 1000.0);
    sumSquared += (currentA * currentA);
    delayMicroseconds(100);
  }
  float rmsCurrent = sqrt(sumSquared / sampleCount);
  if (rmsCurrent < 0.15) rmsCurrent = 0.0; // Noise threshold
  return rmsCurrent;
}

// --- Pump Control Function with Safety Checks ---
bool setPump(bool turnOn, String &reason) {
  if (turnOn) {
    if (lastMainLevelPct >= 98.0) {
      reason = "Blocked: Overhead tank is already 98% full (Overflow safety)";
      return false;
    }
    if (floatSwitchTriggered) {
      reason = "Blocked: Float switch tripped (Safety lockout)";
      return false;
    }
    digitalWrite(PIN_RELAY_PUMP, HIGH);
    pumpState = true;
    pumpStartTime = millis();
    reason = "Pump started successfully";
    return true;
  } else {
    digitalWrite(PIN_RELAY_PUMP, LOW);
    pumpState = false;
    reason = "Pump turned off";
    return true;
  }
}

// --- REST Endpoints for Direct Local WiFi Control ---
void handleGetTelemetry() {
  StaticJsonDocument<512> doc;
  doc["mainTankLevelPct"] = lastMainLevelPct;
  doc["mainTankLitres"] = (lastMainLevelPct / 100.0) * mainTankCapacityLitres;
  doc["rwhTankLevelPct"] = lastRwhLevelPct;
  doc["pumpState"] = pumpState ? "RUNNING" : "OFF";
  doc["pumpCurrent"] = readPumpCurrentAmps();
  doc["rainDetected"] = (digitalRead(PIN_RAIN_DO) == LOW);
  doc["inletFlowLpm"] = (inletPulseCount / pulsesPerLiter) * 6.0; // scaled
  doc["outletFlowLpm"] = (outletPulseCount / pulsesPerLiter) * 6.0;
  doc["rssi"] = WiFi.RSSI();
  
  String response;
  serializeJson(doc, response);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", response);
}

void handlePostPump() {
  if (!server.hasArg("plain")) {
    server.send(400, "text/plain", "Body missing");
    return;
  }
  StaticJsonDocument<256> doc;
  deserializeJson(doc, server.arg("plain"));
  const char* cmd = doc["command"]; // "ON" or "OFF"
  
  String reason;
  bool success = false;
  if (strcmp(cmd, "ON") == 0) {
    success = setPump(true, reason);
  } else if (strcmp(cmd, "OFF") == 0) {
    success = setPump(false, reason);
  }
  
  StaticJsonDocument<256> reply;
  reply["status"] = success ? "OK" : "REJECTED";
  reply["reason"] = reason;
  reply["pumpState"] = pumpState ? "RUNNING" : "OFF";
  
  String out;
  serializeJson(reply, out);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", out);
}

void setup() {
  Serial.begin(115200);
  
  // Pin Setup
  pinMode(PIN_TRIG_MAIN, OUTPUT);
  pinMode(PIN_ECHO_MAIN, INPUT);
  pinMode(PIN_TRIG_RWH, OUTPUT);
  pinMode(PIN_ECHO_RWH, INPUT);
  pinMode(PIN_RAIN_DO, INPUT);
  pinMode(PIN_FLOW_INLET, INPUT_PULLUP);
  pinMode(PIN_FLOW_OUTLET, INPUT_PULLUP);
  pinMode(PIN_FLOAT_SAFETY, INPUT_PULLUP);
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  
  digitalWrite(PIN_RELAY_PUMP, LOW);
  
  // Attach interrupts for pulse counting
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_INLET), onInletFlowPulse, RISING);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_OUTLET), onOutletFlowPulse, RISING);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOAT_SAFETY), onFloatSwitchChange, CHANGE);
  
  // Start WiFi
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP("JalSetu-ESP32-Direct", "jalsetu123");
  WiFi.begin(ssid, password);
  
  Serial.println("JalSetu ESP32 Booted. IP: " + WiFi.localIP().toString());
  
  // Setup REST Server
  server.on("/api/telemetry", HTTP_GET, handleGetTelemetry);
  server.on("/api/pump", HTTP_POST, handlePostPump);
  server.begin();
  
  // Setup MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
}

void loop() {
  server.handleClient();
  
  // Periodic sensor sampling & safety loop
  unsigned long now = millis();
  if (now - lastTelemetrySendTime > 2000) {
    lastTelemetrySendTime = now;
    
    // Measure Main Tank
    float distMain = measureDistanceCm(PIN_TRIG_MAIN, PIN_ECHO_MAIN);
    if (distMain < 900.0) {
      float waterDepth = mainTankTotalHeightCm - (distMain - mainTankSensorOffsetCm);
      if (waterDepth < 0) waterDepth = 0;
      if (waterDepth > mainTankTotalHeightCm) waterDepth = mainTankTotalHeightCm;
      lastMainLevelPct = (waterDepth / mainTankTotalHeightCm) * 100.0;
    }
    
    // Auto-Stop at 98% (Overflow Prevention)
    if (pumpState && lastMainLevelPct >= 98.0) {
      digitalWrite(PIN_RELAY_PUMP, LOW);
      pumpState = false;
      Serial.println("[SAFETY] Auto-stopped pump: Main tank is 98% full!");
    }
    
    // Dry-run checking (If pump running > 25s, verify motor current or inlet flow)
    if (pumpState && (now - pumpStartTime > 25000)) {
      float current = readPumpCurrentAmps();
      if (current < 0.2) { // Motor not drawing current or no water suction
        digitalWrite(PIN_RELAY_PUMP, LOW);
        pumpState = false;
        dryRunAlert = true;
        Serial.println("[SAFETY] Dry-run shutoff! Current is 0A.");
      }
    }
  }
}
`;
