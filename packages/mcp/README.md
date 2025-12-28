# @markdown-confluence/mcp

MCP server that normalizes Markdown headings, generates a table of contents, converts Markdown to ADF via `@markdown-confluence/lib`, and writes a local HTML preview file.

## Usage

Build the package and run the MCP server:

```bash
npm run build -w @markdown-confluence/mcp
node packages/mcp/dist/index.js
```

Tool name: `markdown_to_confluence_preview`

Input fields:
- `markdown` (string, required)
- `confluenceBaseUrl` (string, optional)
- `preview` (boolean, optional, default true)
- `outputDir` (string, optional)

The tool returns a JSON string containing the normalized Markdown, TOC, ADF JSON, preview HTML path, and the ADF JSON file path written alongside the preview.
