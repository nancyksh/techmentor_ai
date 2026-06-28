"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { apiFetch } from '@/lib/api';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function CodingRoom() {
  const [code, setCode] = useState('def two_sum(nums, target):\n    # Write your solution here\n    pass');
  const [language, setLanguage] = useState('python');
  const [question, setQuestion] = useState("Loading a random coding problem...");
  const [starterCodes, setStarterCodes] = useState<any>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSlow, setIsSlow] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [review, setReview] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("N/A");
  const [spaceComplexity, setSpaceComplexity] = useState("N/A");
  const [bugs, setBugs] = useState("None");

  const fetchQuestion = async () => {
    try {
      setIsGenerating(true);
      setIsSlow(false);
      setLoadError("");
      const res = await apiFetch("/api/v1/coding-room/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "Data Structures and Algorithms", difficulty: "Medium" })
      }, () => setIsSlow(true));
      if (!res.ok) throw new Error("API returned " + res.status);
      const data = await res.json();
      setQuestion(data.question_text);
      setStarterCodes(data.starter_code);
      setCode(data.starter_code['python']);
    } catch (err) {
      console.error("Failed to generate question:", err);
      setLoadError("Couldn't load a question from the AI engine.");
      setQuestion("No question loaded.");
    } finally {
      setIsGenerating(false);
      setIsSlow(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);


  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [terminalError, setTerminalError] = useState("");
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugExplanation, setDebugExplanation] = useState("");
  const handleSubmit = async () => {
    if (!code.trim()) return;

    setIsEvaluating(true);

    try {
      const response = await apiFetch("/api/v1/coding-room/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, code, language, stdout: terminalOutput, stderr: terminalError })
      });

      if (!response.ok) {
        throw new Error("API returned " + response.status);
      }

      const data = await response.json();

      setReview(data.review);
      setTimeComplexity(data.time_complexity);
      setSpaceComplexity(data.space_complexity);
      setBugs(data.bugs_found);

    } catch (e) {
      console.error("API error", e);
      setReview("Couldn't reach the AI review engine. Please try Submit Code again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setTerminalOutput("Executing...");
    setTerminalError("");
    setExecutionTime(null);

    try {
      const response = await apiFetch("/api/v1/coding-room/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language })
      });

      if (!response.ok) {
        throw new Error("API returned " + response.status);
      }

      const data = await response.json();

      setTerminalOutput(data.stdout || "");
      setTerminalError(data.stderr || "");
      setExecutionTime(data.execution_time_ms);

    } catch (e) {
      console.error("API error", e);
      setTerminalError("Couldn't reach the execution engine. Please try Run Code again.");
      setTerminalOutput("");
    } finally {
      setIsRunning(false);
    }
  };


  const handleDebugCode = async () => {
    if (!code.trim()) return;

    setIsDebugging(true);
    setDebugExplanation("Analyzing code and error...");

    try {
      const response = await apiFetch("/api/v1/coding-room/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, error: terminalError || terminalOutput || "The program logic is incorrect but there was no explicit error output." })
      });

      if (!response.ok) {
        throw new Error("API returned " + response.status);
      }

      const data = await response.json();

      setDebugExplanation(data.explanation);
      if (data.fixed_code) {
        setCode(data.fixed_code);
      }

    } catch (e) {
      console.error("API error", e);
      setDebugExplanation("Couldn't reach the AI debugging engine. Please try Debug Code again.");
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <main className="relative container mx-auto px-4 py-8 flex flex-col min-h-screen">
        <header className="flex justify-between items-center pb-6 border-b border-white/10 shrink-0">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="text-indigo-500 font-extrabold tracking-tight">CORTEX</span>
            <span className="text-gray-500 font-light text-2xl">|</span>
            AI Coding Room
          </h1>
          <div className="flex gap-4">
            <a href="/" className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 font-medium">
              Dashboard
            </a>
            <a href="/interview" className="px-6 py-2 rounded-full bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors border border-indigo-500/30 font-medium">
              Standard Interview
            </a>
            <button onClick={handleRunCode} disabled={isRunning} className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 transition-colors font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2">
              {isRunning ? "Running..." : "Run Code"}
              {!isRunning && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            </button>
            <button onClick={handleSubmit} disabled={isEvaluating} className="px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 transition-colors font-medium shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center gap-2">
              {isEvaluating ? "Evaluating..." : "Submit Code"}
              {!isRunning && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            </button>
            <button onClick={handleDebugCode} disabled={isDebugging} className="px-6 py-2 rounded-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 transition-colors font-medium shadow-[0_0_15px_rgba(234,88,12,0.3)] flex items-center gap-2">
              {isDebugging ? "Debugging..." : "Debug Code"}
              {!isDebugging && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
            </button>

          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 min-h-0">
          {/* Main Editor Area */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 to-transparent z-0 pointer-events-none"></div>
                <h2 className="text-lg font-bold text-gray-300 relative z-10 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Problem Statement
                </h2>
                <p className="text-gray-300 mt-2 text-md leading-relaxed relative z-10">{question}</p>
                {isGenerating && isSlow && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-400 relative z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    Waking up the AI engine — first load can take up to a minute on the free tier...
                  </div>
                )}
                {loadError && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-red-400 relative z-10">
                    <span>{loadError}</span>
                    <button onClick={fetchQuestion} className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium">Retry</button>
                  </div>
                )}
                <div className="mt-4 flex gap-2 relative z-10">
                    <select 
                        value={language}
                        onChange={(e) => {
                            const newLang = e.target.value;
                            setLanguage(newLang);
                            if (starterCodes && starterCodes[newLang]) {
                                setCode(starterCodes[newLang]);
                            }
                        }}
                        className="bg-gray-800 border border-gray-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 min-h-[420px] bg-[#1e1e1e] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 20 },
                  fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                }}
              />
            </div>

            {/* Terminal Window */}
            <div className="h-48 bg-[#0d0d0d] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col shrink-0">
               <div className="bg-[#1e1e1e] border-b border-gray-800 px-4 py-2 flex justify-between items-center shrink-0">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Terminal Output
                  </h3>
                  {executionTime !== null && (
                    <span className="text-xs text-gray-500 font-mono">Executed in {executionTime}ms</span>
                  )}
               </div>
               <div className="flex-1 p-4 font-mono text-sm overflow-y-auto custom-scrollbar">
                  {!terminalOutput && !terminalError && !isRunning && executionTime === null && (
                    <span className="text-gray-600 italic">No output yet. Click 'Run Code' to execute.</span>
                  )}
                  {!terminalOutput && !terminalError && !isRunning && executionTime !== null && (
                    <span className="text-green-500/70 italic text-xs tracking-wider">Program executed successfully (no output).</span>
                  )}
                  {isRunning && (
                    <span className="text-gray-400 animate-pulse">Executing code on {language === 'python' ? 'Python Engine' : 'Node.js Engine'}...</span>
                  )}
                  {terminalOutput && (
                    <pre className="text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{terminalOutput}</pre>
                  )}
                  {terminalError && (
                    <pre className="text-red-400 whitespace-pre-wrap font-mono mt-2 leading-relaxed">{terminalError}</pre>
                  )}
                  {debugExplanation && (
                    <div className="mt-4 bg-orange-900/20 border border-orange-500/30 p-3 rounded-lg">
                      <h4 className="text-orange-400 font-bold text-xs uppercase mb-1">AI Debugger Analysis</h4>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap font-sans">{debugExplanation}</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* AI Panel Area */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-lg font-bold text-gray-300 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                AI Interview Panel
            </h3>
            
            <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-5 shadow-lg">
              <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  Complexity Analysis
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-300">Time Complexity</span>
                  <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-md font-mono text-xs border border-indigo-500/30">{timeComplexity}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-300">Space Complexity</span>
                  <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-md font-mono text-xs border border-indigo-500/30">{spaceComplexity}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-300">Bugs Detected</span>
                  <span className={bugs === 'None' ? "text-green-400 font-medium" : "text-red-400 font-medium max-w-[150px] truncate"} title={bugs}>{bugs}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 ${isEvaluating ? 'animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.6)]' : ''}`}>T</div>
                  <div>
                    <p className="text-sm font-bold text-white">Tech Lead</p>
                    <p className="text-xs text-indigo-300">{isEvaluating ? 'Reviewing code logic...' : review ? 'Code Reviewed' : 'Awaiting submission'}</p>
                  </div>
                </div>
                {review && (
                  <div className="mt-2 text-sm text-gray-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                      {review}
                  </div>
                )}
            </div>

          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
          }
        `}} />
      </main>
    </div>
  );
}
