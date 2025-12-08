
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SensorDataPoint, ProcessStep, TimelineEvent, SimulatedSensorMetadata } from '../types';

interface Props {
  data: SensorDataPoint[];
  metadata: SimulatedSensorMetadata[];
  steps: ProcessStep[];
  events: TimelineEvent[];
  correlationText: string;
}

const SensorChart: React.FC<Props> = ({ data, metadata, steps, events, correlationText }) => {
  // Extract sensor keys (excluding timeOffset)
  const sensorKeys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'timeOffset') : [];

  const colors = [
    '#3b82f6', // industrial-blue
    '#06b6d4', // industrial-accent
    '#f59e0b', // industrial-warning
    '#ef4444', // industrial-danger
    '#10b981', // industrial-success
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-600 p-3 rounded shadow-xl z-50">
          <p className="text-slate-300 font-mono text-xs mb-2">Time: {label}s</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs font-mono mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-200">{entry.name}:</span>
              <span className="text-white font-bold">{entry.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-100 font-bold flex items-center gap-2 uppercase">
             <svg className="w-5 h-5 text-industrial-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             Simulated Sensor Configuration
          </h3>
          <div className="flex items-center gap-2">
             <span className="text-xs bg-industrial-blue/10 text-industrial-blue border border-industrial-blue/30 px-2 py-1 rounded font-mono">
              AI-GENERATED
            </span>
          </div>
        </div>

        {/* Sensor Network Configuration Grid */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-800/30 rounded border border-slate-800">
             <div className="col-span-1 md:col-span-2 text-xs font-bold text-slate-500 uppercase mb-1">Active Sensor Network</div>
             {metadata.map((sensor, idx) => {
                 // Find matching color based on key order
                 const color = colors[idx % colors.length];
                 return (
                     <div key={idx} className="flex items-start gap-3 p-2 rounded bg-slate-900/50 border border-slate-700/50">
                         <div className="w-1 h-full rounded bg-slate-700 overflow-hidden relative" style={{width: '4px'}}>
                             <div className="absolute inset-0" style={{backgroundColor: color}}></div>
                         </div>
                         <div className="flex-1">
                             <div className="flex justify-between">
                                 <span className="text-sm font-bold text-slate-200">{sensor.sensorName}</span>
                                 <span className={`text-[10px] uppercase px-1 rounded ${sensor.behaviorStatus === 'Normal' ? 'text-industrial-success bg-industrial-success/10' : 'text-industrial-danger bg-industrial-danger/10'}`}>
                                     {sensor.behaviorStatus}
                                 </span>
                             </div>
                             <div className="text-xs font-mono text-industrial-accent mt-0.5">{sensor.location}</div>
                             <div className="text-xs text-slate-400 mt-1 leading-tight">{sensor.functionDescription}</div>
                         </div>
                     </div>
                 );
             })}
        </div>
        
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis 
                dataKey="timeOffset" 
                stroke="#94a3b8" 
                tick={{ fontSize: 12, fontFamily: 'monospace' }}
                label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{ fontSize: 12, fontFamily: 'monospace' }} 
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontFamily: 'monospace' }} />
              
              {sensorKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}

              {/* Event Markers - Only Start lines to avoid clutter */}
              {events.map((evt, i) => (
                <ReferenceLine 
                  key={i} 
                  x={evt.timestamp} 
                  stroke={evt.status === 'Normal' ? '#10b981' : '#ef4444'} 
                  strokeDasharray="3 3"
                  label={{ 
                    value: evt.label, 
                    position: 'top', 
                    fill: evt.status === 'Normal' ? '#10b981' : '#ef4444',
                    fontSize: 10,
                    fontFamily: 'monospace'
                  }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Signal Interpretation Panel */}
      <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
          <h4 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-industrial-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Signal Interpretation & Correlation
          </h4>
          
          <div className="mb-6 p-4 bg-slate-800/50 rounded border border-slate-700/50 text-sm text-slate-300">
            <span className="text-industrial-accent font-bold">Correlation Analysis: </span>
            {correlationText}
          </div>

          <div className="space-y-3">
             {events.map((evt, i) => (
               <div key={i} className={`flex items-start gap-4 p-3 rounded border ${evt.status === 'Normal' ? 'bg-industrial-success/5 border-industrial-success/20' : 'bg-industrial-danger/5 border-industrial-danger/20'}`}>
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${evt.status === 'Normal' ? 'bg-industrial-success' : 'bg-industrial-danger'}`}></div>
                  <div className="flex-1">
                     <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold text-sm text-slate-200">
                          {evt.timestamp}s {evt.endTimestamp ? `- ${evt.endTimestamp}s` : ''} — {evt.label}
                        </span>
                        
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${evt.status === 'Normal' ? 'text-industrial-success bg-industrial-success/10' : 'text-industrial-danger bg-industrial-danger/10'}`}>
                                {evt.status}
                            </span>
                            <span className="text-xs text-slate-500 uppercase">{evt.correlatedSensor} Sensor</span>
                        </div>
                     </div>
                     <p className="text-sm text-slate-400">
                       {evt.explanation}
                     </p>
                  </div>
               </div>
             ))}
          </div>
      </div>
    </div>
  );
};

export default SensorChart;
