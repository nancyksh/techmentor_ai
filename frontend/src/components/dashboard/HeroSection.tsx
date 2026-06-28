import React from 'react';

export default function HeroSection({ readinessScore = 0, activeMission = null }: { readinessScore?: number; activeMission?: string | null }) {
  return (
    <section className="relative overflow-hidden bg-[#1A1718]/80 border border-gray-800 rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-2xl">
      {/* Subtle Background Glows for Premium Aesthetic */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
        
        {/* Left Side: Branding & Mission */}
        <div className="space-y-6 flex-1">
          <div>
            <h2 className="text-5xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-4">
              CORTEX
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(229,89,130,0.1)]">
                System Active
              </span>
            </h2>
            <p className="text-xl text-gray-300 font-medium tracking-wide">
              Autonomous Learning Intelligence Platform
            </p>
            <p className="text-sm text-gray-500 mt-2 italic flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Powered by NOVA — Next-generation Orchestrator for Virtual Academic Guidance
            </p>
          </div>

          <div className="bg-black/40 border border-gray-800 rounded-xl p-4 inline-block w-full max-w-md backdrop-blur-md shadow-inner">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Current Mission
            </p>
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-lg">{activeMission || "No mission deployed yet"}</span>
            </div>
          </div>
        </div>
        
        {/* Right Side: Metrics Dashboard */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Card 1: Interview Readiness */}
          <div className="relative group bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-6 min-w-[220px] hover:border-indigo-500/50 transition-all duration-300 shadow-lg">
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-2">Interview Readiness</p>
            <div className="flex items-end gap-1">
              <p className="text-5xl font-extrabold text-white">{readinessScore}</p>
              <span className="text-2xl text-gray-500 font-bold mb-1">%</span>
            </div>
            <div className="mt-5 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(229,89,130,0.5)] transition-all duration-1000 ease-in-out"
                style={{ width: `${readinessScore}%` }}
              ></div>
            </div>
          </div>

          {/* Card 2: NOVA Status */}
          <div className="relative group bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-6 min-w-[220px] hover:border-emerald-500/50 transition-all duration-300 shadow-lg">
             <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-2 flex justify-between items-center">
              NOVA Status
              <svg className="w-4 h-4 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-black"></span>
              </div>
              <p className="text-2xl font-bold text-white tracking-wide">Operational</p>
            </div>
            <p className="text-xs text-gray-500 mt-5 border-t border-gray-800 pt-3">
              All core subsystems synchronized.
            </p>
          </div>
        </div>
        
      </div>
    </section>
  );
}
