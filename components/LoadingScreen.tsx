
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full bg-slate-900/50 rounded-xl border border-slate-700/50 backdrop-blur-sm p-12">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-industrial-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-4 border-4 border-slate-700 rounded-full"></div>
        <div className="absolute inset-4 border-4 border-t-industrial-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin reverse-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      
      <h3 className="text-xl font-mono font-bold text-slate-100 mb-2">FORENSIC MOTION ANALYSIS</h3>
      <div className="flex flex-col gap-2 text-sm font-mono text-slate-400 text-center">
        <p className="animate-pulse">Pass 1: Raw Observation & Motion Vectoring...</p>
        <p className="animate-pulse delay-75">Pass 2: Reality Check & Self-Critique...</p>
        <p className="animate-pulse delay-150">Pass 3: Finalizing Physics & Sensor Simulation...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
