import { escapeHtml, fmtTime, fmtMoney } from './lib/utils.js';

// ---------------------------------------------------------------------------
// Tool results
// ---------------------------------------------------------------------------

/**
 * Render a collapsible tool-result body.
 */
export function renderResultBody(text, isError) {
  const safe = escapeHtml(text || '');
  const long = (text || '').length > 600;
  return `<details ${long ? '' : 'open'}>
    <summary class="result-summary">${isError ? 'Error' : 'Result'}<span class="char-count">${(text || '').length} chars</span></summary>
    <pre class="result-body">${safe}</pre>
  </details>`;
}

/**
 * Render a single tool-call block (header + args + optional result).
 */
export function renderToolBlock(tc, resultsByCallId) {
  let argsStr;
  try {
    argsStr = JSON.stringify(tc.arguments, null, 2);
  } catch (_) {
    argsStr = String(tc.arguments);
  }

  const result = resultsByCallId.get(tc.id);
  let resultHtml = '';
  if (result) {
    const text = (result.content || []).map(c => c.text || '').join('\n');
    resultHtml = `<div class="tool-result ${result.isError ? 'err' : 'ok'}">${renderResultBody(text, result.isError)}</div>`;
  }

  return `<div class="tool-block">
    <div class="tool-head"><span class="tool-icon">&#9881;</span><span class="tool-name">${escapeHtml(tc.name || 'tool')}</span><span class="tool-id">${escapeHtml(tc.id || '')}</span></div>
    <pre class="tool-args">${escapeHtml(argsStr)}</pre>
    ${resultHtml}
  </div>`;
}

// ---------------------------------------------------------------------------
// Message rows
// ---------------------------------------------------------------------------

/**
 * Render a user message row.
 */
export function renderUserRow(msg, ts) {
  const texts = (msg.content || [])
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('\n\n');

  return `<div class="row row-user">
    <div class="rail rail-user"></div>
    <div class="bubble">
      <div class="bubble-head"><span class="role-label">User</span><span class="ts">${fmtTime(ts)}</span></div>
      <div class="content"><p class="text-block">${escapeHtml(texts)}</p></div>
    </div>
  </div>`;
}

/**
 * Render an assistant message row (text, thinking blocks, tool calls).
 */
export function renderAssistantRow(msg, ts, resultsByCallId) {
  const blocks = (msg.content || []).map(block => {
    if (block.type === 'thinking') {
      return `<details class="thinking"><summary>Thinking</summary><pre>${escapeHtml(block.thinking || '')}</pre></details>`;
    }
    if (block.type === 'text') {
      return `<p class="text-block">${escapeHtml(block.text || '')}</p>`;
    }
    if (block.type === 'toolCall') {
      return renderToolBlock(block, resultsByCallId);
    }
    return '';
  }).join('');

  const metaBits = [msg.model, msg.provider].filter(Boolean).join(' · ');

  const footBits = [];
  if (msg.usage) {
    const u = msg.usage;
    if (u.input != null || u.output != null) footBits.push(`${u.input ?? 0} in / ${u.output ?? 0} out`);
    if (u.cacheRead) footBits.push(`cache ${u.cacheRead}`);
    if (u.cost && typeof u.cost.total === 'number') footBits.push(fmtMoney(u.cost.total));
  }
  if (msg.stopReason) footBits.push(msg.stopReason);

  return `<div class="row row-assistant">
    <div class="rail rail-assistant"></div>
    <div class="bubble">
      <div class="bubble-head"><span class="role-label">Assistant</span><span class="meta">${escapeHtml(metaBits)}</span><span class="ts">${fmtTime(ts)}</span></div>
      <div class="blocks">${blocks || '<span class="meta">(no content)</span>'}</div>
      ${footBits.length ? `<div class="bubble-foot">${footBits.map(escapeHtml).join('<span>·</span>')}</div>` : ''}
    </div>
  </div>`;
}

/**
 * Render an unmatched/orphan tool result (no tool call found for this id).
 */
export function renderOrphanResult(msg, ts) {
  const text = (msg.content || []).map(c => c.text || '').join('\n');
  return `<div class="row row-orphan">
    <div class="rail rail-orphan"></div>
    <div class="bubble">
      <div class="bubble-head"><span class="role-label" style="color:var(--result-err)">Unmatched tool result</span><span class="meta">${escapeHtml(msg.toolName || '')}</span><span class="ts">${fmtTime(ts)}</span></div>
      <div class="content"><div class="tool-result ${msg.isError ? 'err' : 'ok'}">${renderResultBody(text, msg.isError)}</div></div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Stats helper
// ---------------------------------------------------------------------------

/**
 * Build the stats HTML string from a counts object.
 */
export function buildStatsHtml(counts) {
  let html = `<span><b>${counts.messages}</b> messages</span>`
    + `<span><b>${counts.toolCalls}</b> tool calls</span>`;
  if (counts.errors) {
    html += `<span style="color:var(--result-err)"><b>${counts.errors}</b> errors</span>`;
  }
  if (counts.parseErrors) {
    html += `<span style="color:var(--result-err)"><b>${counts.parseErrors}</b> parse errors</span>`;
  }
  return html;
}

// ---------------------------------------------------------------------------
// Top-level orchestrator
// ---------------------------------------------------------------------------

/**
 * Run the full render pipeline: parse → build result map → render rows → update DOM.
 */
export function render({ parsed, statsEl, output }) {
  if (parsed.length === 0) {
    output.innerHTML = '<div class="empty-state">Paste JSONL lines on the left.<br>Each line should be a JSON object with a "message" field.</div>';
    statsEl.innerHTML = '';
    return;
  }

  // Build toolCallId → toolResult map so results nest under tool calls
  const resultsByCallId = new Map();
  const consumedResultIds = new Set();

  for (const p of parsed) {
    if (p.ok && p.obj.message && p.obj.message.role === 'toolResult') {
      resultsByCallId.set(p.obj.message.toolCallId, p.obj.message);
    }
  }

  let html = '';
  const counts = { messages: 0, toolCalls: 0, errors: 0, parseErrors: 0 };

  for (const p of parsed) {
    if (!p.ok) {
      counts.parseErrors++;
      html += `<div class="parse-error">Line ${p.lineNo}: could not parse JSON — ${escapeHtml(p.error)}</div>`;
      continue;
    }

    const obj = p.obj;
    const msg = obj.message;
    if (!msg || !msg.role) continue;

    if (msg.role === 'user') {
      counts.messages++;
      html += renderUserRow(msg, msg.timestamp || obj.timestamp);
    } else if (msg.role === 'assistant') {
      counts.messages++;
      (msg.content || []).forEach(b => {
        if (b.type === 'toolCall') {
          counts.toolCalls++;
          if (resultsByCallId.has(b.id)) consumedResultIds.add(b.id);
        }
      });
      html += renderAssistantRow(msg, msg.timestamp || obj.timestamp, resultsByCallId);
    } else if (msg.role === 'toolResult') {
      if (msg.isError) counts.errors++;
      if (!consumedResultIds.has(msg.toolCallId)) {
        html += renderOrphanResult(msg, msg.timestamp || obj.timestamp);
      }
    }
  }

  output.innerHTML = html || '<div class="empty-state">No renderable messages found.</div>';
  statsEl.innerHTML = buildStatsHtml(counts);
}
