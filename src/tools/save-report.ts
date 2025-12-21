import { StoredReport, reportStorage } from "../storage/report-storage.js";
import { formatZodError } from "../utils/format-zod-error.js";
import {
	SaveReportInput,
	SaveReportResult,
	saveReportSchema,
} from "./schemas/save-report.schema.js";

/**
 * Save a workflow report to in-memory storage.
 * @param input - The report input containing taskId, reportType, content, and fileType
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
			fileType: validatedInput.fileType,
			content: validatedInput.content,
			savedAt: new Date().toISOString(),
		};

		// Save to storage
		reportStorage.save(storedReport);

		return { success: true };
	} catch (error) {
		// Handle storage errors
		const errorMessage =
			error instanceof Error ? error.message : "Unknown storage error";
		return {
			success: false,
			error: errorMessage,
		};
	}
}
