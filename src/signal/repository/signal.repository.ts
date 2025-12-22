import { inject, injectable } from "inversify";
import { TOKENS } from "../../container";
import type { ReportType } from "../../types/report.type";
import type { ISignalRepository } from "../types/signal-repository.interface";
import type { ISignalStorage } from "../types/signal-storage.interface";
import type { IStoredSignal } from "../types/stored-signal.interface";
import type { SignalContent } from "../schemas/save-signal.schema";

/**
 * Repository for managing workflow signals.
 * Wraps the underlying storage implementation and handles timestamp generation.
 */
@injectable()
export class SignalRepositoryImpl implements ISignalRepository {
	constructor(
		@inject(TOKENS.SignalStorage) private readonly storage: ISignalStorage
	) {}

	/**
	 * Save a signal to storage with auto-generated timestamp.
	 * @param taskId - The task identifier
	 * @param signalType - The type of signal (workflow step)
	 * @param content - The signal content with status and summary
	 */
	save(taskId: string, signalType: ReportType, content: SignalContent): void {
		const storedSignal: IStoredSignal = {
			taskId,
			signalType,
			content,
			savedAt: new Date().toISOString(),
		};
		this.storage.save(storedSignal);
	}

	/**
	 * Get a signal from storage.
	 * @param taskId - The task identifier
	 * @param signalType - The type of signal (workflow step)
	 * @returns The stored signal if found, undefined otherwise
	 */
	get(taskId: string, signalType: ReportType): IStoredSignal | undefined {
		return this.storage.get(taskId, signalType);
	}

	/**
	 * Clear all signals from storage.
	 * Useful for test isolation.
	 */
	clear(): void {
		this.storage.clear();
	}
}
