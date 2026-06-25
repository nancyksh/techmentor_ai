"use client";
import React, { useState, useEffect } from 'react';

export default function DigitalTwinDashboard({ activeTopic, masteryTarget = 0 }: { activeTopic?: string | null; masteryTarget?: number }) {
  const [newTopicProgress, setNewTopicProgress] = useState(0);

  useEffect(() => {
    if (activeTopic) {
      // Animate the student's mastery toward the real target driven by quiz/interview performance
      const interval = setInterval(() => {
        setNewTopicProgress(prev => {
          if (prev < masteryTarget) return prev + 1;
          if (prev > masteryTarget) return prev - 1;
          clearInterval(interval);
          return prev;
        });
      }, 80);
      return () => clearInterval(interval);
    } else {
      setNewTopicProgress(0);
    }
  }, [activeTopic, masteryTarget]);

  // Extract the core subject from sentences like "prepare me in 10 days for Computer Networks exam"
  const extractSubject = (text: string | null | undefined) => {
    if (!text) return "";
    const cleaned = text.replace(/tech me|teach me|prepare me ready|prepare me|in \d+ days|for|exam|course|about|learn/gi, '').replace(/\s+/g, ' ').trim();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };
  const cleanTopic = extractSubject(activeTopic);

  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl transition-all duration-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className={`w-5 h-5 ${activeTopic ? 'text-green-400 animate-pulse' : 'text-cyan-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          Student Digital Twin {activeTopic && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">Actively Syncing</span>}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Subject Mastery</h4>
          <div className="space-y-4">
            
            {/* Dynamically injected active topic */}
            {activeTopic && (
              <div className="p-3 bg-indigo-900/30 border border-indigo-500/50 rounded-xl mb-4 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white font-bold max-w-[200px] truncate" title={cleanTopic}>{cleanTopic}</span>
                  <span className="text-indigo-400 font-bold">{newTopicProgress}%</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-800">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${newTopicProgress}%` }}></div>
                </div>
                <p className="text-xs text-indigo-300 mt-2 italic flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  Processing active tutor session...
                </p>
              </div>
            )}

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Operating Systems</span>
                <span className="text-cyan-500">65%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">DBMS</span>
                <span className="text-cyan-500">82%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
            <div className="opacity-70">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Computer Networks</span>
                <span className="text-orange-500">40%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Knowledge Graph Matrix</h4>
          <div className={`h-48 border rounded-xl flex items-center justify-center relative overflow-hidden transition-colors duration-1000 ${activeTopic ? 'border-indigo-500/50 bg-indigo-950/30' : 'border-gray-700 bg-gray-900/50'}`}>
            
            {/* SVG Neural Network Graph */}
            <svg viewBox="0 0 400 200" className="w-full h-full absolute inset-0">
              <defs>
                <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
                <filter id="blur">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
              </defs>
              
              {/* Static Connections */}
              <line x1="200" y1="100" x2="100" y2="50" stroke="#374151" strokeWidth="2" />
              <line x1="200" y1="100" x2="300" y2="50" stroke="#374151" strokeWidth="2" />
              <line x1="200" y1="100" x2="120" y2="150" stroke="#374151" strokeWidth="2" />
              
              {/* Dynamic Connection */}
              {activeTopic && (
                <>
                  <line x1="200" y1="100" x2="320" y2="140" stroke="url(#glow)" strokeWidth="3" opacity="0.6" />
                  {/* Animating Data Packets */}
                  <circle r="4" fill="#A855F7" filter="url(#blur)">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M200,100 L320,140" />
                  </circle>
                  <circle r="4" fill="#4F46E5" filter="url(#blur)">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M320,140 L200,100" />
                  </circle>
                  <circle r="3" fill="#60A5FA" filter="url(#blur)">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path="M200,100 L320,140" />
                  </circle>
                </>
              )}
              
              {/* Static Nodes */}
              <circle cx="100" cy="50" r="18" fill="#1F2937" stroke="#374151" strokeWidth="2" />
              <text x="100" y="54" fill="#9CA3AF" fontSize="10" textAnchor="middle" fontWeight="bold">OS</text>

              <circle cx="300" cy="50" r="18" fill="#1F2937" stroke="#374151" strokeWidth="2" />
              <text x="300" y="54" fill="#9CA3AF" fontSize="10" textAnchor="middle" fontWeight="bold">DB</text>

              <circle cx="120" cy="150" r="18" fill="#1F2937" stroke="#374151" strokeWidth="2" />
              <text x="120" y="154" fill="#9CA3AF" fontSize="10" textAnchor="middle" fontWeight="bold">NET</text>

              {/* Dynamic Node */}
              {activeTopic && (
                <g className="animate-in zoom-in duration-700">
                  <circle cx="320" cy="140" r="24" fill="#312E81" stroke="#8B5CF6" strokeWidth="2" filter="url(#blur)" opacity="0.5" className="animate-pulse" />
                  <circle cx="320" cy="140" r="22" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="2" />
                  <text x="320" y="144" fill="#C4B5FD" fontSize="10" textAnchor="middle" fontWeight="bold">NEW</text>
                </g>
              )}

              {/* Center AI Core Node */}
              <circle cx="200" cy="100" r="32" fill="#312E81" stroke="#4F46E5" strokeWidth="3" filter={activeTopic ? "url(#blur)" : ""} opacity={activeTopic ? 0.8 : 0} className={activeTopic ? 'animate-pulse' : ''} />
              <circle cx="200" cy="100" r="30" fill="#111827" stroke="#4F46E5" strokeWidth="2" />
              <text x="200" y="104" fill="#818CF8" fontSize="12" textAnchor="middle" fontWeight="bold">CORE</text>
            </svg>
            
            <p className="text-gray-400 text-xs z-10 absolute bottom-3 bg-black/60 px-4 py-1.5 rounded-full border border-gray-800 shadow-xl backdrop-blur-sm">
              {activeTopic ? `Mapping neural pathways for ${cleanTopic}...` : 'Waiting for learning input...'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
