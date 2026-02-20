/**
 * Structured logger for the RTO Games platform.
 * All Firestore and service errors should be logged through this module.
 *
 * TODO: Replace console methods with a proper logging service (e.g. Sentry)
 * once observability tooling is in place.
 */

/** Log an error with structured context. */
export function logError(context: string, error: unknown): void {
  // eslint-disable-next-line no-console -- Logger module is the single console access point
  console.error(`[RTO Games] ${context}:`, error);
}

/** Log a warning with structured context. */
export function logWarn(context: string, message: string): void {
  // eslint-disable-next-line no-console -- Logger module is the single console access point
  console.warn(`[RTO Games] ${context}: ${message}`);
}
