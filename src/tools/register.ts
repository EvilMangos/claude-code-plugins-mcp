import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOKENS, container } from "../container";
import {
	CreateMetadataInput,
	createMetadataSchema,
} from "../metadata/schemas/create-metadata.schema";
import {
	GetNextStepInput,
	getNextStepSchema,
} from "../metadata/schemas/get-next-step.schema";
import type { MetadataService } from "../metadata/types/metadata.service.interface";
import {
	GetReportInput,
	getReportSchema,
} from "../report/schemas/get-report.schema";
import {
	SaveReportInput,
	saveReportSchema,
} from "../report/schemas/save-report.schema";
import type { ReportService } from "../report/types/report.service.interface";
import {
	SaveSignalInput,
	saveSignalSchema,
} from "../signal/schemas/save-signal.schema";
import {
	WaitSignalInput,
	waitSignalSchema,
} from "../signal/schemas/wait-signal.schema";
import type { SignalService } from "../signal/types/signal.service.interface";

/**
 * Register all MCP tools with the server.
 * @param server - The MCP server instance to register tools on
 */
export function registerTools(server: McpServer): void {
	const reportService = container.get<ReportService>(TOKENS.ReportService);
	const signalService = container.get<SignalService>(TOKENS.SignalService);
	const metadataService = container.get<MetadataService>(
		TOKENS.MetadataService
	);

	server.registerTool(
		"save-report",
		{
			description: "Save a workflow report",
			inputSchema: saveReportSchema.shape,
		},
		async (input: SaveReportInput) => {
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
		async (input: GetReportInput) => {
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
		async (input: SaveSignalInput) => {
			const result = await signalService.saveSignal(input);
			return { content: [{ type: "text", text: JSON.stringify(result) }] };
		}
	);

	server.registerTool(
		"wait-signal",
		{
			description:
				"Wait for a workflow signal to appear. Polls until the signal is found or timeout is reached.",
			inputSchema: waitSignalSchema.shape,
		},
		async (input: WaitSignalInput) => {
			const result = await signalService.waitSignal(input);
			return { content: [{ type: "text", text: JSON.stringify(result) }] };
		}
	);

	server.registerTool(
		"create-metadata",
		{
			description: "Create task lifecycle metadata with execution steps",
			inputSchema: createMetadataSchema.shape,
		},
		async (input: CreateMetadataInput) => {
			const result = await metadataService.createMetadata(input);
			return { content: [{ type: "text", text: JSON.stringify(result) }] };
		}
	);

	server.registerTool(
		"get-next-step",
		{
			description: "Get the next workflow step for a task",
			inputSchema: getNextStepSchema.shape,
		},
		async (input: GetNextStepInput) => {
			const result = await metadataService.getNextStep(input);
			return { content: [{ type: "text", text: JSON.stringify(result) }] };
		}
	);
}
