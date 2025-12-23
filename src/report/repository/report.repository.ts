import { inject, injectable } from "inversify";
import { TOKENS } from "../../container";
import type { SqliteDatabase } from "../../storage/sqlite-database";
import type { ReportType } from "../../types/report.type";
import type { ReportRepository as ReportRepositoryInterface } from "../types/report.repository.interface";
import type { ReportRow } from "../types/report-row.interface";
import type { StoredReport } from "../types/stored-report.interface";

/**
 * SQLite implementation of report storage.
 * Uses better-sqlite3 for synchronous operations.
 */
@injectable()
export class ReportRepository implements ReportRepositoryInterface {
	constructor(
		@inject(TOKENS.SqliteDatabase)
		private readonly database: SqliteDatabase
	) {}

	/**
	 * Save a report to the database with auto-generated timestamp (upsert behavior).
	 */
	save(taskId: string, reportType: ReportType, content: string): void {
		const db = this.database.getDatabase();
		const stmt = db.prepare(`
			INSERT OR REPLACE INTO reports (task_id, report_type, content, saved_at)
			VALUES (?, ?, ?, ?)
		`);
		const savedAt = new Date().toISOString();
		stmt.run(taskId, reportType, content, savedAt);
	}

	/**
	 * Get a report from the database.
	 */
	get(taskId: string, reportType: ReportType): StoredReport | undefined {
		const db = this.database.getDatabase();
		const stmt = db.prepare(`
			SELECT task_id, report_type, content, saved_at
			FROM reports
			WHERE task_id = ? AND report_type = ?
		`);
		const row = stmt.get(taskId, reportType) as ReportRow | undefined;

		if (!row) {
			return undefined;
		}

		return {
			taskId: row.task_id,
			reportType: row.report_type as ReportType,
			content: row.content,
			savedAt: row.saved_at,
		};
	}

	/**
	 * Clear all reports from the database.
	 */
	clear(): void {
		const db = this.database.getDatabase();
		db.exec("DELETE FROM reports");
	}
}
