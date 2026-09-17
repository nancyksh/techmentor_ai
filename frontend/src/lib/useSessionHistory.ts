"use client";
import { useEffect, useState } from "react";
import { readSessionHistory, SessionEntry } from "./sessionHistory";

// Reads saved quiz/interview results after mount (localStorage isn't available during SSR)
// and refreshes when the tab regains focus, e.g. after finishing a mock interview.
export function useSessionHistory(): SessionEntry[] {
  const [history, setHistory] = useState<SessionEntry[]>([]);
  useEffect(() => {
    const load = () => setHistory(readSessionHistory());
    load();
    window.addEventListener("focus", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return history;
}

// Latest score per topic, most recent first.
export function latestScoreByTopic(history: SessionEntry[], limit = 3) {
  const seen = new Map<string, number>();
  for (let i = history.length - 1; i >= 0; i--) {
    const { topic, score } = history[i];
    if (!seen.has(topic)) seen.set(topic, score);
  }
  return Array.from(seen, ([topic, score]) => ({ topic, score })).slice(0, limit);
}
