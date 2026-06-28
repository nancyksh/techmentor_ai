export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetch with a generous timeout and one retry. Free-tier backend hosts (Render, etc.)
 * can take 30-50s to wake from a cold sleep on the first request after idling —
 * without this, that looks like a frozen page during a live demo.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
  onSlow?: () => void
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const attempt = async (timeoutMs: number) => {
    const controller = new AbortController();
    const slowTimer = onSlow ? setTimeout(onSlow, 4000) : null;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timer);
      if (slowTimer) clearTimeout(slowTimer);
    }
  };

  try {
    return await attempt(45000);
  } catch (err) {
    // One retry in case the cold-start wake-up landed mid-request.
    return await attempt(45000);
  }
}

/** Fire-and-forget ping to wake a sleeping backend as early as possible (e.g. on page load). */
export function warmUpBackend() {
  fetch(`${API_BASE}/health`).catch(() => {});
}
