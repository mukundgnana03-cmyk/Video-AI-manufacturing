
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, ChatMessage } from "../types";

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:video/mp4;base64,")
      const base64Data = base64String.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    stationOverview: {
      type: Type.OBJECT,
      properties: {
        stationType: { type: Type.STRING, description: "Specific process name (e.g., 'Robotic Spot Welding', 'Manual Gear Assembly')" },
        operatorType: { type: Type.STRING },
        partType: { type: Type.STRING },
      },
      required: ["stationType", "operatorType", "partType"],
    },
    processNarrative: { type: Type.STRING, description: "A detailed, expert-level English description of the manufacturing process observed. MUST BE GROUNDED IN VISUAL REALITY." },
    visibilityAssessment: {
      type: Type.OBJECT,
      properties: {
        fullyVisibleComponents: { type: Type.ARRAY, items: { type: Type.STRING } },
        partiallyVisibleComponents: { type: Type.ARRAY, items: { type: Type.STRING } },
        notVisibleComponents: { type: Type.ARRAY, items: { type: Type.STRING } },
        observedParameters: { type: Type.ARRAY, items: { type: Type.STRING } },
        limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["fullyVisibleComponents", "partiallyVisibleComponents", "notVisibleComponents", "observedParameters", "limitations"],
    },
    executiveSummary: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    processSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepId: { type: Type.INTEGER },
          stepName: { type: Type.STRING, description: "Specific action name (e.g. 'Robot Approach to Weld Point 1')" },
          startTimestamp: { type: Type.STRING, description: "Exact video timestamp (e.g., '00:02')" },
          endTimestamp: { type: Type.STRING, description: "Exact video timestamp (e.g., '00:05')" },
          durationSeconds: { type: Type.NUMBER },
          actor: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["Normal", "Potentially Slow", "Potentially Unstable"] },
          description: { type: Type.STRING, description: "Detailed mechanical explanation of what is happening (e.g. 'End-effector rotates 90 degrees to align with fixture')." }
        },
        required: ["stepId", "stepName", "startTimestamp", "endTimestamp", "durationSeconds", "actor", "status", "description"],
      },
    },
    cycleTimeAnalysis: {
      type: Type.OBJECT,
      properties: {
        totalCycleTimeSeconds: { type: Type.NUMBER, description: "MUST MATCH the end timestamp of the final process step." },
        stabilityAssessment: { type: Type.STRING },
        idleTimeObservation: { type: Type.STRING },
        lineBalancingAssessment: { type: Type.STRING, description: "Assessment of line balance, bottlenecks, and internal waiting." },
      },
      required: ["totalCycleTimeSeconds", "stabilityAssessment", "idleTimeObservation", "lineBalancingAssessment"],
    },
    irregularEvents: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          relatedStepId: { type: Type.INTEGER },
          severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        },
        required: ["description", "relatedStepId", "severity"],
      },
    },
    simulatedSensorMetadata: {
      type: Type.ARRAY,
      description: "Definitions for the invisible telemetry parameters. MUST specify location and function.",
      items: {
        type: Type.OBJECT,
        properties: {
          sensorName: { type: Type.STRING },
          location: { type: Type.STRING, description: "Precise physical location e.g. 'Joint 5 Servo Driver'" },
          functionDescription: { type: Type.STRING, description: "What behavior this sensor monitors e.g. 'Torque load during lifting'" },
          parameterType: { type: Type.STRING, enum: ['Torque', 'Force', 'Current', 'Gas Flow', 'Power', 'Temperature', 'Vibration', 'Pressure'] },
          behaviorStatus: { type: Type.STRING, enum: ["Normal", "Abnormal"] },
        },
        required: ["sensorName", "location", "functionDescription", "parameterType", "behaviorStatus"],
      },
    },
    sensorDataSeries: {
      type: Type.ARRAY,
      description: "Simulated sensor values. The 'timeOffset' sequence MUST cover the entire 'totalCycleTimeSeconds' (from 0 to end).",
      items: {
        type: Type.OBJECT,
        properties: {
          timeOffset: { type: Type.NUMBER },
          Vibration: { type: Type.NUMBER, nullable: true },
          Power: { type: Type.NUMBER, nullable: true },
          Pressure: { type: Type.NUMBER, nullable: true },
          Temperature: { type: Type.NUMBER, nullable: true },
          Force: { type: Type.NUMBER, nullable: true },
          Current: { type: Type.NUMBER, nullable: true },
          GasFlow: { type: Type.NUMBER, nullable: true },
          Torque: { type: Type.NUMBER, nullable: true },
        },
        required: ["timeOffset"],
      },
    },
    timelineEvents: {
      type: Type.ARRAY,
      description: "Specific moments to mark on the chart to explain Normal or Abnormal behavior. Timestamps must be within Cycle Time.",
      items: {
        type: Type.OBJECT,
        properties: {
            timestamp: { type: Type.NUMBER, description: "Start time of the event" },
            endTimestamp: { type: Type.NUMBER, description: "End time of the event (optional)" },
            label: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Detailed engineering reason for the sensor behavior." },
            status: { type: Type.STRING, enum: ["Normal", "Abnormal"] },
            correlatedSensor: { type: Type.STRING },
        },
        required: ["timestamp", "label", "explanation", "status", "correlatedSensor"]
      }
    },
    sensorCorrelation: { type: Type.STRING, description: "Overall explanation of how the simulated sensors correlate with the video events." },
    componentAnalysis: {
      type: Type.ARRAY,
      description: "Deep visual inspection of machines/components using Virtual Sensors.",
      items: {
        type: Type.OBJECT,
        properties: {
          componentName: { type: Type.STRING },
          componentStatus: { type: Type.STRING, enum: ["Normal", "Abnormal"] },
          machineActivity: { type: Type.STRING },
          correlationAnalysis: { type: Type.STRING, description: "Synthesize the visual evidence. Explain why the component is Normal or Abnormal based on the virtual sensors." },
          virtualSensors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sensorLocation: { type: Type.STRING, description: "Specific part, e.g., Joint 2" },
                status: { type: Type.STRING, enum: ["Normal", "Abnormal"] },
                sensorAction: { type: Type.STRING, description: "e.g., Kinematic Motion Profiling" },
                parameterMonitored: { type: Type.STRING, description: "e.g., Acceleration Smoothness" },
                rationale: { type: Type.STRING, description: "Engineering logic linking the observation to the status." },
                observation: { type: Type.STRING, description: "Actual visual evidence seen in video." },
              },
              required: ["sensorLocation", "status", "sensorAction", "parameterMonitored", "rationale", "observation"]
            }
          },
          normalBehaviors: { type: Type.ARRAY, items: { type: Type.STRING } },
          abnormalBehaviors: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["componentName", "componentStatus", "machineActivity", "correlationAnalysis", "virtualSensors", "normalBehaviors", "abnormalBehaviors"],
      }
    },
    integratedAnalysis: { type: Type.STRING },
    productQualityAnalysis: {
        type: Type.OBJECT,
        properties: {
            visualSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
            overallAssessment: { type: Type.STRING }
        },
        required: ["visualSignals", "overallAssessment"]
    },
    qualityRisks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          riskArea: { type: Type.STRING },
          likelihood: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
          rationale: { type: Type.STRING },
        },
        required: ["riskArea", "likelihood", "rationale"],
      },
    },
    improvementSuggestions: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                area: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                expectedBenefit: { type: Type.STRING }
            },
            required: ["area", "suggestion", "expectedBenefit"]
        }
    },
    methodologyExplanation: { type: Type.STRING },
  },
  required: [
    "stationOverview",
    "processNarrative",
    "visibilityAssessment",
    "executiveSummary",
    "processSteps",
    "cycleTimeAnalysis",
    "irregularEvents",
    "simulatedSensorMetadata",
    "sensorDataSeries",
    "timelineEvents",
    "sensorCorrelation",
    "componentAnalysis",
    "integratedAnalysis",
    "productQualityAnalysis",
    "qualityRisks",
    "improvementSuggestions",
    "methodologyExplanation",
  ],
};

export const analyzeVideo = async (file: File): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing from environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(file);

  const prompt = `
    You are a **FORENSIC ROBOTICS EXPERT** performing a highly critical **Video Motion Analysis**.
    Your reputation depends on PRECISION, not generalities. 
    
    **AUDIO INSTRUCTION**: IGNORE audio. Focus purely on VISUAL KINEMATICS.

    **EXECUTION PROTOCOL - DEEP OBSERVATION & CRITIQUE (MANDATORY)**
    You must perform an internal "Chain of Verification" before generating the JSON:
    
    **PASS 1: MICRO-KINEMATIC OBSERVATION (Internal)**
    - Watch the video frame-by-frame. 
    - Break down generic actions into MECHANICAL STEPS. (e.g., NOT just "Pick Part", BUT "Arm extends -> Gripper Closes -> Arm Retracts").
    - **PROCESS TIMELINE TRACE**: Must include *every* mechanical step of *every* visible machine.
    - Identify ALL fully visible components.

    **PASS 2: CRITIQUE & REALITY CHECK (Internal)**
    - *Critique*: "I thought it was picking a part, but did the gripper actually close? Is there a part visible?"
    - *Critique*: "I said Cycle Time is 14s. But the video is 25s and the robot is moving the whole time. Correct this to 25s."
    - **CORRECT YOURSELF**: If your Pass 1 observation was lazy or assumed a standard process, DELETE IT and write what actually happened.

    **PASS 3: FINAL SYNTHESIS (JSON Generation)**
    - Now generate the JSON based *only* on verified visual facts.

    **CRITICAL INSTRUCTIONS FOR OUTPUT**:
    1. **NO HALLUCINATIONS**: If the robot is manipulating an air nozzle, ensure you SEE the air nozzle. If it's a welding gun, ensure you SEE the tips.
    2. **DETAILED PROCESS TIMELINE**: 
       - Steps must be highly granular (e.g. "Rapid Approach", "Deceleration", "Clamp Actuation", "Weld Process", "Unclamp", "Retraction").
       - Do not group distinct movements into one "Processing" step.
       - Timestamps must be strictly sequential and cover the full cycle.
    3. **SIGNAL INTERPRETATION (TimelineEvents)**:
       - For 'timelineEvents', you MUST provide the 'timestamp' (Start) and 'endTimestamp' (End).
       - The label/explanation must describe exactly what happens in that time range (e.g. "From 2.1s to 4.5s: Current spike due to resistance welding load").
    4. **CYCLE TIME ACCURACY**:
       - 'totalCycleTimeSeconds' MUST be the exact duration from the first motion to the last motion in the video.
    5. **SIMULATED SENSOR METADATA**:
       - You MUST specify the 'location' (e.g. "Robot Base") and 'functionDescription' (e.g. "Monitor vibration during rotation") for every sensor in 'simulatedSensorMetadata'.
    6. **COMPONENT ANALYSIS**:
       - You MUST generate a 'componentAnalysis' entry for EVERY component listed in 'fullyVisibleComponents'. 
    7. **EXCLUSIONS**:
       - DO NOT generate a 'Non-Value Added Activities' list. Focus on optimizing the core process steps.

    **TASK**:
    Analyze the video using the protocol above and return the detailed JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type, 
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const sendChatMessage = async (history: {role: string, content: string}[], contextData: AnalysisResult, newMessage: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY is missing");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contextSummary = `
      Context: Manufacturing Station Analysis.
      Station: ${contextData.stationOverview.stationType}
      Process: ${contextData.processNarrative}
      Cycle Time: ${contextData.cycleTimeAnalysis.totalCycleTimeSeconds}s
      Line Balance Status: ${contextData.cycleTimeAnalysis.lineBalancingAssessment}
      Components Analyzed: ${contextData.componentAnalysis.map(c => c.componentName).join(", ")}
      Simulated Telemetry: ${contextData.simulatedSensorMetadata.map(s => s.parameterType).join(", ")}
      Issues: ${contextData.irregularEvents.map(e => e.description).join(", ")}
      
      User Question: ${newMessage}
    `;

    const chat = ai.chats.create({
        model: "gemini-3-pro-preview",
        config: {
            systemInstruction: "You are an expert industrial automation consultant. Answer questions based on the provided analysis context. Keep answers brief and engineering-focused."
        }
    });

    const response = await chat.sendMessage({
        message: contextSummary
    });

    return response.text;
}
