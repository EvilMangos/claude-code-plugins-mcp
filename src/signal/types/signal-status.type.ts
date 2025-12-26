/**
 * Enum-like object for signal statuses.
 */
export const SignalStatus = {
	PASSED: "passed",
	FAILED: "failed",
} as const;

/**
 * Type derived from SignalStatus object values.
 */
// eslint-disable-next-line no-redeclare
export type SignalStatus = (typeof SignalStatus)[keyof typeof SignalStatus];

/**
 * Array of valid signal statuses (derived from SignalStatus object).
 */
export const SIGNAL_STATUSES: SignalStatus[] = Object.values(SignalStatus);
