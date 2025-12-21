import { StoredReport, reportStorage } from "../storage/report-storage";
import type { SaveReportResult } from "../types/save-report-result";
import { formatStorageError } from "../utils/format-storage-error";
import { formatZodError } from "../utils/format-zod-error";
import {
	SaveReportInput,
	saveReportSchema,
} from "./schemas/save-report.schema";

/**
 * Save a workflow report to in-memory storage.
 * @param input - The report input containing taskId, reportType, and content
 * @returns A result object with success status and optional error message
 */
export async function saveReport(
	input: SaveReportInput
): Promise<SaveReportResult> {
	// Validate input
	const parseResult = saveReportSchema.safeParse(input);

	if (!parseResult.success) {
		return {
			success: false,
			error: formatZodError(parseResult.error),
		};
	}

	const validatedInput = parseResult.data;

	try {
		// Create stored report with timestamp
		const storedReport: StoredReport = {
			taskId: validatedInput.taskId,
			reportType: validatedInput.reportType,
			content: validatedInput.content,
			savedAt: new Date().toISOString(),
		};

		// Save to storage
		reportStorage.save(storedReport);

		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: formatStorageError(error),
		};
	}
}
