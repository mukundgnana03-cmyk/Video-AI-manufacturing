
import React from 'react';
import { ProcessStep } from '../types';

interface Props {
  steps: ProcessStep[];
  totalDuration: number;
}

const ProcessTimeline: React.FC<Props> = ({ steps, totalDuration }) => {
  return (
    <div className="w-full bg-slate-900 p-6 rounded-lg border border-slate-700 shadow-sm">
      <h3 className="text-slate-100 font-bold mb-6 flex items-center gap-2">
        <span className="w-2 h-2 bg-industrial-accent rounded-full"></span>
        PROCESS TIMELINE TRACE
      </h3>
      
      <div className="space-y-4">
        {steps.map((step) => {
          const widthPercent = (step.durationSeconds / totalDuration) * 100;
          
          let statusColor = "bg-slate-600";
          let borderColor = "border-slate-500";
          
          if (step.status === 'Normal') {
            statusColor = "bg-industrial-blue/20";
            borderColor = "border-industrial-blue";
          } else if (step.status === 'Potentially Slow') {
            statusColor = "bg-industrial-warning/20";
            borderColor = "border-industrial-warning";
          } else {
            statusColor = "bg-industrial-danger/20";
            borderColor = "border-industrial-danger";
          }

          return (
            <div key={step.stepId} className="relative group">
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>{step.startTimestamp}</span>
                <span>{step.endTimestamp}</span>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-16 text-xs font-mono text-slate-500 text-right mt-1">{step.durationSeconds}s</div>
                
                <div className="flex-1">
                    {/* Bar */}
                    <div className="h-8 relative bg-slate-800 rounded border border-slate-700 overflow-hidden mb-2">
                        <div 
                            className={`absolute top-0 bottom-0 left-0 ${statusColor} border-r-2 ${borderColor} flex items-center px-3 transition-all duration-500`}
                            style={{ width: `${Math.max(widthPercent, 1)}%`, minWidth: '4px' }}
                        >
                        </div>
                        <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                            <span className="text-sm font-medium text-slate-200 truncate">{step.stepName}</span>
                        </div>
                    </div>
                    
                    {/* Description Detail */}
                    <div className="pl-4 border-l-2 border-slate-700 ml-2">
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                </div>
                
                <div className="w-24 text-right mt-1">
                  <span className={`text-xs px-2 py-1 rounded border ${
                    step.status === 'Normal' ? 'text-industrial-success border-industrial-success/30 bg-industrial-success/10' :
                    step.status === 'Potentially Slow' ? 'text-industrial-warning border-industrial-warning/30 bg-industrial-warning/10' :
                    'text-industrial-danger border-industrial-danger/30 bg-industrial-danger/10'
                  }`}>
                    {step.status === 'Normal' ? 'NOMINAL' : step.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessTimeline;
