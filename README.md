# RPG → Spring Boot Migration Studio

A polished English demo web app (Next.js + TypeScript + TailwindCSS) that simulates an agentic RPG-to-Spring modernization pipeline.

## Features
- Two-pane UX: RPG editor + tabbed insights (Agent Pipeline, Project Tree, File Viewer)
- Six migration agents with explicit INPUT/OUTPUT JSON and status
- DeepSeek wrapper with live mode and deterministic mock fallback
- Lightweight RAG snippet retrieval based on mapping rules
- Spring Boot artifact generation (layered architecture) + docs outputs
- Copy actions, loading skeletons, toast notifications, and ZIP download

## Run locally
```bash
npm install
npm run dev
```

## DeepSeek config
Copy `.env.example` to `.env.local` and set:
```bash
DEEPSEEK_API_KEY=
```

If no API key is provided, the app remains fully functional in mock mode.
