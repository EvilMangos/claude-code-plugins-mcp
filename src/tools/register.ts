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
			description: [
				"Purpose: Persist a workflow report (markdown) for a given taskId and reportType.",
				"Use when: You have produced or updated the full report content for a workflow stage and need it stored for later retrieval or review.",
			].join("\n"),
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
			description: [
				"Purpose: Retrieve a previously saved workflow report for a given taskId and reportType.",
				"Use when: You need to read existing report content (e.g., to continue writing, reference prior work, or validate what was saved).",
			].join("\n"),
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
			description: [
				"Purpose: Persist a workflow signal for a task (e.g., status/result/summary) so other steps can react to it.",
				"Use when: You have completed a workflow step (or reached a checkpoint) and need to record the outcome for downstream tools or agents.",
			].join("\n"),
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
			description: [
				"Purpose: Wait until one or more workflow signals for a task become available, polling storage until found or timeout.",
				"Use when: You must block progress until the required signal(s) exist (e.g., waiting for another agent/step to finish and publish its result).",
			].join("\n"),
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
			description: [
				"Purpose: Initialize task lifecycle metadata, including the ordered set of workflow steps for a task.",
				"Use when: A new task is starting and you need to define its workflow plan/steps so the system can track progress and compute the next step.",
			].join("\n"),
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
			description: [
				"Purpose: Compute and return the next workflow step that should be executed for a task based on its metadata and current progress.",
				"Use when: You need to decide what to do next in the workflow (e.g., after completing a step, or when resuming a task).",
			].join("\n"),
			inputSchema: getNextStepSchema.shape,
		},
		async (input: GetNextStepInput) => {
			const result = await metadataService.getNextStep(input);
			return { content: [{ type: "text", text: JSON.stringify(result) }] };
		}
	);
}
