import { parseMarkdownToADF } from "@markdown-confluence/lib";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import MarkdownIt from "markdown-it";
import fs from "fs/promises";
import path from "path";

const TOOL_NAME = "markdown_to_confluence_preview";
const DEFAULT_PREVIEW_DIR = ".mcp-previews";

type PreviewInput = {
	markdown: string;
	confluenceBaseUrl?: string;
	preview?: boolean;
	outputDir?: string;
};

type Heading = {
	level: number;
	text: string;
};

const markdownIt = new MarkdownIt({
	html: true,
	linkify: true,
	breaks: false,
});

function normalizeMarkdownWithToc(markdown: string) {
	const lines = markdown.split(/\r?\n/);
	const headingRegex = /^(#{1,6})\s+(.*)$/;
	const headingLines = new Map<number, Heading>();
	let minLevel = Infinity;
	let inFence = false;
	let fenceMarker = "";

	lines.forEach((line, index) => {
		const fenceMatch = line.match(/^(\s*)(```|~~~)/);
		if (fenceMatch) {
			const marker = fenceMatch[2];
			if (!marker) {
				return;
			}
			if (!inFence) {
				inFence = true;
				fenceMarker = marker;
			} else if (marker === fenceMarker) {
				inFence = false;
				fenceMarker = "";
			}
			return;
		}

		if (inFence) {
			return;
		}

		const match = line.match(headingRegex);
		if (!match) {
			return;
		}

		const levelToken = match[1];
		const textToken = match[2];
		if (!levelToken || textToken === undefined) {
			return;
		}
		const level = levelToken.length;
		const text = textToken.trim();
		headingLines.set(index, { level, text });
		minLevel = Math.min(minLevel, level);
	});

	if (headingLines.size === 0) {
		return {
			normalizedMarkdown: markdown,
			tocMarkdown: "",
			headings: [] as Heading[],
		};
	}

	const shift = Math.max(0, minLevel - 1);
	const normalizedLines = lines.map((line, index) => {
		const heading = headingLines.get(index);
		if (!heading) {
			return line;
		}
		const normalizedLevel = Math.min(6, Math.max(1, heading.level - shift));
		headingLines.set(index, { level: normalizedLevel, text: heading.text });
		return `${"#".repeat(normalizedLevel)} ${heading.text}`;
	});

	const headings = Array.from(headingLines.values());
	const tocLines = headings.map((heading) => {
		const indent = "  ".repeat(Math.max(0, heading.level - 1));
		const anchor = slugifyHeading(heading.text);
		return `${indent}- [${heading.text}](#${anchor})`;
	});

	const tocMarkdown = ["## Table of Contents", ...tocLines].join("\n");
	const normalizedMarkdown = `${tocMarkdown}\n\n${normalizedLines.join(
		"\n",
	)}`;

	return { normalizedMarkdown, tocMarkdown, headings };
}

function slugifyHeading(text: string) {
	const cleaned = text
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	return encodeURIComponent(cleaned);
}

function buildHtmlPreview(renderedHtml: string, title: string) {
	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; padding: 32px; color: #1f2a37; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.4em; }
    pre { background: #f6f8fa; padding: 12px; overflow: auto; }
    code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; }
    a { color: #0969da; }
    blockquote { border-left: 3px solid #e5e7eb; padding-left: 12px; color: #4b5563; }
  </style>
</head>
<body>
${renderedHtml}
</body>
</html>`;
}

function escapeHtml(text: string) {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

async function writePreviewHtml(html: string, outputDir?: string) {
	const resolvedDir =
		outputDir ?? path.join(process.cwd(), DEFAULT_PREVIEW_DIR);
	await fs.mkdir(resolvedDir, { recursive: true });
	const filename = `preview-${Date.now()}`;
	const filePath = path.join(resolvedDir, `${filename}.html`);
	await fs.writeFile(filePath, html, "utf8");
	return { filePath, filename, resolvedDir };
}

async function writeAdfJson(
	adfDoc: unknown,
	outputDir: string,
	baseName: string,
) {
	const adfPath = path.join(outputDir, `${baseName}.adf.json`);
	await fs.writeFile(adfPath, JSON.stringify(adfDoc, null, 2), "utf8");
	return adfPath;
}

async function handlePreview(input: PreviewInput) {
	if (!input.markdown || typeof input.markdown !== "string") {
		throw new Error("markdown is required");
	}

	const { normalizedMarkdown, tocMarkdown, headings } =
		normalizeMarkdownWithToc(input.markdown);

	const adfDoc = parseMarkdownToADF(
		normalizedMarkdown,
		input.confluenceBaseUrl ?? "",
	);

	let previewHtmlPath: string | undefined;
	let adfJsonPath: string | undefined;
	if (input.preview !== false) {
		const renderedHtml = markdownIt.render(normalizedMarkdown);
		const title = headings.at(0)?.text ?? "Markdown Preview";
		const html = buildHtmlPreview(renderedHtml, title);
		const { filePath, filename, resolvedDir } = await writePreviewHtml(
			html,
			input.outputDir,
		);
		previewHtmlPath = filePath;
		adfJsonPath = await writeAdfJson(adfDoc, resolvedDir, filename);
	}

	return {
		normalizedMarkdown,
		tocMarkdown,
		adf: adfDoc,
		publishPayload: {
			contentType: "adf",
			body: adfDoc,
		},
		adfJsonPath,
		previewHtmlPath,
	};
}

async function startServer() {
	const server = new Server(
		{ name: "markdown-confluence-mcp", version: "0.1.0" },
		{ capabilities: { tools: {} } },
	);

	server.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: [
				{
					name: TOOL_NAME,
					description:
						"Normalize Markdown headings, generate a TOC, convert to ADF, and emit an HTML preview file.",
					inputSchema: {
						type: "object",
						properties: {
							markdown: {
								type: "string",
								description: "Markdown content.",
							},
							confluenceBaseUrl: {
								type: "string",
								description:
									"Optional Confluence base URL used during conversion.",
							},
							preview: {
								type: "boolean",
								description:
									"Whether to emit an HTML preview file.",
								default: true,
							},
							outputDir: {
								type: "string",
								description:
									"Directory to write preview HTML files.",
							},
						},
						required: ["markdown"],
					},
				},
			],
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		if (request.params.name !== TOOL_NAME) {
			return {
				content: [
					{
						type: "text",
						text: `Unknown tool: ${request.params.name}`,
					},
				],
				isError: true,
			};
		}

		try {
			const args = (request.params.arguments ?? {}) as PreviewInput;
			const result = await handlePreview(args);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			return {
				content: [
					{
						type: "text",
						text: `Error: ${message}`,
					},
				],
				isError: true,
			};
		}
	});

	const transport = new StdioServerTransport();
	await server.connect(transport);
}

startServer().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`Failed to start MCP server: ${message}\n`);
	process.exit(1);
});
