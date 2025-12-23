import type { Newable } from "inversify";
import { MetadataRepository } from "../metadata/repository/metadata.repository";
import { MetadataService } from "../metadata/metadata.service";
import { ReportRepository } from "../report/repository/report.repository";
import { ReportService } from "../report/report.service";
import { SignalRepository } from "../signal/repository/signal.repository";
import { SignalService } from "../signal/signal.service";
import { SqliteDatabase } from "../storage/sqlite-database";
import { container } from "./container";
import { TOKENS } from "./tokens";

/**
 * Binding configuration for a dependency.
 */
interface BindingConfig {
	token: symbol;
	implementation: Newable<unknown>;
}

/**
 * All dependency bindings for the application.
 * Order matters: dependencies must be bound before their dependents.
 */
const BINDINGS: BindingConfig[] = [
	{ token: TOKENS.SqliteDatabase, implementation: SqliteDatabase },
	{ token: TOKENS.ReportRepository, implementation: ReportRepository },
	{ token: TOKENS.ReportService, implementation: ReportService },
	{ token: TOKENS.SignalRepository, implementation: SignalRepository },
	{ token: TOKENS.MetadataRepository, implementation: MetadataRepository },
	{ token: TOKENS.SignalService, implementation: SignalService },
	{ token: TOKENS.MetadataService, implementation: MetadataService },
];

/**
 * Setup the inversify container with all dependencies.
 * Safe to call multiple times - will skip if already bound.
 */
export function setupContainer(): void {
	for (const { token, implementation } of BINDINGS) {
		if (!container.isBound(token)) {
			container.bind(token).to(implementation).inSingletonScope();
		}
	}
}
