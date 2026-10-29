export interface PinConnection {
  component: string;
  pins: { sensorPin: string; esp32Pin: string; voltage: string; description: string }[];
  notes: string;
}

export const wiringGuideData: PinConnection[] = [
  {
    component: "JSN-SR04T Ultrasonic (Main Overhead Tank)",
    pins: [
      { sensorPin: "VCC", esp32Pin: "5V (VIN)", voltage: "5V", description: "Power supply" },
      { sensorPin: "GND", esp32Pin: "GND", voltage: "0V", description: "Common ground" },
      { sensorPin: "TRIG", esp32Pin: "GPIO 5", voltage: "3.3V", description: "Trigger pulse output" },
      { sensorPin: "ECHO", esp32Pin: "GPIO 18", voltage: "3.3V (via 1k/2k divider)", description: "Echo pulse (step down 5V to 3.3V)" },
    ],
    notes: "Mount transducer vertically downward in center of tank lid. Maintain minimum 20cm blanking distance from full water level."
  },
  {
    component: "Ultrasonic / Level Sensor (Rainwater Tank)",
    pins: [
      { sensorPin: "VCC", esp32Pin: "5V (VIN)", voltage: "5V", description: "Power supply" },
      { sensorPin: "GND", esp32Pin: "GND", voltage: "0V", description: "Common ground" },
      { sensorPin: "TRIG", esp32Pin: "GPIO 19", voltage: "3.3V", description: "Trigger pulse output" },
      { sensorPin: "ECHO", esp32Pin: "GPIO 21", voltage: "3.3V (via divider)", description: "Echo pulse input" },
    ],
    notes: "Used to monitor rainwater storage level and calculate harvested water volume."
  },
  {
    component: "Rain Sensor (Capacitive/Resistive Plate)",
    pins: [
      { sensorPin: "VCC", esp32Pin: "3.3V", voltage: "3.3V", description: "Power" },
      { sensorPin: "GND", esp32Pin: "GND", voltage: "0V", description: "Ground" },
      { sensorPin: "D0 (Digital)", esp32Pin: "GPIO 34", voltage: "3.3V", description: "Rain presence trigger (Active LOW)" },
      { sensorPin: "A0 (Analog)", esp32Pin: "GPIO 35", voltage: "3.3V", description: "Rain intensity measurement" },
    ],
    notes: "Place outdoor at 45 degree angle so water drops run off naturally after rain stops."
  },
  {
    component: "Inlet Flow Sensor (YF-S201 - 1/2 Inch)",
    pins: [
      { sensorPin: "Red (VCC)", esp32Pin: "5V", voltage: "5V", description: "Hall effect sensor power" },
      { sensorPin: "Black (GND)", esp32Pin: "GND", voltage: "0V", description: "Ground" },
      { sensorPin: "Yellow (Signal)", esp32Pin: "GPIO 4", voltage: "3.3V (Internal Pull-Up)", description: "Pulse output interrupt (~450 pulses/L)" },
    ],
    notes: "Install horizontally on inlet pipe coming from borewell/sump pump. Arrow indicates flow direction."
  },
  {
    component: "Outlet Flow Sensor (YF-S201 - 1/2 Inch)",
    pins: [
      { sensorPin: "Red (VCC)", esp32Pin: "5V", voltage: "5V", description: "Power" },
      { sensorPin: "Black (GND)", esp32Pin: "GND", voltage: "0V", description: "Ground" },
      { sensorPin: "Yellow (Signal)", esp32Pin: "GPIO 16", voltage: "3.3V (Internal Pull-Up)", description: "Pulse output interrupt for house supply" },
    ],
    notes: "Measures house water consumption. When outlet flow > 0 with closed taps or at 2 AM, leak alert triggers."
  },
  {
    component: "ACS712 Current Sensor (Pump Running Feedback)",
    pins: [
      { sensorPin: "VCC", esp32Pin: "5V", voltage: "5V", description: "Power" },
      { sensorPin: "GND", esp32Pin: "GND", voltage: "0V", description: "Ground" },
      { sensorPin: "OUT", esp32Pin: "GPIO 32", voltage: "3.3V (via voltage divider)", description: "Analog voltage proportional to AC pump current" },
      { sensorPin: "AC Screw Terminals", esp32Pin: "In series with Motor Live line", voltage: "230V AC", description: "Current sensing path" },
    ],
    notes: "Confirms true pump running state. Distinguishes between 'Relay ON but motor tripped' vs 'Normal pumping'."
  },
  {
    component: "Relay Module (Pump Contactor Control)",
    pins: [
      { sensorPin: "VCC", esp32Pin: "5V", voltage: "5V", description: "Optocoupler power" },
      { sensorPin: "GND", esp32Pin: "GND", voltage: "0V", description: "Ground" },
      { sensorPin: "IN", esp32Pin: "GPIO 23", voltage: "3.3V / 5V", description: "Active HIGH / LOW switching" },
      { sensorPin: "COM & NO", esp32Pin: "Pump Starter Coil", voltage: "230V AC", description: "Connect to motor starter push button" },
    ],
    notes: "Always switch the starter coil or magnetic contactor rather than switching high-HP pump current directly."
  },
  {
    component: "Float Switch (Backup Dry-Run & Overflow)",
    pins: [
      { sensorPin: "Wire 1", esp32Pin: "GND", voltage: "0V", description: "Common ground" },
      { sensorPin: "Wire 2", esp32Pin: "GPIO 22", voltage: "3.3V (Internal Pull-Up)", description: "Direct hardware interrupt" },
    ],
    notes: "Failsafe redundancy: If software hangs or Wi-Fi drops, mechanical float switch cuts off pump immediately."
  }
];

export const calibrationGuide = [
  {
    step: 1,
    title: "Overhead Tank Calibration",
    formula: "Water Depth = Total Tank Height - (Measured Distance - Sensor Offset)",
    instructions: "Measure your tank's physical height from bottom to maximum overflow lip (e.g., 150 cm). Then measure distance from the sensor face to the 100% water mark (usually 15-20 cm due to JSN-SR04T dead-zone). Enter these in the sensor settings."
  },
  {
    step: 2,
    title: "Flow Sensor Pulse Factor (YF-S201)",
    formula: "Pulses/L = Total Pulses / Known Litres Dispensed",
    instructions: "Fill a standard 20 Litre jar through the flow sensor. If 9,000 pulses were counted, your factor is 9,000 / 20 = 450 pulses/L. Save this in calibration."
  },
  {
    step: 3,
    title: "ACS712 Motor Current Calibration",
    formula: "Current (A) = (ADC Voltage - Zero Voltage) / Sensitivity",
    instructions: "With pump completely off, measure zero-current voltage (~1.65V on 3.3V ESP32 ADC). When running, a 1 HP pump typically draws 4.2A to 5.5A at 230V."
  },
  {
    step: 4,
    title: "Leakage Threshold Tuning",
    formula: "Night Loss Rate = (Tank Level Drop Litres - Metered Outflow) / Hours",
    instructions: "Between 1:00 AM and 4:00 AM, if level drops by > 15 Litres with zero metered tap outflow, the system automatically flags a subterranean pipe rupture or running toilet valve."
  }
];
