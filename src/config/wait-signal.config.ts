/**
 * Default timeout for waiting for a signal (20 minutes).
 */
const DEFAULT_TIMEOUT_MS = 1200000;

/**
 * Default polling interval (5 seconds).
 */
const DEFAULT_POLL_INTERVAL_MS = 5000;

/**
 * Parse a positive integer from environment variable.
 * Returns default if value is missing, non-numeric, or non-positive.
 */
function parsePositiveInt(
	value: string | undefined,
	defaultValue: number
): number {
	if (!value) return defaultValue;
	const parsed = parseInt(value, 10);
	if (isNaN(parsed) || parsed <= 0) return defaultValue;
	return parsed;
}

/**
 * Server-side configuration for wait-signal operation.
 * Values are read from environment variables at module load time.
 */
export const waitSignalConfig = {
	timeoutMs: parsePositiveInt(
		process.env.WAIT_SIGNAL_TIMEOUT_MS,
		DEFAULT_TIMEOUT_MS
	),
	pollIntervalMs: parsePositiveInt(
		process.env.WAIT_SIGNAL_POLL_INTERVAL_MS,
		DEFAULT_POLL_INTERVAL_MS
	),
} as const;
