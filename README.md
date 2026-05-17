<div align="center">

<br/>

```
  ███████╗████████╗██████╗  █████╗ ████████╗ █████╗
  ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗
  ███████╗   ██║   ██████╔╝███████║   ██║   ███████║
  ╚════██║   ██║   ██╔══██╗██╔══██║   ██║   ██╔══██║
  ███████║   ██║   ██║  ██║██║  ██║   ██║   ██║  ██║
  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝
```

### **AI-Powered Code Archaeology Platform**
*Git histories are not logs. They are civilizations. Strata unearths them.*

<br/>

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Celery](https://img.shields.io/badge/Celery-Async-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev)
[![Redis](https://img.shields.io/badge/Redis-7-DD0031?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Gemini](https://img.shields.io/badge/Gemini_2.5-LangChain-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br/>

</div>

---

## 🏛️ What is Strata?

Every repository carries a hidden story — decisions made under pressure, pivots that changed everything, the one engineer who held it all together. That story is buried in thousands of commits.

**Strata** is a full-stack, AI-native platform that **excavates your codebase's history** and transforms raw git data into rich, narrative-driven insights. Point it at any GitHub repository, and within minutes you get:

- A timeline of architectural **"Eras"** — pivotal epochs in the codebase's evolution, each with a compelling engineering narrative
- An AI-authored **New Hire Survival Guide** to slash onboarding time from weeks to hours
- An interactive **Codebase Topography** map showing structural complexity at a glance
- A **Bus Factor Heatmap** that surfaces knowledge silos before they become crises

> *Built as a solo end-to-end project demonstrating production-grade AI integration, distributed systems design, and modern full-stack engineering.*

---

## ✨ Feature Showcase

### 🤖 AI Era Detection — Map-Reduce over Git History
Strata applies a two-phase **LangChain Map-Reduce pipeline** over commit history:
- **Map Pass**: Chunks commits into windows of 50, sending each to Gemini 2.5 Flash for localized summarization of architectural focus areas and technical debt
- **Reduce Pass**: Synthesizes all summaries into 3–6 macro "Eras" with creative titles (*"The Monolith Foundation"*, *"The Great TypeScript Migration"*) and 2-paragraph engineering narratives
- Built to handle repositories of **any scale** — thousands of commits are processed without truncation

### 📖 New Hire Survival Guide — AI-Authored Onboarding
From the synthesized eras, Strata auto-generates a **Markdown survival guide** written in the voice of a staff engineer: witty, technical, and actionable. Sections include tech stack evolution, known dragons in the codebase, and where a new engineer should make their first commit.

### 🗺️ Interactive Codebase Topography
A live **D3.js file-tree visualization** renders the directory structure as an explorable graph — not just a static tree. Nodes are sized and colored by complexity, giving an instant spatial map of where complexity lives.

### ⏳ Time-Scrubbing Slider
A historical scrubber lets users **rewind the repository** to any point in its lifetime, watching modules rise, dominate, and fade in real time.

### 🔥 Bus Factor Heatmap
Identifies files and modules owned by a **single contributor** — quantifying the organizational risk hidden in your commit history before that engineer walks out the door.

### 🎒 New Hire Mode
Filters deprecated and legacy files out of the visualization so onboarding engineers see only what is **currently relevant** — not archaeological debris.

### ⚡ Real-Time WebSocket Streaming
The heavy pipeline (cloning, PyDriller extraction, multi-pass LLM calls) runs in **Celery workers** with live progress streamed back to the UI via WebSocket. No polling, no waiting in the dark.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Next.js 16 Frontend                     │
│   D3.js Visualizations · Time Scrubber · Bus Factor Map  │
└──────────────┬──────────────────────┬────────────────────┘
               │ REST API             │ WebSocket
               ▼                      ▼
┌──────────────────────────────────────────────────────────┐
│                 FastAPI Backend (Uvicorn)                  │
│         /api/analyze  ·  /api/status  ·  /api/ws         │
└──────────────────────────┬───────────────────────────────┘
                           │ Enqueue Task
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  Redis 7 (Broker + Cache)                  │
└──────────────────────────┬───────────────────────────────┘
                           │ Consume Task
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    Celery Worker                           │
│                                                           │
│   1. Clone & scan repo  ──►  PyDriller extractor.py      │
│   2. Filter noise        ──►  bot/linting commit removal  │
│   3. Map Pass            ──►  Gemini 2.5 Flash (chunks)  │
│   4. Reduce Pass         ──►  Gemini 2.5 Pro (synthesis) │
│   5. Survival Guide      ──►  LangChain prompt chain     │
│   6. Store results       ──►  Redis cache                │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS, D3.js, Lucide Icons |
| **Backend API** | FastAPI, Uvicorn, WebSockets |
| **Task Queue** | Celery (async distributed workers) |
| **Broker & Cache** | Redis 7 |
| **AI / LLM** | Google Gemini 2.5 Flash & Pro via LangChain |
| **Git Analysis** | PyDriller |
| **Infrastructure** | Docker, Docker Compose |
| **Languages** | Python 51.2% · TypeScript 43.8% · Dockerfile, JS, CSS |

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A **Google Gemini API key** — get one free at [ai.google.dev](https://ai.google.dev)

### One-Command Setup

```bash
# 1. Clone the repo
git clone https://github.com/Amirtha-yazhini/strata.git
cd strata

# 2. Configure environment
echo "GOOGLE_API_KEY=your_gemini_api_key_here" > .env
echo "REDIS_URL=redis://redis:6379/0" >> .env

# 3. Launch the full stack
docker-compose up --build
```

That's it. The entire stack — frontend, API, Celery worker, and Redis — spins up in one command.

| Service | URL |
|---|---|
| **Web UI** | http://localhost:3000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |

### Quickstart Usage

1. Open `http://localhost:3000`
2. Paste any public GitHub repository URL
3. Hit **Analyze** and watch the real-time WebSocket progress stream
4. Explore the Eras timeline, read the AI-generated Survival Guide, and navigate the D3 Topography map

---

## 📂 Project Structure

```
strata/
├── frontend/                   # Next.js 16 App
│   ├── app/                    # App Router — pages & global styles
│   ├── components/             # React components
│   │   └── FileTreeGraph.tsx   # Core D3.js visualization component
│   └── Dockerfile              # Frontend container
│
├── main.py                     # FastAPI server — REST & WebSocket endpoints
├── tasks.py                    # Celery task definitions & pipeline orchestration
├── extractor.py                # Git history extraction via PyDriller
├── analyzer.py                 # LangChain Map-Reduce LLM pipeline
│
├── Dockerfile.backend          # Backend + Celery worker container
├── docker-compose.yml          # Multi-service orchestration
└── requirements.txt            # Python dependencies
```

---

## 📡 API Reference

### `POST /api/analyze`
Enqueues an asynchronous repository analysis job.

```json
// Request
{ "repo_url": "https://github.com/user/repo" }

// Response
{ "job_id": "8472-a84b-...", "status": "Queued" }
```

### `GET /api/status/{job_id}`
Polls for job status and retrieves the final structured analysis JSON on completion.

### `WS /api/ws/status/{job_id}`
WebSocket endpoint that streams live pipeline progress (clone → extract → map → reduce → guide) directly to the frontend. Used to power the real-time progress UI.

---

## 🧠 Engineering Highlights

These are the decisions worth talking about in an interview:

**Map-Reduce over unbounded input** — Git histories can have tens of thousands of commits. Feeding them raw to an LLM would exceed context windows and produce incoherent summaries. Strata chunks commits into windows of 50, runs parallel summarization (Map), then synthesizes those summaries into macro-level eras (Reduce). This pattern scales to any repository size.

**Noise filtering before AI** — Raw git logs are full of bot commits, automated formatting runs, and dependency bumps. `extractor.py` filters these out before any LLM call, dramatically improving narrative quality and reducing token cost.

**Async pipeline with live feedback** — Repository cloning and multi-pass LLM processing can take 30–90 seconds. Rather than blocking, Strata uses Celery workers + Redis + WebSockets to stream granular progress updates, making long waits feel transparent and responsive.

**Containerized from day one** — Every service runs in Docker with a single `docker-compose up --build`. No manual environment setup, no "works on my machine" surprises.

---

## 🗺️ Roadmap

- [ ] GitHub OAuth integration for private repository analysis
- [ ] Side-by-side era diff viewer
- [ ] Exportable PDF survival guides
- [ ] Team collaboration mode with shared analysis workspaces
- [ ] Support for GitLab and Bitbucket repositories

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

**Built with curiosity, caffeine, and a deep love for well-designed systems.**

*If you made it this far — the code is worth reading too.*

[⭐ Star this repo](https://github.com/Amirtha-yazhini/strata) · [🐛 Report a Bug](https://github.com/Amirtha-yazhini/strata/issues) · [💡 Request a Feature](https://github.com/Amirtha-yazhini/strata/issues)

</div>
