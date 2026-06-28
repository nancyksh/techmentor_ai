const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageBreak, TableOfContents, ExternalHyperlink
} = require("docx");

const PAGE = {
  size: { width: 12240, height: 15840 },
  margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
};
const CONTENT_WIDTH = 9360;

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function P(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    children: [new TextRun({ text, ...opts })]
  });
}

function H1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function H2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function H3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}

function Bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 120 },
    children: [new TextRun(text)]
  });
}

function Numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 120 },
    children: [new TextRun(text)]
  });
}

function FigurePlaceholder(figNum, title, instructions) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [new TextRun({ text: `[ INSERT SCREENSHOT HERE ]`, bold: true, color: "808080", size: 24 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [new TextRun({ text: `Figure ${figNum} — ${title}`, bold: true, size: 22 })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: instructions, italics: true, size: 20, color: "555555" })]
              })
            ]
          })
        ]
      })
    ]
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}

function codeBlock(lines) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: "1E1E1E", type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: lines.map(line => new Paragraph({
              spacing: { after: 0 },
              children: [new TextRun({ text: line || " ", font: "Consolas", size: 18, color: "D4D4D4" })]
            }))
          })
        ]
      })
    ]
  });
}

function makeTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: "2E3A8C", type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })]
    }))
  });
  const bodyRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? "FFFFFF" : "F2F4FA", type: ShadingType.CLEAR },
      margins: { top: 90, bottom: 90, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })]
    }))
  }));
  return new Table({
    width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...bodyRows]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Calibri", color: "1F2D5C" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E3A8C", space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Calibri", color: "2E3A8C" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, italics: true, font: "Calibri", color: "44546A" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: { page: PAGE },
    children: [
      // ---------------- TITLE PAGE ----------------
      new Paragraph({ spacing: { after: 800 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "CORTEX", bold: true, size: 64, color: "2E3A8C" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "TechMentor AI Professor", bold: true, size: 36, color: "44546A" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
        children: [new TextRun({
          text: "An Autonomous Multi-Agent Platform for Adaptive Learning, AI-Driven Mock Interviews, and Placement Readiness Assessment",
          italics: true, size: 26
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "Project Report", bold: true, size: 24 })]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- TOC ----------------
      H1("Table of Contents"),
      new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- ABSTRACT ----------------
      H1("Abstract"),
      P("Conventional e-learning platforms present every learner with the same static content and the same generic mock interview questions, regardless of how the learner is actually performing. This project presents CORTEX (TechMentor AI Professor), an autonomous, multi-agent learning and placement-preparation platform that adapts its assessment style, interview rigor, and reported readiness scores to both the learner's selected goal and their real, in-session performance."),
      P("The system is built around a five-stage mission pipeline — Goal Analysis, Strategy Generation, Adaptive Quiz, Mock Interview, and Readiness Evaluation — orchestrated from a central NOVA dashboard. A user selects a topic and one of five Mission Profiles (Learning, Interview, Revision, Skill Gap, or Placement Preparation); the platform then dynamically decides which stages are relevant. Learning and Revision missions are intentionally short-circuited to skip the Mock Interview stage entirely, while Interview, Skill Gap, and Placement Preparation missions route the learner through both an adaptive quiz and a full three-panelist mock interview (Tech Lead, HR Manager, and Recruiter), each generating independent, role-specific feedback."),
      P("Two AI-backed subsystems power the experience: a Live Adaptive Quiz tutor that asks mission-style-specific, substantive questions (e.g. scenario-based questions for Interview Mission versus rapid recall questions for Revision Mission) and grades each answer with a bounded readiness delta; and an AI Coding Room offering on-demand DSA problem generation, sandboxed multi-language code execution, AI-assisted debugging, and run-aware code review. Every completed quiz and interview session is persisted as a session-history record, which now drives a fully real-data Learning Analytics dashboard — replacing what was originally a set of hardcoded, unchanging mock statistics — computing genuine growth percentages, per-topic quiz averages, and a placement-readiness gauge from the learner's actual history."),
      P("The platform is delivered as a two-tier web application: a Next.js 16 / React 19 frontend (Tailwind CSS, Monaco Editor) and a FastAPI backend that calls Groq's hosted Llama-3.3-70B model for all generative reasoning (question generation, quiz tutoring, interview evaluation, code review, and debugging). A nine-agent CrewAI orchestration layer (Professor, Planner, Research, Teaching, Quiz, Evaluation, Reflection, Interview Panel, and Memory agents) is scaffolded as the platform's long-term multi-agent architecture, with the currently shipped REST endpoints implementing the same agent responsibilities directly. This report documents the system's design, methodology, implementation, results, and the free-tier deployment pipeline (Vercel, Render, and UptimeRobot) adopted to make the platform publicly reachable for evaluation."),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 1. INTRODUCTION ----------------
      H1("1.  Introduction"),
      H2("1.1  Background"),
      P("Most student-facing ed-tech tools fall into one of two categories: static content libraries (videos, notes, MCQ banks) that do not adapt to the learner at all, or single-purpose tools — a quiz app, a separate mock-interview app, a separate analytics dashboard — that do not share state with one another. A student preparing for campus placements typically has to manually stitch together a learning plan, a self-assessment quiz, a mock interview booking, and a personal tracker to see if they are actually improving."),
      P("Large Language Models (LLMs) make it possible to generate quiz questions, interview questions, and qualitative feedback on demand rather than from a fixed question bank, and to reason about a learner's specific answer rather than just pattern-matching against a key. This project applies that capability inside a single orchestrated platform: one dashboard, one underlying session model, and one continuously-updated readiness score that flows from quiz to interview to analytics."),
      H2("1.2  Motivation"),
      P("The platform was motivated by three specific, observed shortcomings in a typical first-cut implementation of such a system, each of which is directly addressed in this project:"),
      Bullet("Mission profiles existed in the UI (Learning, Interview, Revision, Skill Gap, Placement Preparation) but had no actual effect on the quiz questions asked or on whether a mock interview stage was even relevant — every mission looked identical downstream."),
      Bullet("The dashboard's “Subject Mastery”, Execution Timeline, and Intelligence Report panels, and the entire Learning Analytics page, were populated with fixed, hand-coded numbers (e.g. mastery permanently capped at 15%, a fixed “85% Average Score”, a static 78% placement-readiness gauge) that never changed no matter what the learner actually did."),
      Bullet("The Mock Interview room only ever surfaced one panelist's (the Tech Lead's) feedback, even though the backend was already generating independent HR Manager and Recruiter evaluations for every answer."),
      P("Resolving these gaps — making mission selection actually branch the experience, making every dashboard number traceable to a real user action, and surfacing all three interview panelists — is the core contribution of this project, on top of the originally scaffolded multi-agent architecture."),
      H2("1.3  Scope of the Project"),
      P("The scope of CORTEX, as implemented and demonstrated, covers:"),
      Bullet("A NOVA-orchestrated dashboard supporting five Mission Profiles, each of which now controls the question style of the adaptive quiz and whether a Mock Interview stage is included in the Execution Timeline, Strategy Pipeline, and Agent Execution Path at all."),
      Bullet("A Live Adaptive Quiz tutor, backed by an LLM endpoint, that asks short (2-question), mission-style-specific, substantive questions and returns a bounded readiness delta and an explicit completion signal enforced server-side."),
      Bullet("A three-panelist AI Mock Interview Room (Tech Lead, HR Manager, Recruiter) with real-time speech-to-text answer capture, independent feedback streams per panelist, and live confidence/clarity scoring."),
      Bullet("An AI Coding Room: on-demand DSA problem generation with multi-language starter code, sandboxed code execution (Python/JavaScript) with a strict timeout, AI debugging, and a code review that is now aware of the program's actual run output rather than just the static source."),
      Bullet("A persistent, real (not simulated) session-history log, written to the browser on every completed quiz or interview, that now drives the Learning Analytics page's growth chart, quiz-performance breakdown, and placement-readiness gauge."),
      Bullet("A free-tier-compatible public deployment pipeline (Vercel for the frontend, Render for the backend, UptimeRobot for always-on keep-alive) suitable for sharing a single link with an evaluator."),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 2. PROBLEM STATEMENT ----------------
      H1("2.  Problem Statement"),
      P("Given a learner-selected topic T and a Mission Profile M ∈ {Learning, Interview, Revision, Skill Gap, Placement Preparation}, the system must (i) select an assessment pathway appropriate to M — specifically, deciding whether a Mock Interview stage is warranted at all, since Learning and Revision missions are not job-readiness assessments — (ii) generate quiz and/or interview questions whose phrasing and depth match the style implied by M (e.g. terse recall prompts for Revision, scenario-based trade-off questions for Interview), (iii) produce a readiness score that is derived from the learner's actual answers rather than a fixed or randomly-drifting placeholder, and (iv) persist enough of each session's outcome that a separate analytics view can later compute genuine trend and performance statistics without re-running the assessment."),
      P("A secondary requirement is that the platform must remain operable on free-tier infrastructure for the purpose of remote, link-based evaluation by a single reviewer, while being transparent about the security and reliability trade-offs (in particular, an arbitrary-code-execution endpoint and a cold-start delay on free hosting) that this implies."),
      H2("2.1  Objectives"),
      Bullet("To make each of the five Mission Profiles deterministically alter the quiz question style sent to the LLM tutor, and to make Mock Interview availability conditional on the profile (required only for Interview, Skill Gap, and Placement Preparation missions)."),
      Bullet("To cap the Live Adaptive Quiz at exactly two questions, enforced server-side by counting prior answers rather than left to the LLM's own discretion, so that a live demonstration of the platform completes predictably and quickly."),
      Bullet("To capture and display all three Mock Interview panelists' feedback (Tech Lead, HR Manager, Recruiter) for every submitted answer, instead of surfacing only the Tech Lead's review."),
      Bullet("To replace every hardcoded dashboard and analytics statistic — Subject Mastery, Execution Timeline progress, the Intelligence Report's confidence and outcome fields, and the entire Learning Analytics page — with values computed from real, locally-persisted session history."),
      Bullet("To make the AI Coding Room's code review evaluate the candidate's submission against its actual run-time output (stdout/stderr), not just the static source code."),
      Bullet("To deploy the completed system to public, free-tier cloud infrastructure with a single shareable link and no cold-start delay during a live evaluation."),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 3. LITERATURE / TECHNOLOGY SURVEY ----------------
      H1("3.  Literature and Technology Survey"),
      P("The design of CORTEX draws on three converging areas: adaptive/intelligent tutoring systems, LLM-based conversational assessment, and multi-agent orchestration frameworks."),
      H2("3.1  Adaptive and Intelligent Tutoring Systems"),
      P("Classical Intelligent Tutoring Systems (ITS) maintain a learner model and select the next instructional action (a hint, a question, a topic) based on inferred mastery. This project follows the same principle but replaces a hand-authored question bank and rule-based learner model with an LLM that is prompted, per Mission Profile, to generate a question and a bounded mastery adjustment directly, removing the need for a pre-authored content tree."),
      H2("3.2  LLM-Based Conversational Assessment and Interview Simulation"),
      P("Recent work on LLM-driven interview practice tools demonstrates that a single LLM call can act as a multi-perspective evaluator — technical correctness, communication style, and overall fit — when prompted with distinct role personas in one structured request. CORTEX's Mock Interview endpoint follows this pattern: one Groq/Llama-3.3-70B call returns a JSON object containing the Tech Lead's technical review, the HR Manager's communication review, and the Recruiter's cultural-fit review in a single round-trip, rather than requiring three separate model calls."),
      H2("3.3  Multi-Agent Orchestration (CrewAI)"),
      P("CrewAI models a workflow as a crew of role-scoped agents (each with a goal, backstory, and optional tools) coordinated through a sequence of Tasks. This project's agents/ module defines nine such agents — Professor (master orchestrator), Planner, Research, Teaching, Quiz, Evaluation, Reflection, Interview Panel, and Memory — mirroring the same responsibilities that the shipped REST endpoints currently fulfil directly via targeted Groq prompts. The CrewAI layer is intentionally retained as the platform's longer-horizon orchestration design (Section 12.3, Future Work) rather than the execution path used by the currently deployed endpoints, since a single well-scoped prompt per endpoint was sufficient for the assessed feature set and kept end-to-end latency low."),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 4. DATA / KNOWLEDGE SOURCES ----------------
      H1("4.  Data and Knowledge Sources"),
      P("Unlike a system built around a fixed labelled dataset, CORTEX generates its assessment content on demand from an LLM rather than retrieving it from a static corpus. The project nonetheless maintains three structured data sources that ground its behaviour:"),
      H2("4.1  Student Digital Twin (Relational Schema)"),
      P("A SQLite database (via async SQLAlchemy, aiosqlite) persists two tables: User (id, name, email, role, created_at) and DigitalTwin (subject_mastery, topic_mastery, and weakness_map as JSON columns, plus placement_readiness_score and interview_readiness_score floats), linked one-to-one. This schema is the platform's intended long-term learner model; the currently shipped session-history mechanism (Section 4.2) is the lightweight, fully-wired analogue used by the live dashboard and analytics page today."),
      H2("4.2  Session History (Browser-Persisted, Real-Time)"),
      P("Every completed Live Adaptive Quiz and every evaluated Mock Interview answer is appended, in the browser, to a capped (most recent 10) session-history log keyed by date, session type (Quiz / Interview), topic, and a 0–100 score. Quiz scores are the running readiness score at the point the quiz concludes; interview scores are derived by mapping each of the AI's High / Medium / Low confidence and clarity ratings to 90 / 70 / 45 and averaging the two. This log is the single source of truth read by the Learning Analytics page."),
      H2("4.3  Mission Profile → Question Style Mapping"),
      P("Rather than a static question bank, the quiz tutor is given a per-mission style directive that shapes every question it generates:"),
      makeTable(
        ["Mission Profile", "Question Style Directive"],
        [
          ["Learning Mission", "Step-by-step, teaching-style “what is / how does X work” questions; gently corrects misconceptions."],
          ["Interview Mission", "Interviewer-style problem-solving, trade-off, and real-world application scenarios."],
          ["Revision Mission", "Rapid-fire recall and clarification questions for a learner who has already studied the topic."],
          ["Skill Gap Mission", "Pointed, harder questions designed to surface what the candidate does NOT know."],
          ["Placement Preparation Mission", "Campus-recruitment-style mix of conceptual depth and applied problem-solving."],
        ],
        [3360, 6000]
      ),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 5. METHODOLOGY ----------------
      H1("5.  Methodology"),
      H2("5.1  Overall Approach"),
      P("CORTEX follows a mission-conditioned methodology: a single Mission Profile selection at the start of a session deterministically reshapes (a) the question style used by the quiz tutor, (b) whether a Mock Interview stage exists at all in that session's pipeline, and (c) which dashboard stages are marked complete. Rather than running every learner through an identical five-stage pipeline, the system computes a requiresInterview boolean once the mission is known and conditions the entire downstream Execution Timeline, Strategy Pipeline, Selected Agents list, and Agent Execution Path on it."),
      H2("5.2  Adaptive Quiz Scoring Methodology"),
      P("For each learner answer, the quiz-tutor endpoint sends the topic, mission profile, full conversation history, and the latest answer to the LLM in a single request, and requires a JSON response containing: a substantive (2–3 sentence, scenario-grounded) reply or question; an integer readiness_delta in the range [-5, +5]; and an is_finished boolean. The client-visible readiness score is updated as score = clamp(0, 100, previous_score + readiness_delta) on every turn."),
      H2("5.3  Server-Enforced Quiz Length"),
      P("Early testing showed the LLM did not reliably self-terminate the assessment at a consistent turn count when asked to judge “enough questions asked” itself. The endpoint therefore counts the number of prior user turns in the submitted history and forces is_finished = true once two answers have been received, regardless of what the model itself returned for that field — guaranteeing a short, demo-safe, and predictable quiz length."),
      codeBlock([
        "answers_so_far = sum(1 for turn in data.history if turn.get(\"role\") == \"user\") + 1",
        "is_final_question = answers_so_far >= 2",
        "...",
        "is_finished = result.get(\"is_finished\", False) or is_final_question",
      ]),
      H2("5.4  Three-Panelist Mock Interview Methodology"),
      P("A single evaluation call to the LLM is prompted to act as an entire interview panel and return four independent fields: review (Tech Lead's technical feedback), confidence and clarity (High/Medium/Low), next_question, hr_review (HR Manager's communication/professionalism feedback), and recruiter_review (Recruiter's cultural-fit/impression feedback). The frontend now renders all three reviewer cards and all three feedback blocks per answer, rather than only the Tech Lead's."),
      H2("5.5  Mission-Conditioned Interview Requirement"),
      P("requiresInterview is computed once per active mission as a simple set-membership check: true only for Interview Mission, Skill Gap Mission, and Placement Preparation Mission. Every UI element that previously hardcoded an interview stage — the Execution Timeline's “Mock Interview” step, the Selected Agents “✓ Interview” tag, the Strategy Pipeline's “Interview” node, and the Interview Agent card in the Agent Execution Path — is now conditionally rendered (or entirely omitted, not merely greyed out) based on this flag. A parallel isFullyAssessed flag resolves to “quiz completed” for Learning/Revision missions or “interview completed” for the other three, and gates the Readiness Evaluation, Reflection Agent, and Personalized Roadmap stages accordingly."),
      H2("5.6  Real-Time Subject Mastery Methodology"),
      P("Subject Mastery was previously a fixed animation that always stalled at 15% regardless of performance. It is now driven by a masteryTarget computed from the live session state: 0 before any mission is active; proportional to quiz progress (capped at 40%) while the quiz is in progress; capped at 60% once the quiz finishes but before the interview/evaluation is complete; and the learner's actual readiness score (up to 100%) once the mission is fully assessed. The dashboard animates the displayed percentage toward this real target every time it changes."),
      H2("5.7  Run-Aware Code Review Methodology"),
      P("The Coding Room's evaluation endpoint previously reviewed only the candidate's static source code. It now also receives the program's actual stdout and stderr from the most recent “Run Code” action and is explicitly instructed to judge correctness against that real output, in addition to style, complexity, and bug analysis."),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 6. TOOLS AND TECHNOLOGIES ----------------
      H1("6.  Tools and Technologies Used"),
      H2("6.1  Backend Stack"),
      makeTable(
        ["Component", "Technology", "Purpose"],
        [
          ["Web Framework", "FastAPI + Uvicorn (ASGI)", "Async REST API under /api/v1, CORS middleware, automatic OpenAPI docs"],
          ["LLM Reasoning", "Groq API — Llama-3.3-70B-versatile", "Quiz tutoring, interview evaluation, code review/debug, question generation"],
          ["Multi-Agent Framework", "CrewAI (Agent / Task / Crew)", "Nine-agent orchestration design (Professor, Planner, Research, Teaching, Quiz, Evaluation, Reflection, Interview Panel, Memory)"],
          ["Relational Database", "SQLite + SQLAlchemy 2.0 (async, aiosqlite)", "User and Digital Twin persistence"],
          ["Migrations", "Alembic", "Schema migration tooling for the relational store"],
          ["Sandboxed Execution", "Python subprocess (5-second timeout)", "Runs submitted Python/JavaScript in an isolated temp file with a hard timeout"],
          ["Config / Secrets", "python-dotenv", "Loads GROQ_API_KEY and other settings from .env"],
        ],
        [2400, 3400, 3560]
      ),
      H2("6.2  Frontend Stack"),
      makeTable(
        ["Component", "Technology", "Purpose"],
        [
          ["UI Framework", "Next.js 16 (Turbopack) + React 19", "App-router pages: Dashboard, Coding Room, Interview Room, Analytics"],
          ["Styling", "Tailwind CSS 4", "Utility-first dark “cyberpunk SOC” dashboard theme"],
          ["Code Editor", "@monaco-editor/react", "In-browser multi-language code editor for the Coding Room"],
          ["Speech Input", "Web Speech API (SpeechRecognition)", "Live speech-to-text answer capture in the Mock Interview room"],
          ["Client Persistence", "Browser localStorage (custom sessionHistory.ts helper)", "Cross-page handoff of interview results and the real session-history log"],
        ],
        [2400, 3400, 3560]
      ),
      H2("6.3  DevOps and Deployment Tools"),
      makeTable(
        ["Tool", "Role in this Project"],
        [
          ["Git / GitHub", "Version control and pull-request-based change tracking for this project"],
          ["Vercel", "Recommended/adopted hosting for the Next.js frontend (zero-config, free tier, global CDN)"],
          ["Render", "Recommended/adopted hosting for the FastAPI backend (free tier Python web service)"],
          ["UptimeRobot", "Free external monitor pinging the Render backend every 5 minutes to prevent free-tier idle sleep before/during evaluation"],
        ],
        [3120, 6240]
      ),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 7. SYSTEM ARCHITECTURE ----------------
      H1("7.  System Architecture"),
      P("CORTEX is organised into four logical layers — presentation, API, generative reasoning, and persistence — illustrated in Figure 1."),
      FigurePlaceholder(1, "System Architecture Diagram",
        "Draw or screenshot a simple block diagram: Next.js Frontend (Dashboard / Coding Room / Interview Room / Analytics) → FastAPI /api/v1 → Groq LLM (Llama-3.3-70B) + SQLite/SQLAlchemy, with the browser localStorage session-history store shown feeding back into the Dashboard and Analytics pages."),
      H2("7.1  Layer-by-Layer Description"),
      H3("Presentation Layer"),
      P("Four primary Next.js pages — the NOVA Dashboard, AI Coding Room, Mock Interview Room, and Learning Analytics — each a client component managing its own local React state (mission selection, quiz/interview progress, code editor contents) and reading/writing the shared localStorage session-history log for cross-page handoff."),
      H3("API Layer"),
      P("A single FastAPI application mounts all routers under /api/v1 with permissive CORS for development (tightened to the deployed frontend origin in production), exposing endpoints for interview evaluation, coding-room question generation/execution/debug/evaluation, and quiz-tutor responses."),
      H3("Generative Reasoning Layer"),
      P("Every AI-backed endpoint issues a single structured request to Groq's OpenAI-compatible chat-completions endpoint (model llama-3.3-70b-versatile, response_format=json_object), with a system prompt that fixes the exact JSON keys expected in the reply, and a deterministic fallback string used if the call fails."),
      H3("Persistence Layer"),
      P("A SQLite database (async SQLAlchemy) stores the User / Digital Twin schema for future full learner-profile persistence; in the currently shipped feature set, the browser's localStorage — via the sessionHistory.ts and the interview-result cache — is the live, read-on-every-page-load source of truth for the Dashboard and Analytics pages."),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 8. USE CASE / FLOW ----------------
      H1("8.  Use Case and Mission Flow"),
      H2("8.1  Use Case Diagram"),
      P("Figure 2 identifies the actors interacting with CORTEX: the Student/Learner (selects a topic and Mission Profile, answers quiz and interview questions, writes and runs code), the NOVA Orchestrator (the autonomous dashboard logic that decides which stages apply to the selected mission), and the Mock Interview Panel (Tech Lead, HR Manager, Recruiter — three independent AI evaluators acting on a single submitted answer)."),
      FigurePlaceholder(2, "Use Case Diagram",
        "Draw a simple UML use-case diagram with actors Student, NOVA Orchestrator, and Interview Panel, connected to use cases: Select Mission, Answer Adaptive Quiz, Submit Mock Interview Answer, Run/Debug Code, View Analytics."),
      H2("8.2  Mission-Conditioned Pipeline Flow"),
      P("Figure 3 traces how a single Mission Profile selection branches the Execution Timeline. Learning and Revision missions proceed: Goal Analysis → Strategy Generation → Agent Selection → Learning Path Creation → Knowledge Assessment → Adaptive Quiz → Readiness Evaluation → Personalized Roadmap (no interview stage). Interview, Skill Gap, and Placement Preparation missions insert a Mock Interview stage between the Adaptive Quiz and Readiness Evaluation stages."),
      FigurePlaceholder(3, "Mission-Conditioned Flow Diagram",
        "Draw a flowchart with a single decision diamond after “Adaptive Quiz” labelled “requires Interview?” branching to either “Mock Interview → Readiness Evaluation” or directly to “Readiness Evaluation”."),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 9. IMPLEMENTATION ----------------
      H1("9.  Implementation"),
      H2("9.1  Mission-Aware Quiz Tutor Endpoint"),
      P("The /quiz-tutor/respond endpoint maps the active Mission Profile to a style directive before building the system prompt, and computes whether this is the final (2nd) question independently of the model's own judgement:"),
      codeBlock([
        "mission_guidance = {",
        "    \"Learning Mission\": \"Focus on teaching-style questions ...\",",
        "    \"Interview Mission\": \"Ask questions in the style of a technical interviewer ...\",",
        "    \"Revision Mission\": \"Treat this as a rapid-fire recap ...\",",
        "    \"Skill Gap Mission\": \"Probe specifically for weaknesses ...\",",
        "    \"Placement Preparation Mission\": \"Simulate placement-test style questions ...\"",
        "}",
        "mission_focus = mission_guidance.get(data.mission_type, mission_guidance[\"Learning Mission\"])",
        "answers_so_far = sum(1 for turn in data.history if turn.get(\"role\") == \"user\") + 1",
        "is_final_question = answers_so_far >= 2",
      ]),
      H2("9.2  Sandboxed Code Execution"),
      P("The Coding Room's /coding-room/execute endpoint writes the submitted code to a temporary file and runs it as a subprocess with a hard 5-second timeout, returning stdout, stderr, exit code, and execution time:"),
      codeBlock([
        "process = subprocess.run(",
        "    config[\"cmd\"] + [temp_file_path],",
        "    capture_output=True, text=True, timeout=5.0",
        ")",
        "return CodeExecutionResponse(",
        "    stdout=process.stdout, stderr=process.stderr,",
        "    exit_code=process.returncode,",
        "    execution_time_ms=round((time.time() - start_time) * 1000, 2)",
        ")",
      ]),
      H2("9.3  Mission-Conditioned Dashboard Rendering"),
      P("The dashboard computes requiresInterview and isFullyAssessed once per render and threads them through the Execution Timeline array, the Strategy Pipeline tags, and the Agent Execution Path cards, so that Learning/Revision missions never render an interview-related element at all:"),
      codeBlock([
        "const requiresInterview = activeMissionType",
        "  ? [\"Interview Mission\", \"Skill Gap Mission\", \"Placement Preparation Mission\"].includes(activeMissionType)",
        "  : true;",
        "const isFullyAssessed = requiresInterview ? !!interviewResult : isTutorFinished;",
        "",
        "const timelineSteps = [",
        "  ...,",
        "  ...(requiresInterview ? [{ step: \"Mock Interview\", status: ... }] : []),",
        "  { step: \"Readiness Evaluation\", status: isFullyAssessed ? \"done\" : \"pending\" },",
        "];",
      ]),
      H2("9.4  Real Session-History Persistence"),
      P("A small shared helper, sessionHistory.ts, is the single write/read path for both the quiz and interview flows, capping the stored history at the ten most recent sessions:"),
      codeBlock([
        "export function pushSessionEntry(entry: SessionEntry) {",
        "  const history = readSessionHistory();",
        "  history.push(entry);",
        "  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_ENTRIES)));",
        "}",
        "export function confidenceToScore(level: string): number {",
        "  if (level === \"High\") return 90;",
        "  if (level === \"Medium\") return 70;",
        "  if (level === \"Low\") return 45;",
        "  return 60;",
        "}",
      ]),
      H2("9.5  Three-Panelist Interview Rendering"),
      P("The Mock Interview room now captures and renders all three independent feedback streams returned by a single evaluation call, instead of only the Tech Lead's review:"),
      codeBlock([
        "setReview(data.review);              // Tech Lead",
        "setHrReview(data.hr_review || \"\");    // HR Manager",
        "setRecruiterReview(data.recruiter_review || \"\"); // Recruiter",
      ]),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 10. RESULTS AND SCREENSHOTS ----------------
      H1("10.  Results and Screenshots"),
      P("This section documents the platform's behaviour as observed end-to-end. Each subsection below specifies exactly which screen and which state of that screen should be captured for the corresponding figure."),

      H2("10.1  NOVA Dashboard — Mission Selection"),
      P("Demonstrates the “Start Autonomous Mode” modal, where a topic and one of the five Mission Profiles are chosen before the pipeline begins."),
      FigurePlaceholder(4, "Start Autonomous Mode — Mission Profile Selection",
        "On the Dashboard (/), click “Start Autonomous Mode”, type a topic (e.g. “SQL Databases”), and screenshot the modal showing the topic field and the five Mission Profile buttons before clicking Start Sequence."),

      H2("10.2  Mission-Conditioned Execution Timeline"),
      P("Demonstrates that the Execution Timeline omits the Mock Interview stage for a Learning/Revision mission, and includes it for an Interview/Skill Gap/Placement Preparation mission."),
      FigurePlaceholder(5, "Execution Timeline — Revision Mission (no Mock Interview step)",
        "After deploying a Revision Mission, screenshot the Execution Timeline card and confirm “Mock Interview” does not appear in the step list."),
      FigurePlaceholder(6, "Execution Timeline — Interview Mission (Mock Interview step present)",
        "Deploy an Interview Mission instead and screenshot the same Execution Timeline card to show the contrast — the Mock Interview step should now be visible."),

      H2("10.3  NOVA Intelligence Report and Agent Execution Path"),
      P("Demonstrates the Intelligence Report panel and the Agent Execution Path list, including the Interview Agent card disappearing entirely (not merely greyed out) for non-assessment missions."),
      FigurePlaceholder(7, "NOVA Intelligence Report and Agent Execution Path",
        "Screenshot the full “NOVA Intelligence Report & Execution Path” card on the Dashboard, ideally after completing a quiz so the “Last Interview Review” / Confidence fields and the green-checked agent cards are populated."),

      H2("10.4  Live Adaptive Quiz — Mission-Specific Question Style"),
      P("Demonstrates NOVA asking a question whose style matches the selected Mission Profile, and the Student Intelligence Profile card that appears once the (2-question) quiz concludes."),
      FigurePlaceholder(8, "Live Adaptive Quiz in progress",
        "On the Dashboard, scroll to the “Live Adaptive Quiz” chat box, answer NOVA's first question, and screenshot the conversation showing your answer and NOVA's substantive follow-up question."),
      FigurePlaceholder(9, "Student Intelligence Profile (quiz completed)",
        "After answering the second question, screenshot the revealed “Student Intelligence Profile” card showing Strong/Weak Areas, Subject Mastery, Interview Readiness, and the “Deploy New Mission” button."),

      H2("10.5  Real-Time Subject Mastery"),
      P("Demonstrates Subject Mastery animating toward a real, performance-derived percentage instead of stalling at a fixed 15%."),
      FigurePlaceholder(10, "Student Digital Twin — Subject Mastery",
        "Scroll to the “Student Digital Twin” card below the mission panels and screenshot the active topic's mastery bar mid-animation or at its final value after completing a quiz."),

      H2("10.6  AI Coding Room"),
      P("Demonstrates AI-generated question loading, code execution, the Debug button being usable before any code has been run, and a run-aware Tech Lead code review."),
      FigurePlaceholder(11, "Coding Room — Generated Problem and Editor",
        "Open /coding-room and screenshot the generated problem statement, the Monaco editor with starter code, and the language selector."),
      FigurePlaceholder(12, "Coding Room — Run Code and Tech Lead Review",
        "Click “Run Code”, then “Submit Code”, and screenshot the Terminal Output panel together with the Tech Lead's review and Complexity Analysis panel on the right."),

      H2("10.7  Mock Interview Room — Three-Panelist Feedback"),
      P("Demonstrates all three panelists (Tech Lead, HR Manager, Recruiter) responding independently to a single submitted answer."),
      FigurePlaceholder(13, "Interview Panel — Tech Lead, HR Manager, Recruiter",
        "Open /interview, answer the displayed question (type or use the microphone), click “Submit Answer”, and screenshot the Interview Panel sidebar plus the three feedback blocks (Tech Lead, HR Manager, Recruiter) that appear below."),

      H2("10.8  Learning Analytics — Driven by Real Session History"),
      P("Demonstrates the Analytics page computing genuine numbers from completed sessions, including its honest empty state when no sessions exist yet."),
      FigurePlaceholder(14, "Analytics — Empty State",
        "Before completing any quiz or interview (or after clearing localStorage), open /analytics and screenshot the “No Sessions Yet” empty state."),
      FigurePlaceholder(15, "Analytics — Live Data",
        "After completing at least one quiz and one interview answer, reopen /analytics and screenshot the “Growth Across Sessions” bar chart, “Quiz Performance” per-topic breakdown, and the “Placement Readiness” gauge, all now reflecting your real session scores."),

      H2("10.9  Summary of Verified Behaviour"),
      makeTable(
        ["Feature", "Before This Project's Changes", "After This Project's Changes"],
        [
          ["Mission Profile effect", "Cosmetic only — UI label changed, downstream flow identical", "Determines quiz question style and whether a Mock Interview stage exists at all"],
          ["Quiz length", "Model decided when to stop (inconsistent)", "Server-enforced hard cap at exactly 2 questions"],
          ["Subject Mastery", "Animated up to a fixed 15% regardless of performance", "Animates toward a real target derived from quiz/interview score"],
          ["Interview Panel", "Only Tech Lead's feedback shown", "Tech Lead, HR Manager, and Recruiter feedback all shown"],
          ["Code review", "Reviewed static source code only", "Also evaluates against the program's actual stdout/stderr"],
          ["Analytics page", "Fully hardcoded (fixed 85% quiz score, fixed 78% readiness)", "Computed live from real, persisted session history"],
          ["“Deploy New Mission” button", "No onClick handler — did nothing", "Resets session state and reopens the mission modal pre-filled with the recommended topic"],
        ],
        [2160, 3600, 3600]
      ),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 11. DEPLOYMENT ----------------
      H1("11.  Deployment"),
      P("The completed system is deployed to public, free-tier cloud infrastructure to enable remote, link-based evaluation without requiring a reviewer to run anything locally. The platform follows a split-deployment strategy: a statically built, CDN-hosted frontend and a separately hosted, persistently-running backend, kept warm by an external monitor."),
      H2("11.1  Frontend Deployment — Vercel"),
      P("The Next.js frontend is connected directly to its GitHub repository and deployed on Vercel, which natively understands the Next.js build (npm run build) with zero additional configuration. Every push to the deployed branch triggers an automatic redeploy. Vercel's free tier does not sleep, so the frontend itself loads instantly on every visit."),
      H2("11.2  Backend Deployment — Render"),
      P("The FastAPI backend is deployed as a Render free-tier Python web service, also connected to GitHub for automatic redeploys, with the start command uvicorn app.main:app --host 0.0.0.0 --port $PORT. The GROQ_API_KEY required for all generative endpoints is set as a Render environment variable rather than committed to source control."),
      H2("11.3  Keeping the Backend Warm — UptimeRobot"),
      P("Render's free tier spins the backend down after roughly 15 minutes of inactivity, after which the first request following idle takes 30–50 seconds to respond (a cold start). To eliminate this delay for a live evaluation, UptimeRobot — a free external uptime monitor — is configured to ping the deployed backend's /health endpoint every 5 minutes, which keeps it perpetually warm without any manual intervention before sharing the link."),
      H2("11.4  Cross-Origin Resource Sharing (CORS) Configuration"),
      P("With the frontend and backend hosted on different origins, FastAPI's CORSMiddleware (configured in app/main.py) must explicitly permit the deployed Vercel origin. During local development this is left permissive (allow_origins=[\"*\"]); for the public deployment this is tightened to the specific Vercel production URL to avoid exposing the API to arbitrary cross-origin callers."),
      H2("11.5  Live Deployment URLs"),
      makeTable(
        ["Component", "Platform", "Live URL"],
        [
          ["Frontend (Next.js Dashboard)", "Vercel", "<insert your Vercel production URL here>"],
          ["Backend (FastAPI REST API)", "Render", "<insert your Render service URL here>"],
          ["Source Code Repository", "GitHub", "github.com/nancyksh/techmentor_ai"],
        ],
        [3120, 2160, 4080]
      ),
      spacer(),
      H2("11.6  Known Operational Limitation — Code Execution Endpoint"),
      P("The Coding Room's /coding-room/execute endpoint runs submitted Python/JavaScript as an unsandboxed subprocess on the backend host, bounded only by a 5-second timeout. This is an accepted, scoped risk for a single-reviewer academic demonstration but is not safe to expose to the general public indefinitely — a production hardening of this feature would run submissions inside a disposable container (e.g. gVisor, Firecracker, or a managed code-execution API) rather than a bare subprocess on the application server itself."),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 12. CONCLUSION ----------------
      H1("12.  Conclusion and Future Work"),
      H2("12.1  Conclusion"),
      P("This project took an existing multi-page learning platform — whose Mission Profiles, dashboard statistics, and interview feedback were largely cosmetic or hardcoded — and made every one of those surfaces genuinely responsive to the learner's selected goal and real, in-session performance. The Mission Profile now branches the actual assessment pipeline rather than just relabelling it; the Live Adaptive Quiz and Mock Interview room generate mission-appropriate, multi-perspective AI feedback in place of static or partially-discarded model output; and the Learning Analytics page computes its growth chart, quiz averages, and readiness gauge from a real, persisted session-history log rather than fixed placeholder numbers. The system is deployed on entirely free-tier infrastructure (Vercel, Render, UptimeRobot) with no cold-start penalty during a live evaluation, while remaining transparent about the trade-offs — most notably the unsandboxed code-execution endpoint — that this scope and budget implied."),
      H2("12.2  Limitations"),
      Bullet("Session history and interview results are persisted in browser localStorage rather than the backend's SQLite/Digital-Twin schema, so analytics are currently per-browser rather than per-authenticated-user."),
      Bullet("The Coding Room's code-execution endpoint is an unsandboxed subprocess, acceptable only for a controlled, single-reviewer demonstration (Section 11.6)."),
      Bullet("Groq API rate limits can momentarily degrade the quiz tutor, interview evaluator, or code reviewer to their deterministic fallback text under sustained, rapid-fire use."),
      Bullet("The nine-agent CrewAI orchestration layer (agents/) is a designed but not yet execution-wired architecture; the currently shipped endpoints fulfil the same responsibilities via direct, single-purpose LLM prompts."),
      H2("12.3  Future Work"),
      Bullet("Wire the existing CrewAI agents/ module into the live request path, replacing today's direct per-endpoint Groq calls with true multi-agent task delegation (Professor → Planner → Research → Quiz/Evaluation → Memory)."),
      Bullet("Migrate session history and interview results from localStorage into the SQLite Digital Twin schema, keyed by an authenticated user, so analytics persist across devices and browsers."),
      Bullet("Replace the unsandboxed code-execution subprocess with a disposable, resource-limited container or managed code-execution API suitable for public, unattended use."),
      Bullet("Extend the Reflection Agent to feed completed quiz/interview weaknesses directly into the next Mission Profile's recommended topic, closing the loop the “Deploy New Mission” button currently starts manually."),
      Bullet("Add authentication and per-user Digital Twin persistence so the platform supports more than one learner profile per deployment."),
      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- REFERENCES ----------------
      H1("References"),
      P("[1] Groq Inc. (2024). “Groq API Documentation — OpenAI-Compatible Chat Completions.” console.groq.com/docs."),
      P("[2] CrewAI Inc. (2024). “CrewAI Documentation — Agents, Tasks, and Crews.” docs.crewai.com."),
      P("[3] Vercel Inc. (2024). “Vercel Documentation — Deploying Next.js Applications.” vercel.com/docs."),
      P("[4] Render Services Inc. (2024). “Render Documentation — Free Web Services.” render.com/docs."),
      P("[5] UptimeRobot Ltd. (2024). “UptimeRobot — Free Uptime Monitoring.” uptimerobot.com."),
      P("[6] FastAPI. (2024). “FastAPI Documentation.” fastapi.tiangolo.com."),
      P("[7] Vercel Inc. / Next.js Team. (2024). “Next.js Documentation.” nextjs.org/docs."),
      P("[8] SQLAlchemy Project. (2024). “SQLAlchemy 2.0 Documentation — Asynchronous I/O.” docs.sqlalchemy.org."),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("CORTEX_TechMentor_AI_Project_Report.docx", buffer);
  console.log("done");
});
