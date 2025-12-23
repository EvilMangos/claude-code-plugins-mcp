import { inject, injectable } from "inversify";
import { TOKENS } from "../../container";
import type { SqliteDatabase } from "../../storage/sqlite-database";
import type { ExecutionStep } from "../../types/execution-step.type";
import type { IMetadataRepository } from "../types/metadata.repository.interface";
import type { IStoredMetadata } from "../types/stored-metadata.interface";

/**
 * Row structure for metadata table in SQLite.
 */
interface MetadataRow {
	task_id: string;
	started_at: string;
	completed_at: string | null;
	saved_at: string;
	execution_steps: string;
	current_step_index: number;
}

/**
 * SQLite implementation of metadata storage.
 * Uses better-sqlite3 for synchronous operations.
 * ExecutionSteps are serialized as JSON.
 */
@injectable()
export class MetadataRepository implements IMetadataRepository {
	constructor(
		@inject(TOKENS.SqliteDatabase)
		private readonly database: SqliteDatabase
	) {}

	/**
	 * Create metadata for a new task with auto-generated timestamps.
	 * Sets startedAt and savedAt, initializes currentStepIndex to 0.
	 */
	create(taskId: string, executionSteps: ExecutionStep[]): void {
		const now = new Date().toISOString();
		this.save({
			taskId,
			startedAt: now,
			savedAt: now,
			executionSteps,
			currentStepIndex: 0,
		});
	}

	/**
	 * Save metadata to the database (upsert behavior).
	 * ExecutionSteps are serialized to JSON.
	 */
	private save(metadata: IStoredMetadata): void {
		const db = this.database.getDatabase();
		const stmt = db.prepare(`
			INSERT OR REPLACE INTO metadata (task_id, started_at, completed_at, saved_at, execution_steps, current_step_index)
			VALUES (?, ?, ?, ?, ?, ?)
		`);
		const executionStepsJson = JSON.stringify(metadata.executionSteps);
		stmt.run(
			metadata.taskId,
			metadata.startedAt,
			metadata.completedAt ?? null,
			metadata.savedAt,
			executionStepsJson,
			metadata.currentStepIndex
		);
	}

	/**
	 * Get metadata from the database.
	 * ExecutionSteps are deserialized from JSON.
	 * Returns undefined if the stored JSON is malformed.
	 */
	get(taskId: string): IStoredMetadata | undefined {
		const db = this.database.getDatabase();
		const stmt = db.prepare(`
			SELECT task_id, started_at, completed_at, saved_at, execution_steps, current_step_index
			FROM metadata
			WHERE task_id = ?
		`);
		const row = stmt.get(taskId) as MetadataRow | undefined;

		if (!row) {
			return undefined;
		}

		let executionSteps: ExecutionStep[];
		try {
			executionSteps = JSON.parse(row.execution_steps) as ExecutionStep[];
		} catch {
			// Return undefined for malformed JSON to maintain database resilience
			return undefined;
		}

		const result: IStoredMetadata = {
			taskId: row.task_id,
			startedAt: row.started_at,
			savedAt: row.saved_at,
			executionSteps,
			currentStepIndex: row.current_step_index,
		};

		// Only include completedAt if it's not null
		if (row.completed_at !== null) {
			result.completedAt = row.completed_at;
		}

		return result;
	}

	/**
	 * Increment the currentStepIndex for a task.
	 * No-op if metadata doesn't exist.
	 * Sets completedAt when incrementing from the last step.
	 */
	incrementStep(taskId: string): void {
		const metadata = this.get(taskId);
		if (!metadata) return;

		const now = new Date().toISOString();
		const maxIndex = metadata.executionSteps.length - 1;

		if (metadata.currentStepIndex >= maxIndex) {
			// At last step - mark as complete
			this.save({
				...metadata,
				completedAt: now,
				savedAt: now,
			});
			return;
		}

		this.save({
			...metadata,
			currentStepIndex: metadata.currentStepIndex + 1,
			savedAt: now,
		});
	}

	/**
	 * Decrement the currentStepIndex for a task.
	 * No-op if metadata doesn't exist or already at step 0.
	 */
	decrementStep(taskId: string): void {
		const metadata = this.get(taskId);
		if (!metadata) return;

		if (metadata.currentStepIndex <= 0) return;

		const now = new Date().toISOString();
		this.save({
			...metadata,
			currentStepIndex: metadata.currentStepIndex - 1,
			savedAt: now,
		});
	}

	/**
	 * Clear all metadata from the database.
	 */
	clear(): void {
		const db = this.database.getDatabase();
		db.exec("DELETE FROM metadata");
	}
}
