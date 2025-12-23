/**
 * Row structure for metadata table in SQLite.
 */
export interface MetadataRow {
	task_id: string;
	started_at: string;
	completed_at: string | null;
	saved_at: string;
	execution_steps: string;
	current_step_index: number;
}
