"use client";
import React, { useState, useEffect } from 'react';

export default function LiveFeed({ activeTopic }: { activeTopic?: string | null }) {
  const topic = activeTopic || "Core Concepts";

  const getInitialMessages = (t: string) => [
    { agent: 'Planner Agent', text: `Analyzing roadmap for ${t} mastery.`, time: '10:43 AM', isProfessor: false },
    { agent: 'Reflection Agent', text: `Baseline metric established. Identified initial cognitive gaps in ${t}.`, time: '10:42 AM', isProfessor: false },
    { agent: 'NOVA', text: 'Deploying agents for current objective.', time: '10:42 AM', isProfessor: true },
  ];

  const getMockLiveEvents = (t: string) => [
    { agent: 'Memory Agent', text: 'Updated Digital Twin with new roadmap adjustments.', isProfessor: false },
    { agent: 'NOVA', text: `Generate a short quiz to test ${t} fundamentals.`, isProfessor: true },
    { agent: 'Quiz Agent', text: `Compiled 5 technical questions on advanced ${t} concepts.`, isProfessor: false },
    { agent: 'Memory Agent', text: 'Stored quiz results criteria in student profile.', isProfessor: false },
    { agent: 'Reflection Agent', text: 'Monitoring active tutor session for cognitive load.', isProfessor: false },
    { agent: 'Planner Agent', text: 'Adjusting pacing based on recent reading speed analytics.', isProfessor: false },
  ];

  const [messages, setMessages] = useState(() => getInitialMessages(topic));
  const [eventIndex, setEventIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setMessages(getInitialMessages(topic));
  }, [topic]);

  useEffect(() => {
    setIsMounted(true);
    
    const interval = setInterval(() => {
      const events = getMockLiveEvents(topic);
      const nextEvent = events[eventIndex];
      const newMsg = {
        ...nextEvent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [newMsg, ...prev].slice(0, 8)); // Keep last 8 messages
      setEventIndex(prev => (prev + 1) % events.length); // Loop infinitely
    }, 4500); // Every 4.5 seconds
    
    return () => clearInterval(interval);
  }, [eventIndex, topic]);

  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
        </span>
        Live Collaboration Feed
      </h3>
      
      <div className="space-y-4 overflow-hidden relative max-h-[400px]">
        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-[#0F172A] to-transparent z-10 pointer-events-none"></div>
        
        {messages.map((msg, index) => (
          <div key={index + msg.time + msg.text} className={`flex flex-col animate-in slide-in-from-top-4 fade-in duration-500 ${msg.isProfessor ? 'items-start' : 'items-end'}`}>
            <span className="text-xs text-gray-400 mb-1">{msg.agent} • {msg.time}</span>
            <div className={`px-4 py-3 rounded-2xl max-w-[90%] ${
              msg.isProfessor 
                ? 'bg-indigo-600/50 border border-indigo-500 text-white rounded-tl-none' 
                : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tr-none'
            }`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Telemetry Visualizer */}
      <div className="mt-6 bg-black/40 border border-gray-800 rounded-xl p-4">
        <h4 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">
          Agent Telemetry {activeTopic && <span className="text-indigo-400 normal-case font-normal ml-1">[{activeTopic}]</span>}
        </h4>
        <div className="flex justify-between items-end h-10 gap-1">
          {[...Array(24)].map((_, i) => (
            <div 
              key={i} 
              className="w-full bg-indigo-500/50 rounded-t-sm animate-pulse" 
              style={{ 
                height: isMounted ? `${Math.max(20, Math.random() * 100)}%` : '20%',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            ></div>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-[10px] text-gray-500">
          <span>Prof</span>
          <span>Plan</span>
          <span>Quiz</span>
          <span>Mem</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800 flex justify-center items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        <p className="text-xs text-green-400 font-bold uppercase tracking-widest">Agents Active</p>
      </div>
    </section>
  );
}
