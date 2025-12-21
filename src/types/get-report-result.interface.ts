/**
 * Result type for the getReport function.
 */
export interface IGetReportResult {
	success: boolean;
	content?: string | null;
	error?: string;
}
