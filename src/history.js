/**
 * History persistence via localStorage.
 *
 * Keys:
 *   jsonl-viewer-draft     — auto-saved current textarea content
 *   jsonl-viewer-history   — JSON array of saved entries
 */

const DRAFT_KEY = 'jsonl-viewer-draft';
const HISTORY_KEY = 'jsonl-viewer-history';
const MAX_HISTORY = 50;

// ---------------------------------------------------------------------------
// Draft (auto-save / restore)
// ---------------------------------------------------------------------------

/** Save the current textarea content as a draft. */
export function saveDraft(text) {
  try {
    localStorage.setItem(DRAFT_KEY, text);
  } catch (_) {
    // Storage full or unavailable — silently ignore
  }
}

/** Load the last auto-saved draft. Returns empty string if none. */
export function loadDraft() {
  try {
    return localStorage.getItem(DRAFT_KEY) || '';
  } catch (_) {
    return '';
  }
}

// ---------------------------------------------------------------------------
// History entries
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} HistoryEntry
 * @property {string}   id        — unique id (timestamp-based)
 * @property {string}   title     — auto-extracted or user-provided title
 * @property {string}   text      — raw JSONL content
 * @property {string}   timestamp — ISO date string
 */

/** Read all history entries (newest first). */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/** Persist history array to localStorage. */
function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch (_) {
    // Storage full — trim oldest entries and retry once
    if (entries.length > 5) {
      saveHistory(entries.slice(0, entries.length - 5));
    }
  }
}

/**
 * Extract a title from JSONL text by finding the first user message.
 * Falls back to the timestamp.
 */
function extractTitle(text) {
  const lines = text.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      const msg = obj?.message;
      if (msg?.role === 'user') {
        const firstText = (msg.content || [])
          .filter(c => c.type === 'text')
          .map(c => c.text)[0];
        if (firstText) {
          // Truncate long titles
          return firstText.length > 80 ? firstText.slice(0, 77) + '…' : firstText;
        }
      }
    } catch (_) {
      continue;
    }
  }
  // Fallback to timestamp
  return new Date().toLocaleString();
}

/**
 * Save the given text as a named history entry.
 * If an entry with the same text already exists, it won't be duplicated.
 */
export function saveEntry(text) {
  if (!text.trim()) return null;

  const entries = loadHistory();

  // Avoid exact duplicates
  if (entries.some(e => e.text === text)) return null;

  const entry = {
    id: String(Date.now()),
    title: extractTitle(text),
    text,
    timestamp: new Date().toISOString(),
  };

  entries.unshift(entry);

  // Cap history size
  if (entries.length > MAX_HISTORY) {
    entries.length = MAX_HISTORY;
  }

  saveHistory(entries);
  return entry;
}

/**
 * Delete a history entry by id.
 */
export function deleteEntry(id) {
  const entries = loadHistory().filter(e => e.id !== id);
  saveHistory(entries);
  return entries;
}

/**
 * Clear all history entries.
 */
export function clearHistory() {
  saveHistory([]);
}
