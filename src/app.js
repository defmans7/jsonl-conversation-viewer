import { parseJsonl, SAMPLE } from './lib/parser.js';
import { escapeHtml, fmtTime } from './lib/utils.js';
import { render } from './renderer.js';
import {
  saveDraft,
  loadDraft,
  loadHistory,
  saveEntry,
  deleteEntry,
  clearHistory,
} from './history.js';

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const input = document.getElementById('input');
const output = document.getElementById('output');
const statsEl = document.getElementById('stats');
const clearBtn = document.getElementById('clearBtn');
const inputPane = document.getElementById('inputPane');
const foldBtn = document.getElementById('foldBtn');

const historyToggle = document.getElementById('historyToggle');
const historyDrawer = document.getElementById('historyDrawer');
const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const saveBtn = document.getElementById('saveBtn');
const downloadBtn = document.getElementById('downloadBtn');

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function doSave() {
  if (!input.value.trim()) return;
  saveEntry(input.value);
  refreshHistoryList();
}

function toggleHistory() {
  const open = historyDrawer.classList.toggle('open');
  historyToggle.classList.toggle('active', open);
  if (open) refreshHistoryList();
}

function doDownload() {
  if (!input.value.trim()) return;
  const blob = new Blob([input.value], { type: 'application/jsonl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-${new Date().toISOString().slice(0, 10)}.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Fold / expand input pane
// ---------------------------------------------------------------------------
foldBtn.addEventListener('click', () => {
  const collapsed = inputPane.classList.toggle('collapsed');
  foldBtn.setAttribute('aria-expanded', String(!collapsed));
  foldBtn.textContent = collapsed ? '›' : '‹';
  foldBtn.title = collapsed ? 'Expand input pane' : 'Collapse input pane';
});

// ---------------------------------------------------------------------------
// Render pipeline
// ---------------------------------------------------------------------------
let debounceTimer;

function runRender() {
  const parsed = parseJsonl(input.value);
  render({ parsed, statsEl, output });
}

input.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runRender, 120);

  // Auto-save draft after 2s of inactivity
  clearTimeout(input._draftTimer);
  input._draftTimer = setTimeout(() => saveDraft(input.value), 2000);
});

// ---------------------------------------------------------------------------
// History drawer
// ---------------------------------------------------------------------------
function refreshHistoryList() {
  const entries = loadHistory();
  historyList.innerHTML = '';

  if (entries.length === 0) {
    historyEmpty.style.display = 'block';
    return;
  }

  historyEmpty.style.display = 'none';

  for (const entry of entries) {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <div class="history-item-body">
        <div class="history-item-title">${escapeHtml(entry.title)}</div>
        <div class="history-item-time">${fmtTime(entry.timestamp)}</div>
      </div>
      <button class="history-item-del" data-id="${entry.id}" title="Delete">×</button>
    `;

    // Click to load
    li.addEventListener('click', (e) => {
      if (e.target.closest('.history-item-del')) return;
      input.value = entry.text;
      runRender();
    });

    historyList.appendChild(li);
  }

  // Delegate delete clicks
  historyList.querySelectorAll('.history-item-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteEntry(btn.dataset.id);
      refreshHistoryList();
    });
  });
}

// Toggle drawer
historyToggle.addEventListener('click', toggleHistory);

// Save current
saveBtn.addEventListener('click', doSave);

// Download
downloadBtn.addEventListener('click', doDownload);

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;

  // Ctrl+S / Cmd+S → save to history
  if (mod && e.key === 's') {
    e.preventDefault();
    doSave();
  }

  // Ctrl+Shift+H / Cmd+Shift+H → toggle history drawer
  if (mod && e.shiftKey && e.key === 'H') {
    e.preventDefault();
    toggleHistory();
  }
});

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------
clearBtn.addEventListener('click', () => {
  input.value = '';
  runRender();
  saveDraft('');
  input.focus();
});

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
// Restore draft if available, otherwise load sample
const draft = loadDraft();
input.value = draft || SAMPLE;
runRender();

// Render initial history state
refreshHistoryList();
