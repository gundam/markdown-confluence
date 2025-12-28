<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a monorepo for "markdown-confluence" - a toolset that converts Markdown to Atlassian Document Format (ADF) and publishes it to Confluence. It supports multiple platforms via different packages.

## Package Structure

This is a pnpm workspace with these packages:

- **`packages/lib`** - Core library. Contains the Publisher class, Markdown-to-ADF conversion (`MdToADF.ts`), adaptors, settings loaders, and the ADFProcessingPlugin system. All other packages depend on this.
- **`packages/cli`** - Command-line tool using `AutoSettingsLoader` and `FileSystemAdaptor`.
- **`packages/obsidian`** - Obsidian plugin using `StaticSettingsLoader` and `ObsidianAdaptor`.
- **`packages/mermaid-puppeteer-renderer`** - Mermaid diagram renderer using Puppeteer (for CLI).
- **`packages/mermaid-electron-renderer`** - Mermaid diagram renderer using Electron (for Obsidian).
- **`packages/mcp`** - Model Context Protocol server for Markdown to Confluence preview.

## Key Architecture Concepts

### Pluggable ADF Processing

The `ADFProcessingPlugin` interface (`packages/lib/src/ADFProcessingPlugins/types.ts`) defines a three-stage pipeline for processing ADF documents:

1. **`extract()`** - Scans ADF and returns data items to be processed
2. **`transform()`** - Given extracted data, performs work (uploads, renders) and returns a map
3. **`load()`** - Modifies the ADF in-place using the transformation results

Built-in plugins include `MermaidRendererPlugin` (converts mermaid code blocks to PNG images) and `ImageUploaderPlugin` (uploads local images to Confluence).

### Adaptor Pattern

The adaptor pattern abstracts file system operations. Two implementations exist:

- **`FileSystemAdaptor`** (`packages/lib/src/adaptors/filesystem.ts`) - Reads from local file system. Used by CLI.
- **`ObsidianAdaptor`** (`packages/obsidian/src/adaptors/obsidian.ts`) - Reads from Obsidian vault. Used by Obsidian plugin.

Adaptors must implement the `LoaderAdaptor` interface which defines methods like `getMarkdownFilesToUpload()` and `uploadBuffer()`.

### Settings Loading Chain

Settings are loaded via a priority chain (`AutoSettingsLoader`):

1. `DefaultSettingsLoader` (base defaults)
2. `ConfigFileSettingsLoader` (from config file)
3. `EnvironmentVariableSettingsLoader` (env vars)
4. `CommandLineArgumentSettingsLoader` (CLI args only)

Confluence's frontmatter settings (`connie-` prefixed keys like `connie-parent-id`) override this per-page.

### Publishing Workflow

The `Publisher` class orchestrates the publishing process:

1. Load markdown files via adaptor
2. Create local ADF tree structure (`TreeLocal`)
3. Ensure pages exist in Confluence (`TreeConfluence`) - creates missing pages
4. For each page: run ADF processing plugins, compare with Confluence version, update if changed (content, images, or labels)

### Markdown to ADF Conversion

`parseMarkdownToADF()` in `packages/lib/src/MdToADF.ts` uses:
- `@atlaskit/editor-json-transformer`'s `MarkdownTransformer` and `JSONTransformer`
- `prosemirror-markdown` as the underlying parser
- Custom transforms for wikilinks, callouts, media

## Common Development Commands

```bash
# Build all packages
npm run build   # (or pnpm run build from root)

# Watch mode for lib package
cd packages/lib && npm run dev

# Format code
npm run fmt     # (or pnpm run fmt from root)

# Lint code
npm run lint    # (or pnpm run lint from root)

# Run tests (lib package only)
cd packages/lib && npm test

# Run single test file
cd packages/lib && npm test -- MdToADF.test.ts
```

## Important Technical Details

- All packages use ES modules (`"type": "module"`).
- The project uses esbuild for bundling CLI, MCP, and renderer packages.
- The lib package uses TypeScript directly (no bundling).
- ESLint is configured with `@typescript-eslint` and Prettier.
- Jest for testing (lib package only) with `NODE_OPTIONS=--experimental-vm-modules`.
- Atlassian's ADF schema version is pinned - upgrading requires testing.

## Confluence Integration Notes

- `confluence.js` library wraps the Confluence REST API.
- Content equality is checked via `adfEqual()` before uploading to avoid unnecessary updates.
- Three update types are tracked: `contentResult`, `imageResult`, `labelResult`.
- User accountId is cached to identify "lastUpdatedBy".
