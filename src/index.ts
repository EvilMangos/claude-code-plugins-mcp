import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// In-memory data store (replace with your preferred storage)
const dataStore = new Map<string, unknown>();

// Create MCP server
const server = new McpServer({
	name: "claude-code-plugins-mcp",
	version: "0.1.0",
});

// Tool: Store data
server.tool(
	"store",
	"Store data with a given key",
	{
		key: z.string().describe("Unique key to store the data under"),
		value: z
			.unknown()
			.describe("The data to store (any JSON-serializable value)"),
	},
	async ({ key, value }) => {
		dataStore.set(key, value);
		return {
			content: [
				{
					type: "text" as const,
					text: `Stored data under key: ${key}`,
				},
			],
		};
	}
);

// Tool: Retrieve data
server.tool(
	"retrieve",
	"Retrieve data by key",
	{
		key: z.string().describe("Key to retrieve data for"),
	},
	async ({ key }) => {
		const value = dataStore.get(key);
		if (value === undefined) {
			return {
				content: [
					{
						type: "text" as const,
						text: `No data found for key: ${key}`,
					},
				],
			};
		}
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(value, null, 2),
				},
			],
		};
	}
);

// Tool: List all keys
server.tool("list_keys", "List all stored keys", {}, async () => {
	const keys = Array.from(dataStore.keys());
	return {
		content: [
			{
				type: "text" as const,
				text: keys.length > 0 ? keys.join("\n") : "No keys stored",
			},
		],
	};
});

// Tool: Delete data
server.tool(
	"delete",
	"Delete data by key",
	{
		key: z.string().describe("Key to delete"),
	},
	async ({ key }) => {
		const deleted = dataStore.delete(key);
		return {
			content: [
				{
					type: "text" as const,
					text: deleted ? `Deleted key: ${key}` : `Key not found: ${key}`,
				},
			],
		};
	}
);

// Start the server
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("MCP server running on stdio");
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
