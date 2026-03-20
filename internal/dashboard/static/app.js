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
  activeTab: 'qa',
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
  state.activeTab = 'qa';

  document.querySelectorAll('.topic-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.topicId) === id);
  });

  const data = await api(`/api/topics/${id}`);
  renderTopicView(data);
  switchTab('qa');
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

// --- Tabs ---
function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const btnTab = btn.getAttribute('onclick').includes("'qa'") ? 'qa' : 'visualize';
    btn.classList.toggle('active', btnTab === tab);
  });
  document.getElementById('qa-panel').classList.toggle('hidden', tab !== 'qa');
  document.getElementById('viz-panel').classList.toggle('hidden', tab !== 'visualize');

  if (tab === 'visualize') {
    renderVizSelector();
  }
}

// --- Visualizations ---
const vizState = { currentViz: 0, currentStep: 0 };

function goroutine(label, cls, content) {
  return `<div class="viz-goroutine">
    <div class="viz-goroutine-box ${cls}">${content || label}</div>
    <div class="viz-goroutine-label">${label}</div>
  </div>`;
}

function channel(label, cls, content) {
  return `<div class="viz-channel">
    <div class="viz-channel-pipe ${cls}">${content || ''}</div>
    <div class="viz-channel-label">${label}</div>
  </div>`;
}

function arrow(active) {
  return `<span class="viz-arrow ${active ? 'active' : ''}">&rarr;</span>`;
}

function bufferSlots(slots) {
  return `<div class="viz-buffer-slots">${slots.map(s =>
    `<div class="viz-slot ${s ? 'filled' : 'empty'}">${s || ''}</div>`
  ).join('')}</div>`;
}

const topicVisualizations = {
  'Goroutines & Channels': [
    {
      title: 'Unbuffered Channel',
      steps: [
        {
          canvas: () => goroutine('main', 'g-main', 'main()') + arrow(false) +
            channel('ch', 'ch-empty', 'empty') + arrow(false) + goroutine('goroutine', 'g-sender', 'go func()'),
          desc: 'Channel created with <code>ch := make(chan string)</code>. Both sides exist but nothing has happened yet.'
        },
        {
          canvas: () => goroutine('main', 'g-main', 'main()') + arrow(false) +
            channel('ch', 'ch-empty', 'empty') + arrow(true) +
            goroutine('goroutine', 'g-blocked', 'ch &lt;- "hi"<br><small>BLOCKED</small>'),
          desc: 'Goroutine tries to send <code>"hi"</code> into the channel. But no one is receiving yet, so it <strong>blocks</strong>. The goroutine is paused.'
        },
        {
          canvas: () => goroutine('main', 'g-receiver', '&lt;-ch<br><small>READY</small>') + arrow(true) +
            channel('ch', 'ch-has-data', '<span class="viz-data">"hi"</span>') + arrow(true) +
            goroutine('goroutine', 'g-sender', 'ch &lt;- "hi"'),
          desc: 'Main calls <code>&lt;-ch</code> (receive). Now both sides are ready — the data transfers through the channel. This is the <strong>handshake</strong>.'
        },
        {
          canvas: () => goroutine('main', 'g-main', 'msg = "hi"') + arrow(false) +
            channel('ch', 'ch-empty', 'empty') + arrow(false) +
            goroutine('goroutine', 'viz-done', 'done'),
          desc: 'Transfer complete. Main has <code>"hi"</code>, goroutine continues (or exits). Channel is empty again. <strong>Key insight:</strong> unbuffered channels synchronize — both sides must be ready.'
        },
      ]
    },
    {
      title: 'Buffered Channel',
      steps: [
        {
          canvas: () => goroutine('sender', 'g-sender', 'go func()') + arrow(false) +
            `<div class="viz-channel"><div class="viz-channel-pipe ch-empty">${bufferSlots([null, null, null])}</div><div class="viz-channel-label">ch (cap: 3)</div></div>` +
            arrow(false) + goroutine('receiver', 'g-receiver', 'main()'),
          desc: 'Buffered channel created with <code>ch := make(chan int, 3)</code>. It can hold up to 3 values without a receiver being ready.'
        },
        {
          canvas: () => goroutine('sender', 'g-sender', 'ch &lt;- 1<br>ch &lt;- 2') + arrow(true) +
            `<div class="viz-channel"><div class="viz-channel-pipe ch-has-data">${bufferSlots([1, 2, null])}</div><div class="viz-channel-label">ch (2/3)</div></div>` +
            arrow(false) + goroutine('receiver', 'g-receiver', 'waiting...'),
          desc: 'Sender sends 1 and 2. They go into the buffer. <strong>Sender does NOT block</strong> because there is room in the buffer. No receiver needed yet.'
        },
        {
          canvas: () => goroutine('sender', 'g-sender', 'ch &lt;- 3') + arrow(true) +
            `<div class="viz-channel"><div class="viz-channel-pipe ch-full">${bufferSlots([1, 2, 3])}</div><div class="viz-channel-label">ch (3/3) FULL</div></div>` +
            arrow(false) + goroutine('receiver', 'g-receiver', 'waiting...'),
          desc: 'Sender sends 3. Buffer is now <strong>full</strong>. The next send will block until someone receives.'
        },
        {
          canvas: () => goroutine('sender', 'g-blocked', 'ch &lt;- 4<br><small>BLOCKED</small>') + arrow(false) +
            `<div class="viz-channel"><div class="viz-channel-pipe ch-full">${bufferSlots([1, 2, 3])}</div><div class="viz-channel-label">ch (3/3) FULL</div></div>` +
            arrow(false) + goroutine('receiver', 'g-receiver', 'waiting...'),
          desc: 'Sender tries to send 4 but buffer is full — <strong>sender blocks</strong>. Same as unbuffered at this point.'
        },
        {
          canvas: () => goroutine('sender', 'g-sender', 'ch &lt;- 4') + arrow(true) +
            `<div class="viz-channel"><div class="viz-channel-pipe ch-has-data">${bufferSlots([2, 3, 4])}</div><div class="viz-channel-label">ch (3/3)</div></div>` +
            arrow(true) + goroutine('receiver', 'g-main', 'v := &lt;-ch<br>v = 1'),
          desc: 'Receiver reads 1 from the buffer, making room. Sender\'s 4 goes in. Buffer stays full but data is flowing. <strong>Key insight:</strong> buffered channels decouple send/receive timing.'
        },
      ]
    },
    {
      title: 'Channel Direction',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:20px;align-items:center;width:100%">
            <div style="display:flex;align-items:center;gap:12px">
              ${goroutine('', 'g-main', 'func(ch chan string)')}
              <span style="color:var(--text-muted);font-size:13px">bidirectional — can send and receive</span>
            </div></div>`,
          desc: '<code>chan string</code> — the default. Function can both send to and receive from this channel.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:20px;align-items:center;width:100%">
            <div style="display:flex;align-items:center;gap:12px">
              ${goroutine('', 'g-sender', 'func(ch chan&lt;- string)')}
              <span style="color:var(--text-muted);font-size:13px">send-only — can only send, not receive</span>
            </div></div>`,
          desc: '<code>chan&lt;- string</code> — send-only. The function can put data in but not take it out. Arrow points INTO chan.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:20px;align-items:center;width:100%">
            <div style="display:flex;align-items:center;gap:12px">
              ${goroutine('', 'g-receiver', 'func(ch &lt;-chan string)')}
              <span style="color:var(--text-muted);font-size:13px">receive-only — can only receive, not send</span>
            </div></div>`,
          desc: '<code>&lt;-chan string</code> — receive-only. The function can take data out but not put it in. Arrow points OUT of chan. This prevents bugs by restricting what each side can do.'
        },
      ]
    },
    {
      title: 'Select Statement',
      steps: [
        {
          canvas: () => `<div class="viz-select-container">
            <div class="viz-select-case waiting">case msg := &lt;-ch1:  &nbsp; // waiting...</div>
            <div class="viz-select-case waiting">case msg := &lt;-ch2:  &nbsp; // waiting...</div>
            <div class="viz-select-case waiting">case msg := &lt;-ch3:  &nbsp; // waiting...</div>
            <div class="viz-select-case waiting">default:  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; // fallback</div>
          </div>`,
          desc: '<code>select</code> waits on multiple channels at once. It blocks until one of them is ready. Like a switch statement for channels.'
        },
        {
          canvas: () => `<div class="viz-select-container">
            <div class="viz-select-case waiting">case msg := &lt;-ch1:  &nbsp; // waiting...</div>
            <div class="viz-select-case selected">case msg := &lt;-ch2:  &nbsp; // DATA READY!</div>
            <div class="viz-select-case waiting">case msg := &lt;-ch3:  &nbsp; // waiting...</div>
            <div class="viz-select-case waiting">default:  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; // skipped</div>
          </div>`,
          desc: 'Data arrives on <code>ch2</code>! Select picks this case and runs its code. The other cases are skipped. If multiple are ready, Go picks one <strong>randomly</strong>.'
        },
        {
          canvas: () => `<div class="viz-select-container">
            <div class="viz-select-case waiting">case msg := &lt;-ch1:  &nbsp; // no data</div>
            <div class="viz-select-case waiting">case msg := &lt;-ch2:  &nbsp; // no data</div>
            <div class="viz-select-case waiting">case msg := &lt;-ch3:  &nbsp; // no data</div>
            <div class="viz-select-case selected">default:  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; // RUNS!</div>
          </div>`,
          desc: 'If NO channel is ready and there is a <code>default</code> case, it runs immediately — no blocking. Without default, select blocks until one channel is ready.'
        },
        {
          canvas: () => `<div class="viz-select-container">
            <div class="viz-select-case selected">case &lt;-time.After(5s): // TIMEOUT!</div>
            <div class="viz-select-case waiting">case msg := &lt;-ch:  &nbsp;&nbsp; // still waiting</div>
          </div>`,
          desc: 'Common pattern: use <code>time.After</code> as a timeout. If ch doesn\'t deliver within 5 seconds, the timeout case fires. Prevents waiting forever.'
        },
      ]
    },
    {
      title: 'Range + Close',
      steps: [
        {
          canvas: () => goroutine('sender', 'g-sender', 'ch &lt;- 1<br>ch &lt;- 2<br>ch &lt;- 3') + arrow(true) +
            channel('ch', 'ch-has-data', '<span class="viz-data">1, 2, 3</span>') + arrow(true) +
            goroutine('receiver', 'g-receiver', 'for v := range ch'),
          desc: 'Sender puts values into channel. Receiver uses <code>for v := range ch</code> to read values one by one as they arrive. The loop keeps going.'
        },
        {
          canvas: () => goroutine('sender', 'g-sender', 'close(ch)') + arrow(false) +
            channel('ch', 'ch-closed', 'CLOSED') + arrow(true) +
            goroutine('receiver', 'g-receiver', 'for v := range ch<br><small>draining...</small>'),
          desc: 'Sender calls <code>close(ch)</code> — signals "no more data." Receiver\'s range loop reads remaining values then exits automatically.'
        },
        {
          canvas: () => goroutine('sender', 'viz-done', 'done') + arrow(false) +
            channel('ch', 'ch-closed', 'CLOSED') + arrow(false) +
            goroutine('receiver', 'g-main', 'loop exited'),
          desc: 'Range loop exits cleanly. <strong>Key rules:</strong> only the sender closes. Never close a channel twice (panic). Receivers detect close via <code>v, ok := &lt;-ch</code> where ok is false.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:8px;align-items:center">
            <code style="font-size:13px;color:var(--text)">v, ok := &lt;-ch</code>
            <div style="display:flex;gap:24px;margin-top:8px">
              <div style="text-align:center"><span class="viz-data">42</span><br><small style="color:var(--green)">ok = true</small></div>
              <div style="text-align:center"><span style="color:var(--text-muted)">0</span><br><small style="color:var(--red)">ok = false (closed)</small></div>
            </div>
          </div>`,
          desc: 'You can also check manually: <code>v, ok := &lt;-ch</code>. If ok is true, v has data. If ok is false, channel is closed and v is the zero value.'
        },
      ]
    },
    {
      title: 'Pipeline Pattern',
      steps: [
        {
          canvas: () => goroutine('generate', 'g-sender', 'gen()') + arrow(false) +
            channel('', 'ch-empty', 'ch1') + arrow(false) +
            goroutine('transform', 'g-main', 'square()') + arrow(false) +
            channel('', 'ch-empty', 'ch2') + arrow(false) +
            goroutine('consume', 'g-receiver', 'print()'),
          desc: 'Pipeline: chain of stages connected by channels. Each stage is a goroutine that receives from one channel and sends to the next.'
        },
        {
          canvas: () => goroutine('generate', 'g-sender', '1, 2, 3, 4') + arrow(true) +
            channel('', 'ch-has-data', '<span class="viz-data">1</span>') + arrow(false) +
            goroutine('transform', 'g-main', 'square()') + arrow(false) +
            channel('', 'ch-empty', 'ch2') + arrow(false) +
            goroutine('consume', 'g-receiver', 'waiting'),
          desc: 'Generator produces values (1, 2, 3, 4) and sends them one at a time into ch1.'
        },
        {
          canvas: () => goroutine('generate', 'g-sender', '2, 3, 4') + arrow(true) +
            channel('', 'ch-has-data', '<span class="viz-data">2</span>') + arrow(true) +
            goroutine('transform', 'g-main', '1 &rarr; 1') + arrow(true) +
            channel('', 'ch-has-data', '<span class="viz-data">1</span>') + arrow(false) +
            goroutine('consume', 'g-receiver', 'waiting'),
          desc: 'Transform reads 1 from ch1, squares it (1&rarr;1), sends result to ch2. All stages run <strong>concurrently</strong>.'
        },
        {
          canvas: () => goroutine('generate', 'g-sender', '3, 4') + arrow(true) +
            channel('', 'ch-has-data', '<span class="viz-data">3</span>') + arrow(true) +
            goroutine('transform', 'g-main', '2 &rarr; 4') + arrow(true) +
            channel('', 'ch-has-data', '<span class="viz-data">4</span>') + arrow(true) +
            goroutine('consume', 'g-receiver', 'print(1)'),
          desc: 'Data flows through all stages simultaneously. Consumer prints 1 while transform processes 2 and generator produces 3. All three goroutines work in parallel.'
        },
        {
          canvas: () => goroutine('generate', 'viz-done', 'close(ch1)') + arrow(false) +
            channel('', 'ch-closed', 'closed') + arrow(false) +
            goroutine('transform', 'viz-done', 'close(ch2)') + arrow(false) +
            channel('', 'ch-closed', 'closed') + arrow(false) +
            goroutine('consume', 'g-receiver', '1, 4, 9, 16'),
          desc: 'Generator finishes and closes ch1. Transform drains ch1, closes ch2. Consumer gets all results: 1, 4, 9, 16. <strong>Closure cascades</strong> through the pipeline.'
        },
      ]
    },
  ],
};

function renderVizSelector() {
  const topicName = document.getElementById('topic-name').textContent;
  const vizList = topicVisualizations[topicName];
  const selector = document.getElementById('viz-selector');
  const stage = document.getElementById('viz-stage');
  const noContent = document.getElementById('viz-no-content');

  if (!vizList || vizList.length === 0) {
    selector.innerHTML = '';
    stage.classList.add('hidden');
    noContent.classList.remove('hidden');
    return;
  }

  noContent.classList.add('hidden');
  stage.classList.remove('hidden');

  selector.innerHTML = vizList.map((v, i) =>
    `<button class="viz-select-btn ${i === vizState.currentViz ? 'active' : ''}" onclick="selectViz(${i})">${v.title}</button>`
  ).join('');

  renderVizStep();
}

function selectViz(index) {
  vizState.currentViz = index;
  vizState.currentStep = 0;
  document.querySelectorAll('.viz-select-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
  renderVizStep();
}

function renderVizStep() {
  const topicName = document.getElementById('topic-name').textContent;
  const vizList = topicVisualizations[topicName];
  if (!vizList) return;

  const viz = vizList[vizState.currentViz];
  if (!viz) return;

  const step = viz.steps[vizState.currentStep];

  document.getElementById('viz-canvas').innerHTML = step.canvas();
  document.getElementById('viz-description').innerHTML = step.desc;
  document.getElementById('viz-step-label').textContent = `Step ${vizState.currentStep + 1} / ${viz.steps.length}`;
  document.getElementById('viz-prev').disabled = vizState.currentStep === 0;
  document.getElementById('viz-next').disabled = vizState.currentStep === viz.steps.length - 1;
}

function vizPrev() {
  if (vizState.currentStep > 0) {
    vizState.currentStep--;
    renderVizStep();
  }
}

function vizNext() {
  const topicName = document.getElementById('topic-name').textContent;
  const viz = topicVisualizations[topicName]?.[vizState.currentViz];
  if (viz && vizState.currentStep < viz.steps.length - 1) {
    vizState.currentStep++;
    renderVizStep();
  }
}

// --- Init ---
(async () => {
  await refresh();
  connectSSE();
})();
