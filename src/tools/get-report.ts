import { reportRepository } from "../storage/report-repository";
import type { GetReportResult } from "../types/get-report-result";
import { formatStorageError } from "../utils/format-storage-error";
import { formatZodError } from "../utils/format-zod-error";
import { GetReportInput, getReportSchema } from "./schemas/get-report.schema";

/**
 * Get a workflow report from in-memory storage.
 * @param input - The report input containing taskId and reportType
 * @returns A result object with success status and optional report or error message
 */
export async function getReport(
	input: GetReportInput
): Promise<GetReportResult> {
	// Validate input
	const parseResult = getReportSchema.safeParse(input);

	if (!parseResult.success) {
		return {
			success: false,
			error: formatZodError(parseResult.error),
		};
	}

	const validatedInput = parseResult.data;

	try {
		// Get report from repository
		const report = reportRepository.get(
			validatedInput.taskId,
			validatedInput.reportType
		);

		if (report) {
			return { success: true, content: report.content };
		}

		// Report not found
		return { success: true, content: null };
	} catch (error) {
		return {
			success: false,
			error: formatStorageError(error),
		};
	}
}
