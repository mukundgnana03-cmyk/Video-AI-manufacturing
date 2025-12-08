
export interface ProcessStep {
  stepId: number;
  stepName: string;
  startTimestamp: string;
  endTimestamp: string;
  durationSeconds: number;
  actor: string;
  status: 'Normal' | 'Potentially Slow' | 'Potentially Unstable';
  description: string; // Made required for granular detail
}

export interface CycleTimeAnalysis {
  totalCycleTimeSeconds: number;
  stabilityAssessment: string;
  idleTimeObservation: string;
  lineBalancingAssessment: string; // New: Assessment of line balance/bottlenecks
}

export interface IrregularEvent {
  description: string;
  relatedStepId: number;
  severity: 'Low' | 'Medium' | 'High';
}

// Telemetry Definitions (Invisible parameters: Force, Current, etc.)
export interface SimulatedSensorMetadata {
  sensorName: string; // e.g., "Main Spindle Torque"
  location: string; // New: e.g. "Robot Wrist Joint 5"
  functionDescription: string; // New: e.g. "Monitors load to detect collision"
  parameterType: 'Torque' | 'Force' | 'Current' | 'Gas Flow' | 'Power' | 'Temperature' | 'Vibration' | 'Pressure';
  behaviorStatus: 'Normal' | 'Abnormal';
}

export interface SensorDataPoint {
  timeOffset: number;
  [key: string]: number; // Dynamic keys for sensor names
}

// Specific events to mark on the chart (Normal or Abnormal)
export interface TimelineEvent {
  timestamp: number; // Start time
  endTimestamp?: number; // End time (Optional, but preferred for duration)
  label: string; // Short label for the graph, e.g. "Arc Start"
  explanation: string; // Why this happened, e.g. "Current spike due to contact"
  status: 'Normal' | 'Abnormal';
  correlatedSensor: string; // e.g. "Current"
}

// Visual Inspection Definitions (Virtual Sensors attached to components)
export interface VirtualSensor {
  sensorLocation: string; // e.g., "Joint 2 and 3 (Lower Arm)"
  status: 'Normal' | 'Abnormal';
  sensorAction: string; // e.g., "Kinematic Motion Profiling"
  parameterMonitored: string; // e.g., "Acceleration Smoothness / Jerk"
  rationale: string; // Expert rationale
  observation: string; // Detailed observation
}

export interface ComponentAnalysis {
  componentName: string; // e.g., "KUKA KR Series Robotic Manipulator"
  componentStatus: 'Normal' | 'Abnormal';
  machineActivity: string; // e.g., "Articulating complex multi-axis trajectory..."
  correlationAnalysis: string; // New: Synthesized explanation of status based on observations
  virtualSensors: VirtualSensor[];
  normalBehaviors: string[];
  abnormalBehaviors: string[];
}

export interface QualityRisk {
  riskArea: string;
  likelihood: 'Low' | 'Medium' | 'High';
  rationale: string;
}

export interface VisibilityAssessment {
  fullyVisibleComponents: string[];
  partiallyVisibleComponents: string[];
  notVisibleComponents: string[]; // Expected but not seen (Out of frame)
  observedParameters: string[];
  limitations: string[]; // What cannot be confidently seen
}

export interface ImprovementSuggestion {
  area: string;
  suggestion: string;
  expectedBenefit: string;
}

export interface ProductQualityAnalysis {
  visualSignals: string[]; // e.g. "Weld seam consistency", "Surface finish"
  overallAssessment: string;
}

export interface AnalysisResult {
  stationOverview: {
    stationType: string; // Specific process e.g., "Robotic MIG Welding"
    operatorType: string;
    partType: string;
  };
  processNarrative: string; // Detailed expert description of the process
  visibilityAssessment: VisibilityAssessment;
  executiveSummary: string[];
  processSteps: ProcessStep[];
  cycleTimeAnalysis: CycleTimeAnalysis;
  irregularEvents: IrregularEvent[];
  
  // Simulated Sensors (Telemetry)
  simulatedSensorMetadata: SimulatedSensorMetadata[];
  sensorDataSeries: SensorDataPoint[]; 
  timelineEvents: TimelineEvent[]; // Events marked on the chart
  sensorCorrelation: string; // Text explaining how sensors match video
  
  // Virtual Sensors (Visual Inspection)
  componentAnalysis: ComponentAnalysis[];

  integratedAnalysis: string;
  qualityRisks: QualityRisk[];
  productQualityAnalysis: ProductQualityAnalysis;
  improvementSuggestions: ImprovementSuggestion[];
  methodologyExplanation: string;
}

export interface AnalysisState {
  status: 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';
  result: AnalysisResult | null;
  error?: string;
  videoUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
