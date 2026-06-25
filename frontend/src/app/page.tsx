"use client";
import React, { useState, useEffect } from 'react';
import HeroSection from '@/components/dashboard/HeroSection';
import AgentCommandCenter from '@/components/agents/AgentCommandCenter';
import DigitalTwinDashboard from '@/components/dashboard/DigitalTwinDashboard';
import LiveFeed from '@/components/dashboard/LiveFeed';
import CognitiveRadar from '@/components/dashboard/CognitiveRadar';
import NeuralLogsTerminal from '@/components/dashboard/NeuralLogsTerminal';
import { pushSessionEntry } from '@/lib/sessionHistory';

export default function Home() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState("");
  const [missionType, setMissionType] = useState("Interview Mission");
  const [logs, setLogs] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [activeCurriculum, setActiveCurriculum] = useState<string | null>(null);
  const [activeMissionType, setActiveMissionType] = useState<string | null>(null);
  const [tutorMessages, setTutorMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [tutorStep, setTutorStep] = useState(0);
  const [readinessScore, setReadinessScore] = useState(78);
  const [isTutorFinished, setIsTutorFinished] = useState(false);
  const [interviewResult, setInterviewResult] = useState<{ completed: boolean; confidence: string; clarity: string; review: string; completedAt: string } | null>(null);

  useEffect(() => {
    const loadInterviewResult = () => {
      const raw = localStorage.getItem('novaInterviewResult');
      if (raw) {
        try {
          setInterviewResult(JSON.parse(raw));
        } catch {
          // ignore malformed cache
        }
      }
    };
    loadInterviewResult();
    window.addEventListener('focus', loadInterviewResult);
    window.addEventListener('storage', loadInterviewResult);
    return () => {
      window.removeEventListener('focus', loadInterviewResult);
      window.removeEventListener('storage', loadInterviewResult);
    };
  }, []);

  // Only assessment-style missions warrant a mock interview stage; pure learning/revision ends at the quiz.
  const requiresInterview = activeMissionType
    ? ["Interview Mission", "Skill Gap Mission", "Placement Preparation Mission"].includes(activeMissionType)
    : true;
  const isFullyAssessed = requiresInterview ? !!interviewResult : isTutorFinished;

  const timelineSteps = [
    { step: "Goal Analysis", status: "done" },
    { step: "Strategy Generation", status: "done" },
    { step: "Agent Selection", status: "done" },
    { step: "Learning Path Creation", status: "done" },
    { step: "Knowledge Assessment", status: isTutorFinished || interviewResult ? "done" : "active" },
    { step: "Adaptive Quiz", status: isTutorFinished || interviewResult ? "done" : "pending" },
    ...(requiresInterview ? [{ step: "Mock Interview", status: interviewResult ? "done" : isTutorFinished ? "active" : "pending" }] : []),
    { step: "Readiness Evaluation", status: isFullyAssessed ? "done" : "pending" },
    { step: "Personalized Roadmap", status: isFullyAssessed ? "active" : "pending" }
  ];
  const timelineProgress = Math.round((timelineSteps.filter(s => s.status === 'done').length / timelineSteps.length) * 100);

  // Subject mastery should track real quiz/interview performance instead of a fixed simulated cap.
  const masteryTarget = !activeCurriculum
    ? 0
    : isFullyAssessed
    ? Math.min(100, readinessScore)
    : isTutorFinished
    ? Math.min(60, readinessScore)
    : Math.min(40, tutorStep * 15 + 10);

  const [isTutorThinking, setIsTutorThinking] = useState(false);

  const handleSendTutorMsg = async () => {
    if (!chatInput.trim() || isTutorThinking) return;
    const userMsg = chatInput;
    const history = tutorMessages;
    setChatInput("");
    setTutorMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTutorThinking(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/quiz-tutor/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: activeCurriculum || "this topic", mission_type: activeMissionType || "Learning Mission", history, answer: userMsg })
      });

      if (!response.ok) {
        throw new Error("API returned " + response.status);
      }

      const data = await response.json();

      setTutorMessages(prev => [...prev, { role: "ai", content: data.reply }]);
      setTutorStep(prev => prev + 1);
      const newScore = Math.min(100, Math.max(0, readinessScore + (data.readiness_delta || 0)));
      setReadinessScore(newScore);

      if (data.is_finished) {
        pushSessionEntry({ date: new Date().toISOString(), type: "Quiz", topic: activeCurriculum || "General Topic", score: newScore });
        setTimeout(() => setIsTutorFinished(true), 1000);
      }
    } catch (e) {
      console.error("API error", e);
      setTutorMessages(prev => [...prev, { role: "ai", content: "Failed to connect to AI tutor. Make sure your backend is running on port 8000!" }]);
    } finally {
      setIsTutorThinking(false);
    }
  };

  const startAutonomousSequence = () => {
    if (!topic.trim()) return;
    setIsDeploying(true);
    setLogs(["[SYSTEM] Initializing Autonomous Agents..."]);
    
    const sequence = [
      `[NOVA] Analyzing curriculum requirements for '${topic}'...`,
      `[Research Agent] Scraping latest documentation and best practices...`,
      `[Planner Agent] Structuring step-by-step learning roadmap...`,
      `[Quiz Agent] Generating milestone assessments and technical interview questions...`,
      `✅ SUCCESS: Custom curriculum generated and deployed to Digital Twin.`
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < sequence.length) {
        const currentLog = sequence[step]; // Capture synchronously!
        setLogs(prev => [...prev, currentLog]);
        step++;
      } else {
        clearInterval(interval);
        setIsFinished(true);
        setIsDeploying(false);
      }
    }, 1200); // 1.2 seconds between each agent log
  };

  const closeModal = () => {
    setShowModal(false);
    if (isFinished) {
      setActiveCurriculum(topic);
      setActiveMissionType(missionType);
    }
    setTopic("");
    setLogs([]);
    setIsFinished(false);
    setIsDeploying(false);
  };

  const handleDeployNewMission = (recommendedTopic: string) => {
    // Reset the previous mission's session state and pre-fill the next one
    setActiveCurriculum(null);
    setActiveMissionType(null);
    setTutorMessages([]);
    setTutorStep(0);
    setIsTutorFinished(false);
    setInterviewResult(null);
    localStorage.removeItem('novaInterviewResult');
    setTopic(recommendedTopic);
    setMissionType("Skill Gap Mission");
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <main className="relative container mx-auto px-4 py-8 space-y-12">
        <header className="flex justify-between items-center pb-8 border-b border-white/10">
          <h1 className="text-3xl font-bold text-indigo-500 tracking-tight">
            CORTEX
          </h1>
          <div className="flex gap-4">
            <a href="/interview" className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all font-medium border border-white/10">
              Mock Interview
            </a>
            <a href="/coding-room" className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all font-medium border border-white/10">
              Coding Room
            </a>
            <a href="/analytics" className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all font-medium border border-white/10">
              View Analytics
            </a>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-all font-medium shadow-[0_0_15px_rgba(79,70,229,0.5)] whitespace-nowrap"
            >
              Start Autonomous Mode
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <HeroSection readinessScore={readinessScore} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <AgentCommandCenter />
            
            {activeCurriculum && activeMissionType && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* 2x2 Orchestration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* SECTION 4: NOVA MISSION CONTROL */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-xl hover:border-indigo-500/50 transition-all shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      NOVA Mission Control
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Mission</p>
                        <p className="text-lg font-bold text-white leading-tight">{activeCurriculum} {activeMissionType.replace(" Mission", "")}</p>
                        <p className="text-xs text-gray-400 mt-2 italic bg-black/30 p-2 rounded border border-gray-800">Source Request: "{activeCurriculum}"</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Progress</p>
                          <p className="text-3xl font-extrabold text-indigo-400">68<span className="text-lg text-gray-500">%</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Active Agents</p>
                          <p className="text-xl font-bold text-white">5</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Current Stage</p>
                          <p className="text-sm font-medium text-emerald-400">Knowledge Assessment</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Next Stage</p>
                          <p className="text-sm font-medium text-gray-300">Adaptive Quiz</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 1: NOVA STRATEGY ENGINE */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-xl hover:border-emerald-500/50 transition-all shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      NOVA Strategy Engine
                    </h3>
                    <div className="space-y-3 mb-4">
                       <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-black/30 p-2 rounded border border-gray-800"><span className="text-gray-500 block">Goal:</span><span className="text-white font-medium">{activeCurriculum} {activeMissionType}</span></div>
                          <div className="bg-black/30 p-2 rounded border border-gray-800"><span className="text-gray-500 block">Intent:</span><span className="text-white font-medium">{activeMissionType}</span></div>
                          <div className="bg-black/30 p-2 rounded border border-gray-800"><span className="text-gray-500 block">Detected Topic:</span><span className="text-white font-medium">{activeCurriculum}</span></div>
                          <div className="bg-black/30 p-2 rounded border border-gray-800"><span className="text-gray-500 block">Urgency & Duration:</span><span className="text-red-400 font-medium">High</span> <span className="text-gray-500">| 25 Min</span></div>
                       </div>
                    </div>
                    <div className="mb-4">
                       <p className="text-xs text-gray-500 mb-1">Selected Agents:</p>
                       <div className="flex flex-wrap gap-2 text-xs">
                         <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">✓ Planner</span>
                         <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">✓ Research</span>
                         <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">✓ Quiz</span>
                         {requiresInterview && <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">✓ Interview</span>}
                         <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">✓ Reflection</span>
                       </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Generated Strategy Pipeline</p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded">Assess</span>
                        <span className="text-gray-600">→</span>
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded">Reinforce</span>
                        <span className="text-gray-600">→</span>
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded">Quiz</span>
                        {requiresInterview && (
                          <>
                            <span className="text-gray-600">→</span>
                            <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded">Interview</span>
                          </>
                        )}
                        <span className="text-gray-600">→</span>
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded">Evaluate</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: NOVA EXECUTION TIMELINE */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-xl hover:border-purple-500/50 transition-all shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Execution Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                         <span>Overall Progress</span>
                         <span className="text-purple-400 font-bold">{timelineProgress}%</span>
                      </div>
                      {timelineSteps.map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 text-sm ${item.status === 'pending' ? 'opacity-50' : ''}`}>
                          {item.status === 'done' && <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30 text-xs">✓</span>}
                          {item.status === 'active' && <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 text-xs animate-pulse">⏳</span>}
                          {item.status === 'pending' && <span className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-gray-500 text-xs">◻</span>}
                          <span className={item.status === 'active' ? 'text-white font-bold' : 'text-gray-300'}>{item.step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 3: NOVA INTELLIGENCE REPORT & EXECUTION PATH */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-xl hover:border-cyan-500/50 transition-all shadow-lg relative overflow-hidden flex flex-col max-h-[600px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    
                    <div className="mb-4 pb-4 border-b border-gray-800">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        NOVA Intelligence Report
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="flex flex-col"><span className="text-gray-500">Topic:</span><span className="text-white font-medium">{activeCurriculum}</span></div>
                        <div className="flex flex-col"><span className="text-gray-500">Urgency:</span><span className="text-red-400 font-medium">High</span></div>
                        <div className="flex flex-col col-span-2"><span className="text-gray-500">Objective:</span><span className="text-white font-medium">{activeMissionType}</span></div>
                        <div className="flex flex-col col-span-2"><span className="text-gray-500">Detected Weak Areas:</span><span className="text-white font-medium">Normalization, Transactions</span></div>
                        <div className="flex flex-col col-span-2"><span className="text-gray-500">Selected Strategy:</span><span className="text-cyan-300 font-mono text-[10px]">{requiresInterview ? "Assessment → Reinforcement → Interview" : "Assessment → Reinforcement → Evaluation"}</span></div>
                        <div className="flex flex-col"><span className="text-gray-500">Expected Outcome:</span><span className="text-emerald-400 font-medium">Readiness {">"} 80%</span></div>
                        <div className="flex flex-col"><span className="text-gray-500">Confidence:</span><span className="text-white font-medium">{interviewResult ? interviewResult.confidence : "94%"}</span></div>
                        {interviewResult && (
                          <div className="flex flex-col col-span-2 pt-2 border-t border-white/5">
                            <span className="text-gray-500">Last Interview Review:</span>
                            <span className="text-cyan-200 text-[11px] leading-relaxed">{interviewResult.review}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        Agent Execution Path
                      </h3>
                      
                      <div className="space-y-3">
                        {/* 1. NOVA Orchestrator */}
                        <div className="flex gap-3 items-start group">
                           <div className="w-6 h-6 rounded-full border border-cyan-500/50 bg-cyan-900/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">🧠</div>
                           <div>
                              <p className="text-xs font-bold text-cyan-300">NOVA Orchestrator</p>
                              <p className="text-[10px] text-gray-500">Initializes mission parameters</p>
                           </div>
                        </div>

                        <div className="w-px h-3 bg-gray-800 ml-3 -my-1"></div>

                        {/* 2. Planner Agent */}
                        <div className="flex gap-3 items-start group">
                           <div className="w-6 h-6 rounded-full border border-green-500/30 bg-green-900/20 text-green-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">✓</div>
                           <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-white flex items-center gap-1">📋 Planner Agent</p>
                                <span className="text-[9px] text-green-400 border border-green-500/20 bg-green-500/10 px-1.5 rounded">Complete</span>
                              </div>
                              <p className="text-[10px] text-gray-400">Creates learning strategy</p>
                           </div>
                        </div>

                        <div className="w-px h-3 bg-gray-800 ml-3 -my-1"></div>

                        {/* 3. Research Agent */}
                        <div className="flex gap-3 items-start group">
                           <div className="w-6 h-6 rounded-full border border-green-500/30 bg-green-900/20 text-green-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">✓</div>
                           <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-white flex items-center gap-1">📚 Research Agent</p>
                                <span className="text-[9px] text-green-400 border border-green-500/20 bg-green-500/10 px-1.5 rounded">Complete</span>
                              </div>
                              <p className="text-[10px] text-gray-400">Generates learning resources</p>
                           </div>
                        </div>

                        <div className="w-px h-3 bg-gray-800 ml-3 -my-1"></div>

                        {/* 4. Quiz Agent */}
                        <div className="flex gap-3 items-start group">
                           <div className="w-6 h-6 rounded-full border border-indigo-500/50 bg-indigo-900/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px] animate-pulse">⏳</div>
                           <div className="flex-1 bg-indigo-900/10 border border-indigo-500/20 p-2 rounded-lg -mt-1.5">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-indigo-300 flex items-center gap-1">📝 Quiz Agent</p>
                                <span className="text-[9px] text-indigo-400 border border-indigo-500/30 bg-indigo-500/20 px-1.5 rounded animate-pulse">Active</span>
                              </div>
                              <p className="text-[10px] text-indigo-200/70">Creates adaptive assessments</p>
                           </div>
                        </div>

                        {/* 5. Interview Agent — only relevant for assessment-style missions */}
                        {requiresInterview && (
                          <>
                            <div className="w-px h-3 bg-gray-800 ml-3 -my-1"></div>
                            <div className={`flex gap-3 items-start group ${interviewResult ? '' : 'opacity-50'}`}>
                               <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] ${interviewResult ? 'border border-green-500/30 bg-green-900/20 text-green-400' : 'border border-gray-700 bg-gray-900 text-gray-500'}`}>{interviewResult ? '✓' : '◻'}</div>
                               <div className="flex-1">
                                  <div className="flex justify-between items-center">
                                    <p className={`text-xs font-bold flex items-center gap-1 ${interviewResult ? 'text-white' : 'text-gray-400'}`}>🎤 Interview Agent</p>
                                    <span className={`text-[9px] px-1.5 rounded border ${interviewResult ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-gray-500 border-gray-700 bg-gray-800'}`}>{interviewResult ? 'Complete' : 'Pending'}</span>
                                  </div>
                                  <p className={`text-[10px] ${interviewResult ? 'text-gray-400' : 'text-gray-500'}`}>Conducts interview simulation</p>
                               </div>
                            </div>
                          </>
                        )}

                        <div className="w-px h-3 bg-gray-800 ml-3 -my-1"></div>

                        {/* 6. Reflection Agent */}
                        <div className={`flex gap-3 items-start group ${isFullyAssessed ? '' : 'opacity-50'}`}>
                           <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] ${isFullyAssessed ? 'border border-green-500/30 bg-green-900/20 text-green-400' : 'border border-gray-700 bg-gray-900 text-gray-500'}`}>{isFullyAssessed ? '✓' : '◻'}</div>
                           <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className={`text-xs font-bold flex items-center gap-1 ${isFullyAssessed ? 'text-white' : 'text-gray-400'}`}>📊 Reflection Agent</p>
                                <span className={`text-[9px] px-1.5 rounded border ${isFullyAssessed ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-gray-500 border-gray-700 bg-gray-800'}`}>{isFullyAssessed ? 'Complete' : 'Pending'}</span>
                              </div>
                              <p className={`text-[10px] ${isFullyAssessed ? 'text-gray-400' : 'text-gray-500'}`}>Evaluates performance & readiness</p>
                           </div>
                        </div>

                        <div className="w-px h-3 bg-gray-800 ml-3 -my-1"></div>

                        {/* 7. NOVA Consolidation */}
                        <div className="flex gap-3 items-start group opacity-50">
                           <div className="w-6 h-6 rounded-full border border-cyan-900/50 bg-black text-cyan-900 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">🧠</div>
                           <div>
                              <p className="text-xs font-bold text-gray-500">NOVA Consolidation</p>
                              <p className="text-[10px] text-gray-600">Finalizes Intelligence Profile</p>
                           </div>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>

                {/* Agent Activity Log */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-xl shadow-lg relative overflow-hidden">
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     Agent Activity Log
                   </h3>
                   <div className="space-y-3 h-32 overflow-y-auto pr-2 scrollbar-hide">
                     <div className="flex gap-4 text-sm bg-black/30 p-2 rounded border border-gray-800 border-l-2 border-l-emerald-500">
                       <span className="text-gray-500 font-mono text-xs w-16">12:06 PM</span>
                       <span className="text-emerald-300 font-bold">Reflection Agent:</span>
                       <span className="text-gray-300">Estimating readiness score.</span>
                     </div>
                     <div className="flex gap-4 text-sm bg-black/30 p-2 rounded border border-gray-800 border-l-2 border-l-indigo-500">
                       <span className="text-gray-500 font-mono text-xs w-16">12:05 PM</span>
                       <span className="text-indigo-300 font-bold">Quiz Agent:</span>
                       <span className="text-gray-300">Preparing adaptive assessment.</span>
                     </div>
                     <div className="flex gap-4 text-sm bg-black/30 p-2 rounded border border-gray-800 border-l-2 border-l-purple-500">
                       <span className="text-gray-500 font-mono text-xs w-16">12:04 PM</span>
                       <span className="text-purple-300 font-bold">Research Agent:</span>
                       <span className="text-gray-300">Generated customized study materials.</span>
                     </div>
                     <div className="flex gap-4 text-sm bg-black/30 p-2 rounded border border-gray-800 border-l-2 border-l-cyan-500">
                       <span className="text-gray-500 font-mono text-xs w-16">12:03 PM</span>
                       <span className="text-cyan-300 font-bold">Memory Agent:</span>
                       <span className="text-gray-300">Retrieved previous performance data.</span>
                     </div>
                     <div className="flex gap-4 text-sm bg-black/30 p-2 rounded border border-gray-800 border-l-2 border-l-blue-500">
                       <span className="text-gray-500 font-mono text-xs w-16">12:02 PM</span>
                       <span className="text-blue-300 font-bold">Planner Agent:</span>
                       <span className="text-gray-300">Learning roadmap successfully generated.</span>
                     </div>
                     <div className="flex gap-4 text-sm bg-black/30 p-2 rounded border border-gray-800 border-l-2 border-l-blue-500">
                       <span className="text-gray-500 font-mono text-xs w-16">12:01 PM</span>
                       <span className="text-blue-300 font-bold">Planner Agent:</span>
                       <span className="text-gray-300">Activated. Analyzing mission parameters.</span>
                     </div>
                   </div>
                </div>

              <section className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    Generated Learning Path
                  </h3>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">Active</span>
                </div>
                
                <p className="text-gray-300 mb-6 font-medium bg-black/20 p-4 rounded-xl border border-white/5">
                  Goal: <span className="text-indigo-300 italic">"{activeCurriculum}"</span>
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-900/50 border border-emerald-500/50 rounded-xl transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-bl-lg">Completed</div>
                    <h4 className="text-emerald-400 font-bold text-sm mb-2">Module 1: Foundations & Assessment</h4>
                    <div className="text-xs text-gray-400 mb-1"><span className="text-gray-500">Responsible Agent:</span> Planner Agent</div>
                    <div className="text-xs text-gray-400"><span className="text-gray-500">Objective:</span> Determine current {activeCurriculum} proficiency.</div>
                  </div>
                  <div className="p-4 bg-gray-900/50 border border-indigo-500/50 rounded-xl transition-colors relative overflow-hidden shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-bl-lg flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>In Progress</div>
                    <h4 className="text-indigo-400 font-bold text-sm mb-2">Module 2: Concept Reinforcement</h4>
                    <div className="text-xs text-gray-400 mb-1"><span className="text-gray-500">Responsible Agent:</span> Research Agent</div>
                    <div className="text-xs text-gray-400"><span className="text-gray-500">Objective:</span> Strengthen weak concepts based on baseline.</div>
                  </div>
                  <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl opacity-60 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-gray-700/50 text-gray-400 text-[10px] font-bold rounded-bl-lg">Pending</div>
                    <h4 className="text-gray-300 font-bold text-sm mb-2">{requiresInterview ? "Module 3: Mock Interview & Evaluation" : "Module 3: Final Evaluation"}</h4>
                    <div className="text-xs text-gray-400 mb-1"><span className="text-gray-500">Responsible Agent:</span> {requiresInterview ? "Interview Agent" : "Reflection Agent"}</div>
                    <div className="text-xs text-gray-400"><span className="text-gray-500">Objective:</span> {requiresInterview ? "Measure interview readiness and final evaluation." : "Evaluate quiz performance and finalize readiness score."}</div>
                  </div>
                </div>

                {/* Real-time Interactive Tutor */}
                <div className="mt-8 border-t border-indigo-500/30 pt-6">
                   <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                     Live Adaptive Quiz
                   </h4>
                   <div className="bg-black/40 border border-gray-700 rounded-xl h-80 flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                         <div className="bg-indigo-600/20 p-3 rounded-xl border border-indigo-500/30 w-fit max-w-[80%]">
                            <p className="text-sm text-indigo-100 leading-relaxed">
                              Training sequence initialized. Beginning baseline assessment phase for <span className="font-bold text-white">"{activeCurriculum}"</span>. 
                              Please input your current understanding of the core architectural concepts.
                            </p>
                         </div>
                         {tutorMessages.map((msg, i) => (
                           <div key={i} className={`p-3 rounded-xl border text-sm max-w-[80%] w-fit ${msg.role === 'user' ? 'bg-gray-800 border-gray-700 self-end ml-auto text-gray-200' : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100'}`}>
                             {msg.content}
                           </div>
                         ))}
                         {isTutorThinking && (
                           <div className="p-3 rounded-xl border text-sm max-w-[80%] w-fit bg-indigo-600/20 border-indigo-500/30 text-indigo-300 animate-pulse">
                             NOVA is thinking...
                           </div>
                         )}
                      </div>
                      <div className="p-3 border-t border-gray-800 flex gap-2 bg-gray-900/50 rounded-b-xl">
                         <input
                           type="text"
                           value={chatInput}
                           onChange={(e) => setChatInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSendTutorMsg()}
                           disabled={isTutorThinking}
                           className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
                           placeholder="Type your answer to NOVA to continue..."
                         />
                         <button
                           onClick={handleSendTutorMsg}
                           disabled={!chatInput.trim() || isTutorThinking}
                           className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                         >
                           Send
                         </button>
                      </div>
                   </div>
                 </div>

                {/* Final Student Intelligence Profile */}
                {isTutorFinished && (
                  <div className="bg-gray-900/80 border border-emerald-500/50 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-in fade-in zoom-in duration-700 mt-8">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                       <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                       </div>
                       <div>
                         <h3 className="text-xl font-bold text-white">Student Intelligence Profile</h3>
                         <p className="text-sm text-emerald-400 font-medium">Mission Accomplished. Profile Updated.</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold">Strong Areas</p>
                            <div className="space-y-1">
                               <div className="text-sm text-gray-300 flex items-center gap-2"><span className="text-emerald-400">✓</span> SQL Queries</div>
                               <div className="text-sm text-gray-300 flex items-center gap-2"><span className="text-emerald-400">✓</span> ER Modeling</div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold">Weak Areas</p>
                            <div className="space-y-1">
                               <div className="text-sm text-gray-300 flex items-center gap-2"><span className="text-red-400">✗</span> Normalization</div>
                               <div className="text-sm text-gray-300 flex items-center gap-2"><span className="text-red-400">✗</span> Transactions</div>
                            </div>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div>
                             <p className="text-xs text-gray-500 mb-1">Subject Mastery</p>
                             <div className="flex items-end gap-2">
                               <span className="text-3xl font-bold text-white">76%</span>
                               <span className="text-sm text-emerald-400 mb-1">↑ 4%</span>
                             </div>
                             <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2"><div className="bg-emerald-500 h-1.5 rounded-full w-[76%]"></div></div>
                          </div>
                          <div>
                             <p className="text-xs text-gray-500 mb-1">Interview Readiness</p>
                             <div className="flex items-end gap-2">
                               <span className="text-3xl font-bold text-white">82%</span>
                               <span className="text-sm text-emerald-400 mb-1">↑ 7%</span>
                             </div>
                             <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2"><div className="bg-indigo-500 h-1.5 rounded-full w-[82%]"></div></div>
                          </div>
                       </div>
                       <div className="bg-black/30 rounded-xl p-4 border border-gray-800 flex flex-col justify-center">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold text-center">Recommended Next Topic</p>
                          <p className="text-lg font-bold text-indigo-400 text-center mb-4">Transaction Management</p>
                          <button
                            onClick={() => handleDeployNewMission("Transaction Management")}
                            className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-300 rounded-lg text-sm transition-colors"
                          >
                            Deploy New Mission
                          </button>
                       </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
            )}

            <DigitalTwinDashboard activeTopic={activeCurriculum} masteryTarget={masteryTarget} />
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-1 relative">
            <div className="space-y-6 sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto pb-8 pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full">
              <LiveFeed activeTopic={activeCurriculum} />
              <CognitiveRadar activeTopic={activeCurriculum} />
              <NeuralLogsTerminal activeTopic={activeCurriculum} />
            </div>
          </div>
        </div>
      </main>

      {/* Autonomous Mode Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden">
            
            {!isDeploying && logs.length === 0 ? (
              // STEP 1: Input Topic
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  Initialize Autonomous Mode
                </h3>
                <p className="text-gray-400 text-sm">
                  What technical topic would you like the autonomous agents to build a custom curriculum for?
                </p>
                <input 
                  type="text" 
                  autoFocus
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Distributed Systems, React Hooks, Docker..."
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                />
                
                <div className="pt-2">
                  <p className="text-gray-400 text-sm mb-3">
                    Select Mission Profile:
                  </p>
                  <div className="flex flex-wrap gap-2">
                     {["Learning Mission", "Interview Mission", "Revision Mission", "Skill Gap Mission", "Placement Preparation Mission"].map(type => (
                       <button
                         key={type}
                         onClick={() => setMissionType(type)}
                         className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${missionType === type ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'bg-black/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-800/50'}`}
                       >
                         {type}
                       </button>
                     ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={startAutonomousSequence} disabled={!topic.trim() || isDeploying} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)]">Start Sequence</button>
                </div>
              </div>
            ) : (
              // STEP 2: Live Terminal
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                  <h3 className="text-sm font-bold text-gray-300 tracking-wider uppercase flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isFinished ? 'bg-green-500' : 'bg-indigo-500 animate-pulse'}`}></span>
                    {isFinished ? 'Mission Accomplished' : 'Autonomous Agents Terminal'}
                  </h3>
                  {isFinished && <button onClick={closeModal} className="text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>}
                </div>
                
                <div className="bg-black border border-gray-800 rounded-lg p-4 font-mono text-sm space-y-3 h-64 overflow-y-auto">
                  {logs.map((log, i) => {
                    if (!log) return null;
                    return (
                      <div key={i} className={`${log.startsWith('✅') ? 'text-green-400 font-bold mt-6' : 'text-gray-300'}`}>
                        <span className="text-gray-600 mr-2">{'>'}</span> {log}
                      </div>
                    );
                  })}
                  {isDeploying && (
                    <div className="text-indigo-400 animate-pulse">
                      <span className="text-gray-600 mr-2">{'>'}</span> _
                    </div>
                  )}
                </div>
                
                {isFinished && (
                  <div className="pt-2">
                    <button onClick={closeModal} className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-colors">
                      Return to Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
