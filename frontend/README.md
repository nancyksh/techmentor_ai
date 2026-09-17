# CORTEX frontend

Next.js 16 + React 19 + TypeScript + Tailwind CSS 4.

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                  # http://localhost:3000
npm run lint
npm run build
```

| Route | Page |
|---|---|
| `/` | Dashboard, Autonomous Mode and the adaptive quiz tutor |
| `/coding-room` | AI-generated problems, Monaco editor, run / review / debug |
| `/interview` | Mock interview with voice input (Chrome / Edge) |
| `/analytics` | Scores from past quizzes and interviews |

API calls go through `src/lib/api.ts`, which retries once and shows a "waking up" message while the free-tier backend cold-starts.

See the [project README](../README.md) for architecture and deployment.
