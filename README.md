# AI Keyboard

> An intelligent keyboard layer that transforms your input device into a real-time AI collaborator for coding interviews and beyond.

## What is AI Keyboard?

AI Keyboard is a **system-wide AI assistant** that lives at the point of input. Instead of switching between apps for AI help, it provides:

- **Interview Copilot** - Real-time coding interview assistance with screen capture
- **Context-Aware Autocomplete** - AI suggestions based on what you're typing
- **Persistent Memory** - Remembers your preferences, coding style, and past interactions
- **Invisible Typing** - AI can type directly into any app
- **Desktop Automation** - Full Windows MCP integration for system-level control
- **Voice Agent** - Voice-to-text and text-to-voice capabilities and live agent

## Core Features

### 1. Interview Copilot (Coding Mode)

| Shortcut      | Action                                                            |
| ------------- | ----------------------------------------------------------------- |
| `Alt+X`       | Capture screen & analyze coding problem                           |
| `Alt+Shift+X` | Update analysis with new constraints                              |
| `Alt+N`       | Get code suggestions/improvements                                 |
| `Ctrl+1-6`    | Switch tabs (Chat, Idea, Code, Walkthrough, Test Cases, Memories) |

**Tabs:**

- **Chat** - Free-form conversation with context
- **Idea** - Problem breakdown, key observations, approach
- **Code** - Clean, commented implementation
- **Walkthrough** - Step-by-step solution explanation
- **Test Cases** - Edge cases with input/output/reason
- **Memories** - Retrieved facts about your preferences

### 2. Action Menu (Quick AI)

| Shortcut    | Action                              |
| ----------- | ----------------------------------- |
| `Ctrl+\`    | Open action menu with selected text |
| `Tab`       | Quick AI chat mode                  |
| `Alt+[Key]` | Trigger specific action             |

**Built-in Actions:**

- Fix Grammar, Shorten, Expand text
- Professional/Casual/Friendly tone
- Email writer
- Custom prompts

### 3. AI Suggestions

| Shortcut     | Action                                |
| ------------ | ------------------------------------- |
| `Ctrl+Space` | Get AI suggestion for current context |

- Shows inline completions based on selected/typed text
- Two modes: Hotkey-triggered or Auto (clipboard watcher)

### 4. Brain Panel (Memory Dashboard)

| Shortcut       | Action             |
| -------------- | ------------------ |
| `Ctrl+Shift+B` | Toggle brain panel |

- View stored memories
- Upload images for visual memory
- Monitor automatic context capture
- Neo4j knowledge graph visualization

### 5. Text Output Modes

- **Paste** — Standard clipboard paste (default)
- **Typewriter** — AI types character-by-character (undetectable)

## Tech Stack

| Layer              | Technology                                 |
| ------------------ | ------------------------------------------ |
| Desktop App        | Electron                                   |
| Frontend           | Next.js 15, React 19, Tailwind CSS         |
| AI                 | Vercel AI SDK, OpenAI/Groq/Cerebras        |
| Memory             | Mem0 (Supabase vector store + Neo4j graph) |
| Desktop Automation | nut-js, node-window-manager, Windows MCP   |
| Database           | Supabase (PostgreSQL)                      |

## Setup & Installation

### Prerequisites

- Node.js 18+
- Python 3.12+ (for memory backend)
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- Supabase account (for vector store)
- Optional: Neo4j instance (for knowledge graph)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-repo/ai-keyboard.git
cd ai-keyboard

# Frontend
cd frontend
npm install

# Backend
cd ../backend
uv sync
```

### 2. Environment Variables

**Frontend** (`frontend/.env.local`):

```env
# AI Providers (choose one or more)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
CEREBRAS_API_KEY=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Memory Backend
MEMORY_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`):

```env
# Supabase Connection (for Mem0 vector store)
SUPABASE_CONNECTION_STRING=postgresql://...

# Optional: Neo4j for knowledge graph
NEO4J_URL=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=...
```

### 3. Database Setup

Run the Supabase migrations or create tables manually:

- `conversations` — Chat sessions
- `messages` — Chat messages with metadata
- `memories` — Mem0 vector embeddings (auto-created)

### 4. Run the Application

```bash
# Terminal 1: Start memory backend
cd backend
uv run main.py

# Terminal 2: Start Windows MCP server
cd frontend
npm run windows-mcp

# Terminal 3: Start Electron app
cd frontend
npm run dev
```

The app will start with:

- Next.js at `http://localhost:3000`
- Memory API at `http://localhost:8000`
- Windows MCP at `http://localhost:8001`

### 5. System Tray

The app runs in the system tray. Right-click for:

- Show Actions Menu
- Brain Panel
- Settings
- Quit

## Project Structure

```
ai-keyboard/
├── frontend/                 # Electron + Next.js app
├── electron/src/         # Electron main process
│   ├── main.ts           # Window management, shortcuts
│   ├── text-handler.ts   # Clipboard, typewriter mode
│   └── context-capture.ts # Periodic screenshot capture
├── src/
│       ├── app/              # Next.js pages & API routes
│       ├── components/       # React components
│       │   ├── action-menu/  # Main AI menu, copilot, chat
│       │   ├── brain-panel/  # Memory dashboard
│       │   └── ai-elements/  # Message rendering
│       └── lib/ai/           # AI providers, tools, types
├── backend/                  # FastAPI memory server
│   └── main.py               # Mem0 API endpoints
└── PS.md                     # Problem statement
```

## Keyboard Shortcuts Reference

| Shortcut       | Context    | Action                      |
| -------------- | ---------- | --------------------------- |
| `Ctrl+\`       | Global     | Open/close action menu      |
| `Ctrl+Space`   | Global     | Get AI suggestion           |
| `Ctrl+Shift+B` | Global     | Toggle brain panel          |
| `Alt+X`        | Copilot    | Analyze coding problem      |
| `Alt+Shift+X`  | Copilot    | Update with new constraints |
| `Alt+N`        | Copilot    | Code suggestions            |
| `Ctrl+1-6`     | Copilot    | Switch tabs                 |
| `Ctrl+N`       | Copilot    | New conversation            |
| `Ctrl+Arrow`   | Any window | Move floating window        |
| `Esc`          | Any panel  | Back/close                  |
| `Enter`        | Result     | Accept & paste              |
