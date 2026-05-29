# VedaAI – AI Assessment Creator

> A full-stack AI-powered question paper generator for teachers. Built with Next.js, Node.js, MongoDB, Redis, BullMQ, WebSockets, and Google Gemini AI.

---

## 🚀 Live Demo

| Service | URL |
|---|---|
| **Frontend** | *(Deployed URL here)* |
| **Backend API** | *(Deployed URL here)* |

---

## 📸 Features

- **Create Assignments** — Form with file upload, due date, question types, marks, and instructions
- **AI Question Generation** — Structured prompts sent to Google Gemini 1.5 Flash
- **Diagrams & Graphs** — AI generates embedded diagrams using Mermaid.js syntax for visual questions
- **Real-time Progress** — WebSocket spinner shows live generation logs
- **Exam-style Output** — School name, subject, class, student info blanks, sectioned questions
- **Difficulty Badges** — Color-coded Easy / Moderate / Challenging tags per question
- **Advanced PDF Export** — High-fidelity PDF generation using html2pdf.js with perfect page breaks
- **AI Teacher's Toolkit** — Suite of micro-tools: Lesson Plan Generator, Essay Grader, and Parent Email Drafter
- **Settings Panel** — Configure personalized teacher name, school details, and AI model preferences
- **Mobile Responsive** — Full mobile layout with bottom navigation and mobile-specific floating actions
- **Offline Fallback** — Works without Redis using in-memory standalone generation

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)               │
│                                                         │
│   ┌──────────────┐   ┌───────────────┐   ┌──────────┐  │
│   │  Assignment  │   │  Question     │   │  Mobile  │  │
│   │  List Page   │   │  Paper View   │   │  Nav     │  │
│   └──────┬───────┘   └───────────────┘   └──────────┘  │
│          │                                              │
│   ┌──────▼─────────────────────────────────────────┐   │
│   │         Zustand Store (useAssessmentStore)      │   │
│   │  - assignments[]   - activeJob (progress)       │   │
│   │  - selectedAssignment  - websocketConnected     │   │
│   └──────┬──────────────────────┬──────────────────┘   │
│          │ HTTP (fetch)         │ WebSocket             │
└──────────┼──────────────────────┼─────────────────────-┘
           │                      │
           ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)            │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │                REST API Routes                   │  │
│   │  GET  /api/assignments                           │  │
│   │  POST /api/assignments  (+ file upload)          │  │
│   │  GET  /api/assignments/:id                       │  │
│   │  DELETE /api/assignments/:id                     │  │
│   │  POST /api/assignments/:id/regenerate            │  │
│   └──────────────┬──────────────────────────────────┘  │
│                  │                                      │
│   ┌──────────────▼──────────────────────────────────┐  │
│   │              Queue Manager                       │  │
│   │   Redis Available → BullMQ Queue                 │  │
│   │   Redis Offline   → Standalone In-Memory Worker  │  │
│   └──────────────┬──────────────────────────────────┘  │
│                  │                                      │
│   ┌──────────────▼──────────────────────────────────┐  │
│   │           Generation Worker                      │  │
│   │  1. Fetch assignment from MongoDB                │  │
│   │  2. Build structured prompt                      │  │
│   │  3. Call Google Gemini 1.5 Flash API             │  │
│   │  4. Parse + validate JSON response               │  │
│   │  5. Save generated paper to MongoDB              │  │
│   │  6. Broadcast completion via WebSocket           │  │
│   └──────────────┬──────────────────────────────────┘  │
│                  │                                      │
│   ┌──────────────▼──────────────────────────────────┐  │
│   │        WebSocket Server (ws library)             │  │
│   │  - SUBSCRIBE_JOB → register client per job ID   │  │
│   │  - JOB_PROGRESS  → broadcast progress updates   │  │
│   └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                           │
│   MongoDB Atlas  ──  Assignments Collection             │
│   Redis (optional)── BullMQ Job State                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🧠 Technical Approach

### Frontend
- **Next.js 14 (App Router)** with TypeScript
- **Zustand** for global state — manages assignments list, active job progress, WebSocket lifecycle, and selected paper
- **Scoped CSS (styled-jsx)** — no Tailwind, full custom design system matching Figma pixel-by-pixel
- **WebSocket client** in Zustand store — auto-subscribes per job ID on creation, receives real-time `JOB_PROGRESS` events, auto-closes on completion
- **Mobile-first responsive** — separate mobile card layouts, bottom nav, media query isolation

### Backend
- **Node.js + Express** (TypeScript, strict mode)
- **MongoDB + Mongoose** — single `Assignment` model storing metadata + full generated paper JSON
- **Redis + BullMQ** — `assessment-generation` queue with 2 concurrent workers; gracefully falls back to in-memory `setImmediate` processing when Redis is offline
- **WebSocket (ws library)** — custom `SocketManager` class maps `assignmentId → Set<WebSocket>` for targeted broadcasts
- **Multer** — handles file uploads (PDF/image) in memory, converts to base64 for Gemini multimodal input

### AI Generation Pipeline
1. Teacher submits form → Express creates `Assignment` document (status: `pending`)
2. Job pushed to BullMQ queue (or standalone fallback if Redis offline)
3. Worker builds a structured master prompt:
   - Lists each question type with exact count and marks
   - Requests grouped sections (Section A, B, C...)
   - Specifies difficulty distribution (30% Easy / 50% Moderate / 20% Challenging)
   - Requests answer key with step-by-step solutions
   - Forces strict JSON output schema (no markdown wrapping)
4. Gemini 1.5 Flash generates the paper; response is parsed as JSON
5. Parsed paper is validated (school name, AI message defaults applied)
6. Assignment updated to `completed`, paper saved
7. WebSocket broadcasts `JOB_PROGRESS { status: 'completed', progress: 100, paper: {...} }`
8. Frontend Zustand store receives event, updates UI instantly

### Resilience Design
- **Redis offline:** Standalone fallback engine (`processGenerationDirectly`) runs the exact same pipeline using `setImmediate` — zero crashes, full WebSocket progress, complete DB writes
- **Gemini API error:** Falls back to a high-fidelity mock generator with real CBSE-style questions
- **DB auto-seed:** On first boot with empty DB, automatically seeds 6 completed assignments for demo

---

## 📁 Project Structure

```
veda-ai/
├── frontend/                    # Next.js 14 app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout + global styles
│   │   │   └── page.tsx         # Main page — all views rendered here
│   │   ├── components/
│   │   │   ├── AssignmentForm.tsx    # Assignment creation form
│   │   │   ├── QuestionPaperView.tsx # Exam paper output view
│   │   │   ├── JobProgressOverlay.tsx# Real-time generation modal
│   │   │   ├── Sidebar.tsx          # Desktop left navigation
│   │   │   ├── MobileHeader.tsx     # Mobile top header
│   │   │   └── MobileNav.tsx        # Mobile bottom navigation
│   │   ├── store/
│   │   │   └── useAssessmentStore.ts # Zustand store + WS management
│   │   └── styles/
│   │       └── global.css           # Design system tokens + global styles
│   ├── .env.local                   # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
│   └── package.json
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── index.ts             # Server entry — DB, WS, Worker, Listen
│   │   ├── app.ts               # Express routes
│   │   ├── config/
│   │   │   └── db.ts            # MongoDB connection + auto-seeder
│   │   ├── models/
│   │   │   └── Assignment.ts    # Mongoose schema
│   │   ├── services/
│   │   │   ├── ai.ts            # Gemini AI service + mock fallback
│   │   │   └── queue.ts         # BullMQ + Redis setup
│   │   ├── sockets/
│   │   │   └── socketManager.ts # WebSocket broadcast manager
│   │   └── workers/
│   │       └── generationWorker.ts # BullMQ worker + standalone fallback
│   ├── .env                     # PORT, MONGO_URI, GEMINI_API_KEY, REDIS_*
│   └── package.json
│
├── docker-compose.yml           # MongoDB + Redis containers
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally OR MongoDB Atlas URI
- Redis (optional — app works without it)
- Google Gemini API Key (optional — falls back to smart mock)

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/veda-ai.git
cd veda-ai
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/veda-assessment?retryWrites=true&w=majority
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```bash
npm run dev
```

> Backend runs on `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
```

Start the frontend:

```bash
npm run dev
```

> Frontend runs on `http://localhost:3000`

---

### 4. Optional: Run MongoDB + Redis via Docker

```bash
docker-compose up -d
```

This starts both MongoDB (port 27017) and Redis (port 6379) in containers with persistent volumes.

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `PORT` | Express server port | ✅ |
| `MONGO_URI` | MongoDB connection string | ✅ |
| `GEMINI_API_KEY` | Google AI Studio API key | ⚠️ (falls back to mock) |
| `REDIS_HOST` | Redis host | ❌ (falls back to standalone) |
| `REDIS_PORT` | Redis port | ❌ |

### Frontend (`frontend/.env.local`)

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend REST API base URL | ✅ |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket URL | ✅ |

---

## 🧪 Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) + TypeScript |
| State Management | Zustand |
| Styling | Vanilla CSS (styled-jsx scoped modules) |
| Real-time | WebSocket (native browser API + ws library) |
| Backend Framework | Node.js + Express (TypeScript) |
| Database | MongoDB + Mongoose |
| Queue | BullMQ + Redis (with standalone fallback) |
| AI | Google Gemini 1.5 Flash |
| File Handling | Multer (in-memory) → base64 → Gemini multimodal |
| Containerization | Docker Compose (MongoDB + Redis) |

---

## ✨ Bonus Features Implemented

- ✅ **Voice Input** — Web Speech API mic button in the instructions field
- ✅ **Advanced PDF Download** — High-fidelity PDF export using html2pdf.js with precise page-break algorithms
- ✅ **Mermaid Diagrams** — Native rendering of complex diagrams and flowcharts directly in the question paper
- ✅ **Teacher Toolkit** — Standalone AI toolkit with Lesson Planner, Essay Grader, and Email Drafter
- ✅ **Custom Settings** — Dynamic school context and model selection mapped to the AI generation pipeline
- ✅ **Answer Key** — Full step-by-step answer key generated alongside questions
- ✅ **Auto Seed** — DB seeds demo assignments on first boot
- ✅ **Redis Offline Fallback** — Full pipeline works with zero Redis dependency
- ✅ **File Upload** — PDF/image uploaded, converted to base64, sent to Gemini as multimodal input
- ✅ **Difficulty Badges** — Color-coded per question (green/orange/red)
- ✅ **Regenerate** — One-click re-generation for any existing assignment

---

## 📄 License

MIT — Built for VedaAI Full Stack Engineering Assignment.
