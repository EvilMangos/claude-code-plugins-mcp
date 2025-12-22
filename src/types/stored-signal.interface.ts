import type { ReportType } from "./report.type";
import type { SignalContent } from "../tools/schemas/save-signal.schema";

/**
 * Stored signal structure.
 */
export interface IStoredSignal {
	taskId: string;
	signalType: ReportType;
	content: SignalContent;
	savedAt: string;
}
