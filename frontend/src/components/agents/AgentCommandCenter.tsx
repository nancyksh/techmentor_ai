import React from 'react';

const agents = [
  { name: 'NOVA', role: 'Master Orchestrator', status: 'Planning', color: 'indigo' },
  { name: 'Research Agent', role: 'Data Retrieval', status: 'Idle', color: 'blue' },
  { name: 'Quiz Agent', role: 'Assessment', status: 'Generating', color: 'purple' },
  { name: 'Reflection Agent', role: 'Analysis', status: 'Idle', color: 'emerald' },
  { name: 'Planner Agent', role: 'Roadmap', status: 'Updating', color: 'orange' },
];

export default function AgentCommandCenter() {
  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
        Active Agent Command Center
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {agents.map((agent, index) => (
          <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 hover:border-indigo-500/50 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-white font-semibold text-sm">{agent.name}</h4>
              <span className={`w-2 h-2 rounded-full mt-1 ${agent.status !== 'Idle' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{agent.role}</p>
            <div className="inline-block px-2 py-1 bg-white/5 rounded text-xs font-medium text-gray-300">
              {agent.status}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
