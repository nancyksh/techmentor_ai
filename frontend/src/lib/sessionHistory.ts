export type SessionEntry = {
  date: string;
  type: "Quiz" | "Interview";
  topic: string;
  score: number;
};

const STORAGE_KEY = "novaSessionHistory";
const MAX_ENTRIES = 10;

export function pushSessionEntry(entry: SessionEntry) {
  if (typeof window === "undefined") return;
  const history = readSessionHistory();
  history.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_ENTRIES)));
}

export function readSessionHistory(): SessionEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function confidenceToScore(level: string): number {
  if (level === "High") return 90;
  if (level === "Medium") return 70;
  if (level === "Low") return 45;
  return 60;
}
