/**
 * Row structure for signals table in SQLite.
 */
export interface SignalRow {
	task_id: string;
	signal_type: string;
	content: string;
	saved_at: string;
}
