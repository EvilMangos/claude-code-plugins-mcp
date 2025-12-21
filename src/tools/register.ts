import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getReport } from "./get-report";
import { saveReport } from "./save-report";
import { getReportSchema } from "./schemas/get-report.schema";
import { saveReportSchema } from "./schemas/save-report.schema";

/**
 * Register all MCP tools with the server.
 * @param server - The MCP server instance to register tools on
 */
export function registerTools(server: McpServer): void {
	server.registerTool(
		"save-report",
		{
			description: "Save a workflow report",
			inputSchema: saveReportSchema.shape,
		},
		async (input) => {
			const result = await saveReport(input);
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
			const result = await getReport(input);
			return { content: [{ type: "text", text: JSON.stringify(result) }] };
		}
	);
}
