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

## Docker

Build the image from the repo root:

```bash
docker build -f packages/mcp/Dockerfile -t markdown-confluence/mcp .
```

Run the MCP server with stdio (for MCP clients):

```bash
docker run -i --rm markdown-confluence/mcp
```

To capture preview output on the host:

```bash
docker run -i --rm -v "$(pwd)/.mcp-previews:/data" markdown-confluence/mcp
```

Set `outputDir` to `/data` so preview files are written to the mounted folder.
