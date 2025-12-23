/**
 * Row structure for reports table in SQLite.
 */
export interface ReportRow {
	task_id: string;
	report_type: string;
	content: string;
	saved_at: string;
}
