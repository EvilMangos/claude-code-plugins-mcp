import type { IGetReportResult } from "./get-report-result.interface";
import type { ISaveReportResult } from "./save-report-result.interface";
import type { GetReportInput } from "../tools/schemas/get-report.schema";
import type { SaveReportInput } from "../tools/schemas/save-report.schema";

/**
 * Interface for report service operations.
 */
export interface IReportService {
	/**
	 * Save a workflow report to report-repository.
	 * @param input - The report input containing taskId, reportType, and content
	 * @returns A result object with success status and optional error message
	 */
	saveReport(input: SaveReportInput): Promise<ISaveReportResult>;

	/**
	 * Get a workflow report from report-repository.
	 * @param input - The report input containing taskId and reportType
	 * @returns A result object with success status and optional report or error message
	 */
	getReport(input: GetReportInput): Promise<IGetReportResult>;
}
