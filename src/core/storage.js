/*
 * Shared local-storage helpers.
 * This file centralizes JSON/text persistence helpers so feature modules can
 * read and write browser storage through a small common surface.
 */
export function getStoredMap(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function setStoredMap(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

export function getStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

export function peekStoredMap(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function peekStoredJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
