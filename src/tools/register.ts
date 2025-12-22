import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getReportSchema } from "./schemas/get-report.schema";
import { saveReportSchema } from "./schemas/save-report.schema";
import { saveSignalSchema } from "./schemas/save-signal.schema";
import { TOKENS, container } from "../container";
import { IReportService } from "../types/report-service.interface";
import { ISignalService } from "../types/signal-service.interface";

/**
 * Register all MCP tools with the server.
 * @param server - The MCP server instance to register tools on
 */
export function registerTools(server: McpServer): void {
	const reportService = container.get<IReportService>(TOKENS.ReportService);
	const signalService = container.get<ISignalService>(TOKENS.SignalService);

	server.registerTool(
		"save-report",
		{
			description: "Save a workflow report",
			inputSchema: saveReportSchema.shape,
		},
		async (input) => {
			const result = await reportService.saveReport(input);
			return { content: [{ type: "text", text: JSON.stringify(result) }] };
		}
	);

	server.registerTool(
		"get-report",
		{
			description: "Get a workflow report",
			inputSchema: getReportSchema.shape,
		},
		async (input) => {
			const result = await reportService.getReport(input);
			return { content: [{ type: "text", text: JSON.stringify(result) }] };
		}
	);

	server.registerTool(
		"save-signal",
		{
			description: "Save a workflow signal with status and summary",
			inputSchema: saveSignalSchema.shape,
		},
		async (input) => {
			const result = await signalService.saveSignal(input);
			return { content: [{ type: "text", text: JSON.stringify(result) }] };
		}
	);
}
