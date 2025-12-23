import { MetadataRepository } from "../metadata/repository/metadata.repository";
import { MetadataService } from "../metadata/metadata.service";
import type { IMetadataService } from "../metadata/types/metadata.service.interface";
import type { IMetadataRepository } from "../metadata/types/metadata.repository.interface";
import { ReportRepository } from "../report/repository/report.repository";
import { ReportService } from "../report/report.service";
import type { IReportService } from "../report/types/report.service.interface";
import type { IReportRepository } from "../report/types/report.repository.interface";
import { SignalRepository } from "../signal/repository/signal.repository";
import { SignalService } from "../signal/signal.service";
import type { ISignalService } from "../signal/types/signal.service.interface";
import type { ISignalRepository } from "../signal/types/signal.repository.interface";
import { SqliteDatabase } from "../storage/sqlite-database";
import { container } from "./container";
import { TOKENS } from "./tokens";

/**
 * Setup the inversify container with all dependencies.
 * Safe to call multiple times - will skip if already bound.
 */
export function setupContainer(): void {
	// Bind SQLite database (if not already bound)
	if (!container.isBound(TOKENS.SqliteDatabase)) {
		container
			.bind<SqliteDatabase>(TOKENS.SqliteDatabase)
			.to(SqliteDatabase)
			.inSingletonScope();
	}

	// Bind report repository (if not already bound)
	if (!container.isBound(TOKENS.ReportRepository)) {
		container
			.bind<IReportRepository>(TOKENS.ReportRepository)
			.to(ReportRepository)
			.inSingletonScope();
	}

	// Bind report service (if not already bound)
	if (!container.isBound(TOKENS.ReportService)) {
		container
			.bind<IReportService>(TOKENS.ReportService)
			.to(ReportService)
			.inSingletonScope();
	}

	// Bind signal repository (if not already bound)
	if (!container.isBound(TOKENS.SignalRepository)) {
		container
			.bind<ISignalRepository>(TOKENS.SignalRepository)
			.to(SignalRepository)
			.inSingletonScope();
	}

	// Bind signal service (if not already bound)
	if (!container.isBound(TOKENS.SignalService)) {
		container
			.bind<ISignalService>(TOKENS.SignalService)
			.to(SignalService)
			.inSingletonScope();
	}

	// Bind metadata repository (if not already bound)
	if (!container.isBound(TOKENS.MetadataRepository)) {
		container
			.bind<IMetadataRepository>(TOKENS.MetadataRepository)
			.to(MetadataRepository)
			.inSingletonScope();
	}

	// Bind metadata service (if not already bound)
	if (!container.isBound(TOKENS.MetadataService)) {
		container
			.bind<IMetadataService>(TOKENS.MetadataService)
			.to(MetadataService)
			.inSingletonScope();
	}
}
