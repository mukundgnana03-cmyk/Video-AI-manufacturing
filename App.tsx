
import React, { useState, useRef, useEffect } from 'react';
import { analyzeVideo, sendChatMessage } from './services/geminiService';
import { AnalysisResult, AnalysisState, ChatMessage, ComponentAnalysis } from './types';
import LoadingScreen from './components/LoadingScreen';
import ProcessTimeline from './components/ProcessTimeline';
import SensorChart from './components/SensorChart';

const ComponentCard: React.FC<{ comp: ComponentAnalysis }> = ({ comp }) => (
  <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden mb-6">
      {/* Component Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
          <div>
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  {comp.componentName}
                  <span className={`text-xs px-2 py-0.5 rounded border ${comp.componentStatus === 'Normal' ? 'bg-industrial-success/20 text-industrial-success border-industrial-success/30' : 'bg-industrial-danger/20 text-industrial-danger border-industrial-danger/30'}`}>
                      {comp.componentStatus.toUpperCase()}
                  </span>
              </h4>
              <p className="text-sm text-slate-400 mt-1">{comp.machineActivity}</p>
          </div>
          <div className="text-xs font-mono text-slate-500 bg-slate-900/50 px-3 py-1 rounded">
              VISUAL INSPECTION
          </div>
      </div>
      
      {/* Correlation Analysis - Synthesis */}
      <div className="p-4 bg-slate-800/20 border-b border-slate-800">
           <span className="text-xs font-bold text-industrial-accent uppercase block mb-1">Expert Correlation & Analysis</span>
           <p className="text-sm text-slate-300 italic leading-relaxed">
             "{comp.correlationAnalysis}"
           </p>
      </div>

      {/* Detailed Virtual Sensors */}
      <div className="divide-y divide-slate-800">
          {comp.virtualSensors.map((sensor, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                      <div>
                           <h5 className="text-industrial-blue font-bold text-sm font-mono">{sensor.sensorLocation}</h5>
                           <div className="text-xs text-slate-500 font-mono mt-0.5">
                               ACTION: <span className="text-slate-300">{sensor.sensorAction}</span> | 
                               PARAM: <span className="text-slate-300">{sensor.parameterMonitored}</span>
                           </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-mono ${sensor.status === 'Normal' ? 'text-industrial-success bg-industrial-success/10' : 'text-industrial-danger bg-industrial-danger/10'}`}>
                           {sensor.status}
                      </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                       <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                           <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Expert Rationale</span>
                           <p className="text-sm text-slate-300">{sensor.rationale}</p>
                       </div>
                       <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                           <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Visual Evidence / Observation</span>
                           <p className="text-sm text-slate-300">{sensor.observation}</p>
                       </div>
                  </div>
              </div>
          ))}
      </div>

      {/* Component Summary Footer */}
      <div className="p-4 bg-slate-950/30 border-t border-slate-800 flex flex-col md:flex-row gap-6">
           <div className="flex-1">
               <h6 className="text-xs font-bold text-slate-500 uppercase mb-2">Observed Normal Behaviors</h6>
               <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                   {comp.normalBehaviors.length > 0 ? 
                     comp.normalBehaviors.map((b, i) => <li key={i}>{b}</li>) : 
                     <li className="italic">None explicitly listed</li>
                   }
               </ul>
           </div>
           
           <div className="flex-1">
               <h6 className={`text-xs font-bold uppercase mb-2 ${comp.abnormalBehaviors.length > 0 ? 'text-industrial-danger' : 'text-industrial-success'}`}>
                  {comp.abnormalBehaviors.length > 0 ? 'Detected Abnormal Behaviors' : 'Abnormalities'}
               </h6>
               {comp.abnormalBehaviors.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-industrial-danger space-y-1">
                      {comp.abnormalBehaviors.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
               ) : (
                  <div className="text-xs text-industrial-success flex items-center gap-1">
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     No anomalies detected
                  </div>
               )}
           </div>
      </div>
  </div>
);

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    result: null,
  });
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setVideoUrl(URL.createObjectURL(selectedFile));
      setAnalysisState({ status: 'idle', result: null });
      setChatMessages([]);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;

    setAnalysisState({ status: 'analyzing', result: null });
    try {
      const result = await analyzeVideo(file);
      setAnalysisState({ status: 'complete', result });
    } catch (error: any) {
      setAnalysisState({
        status: 'error',
        result: null,
        error: error.message || "Failed to analyze video. Ensure API key is set.",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !analysisState.result) return;
    
    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
        const responseText = await sendChatMessage(chatMessages, analysisState.result, userMsg.content);
        setChatMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (error) {
        console.error(error);
        setChatMessages(prev => [...prev, { role: 'model', content: "Error: Could not process request." }]);
    } finally {
        setIsChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const ResultView = ({ data }: { data: AnalysisResult }) => {
    return (
      <div className="space-y-8 pb-20">
        
        {/* Expert Process Narrative */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                 <svg className="w-6 h-6 text-industrial-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 Expert Process Narrative
            </h3>
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
                {data.processNarrative}
            </p>
            <div className="flex gap-2 text-xs font-mono text-slate-500">
               <span className="bg-slate-800 px-2 py-1 rounded">Process: {data.stationOverview.stationType}</span>
               <span className="bg-slate-800 px-2 py-1 rounded">Actor: {data.stationOverview.operatorType}</span>
            </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
            <h4 className="text-slate-400 text-xs font-mono uppercase mb-1">Cycle Time & Balance</h4>
            <div className="text-2xl font-bold text-white font-mono">
              {data.cycleTimeAnalysis.totalCycleTimeSeconds}s
            </div>
            <div className="text-xs text-slate-500 mt-2 border-t border-slate-800 pt-2">
              <span className="block text-slate-400 mb-0.5">Line Balance:</span>
              {data.cycleTimeAnalysis.lineBalancingAssessment}
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
            <h4 className="text-slate-400 text-xs font-mono uppercase mb-1">Process Type</h4>
            <div className="text-lg font-bold text-white truncate" title={data.stationOverview.stationType}>
              {data.stationOverview.stationType}
            </div>
             <div className="text-xs text-slate-500 mt-1">
              Part: {data.stationOverview.partType}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
            <h4 className="text-slate-400 text-xs font-mono uppercase mb-1">Quality Assessment</h4>
            <div className="flex items-center gap-2">
               {data.qualityRisks.length > 0 ? (
                 <>
                   <span className={`w-3 h-3 rounded-full ${data.qualityRisks[0].likelihood === 'High' ? 'bg-industrial-danger' : 'bg-industrial-warning'}`}></span>
                   <span className="text-lg font-bold text-white">{data.qualityRisks[0].likelihood} Risk</span>
                 </>
               ) : (
                 <span className="text-lg font-bold text-industrial-success">Stable</span>
               )}
            </div>
            <div className="text-xs text-slate-500 mt-1 truncate">
              {data.productQualityAnalysis.overallAssessment}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
            <h4 className="text-slate-400 text-xs font-mono uppercase mb-1">Irregularities</h4>
            <div className="text-2xl font-bold text-white font-mono">
              {data.irregularEvents.length}
            </div>
             <div className="text-xs text-slate-500 mt-1">
              Detected Events
            </div>
          </div>
        </div>

        {/* Visibility Assessment (Confidence) */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-industrial-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Machine Visibility & Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <h4 className="text-xs font-mono text-industrial-success mb-2 uppercase">Fully Visible Machines</h4>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {data.visibilityAssessment.fullyVisibleComponents.length > 0 ? 
                            data.visibilityAssessment.fullyVisibleComponents.map((p, i) => <li key={i}>{p}</li>) :
                            <li className="text-slate-600 italic">None identified</li>
                        }
                    </ul>
                </div>
                <div>
                    <h4 className="text-xs font-mono text-industrial-warning mb-2 uppercase">Partially Visible / Obscured</h4>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                        {data.visibilityAssessment.partiallyVisibleComponents.length > 0 ? 
                            data.visibilityAssessment.partiallyVisibleComponents.map((p, i) => <li key={i}>{p}</li>) :
                            <li className="text-slate-600 italic">None identified</li>
                        }
                    </ul>
                </div>
                <div>
                    <h4 className="text-xs font-mono text-slate-500 mb-2 uppercase">Expected But Not Visible</h4>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                        {data.visibilityAssessment.notVisibleComponents.length > 0 ? 
                            data.visibilityAssessment.notVisibleComponents.map((p, i) => <li key={i}>{p}</li>) :
                            <li className="text-slate-600 italic">None identified</li>
                        }
                    </ul>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800 pt-4">
                <div>
                    <h4 className="text-xs font-mono text-slate-500 mb-2">OBSERVED PARAMETERS</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.visibilityAssessment.observedParameters.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded text-xs font-mono">
                                {p}
                            </span>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-mono text-slate-500 mb-2">LIMITATIONS</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.visibilityAssessment.limitations.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded text-xs font-mono">
                                {p}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Simulated Sensors (Telemetry) & Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <ProcessTimeline steps={data.processSteps} totalDuration={data.cycleTimeAnalysis.totalCycleTimeSeconds} />
           <SensorChart 
              data={data.sensorDataSeries} 
              metadata={data.simulatedSensorMetadata}
              steps={data.processSteps} 
              events={data.timelineEvents} 
              correlationText={data.sensorCorrelation}
           />
        </div>

        {/* Detailed Component & Virtual Sensor Analysis */}
        <div>
            <div className="flex items-center justify-between mb-4 mt-8">
                 <h3 className="text-xl font-bold text-white uppercase tracking-tight">Detailed Component & Virtual Sensor Analysis</h3>
                 <span className="text-xs text-slate-500 font-mono hidden md:inline">DEEP VISUAL INSPECTION</span>
            </div>
            {data.componentAnalysis.map((comp, i) => (
                <ComponentCard key={i} comp={comp} />
            ))}
        </div>

        {/* Improvements Only (No NVA) */}
        <div className="w-full">
           <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg">
              <h3 className="text-white font-bold mb-4 text-sm uppercase border-l-4 border-industrial-success pl-3">Suggested Improvements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.improvementSuggestions.map((imp, i) => (
                      <div key={i} className="border border-slate-800 rounded p-3 bg-slate-800/20">
                          <div className="text-industrial-accent font-medium text-sm mb-1">{imp.suggestion}</div>
                          <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Area: {imp.area}</span>
                              <span className="text-industrial-success">Benefit: {imp.expectedBenefit}</span>
                          </div>
                      </div>
                  ))}
              </div>
           </div>
        </div>
        
        {/* Chat Interface */}
        <div className="border-t border-slate-800 pt-8 mt-12">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-industrial-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Engineering Assistant
            </h3>
            
            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                <div className="h-64 overflow-y-auto p-6 space-y-4 bg-slate-900/50">
                    {chatMessages.length === 0 && (
                        <div className="text-center text-slate-500 py-10">
                            Ask follow-up questions about the cycle time, specific sensors, or quality risks.
                        </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-industrial-blue text-white' : 'bg-slate-800 text-slate-200'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                         <div className="flex justify-start">
                            <div className="bg-slate-800 text-slate-400 rounded-lg px-4 py-3 text-sm animate-pulse">
                                Analyzing context...
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef}></div>
                </div>
                <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask a question about the process..." 
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-industrial-blue"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={isChatLoading || !chatInput.trim()}
                        className="bg-industrial-accent hover:bg-cyan-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-industrial-blue selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-industrial-blue to-industrial-accent rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white">
              Video<span className="text-industrial-blue">AI</span>
            </h1>
          </div>
          <div className="text-xs font-mono text-slate-500">
             POWERED BY GEMINI 3 PRO PREVIEW
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Upload Section */}
        <div className={`mb-8 transition-all duration-300 ${analysisState.result ? 'opacity-100' : 'opacity-100'}`}>
          <div className={`border-2 border-dashed border-slate-700 rounded-xl p-8 bg-slate-900/30 text-center hover:border-industrial-blue hover:bg-slate-900/50 transition-all cursor-pointer group ${analysisState.result ? 'py-4' : 'py-12'}`}
               onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="video/*" 
              onChange={handleFileChange} 
            />
            
            {file ? (
              <div className={`flex items-center gap-6 ${analysisState.result ? 'flex-col lg:flex-row justify-between' : 'flex-col'}`}>
                 <div className={`${analysisState.result ? 'w-full max-w-2xl' : 'w-full max-w-md'} relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-2xl`}>
                    {videoUrl && (
                      <video src={videoUrl} controls className="w-full h-full object-contain" />
                    )}
                 </div>
                 
                 <div className={`flex flex-col ${analysisState.result ? 'items-end' : 'items-center'} gap-3`}>
                   <span className="font-mono text-sm text-slate-300">{file.name}</span>
                   <button 
                    onClick={(e) => { e.stopPropagation(); startAnalysis(); }}
                    disabled={analysisState.status === 'analyzing'}
                    className={`bg-industrial-blue hover:bg-blue-600 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${analysisState.result ? 'hidden' : ''}`}
                   >
                     {analysisState.status === 'analyzing' ? 'PROCESSING...' : 'RUN ANALYSIS'}
                     {!analysisState.status.includes('analyzing') && (
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                       </svg>
                     )}
                   </button>
                   {analysisState.result && (
                       <span className="text-xs text-industrial-success font-mono uppercase border border-industrial-success/30 px-2 py-1 rounded bg-industrial-success/10">Analysis Complete</span>
                   )}
                 </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400 group-hover:text-slate-200">
                <svg className="w-12 h-12 mb-4 text-slate-600 group-hover:text-industrial-blue transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium">Upload Manufacturing Video</p>
                <p className="text-sm text-slate-500 mt-2">Supports MP4, MOV, WebM. No sensor data required.</p>
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {analysisState.status === 'error' && (
           <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-lg text-red-200 mb-8 flex items-center gap-3">
             <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
             {analysisState.error}
           </div>
        )}

        {/* Loading State */}
        {analysisState.status === 'analyzing' && <LoadingScreen />}

        {/* Results State */}
        {analysisState.status === 'complete' && analysisState.result && (
          <ResultView data={analysisState.result} />
        )}

      </main>
    </div>
  );
}

export default App;
