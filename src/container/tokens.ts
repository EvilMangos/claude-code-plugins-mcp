/**
 * Dependency injection tokens for inversify container.
 */
export const TOKENS = {
	ReportStorage: Symbol.for("ReportStorage"),
	ReportRepository: Symbol.for("ReportRepository"),
	ReportService: Symbol.for("ReportService"),
	SignalStorage: Symbol.for("SignalStorage"),
	SignalRepository: Symbol.for("SignalRepository"),
	SignalService: Symbol.for("SignalService"),
} as const;
