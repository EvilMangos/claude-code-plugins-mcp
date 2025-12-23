/**
 * Dependency injection tokens for inversify container.
 */
export const TOKENS = {
	SqliteDatabase: Symbol.for("SqliteDatabase"),
	ReportRepository: Symbol.for("ReportRepository"),
	ReportService: Symbol.for("ReportService"),
	SignalRepository: Symbol.for("SignalRepository"),
	SignalService: Symbol.for("SignalService"),
	MetadataRepository: Symbol.for("MetadataRepository"),
	MetadataService: Symbol.for("MetadataService"),
} as const;
