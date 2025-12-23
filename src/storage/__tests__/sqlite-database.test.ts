import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SqliteDatabase } from "../sqlite-database";

describe("SqliteDatabase", () => {
	let database: SqliteDatabase;

	beforeEach(() => {
		// Use in-memory database for test isolation
		database = new SqliteDatabase(":memory:");
	});

	afterEach(() => {
		database.close();
	});

	describe("Database Instance Creation", () => {
		it("should create database instance without opening connection", () => {
			const db = new SqliteDatabase(":memory:");

			expect(db).toBeDefined();
			expect(db).toBeInstanceOf(SqliteDatabase);

			db.close();
		});

		it("should accept custom database path", () => {
			const customPath = ":memory:";
			const db = new SqliteDatabase(customPath);

			expect(db).toBeDefined();

			db.close();
		});
	});

	describe("Lazy Initialization", () => {
		it("should not open database until getDatabase is called", () => {
			const db = new SqliteDatabase(":memory:");

			// Database should be created but connection should be lazy
			expect(db).toBeDefined();

			// First access should open the connection
			const connection = db.getDatabase();
			expect(connection).toBeDefined();

			db.close();
		});

		it("should return same database instance on multiple getDatabase calls", () => {
			const firstCall = database.getDatabase();
			const secondCall = database.getDatabase();

			expect(firstCall).toBe(secondCall);
		});
	});

	describe("Table Creation on First Access", () => {
		it("should create reports table on first access", () => {
			const db = database.getDatabase();

			const tableInfo = db
				.prepare(
					"SELECT name FROM sqlite_master WHERE type='table' AND name='reports'"
				)
				.get() as { name: string } | undefined;

			expect(tableInfo).toBeDefined();
			expect(tableInfo?.name).toBe("reports");
		});

		it("should create signals table on first access", () => {
			const db = database.getDatabase();

			const tableInfo = db
				.prepare(
					"SELECT name FROM sqlite_master WHERE type='table' AND name='signals'"
				)
				.get() as { name: string } | undefined;

			expect(tableInfo).toBeDefined();
			expect(tableInfo?.name).toBe("signals");
		});

		it("should create metadata table on first access", () => {
			const db = database.getDatabase();

			const tableInfo = db
				.prepare(
					"SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'"
				)
				.get() as { name: string } | undefined;

			expect(tableInfo).toBeDefined();
			expect(tableInfo?.name).toBe("metadata");
		});

		it("should create reports table with correct schema", () => {
			const db = database.getDatabase();

			const columns = db.prepare("PRAGMA table_info(reports)").all() as Array<{
				name: string;
				type: string;
				notnull: number;
				pk: number;
			}>;

			const columnNames = columns.map((c) => c.name);
			expect(columnNames).toContain("task_id");
			expect(columnNames).toContain("report_type");
			expect(columnNames).toContain("content");
			expect(columnNames).toContain("saved_at");
		});

		it("should create signals table with correct schema", () => {
			const db = database.getDatabase();

			const columns = db.prepare("PRAGMA table_info(signals)").all() as Array<{
				name: string;
				type: string;
				notnull: number;
				pk: number;
			}>;

			const columnNames = columns.map((c) => c.name);
			expect(columnNames).toContain("task_id");
			expect(columnNames).toContain("signal_type");
			expect(columnNames).toContain("content");
			expect(columnNames).toContain("saved_at");
		});

		it("should create metadata table with correct schema", () => {
			const db = database.getDatabase();

			const columns = db.prepare("PRAGMA table_info(metadata)").all() as Array<{
				name: string;
				type: string;
				notnull: number;
				pk: number;
			}>;

			const columnNames = columns.map((c) => c.name);
			expect(columnNames).toContain("task_id");
			expect(columnNames).toContain("started_at");
			expect(columnNames).toContain("completed_at");
			expect(columnNames).toContain("saved_at");
			expect(columnNames).toContain("execution_steps");
			expect(columnNames).toContain("current_step_index");
		});

		it("should create reports table with composite primary key", () => {
			const db = database.getDatabase();

			const columns = db.prepare("PRAGMA table_info(reports)").all() as Array<{
				name: string;
				pk: number;
			}>;

			const pkColumns = columns.filter((c) => c.pk > 0);
			expect(pkColumns.length).toBe(2);
			expect(pkColumns.map((c) => c.name)).toContain("task_id");
			expect(pkColumns.map((c) => c.name)).toContain("report_type");
		});

		it("should create signals table with composite primary key", () => {
			const db = database.getDatabase();

			const columns = db.prepare("PRAGMA table_info(signals)").all() as Array<{
				name: string;
				pk: number;
			}>;

			const pkColumns = columns.filter((c) => c.pk > 0);
			expect(pkColumns.length).toBe(2);
			expect(pkColumns.map((c) => c.name)).toContain("task_id");
			expect(pkColumns.map((c) => c.name)).toContain("signal_type");
		});

		it("should create metadata table with single primary key on task_id", () => {
			const db = database.getDatabase();

			const columns = db.prepare("PRAGMA table_info(metadata)").all() as Array<{
				name: string;
				pk: number;
			}>;

			const pkColumns = columns.filter((c) => c.pk > 0);
			expect(pkColumns.length).toBe(1);
			expect(pkColumns[0].name).toBe("task_id");
		});
	});

	describe("Close Operation", () => {
		it("should close database connection without error", () => {
			database.getDatabase(); // Ensure connection is open

			expect(() => database.close()).not.toThrow();
		});

		it("should allow close on never-opened database", () => {
			const db = new SqliteDatabase(":memory:");

			expect(() => db.close()).not.toThrow();
		});

		it("should allow multiple close calls", () => {
			database.getDatabase();

			expect(() => {
				database.close();
				database.close();
			}).not.toThrow();
		});
	});

	describe("Database Operations After Initialization", () => {
		it("should allow insert operations on reports table", () => {
			const db = database.getDatabase();

			const insert = db.prepare(`
				INSERT INTO reports (task_id, report_type, content, saved_at)
				VALUES (?, ?, ?, ?)
			`);

			expect(() =>
				insert.run(
					"task-1",
					"requirements",
					"test content",
					"2025-01-01T00:00:00.000Z"
				)
			).not.toThrow();
		});

		it("should allow insert operations on signals table", () => {
			const db = database.getDatabase();

			const insert = db.prepare(`
				INSERT INTO signals (task_id, signal_type, content, saved_at)
				VALUES (?, ?, ?, ?)
			`);

			expect(() =>
				insert.run(
					"task-1",
					"requirements",
					JSON.stringify({ status: "passed", summary: "test" }),
					"2025-01-01T00:00:00.000Z"
				)
			).not.toThrow();
		});

		it("should allow insert operations on metadata table", () => {
			const db = database.getDatabase();

			const insert = db.prepare(`
				INSERT INTO metadata (task_id, started_at, completed_at, saved_at, execution_steps, current_step_index)
				VALUES (?, ?, ?, ?, ?, ?)
			`);

			expect(() =>
				insert.run(
					"task-1",
					"2025-01-01T00:00:00.000Z",
					null,
					"2025-01-01T00:00:00.000Z",
					JSON.stringify(["requirements", "plan"]),
					0
				)
			).not.toThrow();
		});
	});
});
