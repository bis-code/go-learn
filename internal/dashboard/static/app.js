// Configure marked with highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

const state = {
  phases: [],
  activeTopic: null,
  searchTimeout: null,
};

// Reference links per topic (keyed by topic name)
const topicReferences = {
  // Phase 1: Go Fundamentals
  'Error Handling Deep Dive': [
    { title: 'roadmap.sh — Error Handling', url: 'https://roadmap.sh/golang/go-advanced/error-handling' },
    { title: 'Go Blog — Error handling and Go', url: 'https://go.dev/blog/error-handling-and-go' },
    { title: 'Go Blog — Errors are values', url: 'https://go.dev/blog/errors-are-values' },
  ],
  'Generics': [
    { title: 'roadmap.sh — Generics', url: 'https://roadmap.sh/golang/go-advanced/generics' },
    { title: 'Go Blog — An Introduction To Generics', url: 'https://go.dev/blog/intro-generics' },
  ],
  'Goroutines & Channels': [
    { title: 'roadmap.sh — Goroutines', url: 'https://roadmap.sh/golang/go-advanced/goroutines' },
    { title: 'roadmap.sh — Channels', url: 'https://roadmap.sh/golang/go-advanced/channels' },
    { title: 'Go by Example — Goroutines', url: 'https://gobyexample.com/goroutines' },
  ],
  'Sync Primitives': [
    { title: 'roadmap.sh — Mutex', url: 'https://roadmap.sh/golang/go-advanced/mutex' },
    { title: 'Go pkg — sync', url: 'https://pkg.go.dev/sync' },
  ],
  'Context Package': [
    { title: 'roadmap.sh — Context', url: 'https://roadmap.sh/golang/go-advanced/context' },
    { title: 'Go Blog — Contexts and structs', url: 'https://go.dev/blog/context-and-structs' },
  ],
  'Concurrency Patterns': [
    { title: 'roadmap.sh — Goroutines', url: 'https://roadmap.sh/golang/go-advanced/goroutines' },
    { title: 'Go Blog — Pipelines and cancellation', url: 'https://go.dev/blog/pipelines' },
    { title: 'Go pkg — errgroup', url: 'https://pkg.go.dev/golang.org/x/sync/errgroup' },
  ],
  'Standard Library Deep Dive': [
    { title: 'Go pkg — slog', url: 'https://pkg.go.dev/log/slog' },
    { title: 'Go Blog — Structured Logging with slog', url: 'https://go.dev/blog/slog' },
    { title: 'Go pkg — embed', url: 'https://pkg.go.dev/embed' },
  ],
  'Testing Mastery': [
    { title: 'roadmap.sh — Testing', url: 'https://roadmap.sh/golang/go-advanced/testing' },
    { title: 'Go Blog — Using Subtests and Sub-benchmarks', url: 'https://go.dev/blog/subtests' },
    { title: 'Go Blog — Fuzzing is Beta Ready', url: 'https://go.dev/blog/fuzz-beta' },
  ],
  'Phase 1 Project': [
    { title: 'roadmap.sh — Go Roadmap', url: 'https://roadmap.sh/golang' },
  ],

  // Phase 2: Design Patterns & SOLID
  'Single Responsibility Principle': [
    { title: 'Go Blog — Package names', url: 'https://go.dev/blog/package-names' },
    { title: 'Dave Cheney — SOLID Go Design', url: 'https://dave.cheney.net/2016/08/20/solid-go-design' },
  ],
  'Open/Closed Principle': [
    { title: 'Dave Cheney — SOLID Go Design', url: 'https://dave.cheney.net/2016/08/20/solid-go-design' },
  ],
  'Liskov Substitution Principle': [
    { title: 'Dave Cheney — SOLID Go Design', url: 'https://dave.cheney.net/2016/08/20/solid-go-design' },
    { title: 'Effective Go — Interfaces', url: 'https://go.dev/doc/effective_go#interfaces' },
  ],
  'Interface Segregation Principle': [
    { title: 'Dave Cheney — SOLID Go Design', url: 'https://dave.cheney.net/2016/08/20/solid-go-design' },
    { title: 'Go Wiki — CodeReviewComments', url: 'https://go.dev/wiki/CodeReviewComments#interfaces' },
  ],
  'Dependency Inversion Principle': [
    { title: 'Dave Cheney — SOLID Go Design', url: 'https://dave.cheney.net/2016/08/20/solid-go-design' },
  ],
  'Functional Options Pattern': [
    { title: 'Dave Cheney — Functional options', url: 'https://dave.cheney.net/2014/10/17/functional-options-for-friendly-apis' },
    { title: 'Go by Example — Struct Embedding', url: 'https://gobyexample.com/struct-embedding' },
  ],
  'Strategy Pattern': [
    { title: 'Effective Go — Interfaces', url: 'https://go.dev/doc/effective_go#interfaces' },
    { title: 'Game Programming Patterns — Strategy', url: 'https://gameprogrammingpatterns.com/type-object.html' },
  ],
  'Factory & Builder Patterns': [
    { title: 'Effective Go — Constructors', url: 'https://go.dev/doc/effective_go#composite_literals' },
  ],
  'Decorator & Middleware': [
    { title: 'Go by Example — HTTP Middleware', url: 'https://gobyexample.com/http-middleware' },
    { title: 'Go Wiki — HTTP Handler Middleware', url: 'https://go.dev/wiki/LearnServerProgramming' },
  ],
  'Observer Pattern': [
    { title: 'Game Programming Patterns — Observer', url: 'https://gameprogrammingpatterns.com/observer.html' },
  ],
  'Repository Pattern': [
    { title: 'Go Wiki — SQLInterface', url: 'https://go.dev/wiki/SQLInterface' },
  ],
  'Dependency Injection': [
    { title: 'Go Blog — Wire', url: 'https://go.dev/blog/wire' },
    { title: 'Dave Cheney — SOLID Go Design', url: 'https://dave.cheney.net/2016/08/20/solid-go-design' },
  ],
  'Phase 2 Project': [
    { title: 'Game Programming Patterns', url: 'https://gameprogrammingpatterns.com/contents.html' },
  ],

  // Phase 3: Networked Go
  'net/http From Scratch': [
    { title: 'roadmap.sh — Building APIs', url: 'https://roadmap.sh/golang/go-api' },
    { title: 'Go pkg — net/http', url: 'https://pkg.go.dev/net/http' },
  ],
  'Routing with Chi': [
    { title: 'go-chi/chi — GitHub', url: 'https://github.com/go-chi/chi' },
    { title: 'Go pkg — chi', url: 'https://pkg.go.dev/github.com/go-chi/chi/v5' },
  ],
  'REST API Design': [
    { title: 'roadmap.sh — REST API Design', url: 'https://roadmap.sh/golang/go-api/rest' },
    { title: 'Go Blog — JSON and Go', url: 'https://go.dev/blog/json' },
  ],
  'gRPC & Protobuf': [
    { title: 'roadmap.sh — gRPC', url: 'https://roadmap.sh/golang/go-api/grpc' },
    { title: 'grpc.io — Go Quick Start', url: 'https://grpc.io/docs/languages/go/quickstart/' },
  ],
  'Database with pgx/sqlx': [
    { title: 'roadmap.sh — ORMs', url: 'https://roadmap.sh/golang/go-api/orms' },
    { title: 'Go pkg — pgx', url: 'https://pkg.go.dev/github.com/jackc/pgx/v5' },
    { title: 'Go pkg — sqlx', url: 'https://pkg.go.dev/github.com/jmoiron/sqlx' },
  ],
  'WebSockets': [
    { title: 'Go pkg — nhooyr/websocket', url: 'https://pkg.go.dev/nhooyr.io/websocket' },
    { title: 'Go by Example — WebSockets', url: 'https://gobyexample.com/websockets' },
  ],
  'Phase 3 Project': [
    { title: 'roadmap.sh — Go API', url: 'https://roadmap.sh/golang/go-api' },
  ],

  // Phase 4: Production Go
  'Profiling & Benchmarking': [
    { title: 'Go Blog — Profiling Go Programs', url: 'https://go.dev/blog/pprof' },
    { title: 'Go pkg — runtime/pprof', url: 'https://pkg.go.dev/runtime/pprof' },
  ],
  'Rate Limiting': [
    { title: 'Go by Example — Rate Limiting', url: 'https://gobyexample.com/rate-limiting' },
    { title: 'Go pkg — x/time/rate', url: 'https://pkg.go.dev/golang.org/x/time/rate' },
  ],
  'Circuit Breakers': [
    { title: 'Go pkg — gobreaker', url: 'https://pkg.go.dev/github.com/sony/gobreaker' },
  ],
  'Caching Patterns': [
    { title: 'Go pkg — groupcache', url: 'https://pkg.go.dev/github.com/golang/groupcache' },
    { title: 'Go Blog — GC Guide', url: 'https://go.dev/doc/gc-guide' },
  ],
  'OpenTelemetry': [
    { title: 'OpenTelemetry Go — Getting Started', url: 'https://opentelemetry.io/docs/languages/go/getting-started/' },
    { title: 'Go pkg — otel', url: 'https://pkg.go.dev/go.opentelemetry.io/otel' },
  ],
  'Graceful Shutdown': [
    { title: 'Go pkg — os/signal', url: 'https://pkg.go.dev/os/signal' },
    { title: 'Go by Example — Signals', url: 'https://gobyexample.com/signals' },
  ],
  'Phase 4 Project': [
    { title: 'roadmap.sh — Go Roadmap', url: 'https://roadmap.sh/golang' },
  ],
};

// --- API ---
async function api(path) {
  const res = await fetch(path);
  return res.json();
}

// --- Rendering ---
function renderSidebar(phases) {
  const tree = document.getElementById('phase-tree');
  tree.innerHTML = phases.map(({ phase, topics }) => `
    <div class="phase-group">
      <div class="phase-header" onclick="togglePhase(this)">
        <span class="chevron">&#9660;</span>
        ${phase.name}
        <span style="margin-left:auto;font-size:10px;color:var(--text-muted)">
          ${topics.filter(t => t.status === 'done').length}/${topics.length}
        </span>
      </div>
      <div class="phase-topics">
        ${topics.map(t => `
          <div class="topic-item ${state.activeTopic === t.id ? 'active' : ''}"
               onclick="selectTopic(${t.id})"
               data-topic-id="${t.id}">
            <span class="status-dot ${t.status}"></span>
            <span>${t.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderProgress(stats) {
  const pct = stats.totalTopics > 0
    ? Math.round((stats.doneTopics / stats.totalTopics) * 100)
    : 0;

  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent =
    `${stats.doneTopics}/${stats.totalTopics} topics (${pct}%)`;

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.doneTopics}</div>
      <div class="stat-label">Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.inProgressTopics}</div>
      <div class="stat-label">In Progress</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalQuestions}</div>
      <div class="stat-label">Questions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalAnswers}</div>
      <div class="stat-label">Answers</div>
    </div>
  `;
}

function renderTopicView(data) {
  const { topic, entries } = data;

  document.getElementById('welcome').classList.add('hidden');
  document.getElementById('topic-view').classList.remove('hidden');

  document.getElementById('topic-name').textContent = topic.name;
  document.getElementById('topic-status').textContent = topic.status.replace('_', ' ');
  document.getElementById('topic-status').className = `badge ${topic.status}`;
  document.getElementById('topic-description').textContent = topic.description;

  // Render reference links
  const refsContainer = document.getElementById('topic-references');
  const refs = topicReferences[topic.name];
  if (refs && refs.length > 0) {
    refsContainer.innerHTML = `
      <div class="topic-refs">
        ${refs.map(r => `<a href="${r.url}" target="_blank" class="ref-link">${r.title}</a>`).join('')}
      </div>`;
    refsContainer.classList.remove('hidden');
  } else {
    refsContainer.innerHTML = '';
    refsContainer.classList.add('hidden');
  }

  const list = document.getElementById('entries-list');
  const empty = document.getElementById('empty-state');

  if (!entries || entries.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  // Group entries into Q&A cards by questionId
  const questionMap = new Map();
  const groups = [];

  entries.forEach(e => {
    if (e.kind === 'question') {
      const group = { question: e, answers: [] };
      questionMap.set(e.id, group);
      groups.push(group);
    } else if (e.questionId && questionMap.has(e.questionId)) {
      questionMap.get(e.questionId).answers.push(e);
    } else {
      groups.push({ standalone: e });
    }
  });

  list.innerHTML = groups.map(g => {
    if (g.standalone) {
      const e = g.standalone;
      return `
        <div class="entry-card">
          <div class="entry-header">
            <span class="entry-kind ${e.kind}">${e.kind}</span>
            <span>${formatTime(e.createdAt)}</span>
          </div>
          <div class="entry-body">${marked.parse(e.content)}</div>
        </div>`;
    }

    const q = g.question;
    let html = `<div class="qa-card">`;
    html += `
      <div class="qa-question">
        <div class="entry-header">
          <span class="entry-kind question">question</span>
          <span>${formatTime(q.createdAt)}</span>
        </div>
        <div class="entry-body">${marked.parse(q.content)}</div>
      </div>`;

    g.answers.forEach(a => {
      html += `
        <div class="qa-answer">
          <div class="entry-header">
            <span class="entry-kind ${a.kind}">${a.kind}</span>
            <span>${formatTime(a.createdAt)}</span>
          </div>
          <div class="entry-body">${marked.parse(a.content)}</div>
        </div>`;
    });

    html += `</div>`;
    return html;
  }).join('');
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// --- Actions ---
function togglePhase(el) {
  el.classList.toggle('collapsed');
  el.nextElementSibling.classList.toggle('collapsed');
}

async function selectTopic(id) {
  state.activeTopic = id;

  document.querySelectorAll('.topic-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.topicId) === id);
  });

  const data = await api(`/api/topics/${id}`);
  renderTopicView(data);
}

// --- Search ---
function openSearch() {
  const modal = document.getElementById('search-modal');
  modal.classList.remove('hidden');
  document.getElementById('search-input').value = '';
  document.getElementById('search-input').focus();
  document.getElementById('search-results').innerHTML = '';
}

function closeSearch() {
  document.getElementById('search-modal').classList.add('hidden');
}

async function doSearch(query) {
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }

  const results = await api(`/api/search?q=${encodeURIComponent(query)}`);

  if (!results || results.length === 0) {
    document.getElementById('search-results').innerHTML =
      '<div class="search-no-results">No results found</div>';
    return;
  }

  document.getElementById('search-results').innerHTML = results.map(r => `
    <div class="search-result-item" onclick="closeSearch(); selectTopic(${r.entry.topicId})">
      <div class="search-result-meta">
        <span class="entry-kind ${r.entry.kind}">${r.entry.kind}</span>
        <span>${r.phaseName} &rarr; ${r.topicName}</span>
      </div>
      <div class="search-result-content">${truncate(r.entry.content, 150)}</div>
    </div>
  `).join('');
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.substring(0, max) + '...';
}

// --- Keyboard ---
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') {
    closeSearch();
  }
});

document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(state.searchTimeout);
  state.searchTimeout = setTimeout(() => doSearch(e.target.value), 200);
});

document.querySelector('.modal-backdrop')?.addEventListener('click', closeSearch);

// --- SSE ---
function connectSSE() {
  const evtSource = new EventSource('/api/events');

  evtSource.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'update') {
      await refresh();
    }
  };

  evtSource.onerror = () => {
    evtSource.close();
    setTimeout(connectSSE, 3000);
  };
}

async function refresh() {
  const [phases, stats] = await Promise.all([
    api('/api/phases'),
    api('/api/progress'),
  ]);

  state.phases = phases;
  renderSidebar(phases);
  renderProgress(stats);

  if (state.activeTopic) {
    const data = await api(`/api/topics/${state.activeTopic}`);
    renderTopicView(data);
  }
}

// --- Init ---
(async () => {
  await refresh();
  connectSSE();
})();
