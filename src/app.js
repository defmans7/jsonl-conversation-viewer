import { parseJsonl, SAMPLE } from './lib/parser.js';
import { render } from './renderer.js';

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const input = document.getElementById('input');
const output = document.getElementById('output');
const statsEl = document.getElementById('stats');
const clearBtn = document.getElementById('clearBtn');
const inputPane = document.getElementById('inputPane');
const foldBtn = document.getElementById('foldBtn');

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
});

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------
clearBtn.addEventListener('click', () => {
  input.value = '';
  runRender();
  input.focus();
});

// ---------------------------------------------------------------------------
// Bootstrap with sample data
// ---------------------------------------------------------------------------
input.value = SAMPLE;
runRender();
