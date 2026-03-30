/*
 * Shared formatting helpers.
 * This file holds safe HTML escaping and lightweight date/time formatting used
 * throughout the frontend presentation layer.
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDate(ts) {
  if (!ts) return "--";
  const date = new Date(ts);
  return Number.isNaN(date.getTime()) ? String(ts) : date.toLocaleString();
}

export function formatTime(ts) {
  if (!ts) return "--";
  const date = new Date(ts);
  return Number.isNaN(date.getTime()) ? String(ts) : date.toLocaleTimeString();
}
