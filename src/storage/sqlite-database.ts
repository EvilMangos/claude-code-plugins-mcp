import Database from "better-sqlite3";
import { injectable } from "inversify";

/**
 * Shared SQLite database manager with lazy initialization.
 * Creates all required tables on first access.
 */
@injectable()
export class SqliteDatabase {
	private db: Database.Database | null = null;
	private readonly dbPath: string;

	/**
	 * Create a new SqliteDatabase instance.
	 * @param dbPath - Path to the database file. Defaults to 'mcp-storage.db' in CWD.
	 *                 Use ':memory:' for in-memory database (useful for testing).
	 */
	constructor(dbPath: string = "mcp-storage.db") {
		this.dbPath = dbPath;
	}

	/**
	 * Get the database instance, initializing it lazily if needed.
	 * Creates all required tables on first access.
	 */
	getDatabase(): Database.Database {
		if (this.db === null) {
			this.db = new Database(this.dbPath);
			this.initializeTables();
		}
		return this.db;
	}

	/**
	 * Close the database connection.
	 * Safe to call multiple times or on never-opened database.
	 */
	close(): void {
		if (this.db !== null) {
			this.db.close();
			this.db = null;
		}
	}

	/**
	 * Initialize all required tables.
	 */
	private initializeTables(): void {
		const db = this.db!;

		// Create reports table with composite primary key
		db.exec(`
			CREATE TABLE IF NOT EXISTS reports (
				task_id TEXT NOT NULL,
				report_type TEXT NOT NULL,
				content TEXT NOT NULL,
				saved_at TEXT NOT NULL,
				PRIMARY KEY (task_id, report_type)
			)
		`);

		// Create signals table with composite primary key
		db.exec(`
			CREATE TABLE IF NOT EXISTS signals (
				task_id TEXT NOT NULL,
				signal_type TEXT NOT NULL,
				content TEXT NOT NULL,
				saved_at TEXT NOT NULL,
				PRIMARY KEY (task_id, signal_type)
			)
		`);

		// Create metadata table with single primary key on task_id
		db.exec(`
			CREATE TABLE IF NOT EXISTS metadata (
				task_id TEXT PRIMARY KEY,
				started_at TEXT NOT NULL,
				completed_at TEXT,
				saved_at TEXT NOT NULL,
				execution_steps TEXT NOT NULL,
				current_step_index INTEGER NOT NULL
			)
		`);
	}
}
