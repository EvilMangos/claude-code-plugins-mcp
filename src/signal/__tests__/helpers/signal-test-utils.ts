import type { ReportType } from "../../../types/report.type";
import type { StoredSignal } from "../../types/stored-signal.interface";
import type { SignalStatus } from "../../types/signal-status.type";

/**
 * Helper to create a stored signal for testing.
 */
export function createStoredSignal(
	taskId: string,
	signalType: ReportType,
	status: SignalStatus,
	summary: string
): StoredSignal {
	return {
		taskId,
		signalType,
		content: { status, summary },
		savedAt: new Date().toISOString(),
	};
}
