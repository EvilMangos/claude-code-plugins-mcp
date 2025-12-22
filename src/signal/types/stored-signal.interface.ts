import type { ReportType } from "../../types/report.type";
import { SignalContent } from "../schemas/signal-content.schema";

/**
 * Stored signal structure.
 */
export interface IStoredSignal {
	taskId: string;
	signalType: ReportType;
	content: SignalContent;
	savedAt: string;
}
