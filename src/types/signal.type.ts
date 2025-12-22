/**
 * Valid signal statuses.
 */
export const SIGNAL_STATUSES = ["passed", "failed"] as const;

/**
 * Type derived from SIGNAL_STATUSES constant.
 */
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];
