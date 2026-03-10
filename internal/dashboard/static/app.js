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

  const list = document.getElementById('entries-list');
  const empty = document.getElementById('empty-state');

  if (!entries || entries.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  list.innerHTML = entries.map(e => `
    <div class="entry-card">
      <div class="entry-header">
        <span class="entry-kind ${e.kind}">${e.kind}</span>
        <span>${formatTime(e.createdAt)}</span>
      </div>
      <div class="entry-body">${marked.parse(e.content)}</div>
    </div>
  `).join('');
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
