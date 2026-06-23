import React from 'react';

export default function AnalyticsDashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <main className="relative container mx-auto px-4 py-8 space-y-12">
        <header className="flex justify-between items-start md:items-center pb-8 border-b border-white/10 flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="text-indigo-500 font-extrabold tracking-tight">CORTEX</span>
              <span className="text-gray-500 font-light text-2xl">|</span>
              Learning Analytics
            </h1>
            <div className="flex items-center gap-2 w-fit px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Simulated Profile Active</span>
            </div>
          </div>
          <a href="/" className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 font-medium whitespace-nowrap">
            Back to Dashboard
          </a>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="bg-[#1A1718]/80 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl shadow-lg">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Weekly Growth</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold text-white">+12%</span>
              <span className="text-emerald-400 text-sm mb-1">↑ from last week</span>
            </div>
            <div className="h-24 bg-gray-900/50 rounded-lg flex items-end px-2 pb-2 gap-1">
              {/* Mock Bar Chart */}
              <div className="w-1/6 bg-emerald-500/20 rounded-t h-[30%]"></div>
              <div className="w-1/6 bg-emerald-500/40 rounded-t h-[50%]"></div>
              <div className="w-1/6 bg-emerald-500/60 rounded-t h-[40%]"></div>
              <div className="w-1/6 bg-emerald-500/80 rounded-t h-[70%]"></div>
              <div className="w-1/6 bg-emerald-400 rounded-t h-[90%]"></div>
              <div className="w-1/6 bg-emerald-300 rounded-t h-[100%]"></div>
            </div>
          </div>

          <div className="bg-[#1A1718]/80 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl shadow-lg">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Quiz Performance</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold text-white">85%</span>
              <span className="text-gray-400 text-sm mb-1">Average Score</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>OS: Deadlocks</span>
                <span className="text-emerald-400">90%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>DBMS: Normalization</span>
                <span className="text-emerald-400">85%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CN: TCP/IP</span>
                <span className="text-yellow-400">70%</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1718]/80 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl shadow-lg">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Placement Readiness</h3>
            <div className="flex items-center justify-center h-32 relative">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle className="text-gray-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="50" cx="56" cy="56" />
                <circle className="text-indigo-500" strokeWidth="8" strokeDasharray="314" strokeDashoffset="69" strokeLinecap="round" stroke="currentColor" fill="transparent" r="50" cx="56" cy="56" />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-bold text-white">78%</span>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-2">Ready for Tier-1 Mock Interviews</p>
          </div>

        </div>
      </main>
    </div>
  );
}
