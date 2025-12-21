import { ReportRepositoryImpl } from "../report-repository/report.repository";
import { ReportStorageImpl } from "../report-repository/report.storage";
import { ReportServiceImpl } from "../tools/report.service";
import type { IReportRepository } from "../types/report-repository.interface";
import type { IReportService } from "../types/report-service.interface";
import type { IReportStorage } from "../types/report-storage.interface";
import { container } from "./container";
import { TOKENS } from "./tokens";

/**
 * Setup the inversify container with all dependencies.
 * Safe to call multiple times - will skip if already bound.
 */
export function setupContainer(): void {
	// Bind report-repository (if not already bound)
	if (!container.isBound(TOKENS.ReportStorage)) {
		container
			.bind<IReportStorage>(TOKENS.ReportStorage)
			.to(ReportStorageImpl)
			.inSingletonScope();
	}

	// Bind repository (if not already bound)
	if (!container.isBound(TOKENS.ReportRepository)) {
		container
			.bind<IReportRepository>(TOKENS.ReportRepository)
			.to(ReportRepositoryImpl)
			.inSingletonScope();
	}

	// Bind service (if not already bound)
	if (!container.isBound(TOKENS.ReportService)) {
		container
			.bind<IReportService>(TOKENS.ReportService)
			.to(ReportServiceImpl)
			.inSingletonScope();
	}
}
