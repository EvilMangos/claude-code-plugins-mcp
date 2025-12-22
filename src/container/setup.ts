import { ReportRepositoryImpl } from "../report/repository/report.repository";
import { ReportStorageImpl } from "../report/repository/report.storage";
import { SignalRepositoryImpl } from "../signal/repository/signal.repository";
import { SignalStorageImpl } from "../signal/repository/signal.storage";
import { ReportServiceImpl } from "../report/service";
import { SignalServiceImpl } from "../signal/service";
import type { IReportRepository } from "../report/types/report-repository.interface";
import type { IReportService } from "../report/types/report-service.interface";
import type { IReportStorage } from "../report/types/report-storage.interface";
import type { ISignalRepository } from "../signal/types/signal-repository.interface";
import type { ISignalService } from "../signal/types/signal-service.interface";
import type { ISignalStorage } from "../signal/types/signal-storage.interface";
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

	// Bind signal storage (if not already bound)
	if (!container.isBound(TOKENS.SignalStorage)) {
		container
			.bind<ISignalStorage>(TOKENS.SignalStorage)
			.to(SignalStorageImpl)
			.inSingletonScope();
	}

	// Bind signal repository (if not already bound)
	if (!container.isBound(TOKENS.SignalRepository)) {
		container
			.bind<ISignalRepository>(TOKENS.SignalRepository)
			.to(SignalRepositoryImpl)
			.inSingletonScope();
	}

	// Bind signal service (if not already bound)
	if (!container.isBound(TOKENS.SignalService)) {
		container
			.bind<ISignalService>(TOKENS.SignalService)
			.to(SignalServiceImpl)
			.inSingletonScope();
	}
}
