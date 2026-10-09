# AI Hub — Production-Style AI Agent Development Platform

AI Hub is an autonomous AI coding agent platform designed to connect Git repositories, formulate implementation plans, modify codebases, run automated tests/builds/linting, review diffs, commit, push, and deploy to server fleets.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Firebase Auth
- **Backend**: Node.js, Express, TypeScript, Server-Sent Events (SSE)
- **Database & ORM**: SQLite, Prisma ORM
- **AI Providers**: Google Gemini, OpenAI, Anthropic, Demo Intelligent Provider

---

## 🚀 Running the Application

### 1. Backend Server
```bash
cd "/home/swap/AI hub/backend"
npm start
# Running on http://localhost:5001
```

### 2. Frontend Application
```bash
cd "/home/swap/AI hub/frontend"
npm run dev
# Running on http://localhost:5173
```

---

## 🔑 Access & Login

Open your browser at **http://localhost:5173**

You can log in using:
1. **Demo Login button**: Immediate 1-click access with pre-configured developer profile.
2. **Email / Password**:
   - Email: `demo@aihub.dev`
   - Password: `password123`
3. **Google / Microsoft OAuth** (via Firebase Authentication)

---

## 🤖 Pre-loaded Agents

1. **AMR Agent** — Robotics & Embedded Systems (`fleet-telemetry` repository)
2. **Astute DFM** — CAD & Engineering Analysis (`dfm-analyzer` repository)
3. **CBRE Agent** — IoT & Commercial Facilities (`building-iq` repository)
4. **Project Agent** — Workflow & Sprint Automation (`project-monorepo`)
5. **Development Agent** — Full Stack Autonomous Developer (`core-service`)

---

## ⚡ Key Workflows

1. **Active Chat & Prompts**: Send requests like *"Add JWT verification and telemetry"*.
2. **21-Step Pipeline**:
   - Load config -> Verify Git connection -> Pull branch -> Analyze codebase -> Formulate Plan -> **Approve Plan** -> Apply changes -> Run Tests -> Run Build & Typechecks -> **File Review Panel (Diffs +/-)** -> Commit -> Push -> Deploy -> Health Check.
3. **+ Add Agent Wizard**: 13-step comprehensive wizard configuring all agent dimensions.
4. **Agent Settings**: 13-tab configuration editor for existing agents.
5. **File Change Review**: Unified diff viewer with line additions/deletions and granular approve/reject controls.
6. **Live Logs**: Real-time streamed SSE telemetry with timestamped logs.

