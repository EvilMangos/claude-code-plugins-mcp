import type { ReportType } from "../../types/report.type";
import type { SignalContent } from "../schemas/save-signal.schema";

/**
 * Stored signal structure.
 */
export interface IStoredSignal {
	taskId: string;
	signalType: ReportType;
	content: SignalContent;
	savedAt: string;
}
