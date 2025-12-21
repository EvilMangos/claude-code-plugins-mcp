/**
 * Result type for the getReport function.
 */
export interface GetReportResult {
	success: boolean;
	content?: string | null;
	error?: string;
}
