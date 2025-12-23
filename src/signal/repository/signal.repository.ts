import { inject, injectable } from "inversify";
import { TOKENS } from "../../container";
import type { SqliteDatabase } from "../../storage/sqlite-database";
import type { ReportType } from "../../types/report.type";
import type { SignalContent } from "../schemas/signal-content.schema";
import type { ISignalRepository } from "../types/signal.repository.interface";
import type { IStoredSignal } from "../types/stored-signal.interface";

/**
 * Row structure for signals table in SQLite.
 */
interface SignalRow {
	task_id: string;
	signal_type: string;
	content: string;
	saved_at: string;
}

/**
 * SQLite implementation of signal repository.
 * Uses better-sqlite3 for synchronous operations.
 * Content is serialized as JSON.
 */
@injectable()
export class SignalRepository implements ISignalRepository {
	constructor(
		@inject(TOKENS.SqliteDatabase)
		private readonly database: SqliteDatabase
	) {}

	/**
	 * Save a signal to the database with auto-generated timestamp (upsert behavior).
	 * Content is serialized to JSON.
	 */
	save(taskId: string, signalType: ReportType, content: SignalContent): void {
		const db = this.database.getDatabase();
		const stmt = db.prepare(`
			INSERT OR REPLACE INTO signals (task_id, signal_type, content, saved_at)
			VALUES (?, ?, ?, ?)
		`);
		const contentJson = JSON.stringify(content);
		const savedAt = new Date().toISOString();
		stmt.run(taskId, signalType, contentJson, savedAt);
	}

	/**
	 * Get a signal from the database.
	 * Content is deserialized from JSON.
	 * Returns undefined if the stored JSON is malformed.
	 */
	get(taskId: string, signalType: ReportType): IStoredSignal | undefined {
		const db = this.database.getDatabase();
		const stmt = db.prepare(`
			SELECT task_id, signal_type, content, saved_at
			FROM signals
			WHERE task_id = ? AND signal_type = ?
		`);
		const row = stmt.get(taskId, signalType) as SignalRow | undefined;

		if (!row) {
			return undefined;
		}

		let content: SignalContent;
		try {
			content = JSON.parse(row.content) as SignalContent;
		} catch {
			// Return undefined for malformed JSON to maintain database resilience
			return undefined;
		}

		return {
			taskId: row.task_id,
			signalType: row.signal_type as ReportType,
			content,
			savedAt: row.saved_at,
		};
	}

	/**
	 * Clear all signals from the database.
	 */
	clear(): void {
		const db = this.database.getDatabase();
		db.exec("DELETE FROM signals");
	}
}
