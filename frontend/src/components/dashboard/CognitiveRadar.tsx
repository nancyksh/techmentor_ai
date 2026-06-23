import React from 'react';

export default function CognitiveRadar({ activeTopic }: { activeTopic?: string | null }) {
  const topicLabel = activeTopic ? ` [${activeTopic}]` : '';
  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
        Cognitive Sync Radar
      </h3>
      
      <div className="relative w-full aspect-square max-h-[250px] mx-auto rounded-full border border-gray-700 bg-gray-900/50 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.1)]">
        {/* Radar grids */}
        <div className="absolute w-3/4 h-3/4 rounded-full border border-purple-500/20"></div>
        <div className="absolute w-1/2 h-1/2 rounded-full border border-purple-500/30"></div>
        <div className="absolute w-1/4 h-1/4 rounded-full border border-purple-500/40"></div>
        
        {/* Crosshairs */}
        <div className="absolute w-full h-[1px] bg-purple-500/20"></div>
        <div className="absolute h-full w-[1px] bg-purple-500/20"></div>
        
        {/* Radar Sweep Animation */}
        <div 
          className="absolute w-full h-full rounded-full animate-spin origin-center" 
          style={{ 
            animationDuration: '4s', 
            background: 'conic-gradient(from 0deg, transparent 70%, rgba(168, 85, 247, 0.1) 80%, rgba(168, 85, 247, 0.6) 100%)' 
          }}
        ></div>
        
        {/* Pinging Nodes */}
        <div className="absolute w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ top: '25%', left: '60%', animationDuration: '2s' }}></div>
        <div className="absolute w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{ bottom: '30%', left: '25%', animationDuration: '3.5s' }}></div>
        <div className="absolute w-3 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ top: '45%', right: '20%', boxShadow: '0 0 10px #22d3ee' }}></div>
        <div className="absolute w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ top: '65%', left: '70%', animationDuration: '2.5s' }}></div>
        
        {/* Center Target */}
        <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10"></div>
      </div>
      
      <div className="mt-6 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Pattern Recognition<span className="text-purple-300/70 ml-1">{topicLabel}</span></span>
            <span className="text-purple-400 font-bold">94%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div className="bg-purple-500 h-1.5 rounded-full w-[94%] shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Memory Retention Sync<span className="text-indigo-300/70 ml-1">{topicLabel}</span></span>
            <span className="text-indigo-400 font-bold">88%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full w-[88%] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
