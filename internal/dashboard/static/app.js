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
  'Sync Primitives': [
    {
      title: 'Mutex vs RWMutex',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:24px;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--accent)">sync.Mutex — one at a time</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:8px">
              ${goroutine('G1', 'g-main', 'Lock() ✅')}
              ${goroutine('G2', 'g-blocked', 'Lock() ⏳')}
              ${goroutine('G3', 'g-blocked', 'Lock() ⏳')}
              ${goroutine('G4', 'g-blocked', 'Lock() ⏳')}
            </div></div>`,
          desc: '<code>sync.Mutex</code> — only <strong>one</strong> goroutine can hold the lock. Everyone else waits, whether they want to read or write.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:24px;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--green)">sync.RWMutex — readers share</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:8px">
              ${goroutine('R1', 'g-receiver', 'RLock() ✅')}
              ${goroutine('R2', 'g-receiver', 'RLock() ✅')}
              ${goroutine('R3', 'g-receiver', 'RLock() ✅')}
              ${goroutine('W1', 'g-blocked', 'Lock() ⏳')}
            </div></div>`,
          desc: '<code>sync.RWMutex</code> — multiple readers hold <code>RLock()</code> simultaneously. The writer waits until all readers finish. <strong>Use when reads >> writes.</strong>'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:24px;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--yellow)">RWMutex — writer's turn</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:8px">
              ${goroutine('R1', 'g-blocked', 'RLock() ⏳')}
              ${goroutine('R2', 'g-blocked', 'RLock() ⏳')}
              ${goroutine('R3', 'g-blocked', 'RLock() ⏳')}
              ${goroutine('W1', 'g-sender', 'Lock() ✅')}
            </div></div>`,
          desc: 'When a writer gets <code>Lock()</code>, <strong>all readers are blocked</strong>. The writer has exclusive access. Once it calls <code>Unlock()</code>, readers can enter again.'
        },
      ]
    },
    {
      title: 'sync.Once',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="display:flex;gap:8px">
              ${goroutine('G1', 'g-sender', 'GetConfig()')}
              ${goroutine('G2', 'g-sender', 'GetConfig()')}
              ${goroutine('G3', 'g-sender', 'GetConfig()')}
            </div>
            ${arrow(true)}
            <div class="viz-channel"><div class="viz-channel-pipe ch-empty">sync.Once</div><div class="viz-channel-label">not called yet</div></div>
          </div>`,
          desc: 'Three goroutines call <code>GetConfig()</code> at the same time. The config hasn\'t been loaded yet.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="display:flex;gap:8px">
              ${goroutine('G1', 'g-main', 'loading... ⚙️')}
              ${goroutine('G2', 'g-blocked', 'waiting ⏳')}
              ${goroutine('G3', 'g-blocked', 'waiting ⏳')}
            </div>
            ${arrow(true)}
            <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">sync.Once</div><div class="viz-channel-label">running func</div></div>
          </div>`,
          desc: '<code>once.Do(func)</code> — G1 wins the race and runs the load function. G2 and G3 <strong>block and wait</strong> — they don\'t skip, they don\'t run it again. They wait for G1 to finish.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="display:flex;gap:8px">
              ${goroutine('G1', 'g-receiver', 'config ✅')}
              ${goroutine('G2', 'g-receiver', 'config ✅')}
              ${goroutine('G3', 'g-receiver', 'config ✅')}
            </div>
            ${arrow(false)}
            <div class="viz-channel"><div class="viz-channel-pipe ch-full">sync.Once</div><div class="viz-channel-label">done — never runs again</div></div>
          </div>`,
          desc: 'Load complete. All three goroutines get the config. The function ran <strong>exactly once</strong>. Any future calls to <code>once.Do()</code> return immediately — the func is never called again.'
        },
      ]
    },
    {
      title: 'sync/atomic',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--red)">Without atomic — race condition</div>
            <div style="display:flex;gap:8px">
              ${goroutine('G1', 'g-sender', 'read: 5')}
              ${goroutine('G2', 'g-sender', 'read: 5')}
            </div>
            <div style="font-size:28px;font-weight:700;color:var(--text)">counter = 5</div>
            <div style="display:flex;gap:8px">
              ${goroutine('G1', 'g-blocked', 'write: 6')}
              ${goroutine('G2', 'g-blocked', 'write: 6')}
            </div>
            <div style="font-size:28px;font-weight:700;color:var(--red)">counter = 6 ❌ (should be 7)</div>
          </div>`,
          desc: 'Without atomics: both goroutines read 5, both write 6. One increment is <strong>lost</strong>. This is the classic race condition.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--green)">With atomic — safe</div>
            <div style="display:flex;gap:8px">
              ${goroutine('G1', 'g-main', 'AddInt64(&c, 1)')}
              ${goroutine('G2', 'g-blocked', 'waiting...')}
            </div>
            <div style="font-size:28px;font-weight:700;color:var(--text)">counter = 6</div>
            <div style="display:flex;gap:8px">
              ${goroutine('G1', 'viz-done', 'done')}
              ${goroutine('G2', 'g-main', 'AddInt64(&c, 1)')}
            </div>
            <div style="font-size:28px;font-weight:700;color:var(--green)">counter = 7 ✅</div>
          </div>`,
          desc: '<code>atomic.AddInt64</code> does read+increment+write as a <strong>single CPU instruction</strong>. No lock needed. Faster than mutex for simple counters.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--accent)">When to use what?</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:500px">
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center">
                <div style="font-weight:600;color:var(--green)">atomic</div>
                <div style="font-size:12px;color:var(--text-muted)">Simple counters, flags, single values</div>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center">
                <div style="font-weight:600;color:var(--accent)">Mutex</div>
                <div style="font-size:12px;color:var(--text-muted)">Multiple fields, maps, complex state</div>
              </div>
            </div>
          </div>`,
          desc: '<strong>Atomic</strong> for single values (counter++, flag toggle). <strong>Mutex</strong> when you need to protect multiple fields or complex data structures. Atomic is faster but limited.'
        },
      ]
    },
    {
      title: 'sync.Map',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--accent)">Regular map + Mutex</div>
            <div style="display:flex;gap:8px">
              ${goroutine('G1', 'g-main', 'mu.Lock()')}
              ${goroutine('G2', 'g-blocked', 'mu.Lock() ⏳')}
              ${goroutine('G3', 'g-blocked', 'mu.Lock() ⏳')}
            </div>
            <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center;width:200px">
              <div style="font-weight:600">map[K]V</div>
              <div style="font-size:12px;color:var(--text-muted)">type-safe, full control</div>
            </div>
          </div>`,
          desc: 'Regular approach: protect a normal <code>map</code> with a Mutex. Type-safe, simple. One goroutine at a time (or use RWMutex for concurrent reads).'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--green)">sync.Map — lock-free reads</div>
            <div style="display:flex;gap:8px">
              ${goroutine('G1', 'g-receiver', 'Load("a") ✅')}
              ${goroutine('G2', 'g-receiver', 'Load("b") ✅')}
              ${goroutine('G3', 'g-sender', 'Store("c") ✅')}
            </div>
            <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center;width:200px">
              <div style="font-weight:600">sync.Map</div>
              <div style="font-size:12px;color:var(--text-muted)">no explicit locking</div>
            </div>
          </div>`,
          desc: '<code>sync.Map</code> handles locking internally. No <code>Lock()</code>/<code>Unlock()</code> needed. Different goroutines accessing <strong>different keys</strong> rarely block each other.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--yellow)">Trade-offs</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:500px">
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px">
                <div style="font-weight:600;color:var(--green)">sync.Map ✅</div>
                <div style="font-size:12px;color:var(--text-muted)">• Read-heavy, stable keys<br>• Different goroutines → different keys<br>• No explicit locking</div>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px">
                <div style="font-weight:600;color:var(--red)">sync.Map ❌</div>
                <div style="font-size:12px;color:var(--text-muted)">• No type safety (any)<br>• No Len() method<br>• Slower for write-heavy</div>
              </div>
            </div>
          </div>`,
          desc: 'Default to <code>RWMutex + map</code>. Only use <code>sync.Map</code> when profiling shows you need it, or when goroutines mostly touch different keys.'
        },
      ]
    },
    {
      title: 'sync.Pool',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--red)">Without Pool — allocate every time</div>
            <div style="display:flex;gap:8px">
              ${goroutine('Req 1', 'g-sender', 'new(Buffer)')}
              ${goroutine('Req 2', 'g-sender', 'new(Buffer)')}
              ${goroutine('Req 3', 'g-sender', 'new(Buffer)')}
            </div>
            <div style="font-size:13px;color:var(--text-muted)">🗑️ → GC → 🗑️ → GC → 🗑️ → GC</div>
          </div>`,
          desc: 'Without a pool: every request allocates a new buffer. When done, the garbage collector has to clean it up. High allocation rate = GC pressure = latency spikes.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--green)">With Pool — reuse objects</div>
            <div style="display:flex;gap:8px">
              ${goroutine('Req 1', 'g-receiver', 'pool.Get()')}
              <span class="viz-arrow active">&larr;</span>
              <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">Pool: [buf, buf, buf]</div><div class="viz-channel-label">sync.Pool</div></div>
            </div>
          </div>`,
          desc: '<code>pool.Get()</code> returns a reused object if available. When done, <code>pool.Put(buf)</code> returns it for someone else to use. Less allocation, less GC.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="display:flex;gap:8px">
              ${goroutine('Req 1', 'g-sender', 'pool.Put(buf)')}
              <span class="viz-arrow active">&rarr;</span>
              <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">Pool: [buf]</div><div class="viz-channel-label">sync.Pool</div></div>
              <span class="viz-arrow active">&larr;</span>
              ${goroutine('Req 2', 'g-receiver', 'pool.Get()')}
            </div>
            <div style="font-size:13px;color:var(--text-muted)">Same buffer, zero allocation</div>
          </div>`,
          desc: 'Req 1 puts buffer back. Req 2 gets the same buffer. <strong>Zero allocation.</strong> The pool\'s <code>New</code> function only runs when the pool is empty. Note: GC can clear the pool at any time — don\'t rely on items persisting.'
        },
      ]
    },
  ],
  'Context Package': [
    {
      title: 'Context Tree',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">context.Background()</div><div class="viz-channel-label">root — never cancelled</div></div>
            <span class="viz-arrow active">&darr;</span>
            <div style="display:flex;gap:24px">
              <div class="viz-channel"><div class="viz-channel-pipe ch-empty">WithCancel</div><div class="viz-channel-label">manual cancel</div></div>
              <div class="viz-channel"><div class="viz-channel-pipe ch-empty">WithTimeout</div><div class="viz-channel-label">auto cancel</div></div>
              <div class="viz-channel"><div class="viz-channel-pipe ch-empty">WithValue</div><div class="viz-channel-label">carries data</div></div>
            </div>
          </div>`,
          desc: 'Every context starts from <code>context.Background()</code>. You derive child contexts with <code>WithCancel</code>, <code>WithTimeout</code>, or <code>WithValue</code>. <strong>Cancelling a parent cancels all children.</strong>'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">Background()</div><div class="viz-channel-label">root</div></div>
            <span class="viz-arrow active">&darr;</span>
            <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">WithTimeout(2s)</div><div class="viz-channel-label">HTTP handler</div></div>
            <span class="viz-arrow active">&darr;</span>
            <div style="display:flex;gap:24px">
              <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">WithValue(reqID)</div><div class="viz-channel-label">service layer</div></div>
              <div class="viz-channel"><div class="viz-channel-pipe ch-empty">WithCancel</div><div class="viz-channel-label">background job</div></div>
            </div>
          </div>`,
          desc: 'Real-world pattern: HTTP handler sets a timeout, adds request metadata via WithValue, then passes context down to service and repository layers. Each layer checks <code>ctx.Done()</code> before doing work.'
        },
      ]
    },
    {
      title: 'WithCancel',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="display:flex;gap:8px">
              ${goroutine('W1', 'g-sender', 'working...')}
              ${goroutine('W2', 'g-sender', 'working...')}
              ${goroutine('W3', 'g-sender', 'working...')}
            </div>
            <div class="viz-channel"><div class="viz-channel-pipe ch-empty">ctx.Done() — open</div><div class="viz-channel-label">not cancelled</div></div>
            ${goroutine('main', 'g-main', 'cancel() not called yet')}
          </div>`,
          desc: 'Three workers loop, checking <code>ctx.Done()</code> each iteration. The channel is open (not cancelled), so <code>select</code> skips it and workers continue.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="display:flex;gap:8px">
              ${goroutine('W1', 'g-blocked', 'ctx.Done()!')}
              ${goroutine('W2', 'g-blocked', 'ctx.Done()!')}
              ${goroutine('W3', 'g-blocked', 'ctx.Done()!')}
            </div>
            <div class="viz-channel"><div class="viz-channel-pipe ch-full">ctx.Done() — CLOSED</div><div class="viz-channel-label">cancelled!</div></div>
            ${goroutine('main', 'g-main', 'cancel() called')}
          </div>`,
          desc: 'Main calls <code>cancel()</code>. The Done channel <strong>closes</strong> — all workers receive on it simultaneously. They exit their loops.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="display:flex;gap:8px">
              ${goroutine('W1', 'viz-done', 'stopped')}
              ${goroutine('W2', 'viz-done', 'stopped')}
              ${goroutine('W3', 'viz-done', 'stopped')}
            </div>
            <div class="viz-channel"><div class="viz-channel-pipe ch-closed">ctx.Done() — CLOSED</div><div class="viz-channel-label">ctx.Err() = context.Canceled</div></div>
            ${goroutine('main', 'g-receiver', 'wg.Wait() done ✅')}
          </div>`,
          desc: 'All workers stopped cleanly. <code>ctx.Err()</code> returns <code>context.Canceled</code>. <strong>Key insight:</strong> closing a channel broadcasts to ALL receivers — that\'s how one cancel stops many goroutines.'
        },
      ]
    },
    {
      title: 'WithTimeout',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            ${goroutine('main', 'g-main', 'WithTimeout(300ms)')}
            <span class="viz-arrow active">&darr;</span>
            ${goroutine('fetchData', 'g-sender', 'working...<br><small>random 100-500ms</small>')}
            <div style="display:flex;gap:24px;margin-top:8px">
              <div style="background:var(--bg-tertiary);padding:8px 16px;border-radius:8px;text-align:center">
                <div style="font-size:24px">⏱️</div>
                <div style="font-size:12px;color:var(--text-muted)">300ms deadline</div>
              </div>
            </div>
          </div>`,
          desc: '<code>WithTimeout(300ms)</code> creates a context that auto-cancels after 300ms. The fetch function races against the clock.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="display:flex;gap:48px">
              <div style="text-align:center">
                <div style="font-weight:600;color:var(--green)">Fast (200ms)</div>
                ${goroutine('fetch', 'g-receiver', 'result ✅')}
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">finished before deadline</div>
              </div>
              <div style="text-align:center">
                <div style="font-weight:600;color:var(--red)">Slow (450ms)</div>
                ${goroutine('fetch', 'g-blocked', 'TIMEOUT ❌')}
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">ctx.Done() fired at 300ms</div>
              </div>
            </div>
          </div>`,
          desc: 'Two scenarios: if fetch finishes in 200ms → success. If it takes 450ms → context times out at 300ms, <code>ctx.Err()</code> returns <code>context.DeadlineExceeded</code>.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--yellow)">Always call cancel()!</div>
            <div style="background:var(--bg-tertiary);padding:16px;border-radius:8px;width:100%;max-width:400px">
              <code style="font-size:13px;color:var(--text)">ctx, cancel := context.WithTimeout(...)<br>defer cancel() // ← ALWAYS, even if timeout fires</code>
            </div>
            <div style="font-size:12px;color:var(--text-muted)">cancel() releases resources. Not calling it leaks a timer goroutine until timeout fires.</div>
          </div>`,
          desc: '<strong>Always defer cancel()</strong> — even if the timeout fires automatically. Without it, Go keeps a timer goroutine alive until the timeout expires. The linter will warn you about this.'
        },
      ]
    },
    {
      title: 'WithValue',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">Background()</div><div class="viz-channel-label">empty context</div></div>
            <span class="viz-arrow active">&darr; WithValue(reqIDKey, "abc-123")</span>
            <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">ctx + reqID</div><div class="viz-channel-label">reqID = "abc-123"</div></div>
            <span class="viz-arrow active">&darr; WithValue(userIDKey, 42)</span>
            <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">ctx + reqID + userID</div><div class="viz-channel-label">userID = 42</div></div>
          </div>`,
          desc: 'Each <code>WithValue</code> wraps the parent context, adding one key-value pair. Values are inherited — the bottom context has both reqID and userID.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:500px">
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px">
                <div style="font-weight:600;color:var(--green)">✅ Use for</div>
                <div style="font-size:12px;color:var(--text-muted)">• Request IDs<br>• User/auth info<br>• Trace/span IDs<br>• Request-scoped metadata</div>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px">
                <div style="font-weight:600;color:var(--red)">❌ Don't use for</div>
                <div style="font-size:12px;color:var(--text-muted)">• Function parameters<br>• Config values<br>• Database connections<br>• Anything not request-scoped</div>
              </div>
            </div>
          </div>`,
          desc: '<code>WithValue</code> is for <strong>request-scoped metadata</strong> that crosses API boundaries. If you\'re passing function arguments — use actual parameters instead. Rule: if it affects correctness, it\'s a parameter, not a context value.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--accent)">Use custom key types!</div>
            <div style="background:var(--bg-tertiary);padding:16px;border-radius:8px;width:100%;max-width:450px">
              <code style="font-size:12px;color:var(--red)">// ❌ string keys can collide<br>ctx = context.WithValue(ctx, "userID", 42)</code>
              <br><br>
              <code style="font-size:12px;color:var(--green)">// ✅ unexported type — impossible to collide<br>type userIDKey struct{}<br>ctx = context.WithValue(ctx, userIDKey{}, 42)</code>
            </div>
          </div>`,
          desc: 'Always use <strong>unexported custom types</strong> as keys. String keys like <code>"userID"</code> can collide with other packages using the same string. An unexported struct type is unique to your package.'
        },
      ]
    },
    {
      title: 'Propagation Pattern',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            ${goroutine('Handler', 'g-main', 'ctx = WithTimeout<br>ctx = WithValue(reqID)')}
            <span class="viz-arrow active">&darr; passes ctx</span>
            ${goroutine('Service', 'g-sender', 'if ctx.Err() != nil → bail<br>business logic')}
            <span class="viz-arrow active">&darr; passes ctx</span>
            ${goroutine('Repository', 'g-receiver', 'if ctx.Err() != nil → bail<br>db.QueryContext(ctx, ...)')}
          </div>`,
          desc: 'Context flows top-down through layers. Each layer receives <code>ctx</code> as its <strong>first parameter</strong> (Go convention). Each layer checks <code>ctx.Err()</code> before doing expensive work.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            ${goroutine('Handler', 'g-main', '⏱️ timeout fires!')}
            <span class="viz-arrow active">&darr; ctx.Done() closes</span>
            ${goroutine('Service', 'g-blocked', 'ctx.Err() ≠ nil → returns error')}
            <span class="viz-arrow active">&darr; never called</span>
            ${goroutine('Repository', 'viz-done', 'skipped entirely')}
          </div>`,
          desc: 'If the handler\'s timeout fires, the service layer sees <code>ctx.Err() != nil</code> and returns immediately. The repository is never called. <strong>Cancellation cascades down automatically.</strong>'
        },
      ]
    },
  ],
  'Concurrency Patterns': [
    {
      title: 'Pipeline',
      steps: [
        {
          canvas: () => `<div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">
            ${goroutine('generate', 'g-sender', '1, 2, 3, 4, 5')}
            ${arrow(true)}
            ${channel('ch1', 'ch-has-data', '<span class="viz-data">1</span>')}
            ${arrow(true)}
            ${goroutine('square', 'g-main', 'n * n')}
            ${arrow(true)}
            ${channel('ch2', 'ch-has-data', '<span class="viz-data">1</span>')}
            ${arrow(true)}
            ${goroutine('consumer', 'g-receiver', 'print')}
          </div>`,
          desc: 'Pipeline: chain of stages connected by channels. Each stage runs as a goroutine. Data flows left to right. All stages run <strong>concurrently</strong> — while square processes 1, generate is already sending 2.'
        },
        {
          canvas: () => `<div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">
            ${goroutine('generate', 'g-sender', '3, 4, 5')}
            ${arrow(true)}
            ${channel('ch1', 'ch-has-data', '<span class="viz-data">2</span>')}
            ${arrow(true)}
            ${goroutine('square', 'g-main', '1→1')}
            ${arrow(true)}
            ${channel('ch2', 'ch-has-data', '<span class="viz-data">1</span>')}
            ${arrow(true)}
            ${goroutine('consumer', 'g-receiver', 'print(1)')}
          </div>`,
          desc: 'Streaming, not batching. Generate sends 2 while square processes 1 while consumer prints. Total time ≈ slowest stage, not sum of all stages.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--yellow)">Without ctx.Done() — goroutine leak!</div>
            <div style="display:flex;align-items:center;gap:8px">
              ${goroutine('generate', 'g-blocked', 'out &lt;- 3<br><small>BLOCKED</small>')}
              ${arrow(false)}
              ${channel('ch', 'ch-full', 'stuck')}
              ${arrow(false)}
              ${goroutine('consumer', 'viz-done', 'returned early')}
            </div>
            <div style="font-size:12px;color:var(--text-muted)">Consumer stopped reading → sender blocked forever</div>
          </div>`,
          desc: 'If the consumer stops reading, senders block forever on <code>out &lt;- value</code>. Fix: wrap sends in <code>select</code> with <code>ctx.Done()</code> so goroutines can exit cleanly.'
        },
      ]
    },
    {
      title: 'Fan-out / Fan-in',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--accent)">Fan-out: one channel → many workers</div>
            <div style="display:flex;align-items:center;gap:8px">
              ${goroutine('gen', 'g-sender', '1..10')}
              ${arrow(true)}
              ${channel('input', 'ch-has-data', 'shared')}
            </div>
            <div style="display:flex;gap:8px">
              <span class="viz-arrow active">&darr;</span>
              <span class="viz-arrow active">&darr;</span>
              <span class="viz-arrow active">&darr;</span>
            </div>
            <div style="display:flex;gap:8px">
              ${goroutine('W1', 'g-main', 'square')}
              ${goroutine('W2', 'g-main', 'square')}
              ${goroutine('W3', 'g-main', 'square')}
            </div>
          </div>`,
          desc: '<strong>Fan-out:</strong> multiple goroutines read from the same channel. Go ensures each value goes to exactly one worker. Work is split automatically.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--green)">Fan-in: many channels → one</div>
            <div style="display:flex;gap:8px">
              ${goroutine('W1', 'g-main', '→ 1, 16')}
              ${goroutine('W2', 'g-main', '→ 4, 25')}
              ${goroutine('W3', 'g-main', '→ 9, 36')}
            </div>
            <div style="display:flex;gap:8px">
              <span class="viz-arrow active">&darr;</span>
              <span class="viz-arrow active">&darr;</span>
              <span class="viz-arrow active">&darr;</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              ${channel('merged', 'ch-has-data', 'all results')}
              ${arrow(true)}
              ${goroutine('consumer', 'g-receiver', 'range merged')}
            </div>
          </div>`,
          desc: '<strong>Fan-in:</strong> merge() combines multiple output channels into one. One goroutine per input, WaitGroup to track completion, closer goroutine to close output when all done.'
        },
      ]
    },
    {
      title: 'Worker Pool',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="display:flex;align-items:center;gap:8px">
              ${goroutine('producer', 'g-sender', 'Job{1} Job{2} ...')}
              ${arrow(true)}
              ${channel('jobs', 'ch-has-data', 'job queue')}
            </div>
            <div style="display:flex;gap:8px">
              <span class="viz-arrow active">&darr;</span>
              <span class="viz-arrow active">&darr;</span>
              <span class="viz-arrow active">&darr;</span>
            </div>
            <div style="display:flex;gap:8px">
              ${goroutine('W1', 'g-main', 'process')}
              ${goroutine('W2', 'g-main', 'process')}
              ${goroutine('W3', 'g-main', 'process')}
            </div>
            <div style="display:flex;gap:8px">
              <span class="viz-arrow active">&darr;</span>
              <span class="viz-arrow active">&darr;</span>
              <span class="viz-arrow active">&darr;</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              ${channel('results', 'ch-has-data', 'Result{}')}
              ${arrow(true)}
              ${goroutine('consumer', 'g-receiver', 'range results')}
            </div>
          </div>`,
          desc: 'Worker pool: N workers read jobs from a shared channel, process them, send results. Same as fan-out + fan-in but with structured Job/Result types. WaitGroup + closer goroutine manage the results channel.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--accent)">Worker Pool anatomy</div>
            <div style="background:var(--bg-tertiary);padding:16px;border-radius:8px;width:100%;max-width:450px;font-size:12px">
              <code>wg.Add(numWorkers)<br>
for i := 0; i &lt; numWorkers; i++ {<br>
&nbsp;&nbsp;go func() {<br>
&nbsp;&nbsp;&nbsp;&nbsp;defer wg.Done()<br>
&nbsp;&nbsp;&nbsp;&nbsp;for job := range jobs {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;select {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;case results &lt;- process(job):<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;case &lt;-ctx.Done(): return<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br>
&nbsp;&nbsp;&nbsp;&nbsp;}<br>
&nbsp;&nbsp;}()<br>
}<br>
go func() { wg.Wait(); close(results) }()</code>
            </div>
          </div>`,
          desc: 'The pattern: Add(N) workers, each reads from jobs channel, sends results with select + ctx.Done(), defer wg.Done(). Closer goroutine waits for all workers, then closes results.'
        },
      ]
    },
    {
      title: 'errgroup',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--accent)">Parallel fetch — all succeed</div>
            <div style="display:flex;gap:8px">
              ${goroutine('users', 'g-receiver', 'fetchUsers ✅')}
              ${goroutine('products', 'g-receiver', 'fetchProducts ✅')}
              ${goroutine('orders', 'g-receiver', 'fetchOrders ✅')}
            </div>
            <span class="viz-arrow active">&darr;</span>
            ${goroutine('g.Wait()', 'g-main', 'err = nil ✅')}
          </div>`,
          desc: '<code>errgroup</code> runs goroutines in parallel and waits for all. If all succeed, <code>g.Wait()</code> returns nil.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--red)">One fails — all cancelled</div>
            <div style="display:flex;gap:8px">
              ${goroutine('users', 'g-receiver', 'fetchUsers ✅')}
              ${goroutine('products', 'g-blocked', 'fetchProducts ❌')}
              ${goroutine('orders', 'g-blocked', 'ctx cancelled ⏹')}
            </div>
            <span class="viz-arrow active">&darr;</span>
            ${goroutine('g.Wait()', 'g-main', 'err = "products failed"')}
          </div>`,
          desc: 'If any goroutine returns an error, the context is cancelled — other goroutines see <code>ctx.Done()</code> and stop. <code>g.Wait()</code> returns the <strong>first</strong> error. Cleaner than WaitGroup + manual error handling.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:500px">
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px">
                <div style="font-weight:600;color:var(--accent)">errgroup</div>
                <div style="font-size:12px;color:var(--text-muted)">• Parallel independent tasks<br>• First error cancels all<br>• Built-in context cancel<br>• Common in backends</div>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px">
                <div style="font-weight:600;color:var(--text-muted)">WaitGroup</div>
                <div style="font-size:12px;color:var(--text-muted)">• No error handling<br>• No cancellation<br>• Manual everything<br>• Lower level</div>
              </div>
            </div>
          </div>`,
          desc: 'Use <code>errgroup</code> over <code>WaitGroup</code> when you need error handling and cancellation. It\'s the standard choice for parallel fetches in Go backends.'
        },
      ]
    },
    {
      title: 'Rate Limiting',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--red)">Without rate limiting</div>
            <div style="display:flex;gap:4px">
              ${goroutine('', 'g-sender', 'e1')}
              ${goroutine('', 'g-sender', 'e2')}
              ${goroutine('', 'g-sender', 'e3')}
              ${goroutine('', 'g-sender', 'e4')}
              ${goroutine('', 'g-sender', 'e5')}
            </div>
            <div style="font-size:13px;color:var(--red)">All at once — server overwhelmed</div>
          </div>`,
          desc: 'Without rate limiting, all events fire immediately. This can overwhelm downstream services, APIs, or databases.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--green)">With rate limiting (5/sec)</div>
            <div style="display:flex;align-items:center;gap:8px">
              ${goroutine('events', 'g-sender', 'e1 e2 e3...')}
              ${arrow(true)}
              <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">⏱ Ticker 200ms</div><div class="viz-channel-label">time.Ticker</div></div>
              ${arrow(true)}
              ${goroutine('output', 'g-receiver', 'e1...e2...e3')}
            </div>
            <div style="font-size:13px;color:var(--green)">Evenly spaced — 200ms apart (5 per second)</div>
          </div>`,
          desc: '<code>time.NewTicker(200ms)</code> fires every 200ms. The rate limiter waits for a tick before forwarding each event. 5 ticks per second = 5 events per second.'
        },
      ]
    },
  ],
  'Standard Library Deep Dive': [
    {
      title: 'slog — Structured Logging',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--red)">❌ fmt.Printf / log.Println</div>
            <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;width:100%;max-width:450px">
              <code style="font-size:12px;color:var(--text-muted)">2026/03/21 user alice logged in from 192.168.1.1</code>
            </div>
            <div style="text-align:center;font-weight:600;color:var(--green);margin-top:8px">✅ slog — structured</div>
            <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;width:100%;max-width:450px">
              <code style="font-size:12px;color:var(--green)">{"time":"...","level":"INFO","msg":"login","user":"alice","ip":"192.168.1.1"}</code>
            </div>
          </div>`,
          desc: 'Unstructured logs are hard to search and parse. <code>slog</code> outputs JSON or text with typed key-value pairs — searchable, filterable, machine-readable.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:500px">
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px">
                <div style="font-weight:600;color:var(--accent)">Levels</div>
                <div style="font-size:12px;color:var(--text-muted)">Debug → Info → Warn → Error<br>Set min level to filter noise</div>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px">
                <div style="font-weight:600;color:var(--accent)">Handlers</div>
                <div style="font-size:12px;color:var(--text-muted)">TextHandler → human-readable<br>JSONHandler → machine-readable</div>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px">
                <div style="font-weight:600;color:var(--accent)">slog.With()</div>
                <div style="font-size:12px;color:var(--text-muted)">Add default attrs to every log<br>e.g. "service", "api"</div>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px">
                <div style="font-weight:600;color:var(--accent)">Groups</div>
                <div style="font-size:12px;color:var(--text-muted)">Nest attrs: slog.Group("req",<br>"method","GET","path","/")</div>
              </div>
            </div>
          </div>`,
          desc: '<code>slog</code> is Go\'s built-in structured logger (since Go 1.21). It replaces <code>log</code> for production use. Key features: levels, handlers, default attributes, and groups.'
        },
      ]
    },
    {
      title: 'go:embed',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--accent)">Compile time</div>
            <div style="display:flex;gap:8px;align-items:center">
              <div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:8px;font-size:12px">schema.sql</div>
              <div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:8px;font-size:12px">logo.png</div>
              <div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:8px;font-size:12px">index.html</div>
            </div>
            <span class="viz-arrow active">&darr; go build</span>
            <div class="viz-channel"><div class="viz-channel-pipe ch-has-data">single binary</div><div class="viz-channel-label">files baked in</div></div>
          </div>`,
          desc: '<code>//go:embed</code> bakes files into the binary at compile time. No external files needed at runtime — deploy a single binary with everything included.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;width:100%;max-width:500px">
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center">
                <div style="font-weight:600;color:var(--green)">string</div>
                <div style="font-size:11px;color:var(--text-muted)">single text file</div>
                <code style="font-size:10px">//go:embed f.txt<br>var s string</code>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center">
                <div style="font-weight:600;color:var(--accent)">[]byte</div>
                <div style="font-size:11px;color:var(--text-muted)">single binary file</div>
                <code style="font-size:10px">//go:embed img.png<br>var b []byte</code>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center">
                <div style="font-weight:600;color:var(--yellow)">embed.FS</div>
                <div style="font-size:11px;color:var(--text-muted)">multiple files/dirs</div>
                <code style="font-size:10px">//go:embed static/*<br>var fs embed.FS</code>
              </div>
            </div>
          </div>`,
          desc: 'Three variable types: <code>string</code> for text, <code>[]byte</code> for binary, <code>embed.FS</code> for directories. This project uses <code>embed.FS</code> for the entire dashboard (HTML + CSS + JS).'
        },
      ]
    },
    {
      title: 'io — Reader/Writer',
      steps: [
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--accent)">io.Reader — the universal input</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
              <div style="background:var(--bg-tertiary);padding:6px 12px;border-radius:8px;font-size:12px">os.File</div>
              <div style="background:var(--bg-tertiary);padding:6px 12px;border-radius:8px;font-size:12px">http.Response.Body</div>
              <div style="background:var(--bg-tertiary);padding:6px 12px;border-radius:8px;font-size:12px">strings.Reader</div>
              <div style="background:var(--bg-tertiary);padding:6px 12px;border-radius:8px;font-size:12px">bytes.Buffer</div>
              <div style="background:var(--bg-tertiary);padding:6px 12px;border-radius:8px;font-size:12px">gzip.Reader</div>
            </div>
            <span class="viz-arrow active">&darr; Read(p []byte) (n int, err error)</span>
            <div style="background:var(--bg-tertiary);padding:8px 16px;border-radius:8px;font-size:12px">your function(r io.Reader)</div>
          </div>`,
          desc: '<code>io.Reader</code> is one method: <code>Read(p []byte) (n int, err error)</code>. Files, HTTP bodies, strings, compressed streams — all implement it. Write your function once, it works with any source.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:16px;align-items:center;width:100%">
            <div style="text-align:center;font-weight:600;color:var(--green)">Composition — chain them</div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center">
              ${goroutine('file', 'g-sender', 'io.Reader')}
              ${arrow(true)}
              ${goroutine('gzip', 'g-main', 'decompress')}
              ${arrow(true)}
              ${goroutine('bufio', 'g-main', 'buffer')}
              ${arrow(true)}
              ${goroutine('scanner', 'g-receiver', 'line by line')}
            </div>
          </div>`,
          desc: 'Readers wrap readers: <code>bufio.NewReader(gzip.NewReader(file))</code>. Each adds a layer — decompression, buffering, scanning. Like Unix pipes but in Go.'
        },
        {
          canvas: () => `<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:450px">
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center">
                <div style="font-weight:600;color:var(--accent)">io.Copy</div>
                <div style="font-size:11px;color:var(--text-muted)">Reader → Writer<br>efficient streaming</div>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center">
                <div style="font-weight:600;color:var(--accent)">io.MultiReader</div>
                <div style="font-size:11px;color:var(--text-muted)">combine N readers<br>into one stream</div>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center">
                <div style="font-weight:600;color:var(--accent)">io.MultiWriter</div>
                <div style="font-size:11px;color:var(--text-muted)">write once<br>goes to N writers</div>
              </div>
              <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;text-align:center">
                <div style="font-weight:600;color:var(--accent)">io.TeeReader</div>
                <div style="font-size:11px;color:var(--text-muted)">read + copy to<br>a writer (like tee)</div>
              </div>
            </div>
          </div>`,
          desc: 'The <code>io</code> package provides building blocks for composing streams. Write functions that accept <code>io.Reader</code>/<code>io.Writer</code> — they work with files, networks, buffers, anything.'
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
