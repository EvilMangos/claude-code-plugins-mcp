import type { GetReportResult } from "./get-report-result.interface";
import type { SaveReportResult } from "./save-report-result.interface";
import type { GetReportInput } from "../schemas/get-report.schema";
import type { SaveReportInput } from "../schemas/save-report.schema";

/**
 * Interface for report service operations.
 */
export interface ReportService {
	/**
	 * Save a workflow report to report-repository.
	 * @param input - The report input containing taskId, reportType, and content
	 * @returns A result object with success status and optional error message
	 */
	saveReport(input: SaveReportInput): Promise<SaveReportResult>;

	/**
	 * Get a workflow report from report-repository.
	 * @param input - The report input containing taskId and reportType
	 * @returns A result object with success status and optional report or error message
	 */
	getReport(input: GetReportInput): Promise<GetReportResult>;
}
