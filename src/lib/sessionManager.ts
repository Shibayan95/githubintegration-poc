const STORAGE_KEY_PREFIX = "data-app-session-";

function storageKey(dataAppId: string): string {
  return `${STORAGE_KEY_PREFIX}${dataAppId}`;
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function getSessionId(dataAppId: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(storageKey(dataAppId));
}

export function setSessionId(dataAppId: string, sessionId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(dataAppId), sessionId);
}

export function clearSessionId(dataAppId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey(dataAppId));
}

/**
 * Get the current session ID or generate a new one.
 * Stores in sessionStorage keyed by dataAppId.
 */
export function getOrCreateSessionId(dataAppId: string): string {
  const existing = getSessionId(dataAppId);
  if (existing) return existing;
  const id = generateSessionId();
  setSessionId(dataAppId, id);
  return id;
}
