/**
 * HTML-safe string escaping.
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Format an ISO timestamp to a locale time string (HH:MM:SS).
 */
export function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format a number as a dollar amount with up to 6 decimal places.
 * Returns null for non-number inputs.
 */
export function fmtMoney(n) {
  if (typeof n !== 'number') return null;
  return '$' + n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}
