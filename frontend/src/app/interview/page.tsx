"use client";
import React, { useState, useEffect, useRef } from 'react';
import { pushSessionEntry, confidenceToScore } from '@/lib/sessionHistory';

export default function InterviewRoom() {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [question, setQuestion] = useState("Loading question...");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [analysis, setAnalysis] = useState({ confidence: "N/A", clarity: "N/A" });
  const [review, setReview] = useState("");
  const [hrReview, setHrReview] = useState("");
  const [recruiterReview, setRecruiterReview] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    // Randomize initial question
    const starters = [
      "Please explain how a hash map resolves collisions.",
      "What is the difference between TCP and UDP?",
      "Can you explain the concept of 'Time Complexity' in Big-O notation?",
      "How does a load balancer work?",
      "Explain the concept of Dependency Injection."
    ];
    setQuestion(starters[Math.floor(Math.random() * starters.length)]);

    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscriptRef.current += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          // Update the text box with the combined final + live interim text
          setText(finalTranscriptRef.current + interimTranscript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
             isRecordingRef.current = false;
             setIsRecording(false);
          }
        };
        
        recognitionRef.current.onend = () => {
          // If we want it to be continuous and the user hasn't clicked stop:
          if (isRecordingRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Ignore restart errors
            }
          }
        };
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Microphone API not supported. Please use Google Chrome.");
      return;
    }

    if (isRecordingRef.current) {
      // STOP recording
      isRecordingRef.current = false;
      setIsRecording(false);
      recognitionRef.current.stop();
    } else {
      // START recording
      isRecordingRef.current = true;
      setIsRecording(true);
      finalTranscriptRef.current = ''; // Reset memory
      setText(''); // Reset UI
      try {
        recognitionRef.current.start();
      } catch (e) {
        // It might already be started
      }
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setIsEvaluating(true);
    
    // Force stop recording on submit
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      setIsRecording(false);
      recognitionRef.current?.stop();
    }
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer: text })
      });
      
      if (!response.ok) {
        throw new Error("API returned " + response.status);
      }
      
      const data = await response.json();
      
      setReview(data.review);
      setHrReview(data.hr_review || "");
      setRecruiterReview(data.recruiter_review || "");
      setAnalysis({ confidence: data.confidence, clarity: data.clarity });
      setQuestion(data.next_question);
      setText('');
      finalTranscriptRef.current = '';

      if (typeof window !== 'undefined') {
        localStorage.setItem('novaInterviewResult', JSON.stringify({
          completed: true,
          confidence: data.confidence,
          clarity: data.clarity,
          review: data.review,
          completedAt: new Date().toISOString()
        }));
      }

      const interviewScore = Math.round((confidenceToScore(data.confidence) + confidenceToScore(data.clarity)) / 2);
      pushSessionEntry({ date: new Date().toISOString(), type: "Interview", topic: "Mock Interview", score: interviewScore });
      
    } catch (e) {
      console.error("API error", e);
      alert("Failed to connect to AI API. Make sure your backend is running!");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <main className="relative container mx-auto px-4 py-8 space-y-12">
        <header className="flex justify-between items-center pb-8 border-b border-white/10">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="text-indigo-500 font-extrabold tracking-tight">CORTEX</span>
            <span className="text-gray-500 font-light text-2xl">|</span>
            AI Interview Room
          </h1>
          <div className="flex gap-4">
            <a href="/" className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 font-medium">
              Back to Dashboard
            </a>
            <a href="/analytics" className="px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center gap-2">
              End Interview & View Analytics
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Interview Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl aspect-video flex items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-gray-900/90 z-0"></div>
              
              <div className="text-center z-10 p-8">
                <div className={`w-24 h-24 mx-auto bg-indigo-600 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${isRecording ? 'shadow-[0_0_50px_rgba(79,70,229,0.8)] scale-110' : 'shadow-[0_0_30px_rgba(79,70,229,0.5)]'}`}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Technical Interviewer</h2>
                <p className="text-gray-300 mt-4 max-w-2xl mx-auto text-lg leading-relaxed">"{question}"</p>
              </div>
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                <button 
                  onClick={toggleRecording}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white'}`}
                  title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isRecording ? (
                       <rect x="7" y="7" width="10" height="10" strokeWidth="2" fill="currentColor" />
                    ) : (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 13l4 4L19 7"></path>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 relative">
               <textarea 
                 value={text}
                 onChange={(e) => setText(e.target.value)}
                 className="w-full bg-transparent border-none text-white outline-none resize-none placeholder-gray-500"
                 rows={4}
                 placeholder={isRecording ? "Listening to you... speak clearly!" : "Type your answer or speak into the microphone..."}
               ></textarea>
               
               <div className="flex justify-end border-t border-white/10 pt-3">
                 <button 
                   onClick={handleSubmit}
                   disabled={!text.trim() || isEvaluating}
                   className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                 >
                   <span>{isEvaluating ? "Evaluating..." : "Submit Answer"}</span>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                 </button>
               </div>
               
               {isRecording && (
                 <div className="absolute top-4 right-4 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                   <span className="text-xs text-red-400 font-medium tracking-widest uppercase">Recording</span>
                 </div>
               )}
            </div>
          </div>

          {/* Panel Area */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-300">Interview Panel</h3>
            
            <div className="space-y-4">
              <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-xl p-4 flex items-center gap-4 transition-all">
                <div className={`w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center ${isEvaluating ? 'animate-pulse' : ''}`}>T</div>
                <div>
                  <p className="text-sm font-bold">Tech Lead</p>
                  <p className="text-xs text-green-400">{isEvaluating ? 'Evaluating...' : isRecording ? 'Listening...' : review ? 'Feedback Given' : 'Waiting'}</p>
                </div>
              </div>
              <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4 transition-all">
                <div className={`w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center ${isEvaluating ? 'animate-pulse' : ''}`}>H</div>
                <div>
                  <p className="text-sm font-bold">HR Manager</p>
                  <p className="text-xs text-green-400">{isEvaluating ? 'Evaluating...' : isRecording ? 'Listening...' : hrReview ? 'Feedback Given' : 'Waiting'}</p>
                </div>
              </div>
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-4 flex items-center gap-4 transition-all">
                <div className={`w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center ${isEvaluating ? 'animate-pulse' : ''}`}>R</div>
                <div>
                  <p className="text-sm font-bold">Recruiter</p>
                  <p className="text-xs text-green-400">{isEvaluating ? 'Evaluating...' : isRecording ? 'Listening...' : recruiterReview ? 'Feedback Given' : 'Waiting'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 mt-8">
              <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Live Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Confidence</span>
                  <span className={analysis.confidence === 'High' ? "text-green-400" : analysis.confidence === 'Low' ? "text-red-400" : "text-yellow-400"}>{analysis.confidence}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Clarity</span>
                  <span className={analysis.clarity === 'High' ? "text-green-400" : analysis.clarity === 'Low' ? "text-red-400" : "text-yellow-400"}>{analysis.clarity}</span>
                </div>
                {text.length > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-800 mt-2">
                    <span className="text-gray-300">Word Count</span>
                    <span className="text-indigo-400">{text.split(' ').filter(w => w).length}</span>
                  </div>
                )}
              </div>
            </div>

            {review && (
              <div className="bg-indigo-900/20 border border-indigo-500/50 rounded-xl p-4 mt-4">
                <h4 className="text-xs text-indigo-400 uppercase tracking-wider mb-2">Tech Lead Feedback</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{review}</p>
              </div>
            )}

            {hrReview && (
              <div className="bg-emerald-900/20 border border-emerald-500/50 rounded-xl p-4 mt-4">
                <h4 className="text-xs text-emerald-400 uppercase tracking-wider mb-2">HR Manager Feedback</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{hrReview}</p>
              </div>
            )}

            {recruiterReview && (
              <div className="bg-orange-900/20 border border-orange-500/50 rounded-xl p-4 mt-4">
                <h4 className="text-xs text-orange-400 uppercase tracking-wider mb-2">Recruiter Feedback</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{recruiterReview}</p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
