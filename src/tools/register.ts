import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { saveReport } from "./save-report";
import { saveReportSchema } from "./schemas/save-report.schema";

/**
 * Register all MCP tools with the server.
 * @param server - The MCP server instance to register tools on
 */
export function registerTools(server: McpServer): void {
	server.registerTool(
		"save-report",
		{
			description: "Save a workflow report to in-memory storage",
			inputSchema: saveReportSchema.shape,
		},
		async (input) => {
			const result = await saveReport(input);
			return { content: [{ type: "text", text: JSON.stringify(result) }] };
		}
	);
}
