"use client";
import React, { useEffect, useState } from 'react';
import { readSessionHistory, SessionEntry } from '@/lib/sessionHistory';

export default function AnalyticsDashboard() {
  const [history, setHistory] = useState<SessionEntry[]>([]);

  useEffect(() => {
    const load = () => setHistory(readSessionHistory());
    load();
    window.addEventListener('focus', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('focus', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  const hasData = history.length > 0;
  const recent = history.slice(-6);
  const latestScore = hasData ? history[history.length - 1].score : 0;
  const weeklyGrowth = history.length >= 2
    ? Math.round(((history[history.length - 1].score - history[0].score) / Math.max(1, history[0].score)) * 100)
    : 0;

  const quizEntries = history.filter(e => e.type === "Quiz");
  const quizAverage = quizEntries.length > 0
    ? Math.round(quizEntries.reduce((sum, e) => sum + e.score, 0) / quizEntries.length)
    : 0;
  // Most recent score per topic, last 3 distinct topics
  const topicScores = new Map<string, number>();
  for (const e of quizEntries) topicScores.set(e.topic, e.score);
  const recentTopics = Array.from(topicScores.entries()).slice(-3).reverse();

  const circumference = 314;
  const readinessOffset = circumference * (1 - latestScore / 100);

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
            {hasData ? (
              <div className="flex items-center gap-2 w-fit px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Live Profile — {history.length} Session{history.length !== 1 ? 's' : ''} Tracked</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-fit px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">No Sessions Yet</span>
              </div>
            )}
          </div>
          <a href="/" className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 font-medium whitespace-nowrap">
            Back to Dashboard
          </a>
        </header>

        {!hasData ? (
          <div className="bg-[#1A1718]/80 border border-gray-800 rounded-3xl p-12 text-center text-gray-400">
            Complete a Live Adaptive Quiz or a Mock Interview to start populating real analytics here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            <div className="bg-[#1A1718]/80 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Growth Across Sessions</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className={`text-4xl font-bold ${weeklyGrowth >= 0 ? 'text-white' : 'text-red-400'}`}>{weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth}%</span>
                <span className="text-emerald-400 text-sm mb-1">{history.length >= 2 ? 'since first tracked session' : 'need more sessions'}</span>
              </div>
              <div className="h-24 bg-gray-900/50 rounded-lg flex items-end px-2 pb-2 gap-1">
                {recent.map((entry, i) => (
                  <div
                    key={i}
                    title={`${entry.type}: ${entry.topic} — ${entry.score}%`}
                    className="flex-1 bg-emerald-500/70 rounded-t transition-all"
                    style={{ height: `${Math.max(8, entry.score)}%` }}
                  ></div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1718]/80 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Quiz Performance</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold text-white">{quizAverage}%</span>
                <span className="text-gray-400 text-sm mb-1">Average Score</span>
              </div>
              <div className="space-y-3">
                {recentTopics.length > 0 ? recentTopics.map(([topic, score]) => (
                  <div key={topic} className="flex justify-between text-sm">
                    <span className="truncate max-w-[160px]" title={topic}>{topic}</span>
                    <span className={score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400"}>{score}%</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 italic">No quiz sessions yet.</p>
                )}
              </div>
            </div>

            <div className="bg-[#1A1718]/80 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Placement Readiness</h3>
              <div className="flex items-center justify-center h-32 relative">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle className="text-gray-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="50" cx="56" cy="56" />
                  <circle className="text-indigo-500" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={readinessOffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r="50" cx="56" cy="56" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-bold text-white">{latestScore}%</span>
                </div>
              </div>
              <p className="text-center text-sm text-gray-400 mt-2">
                {latestScore >= 80 ? "Ready for Tier-1 Mock Interviews" : latestScore >= 60 ? "On track — keep practicing" : "Needs more reinforcement"}
              </p>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
