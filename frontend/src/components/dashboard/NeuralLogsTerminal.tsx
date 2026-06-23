"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function NeuralLogsTerminal({ activeTopic }: { activeTopic?: string | null }) {
  const topic = activeTopic || "Core Curriculum";

  const getMockSystemLogs = (t: string) => [
    `[SYS] Kernel memory sync initialized for ${t}...`,
    `[MEM] Allocating 4.2GB context window for ${t} session.`,
    `[PLANNER] Re-calculating learning trajectory paths for ${t}...`,
    `[QUIZ] Fetching Tier-1 interview question heuristics for ${t}.`,
    `[NOVA] Analyzing cognitive load from recent ${t} inputs.`,
    `[SYS] Database connection stable. Latency: 24ms`,
    `[REFLECTION] Scanning for edge-case knowledge gaps in ${t}...`,
    `[MEM] Pruning stale context from short-term buffer.`,
    `[SYS] Vector embeddings updated successfully for ${t}.`,
    `[PLANNER] Resolving dependency graph for ${t} module.`,
    `[SYS] Optimization routine complete.`,
    `[QUIZ] Parsing student response accuracy matrices.`,
  ];

  const [logs, setLogs] = useState<string[]>([
    "CORTEX System Kernel v4.2.0",
    "Establishing secure neural link...",
    "Swarm communication protocols active."
  ]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a random log every 1.5 to 3 seconds
    const generateLog = () => {
      const logsArray = getMockSystemLogs(topic);
      const randomLog = logsArray[Math.floor(Math.random() * logsArray.length)];
      const timestamp = new Date().toISOString().split('T')[1].slice(0, 11); // gets HH:MM:SS.mmm
      
      setLogs(prev => {
        const newLogs = [...prev, `[${timestamp}] ${randomLog}`];
        return newLogs.slice(-25); // Keep last 25 logs
      });

      const nextInterval = Math.random() * 1500 + 1500;
      timeoutId = setTimeout(generateLog, nextInterval);
    };

    let timeoutId = setTimeout(generateLog, 2000);
    return () => clearTimeout(timeoutId);
  }, [topic]);

  useEffect(() => {
    // Auto-scroll ONLY the internal container, preventing the entire page from jumping
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section className="bg-black/50 border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-64 shadow-xl backdrop-blur-xl">
      <div className="bg-black/80 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(229,89,130,0.8)]"></span>
          Neural System Logs
        </h3>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
        </div>
      </div>
      <div ref={scrollContainerRef} className="p-4 font-mono text-[10px] sm:text-xs text-gray-500 flex-1 overflow-y-auto space-y-1 scroll-smooth">
        {logs.map((log, i) => (
          <div key={i} className="break-all opacity-80 hover:opacity-100 transition-opacity">
            <span className="text-indigo-600 mr-2">{'>'}</span>
            <span className={log.includes('[SYS]') ? 'text-gray-300 font-semibold' : log.includes('[MEM]') ? 'text-indigo-400' : 'text-gray-500'}>
              {log}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
