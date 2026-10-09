export interface LastActionSession {
  eventId: number;
  leadId: string;
  action: string;
  leadName: string;
  timestamp: number;
}

let lastAction: LastActionSession | null = null;
const listeners = new Set<(action: LastActionSession | null) => void>();

/**
 * Records the most recent action executed in the current browser session.
 */
export function recordLastAction(session: Omit<LastActionSession, 'timestamp'>): void {
  lastAction = {
    ...session,
    timestamp: Date.now(),
  };
  listeners.forEach((fn) => fn(lastAction));
}

/**
 * Clears the active action session (e.g. after it has been undone).
 */
export function clearLastAction(): void {
  lastAction = null;
  listeners.forEach((fn) => fn(null));
}

/**
 * Returns the last action if within the 10-minute undo window.
 */
export function getLastAction(): LastActionSession | null {
  if (!lastAction) return null;
  if (Date.now() - lastAction.timestamp > 10 * 60 * 1000) {
    lastAction = null;
    return null;
  }
  return lastAction;
}

/**
 * Subscribes to changes to the last action session.
 */
export function subscribeLastAction(fn: (action: LastActionSession | null) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
