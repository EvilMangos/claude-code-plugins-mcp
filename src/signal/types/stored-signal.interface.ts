import type { ReportType } from "../../types/report.type";
import { SignalContent } from "../schemas/signal-content.schema";

/**
 * Stored signal structure.
 */
export interface StoredSignal {
	taskId: string;
	signalType: ReportType;
	content: SignalContent;
	savedAt: string;
}
