# Go Learn

An interactive Go learning tracker powered by Claude Code. Features an MCP server that logs your Q&A sessions and a live dashboard to review your progress.

## Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI

## Quick Start

### 1. Clone and build

```bash
git clone https://github.com/bis-code/go-learn.git
cd go-learn
go build -o bin/go-learn-server ./cmd/server
```

### 2. Configure Claude Code

The project includes a `.mcp.json` that registers the MCP server. Update the `command` path to match your local setup:

```json
{
  "mcpServers": {
    "go-learn": {
      "command": "/absolute/path/to/go-learn/bin/go-learn-server",
      "args": []
    }
  }
}
```

### 3. Start learning

Open Claude Code in the project directory:

```bash
cd go-learn
claude
```

The MCP server starts automatically. Ask Go questions and they'll be logged to the dashboard.

### 4. Open the dashboard

The dashboard runs at **http://127.0.0.1:19281** when the MCP server is active.

Features:
- Topic sidebar with progress tracking
- Q&A cards with paired questions and answers
- Interactive visualizations for concurrency concepts
- Reference links to official Go docs, roadmap.sh, and more
- Full-text search across all your notes (Cmd+K)

## Exercises

Work through the exercises in order. Each builds on previous concepts:

```bash
go run ./exercises/01-error-handling    # Sentinel errors, custom types, wrapping
go run ./exercises/02-generics          # Type params, constraints, ~tilde
go run ./exercises/03-goroutines        # Goroutines, WaitGroup, Mutex
go run ./exercises/04-sync-primitives   # RWMutex, Once, atomic, sync.Map, Pool
```

Each exercise file has TODOs to implement. Uncomment the test calls in `main()` as you complete each section.

## Project Structure

```
go-learn/
├── cmd/server/          # MCP server + dashboard entrypoint
├── internal/
│   ├── curriculum/      # Topic definitions (phases + topics)
│   ├── dashboard/       # Web dashboard (embedded static files)
│   ├── db/              # SQLite store for Q&A and progress
│   └── mcp/             # MCP tool handlers
├── exercises/           # Hands-on Go exercises
├── data/learn.sqlite    # Your learning data (auto-created)
└── .claude/rules/       # Claude Code rules for tutor behavior
```

## How It Works

1. **Ask questions** — Claude acts as a Go tutor, answering with idiomatic examples
2. **Auto-logging** — Questions and answers are automatically saved via MCP tools
3. **Dashboard** — Review your Q&A history, grouped by topic
4. **Exercises** — Practice each concept with guided coding exercises
5. **Visualizations** — Step-through animations for concurrency concepts

## Curriculum

36 topics across 4 phases:

- **Phase 1: Go Fundamentals** — Error handling, generics, goroutines, channels, sync, context, testing
- **Phase 2: Design Patterns & SOLID** — SOLID principles, GoF patterns adapted for Go
- **Phase 3: Networked Go** — HTTP, gRPC, databases, WebSockets
- **Phase 4: Production Go** — Profiling, rate limiting, circuit breakers, observability
