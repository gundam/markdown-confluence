# Project Context

## Purpose
提供一套将 Markdown 转换为 Atlassian Document Format (ADF) 并发布到 Confluence 的工具，覆盖 Obsidian 插件、CLI、Docker/GitHub Action、以及 npm 库，确保各入口行为一致。

## Tech Stack
- TypeScript（严格模式）、Node.js（ESM）、npm workspaces 单仓
- Esbuild + tsc 构建；Jest 用于库测试
- ESLint + Prettier 进行 lint/格式化
- React（Obsidian UI）、Obsidian 插件 API

## Project Conventions

### Code Style
- 通过根目录 `tsconfig.json` 启用 TypeScript 严格检查
- ESLint 使用 `@typescript-eslint` 规则；Prettier 使用默认配置
- 命名：属性使用 camelCase，API 头字段按 `.eslintrc` 例外处理

### Architecture Patterns
- 核心转换与发布逻辑在 `packages/lib`
- 其他入口（Obsidian 插件、CLI、渲染器）依赖 `@markdown-confluence/lib` 保证一致行为
- 单仓 + npm workspaces，各包独立构建

### Testing Strategy
- `packages/lib` 使用 Jest（`npm test -w @markdown-confluence/lib`）
- 其他包以 lint/类型检查为主；新增特性尽量补测试

### Git Workflow
- PR 工作流；不相关改动分拆 PR
- 使用 Conventional Commits 生成变更日志/发布
- 较大改动先开 issue，并遵循 CLA 要求（见 `CONTRIBUTING.md`）

## Domain Context
- 将 Markdown 转换为 ADF 并发布到 Confluence
- 支持多入口：Obsidian 插件、CLI、Docker、GitHub Action、npm 库

## Important Constraints
- 必须符合 Atlassian ADF 结构与 Confluence API 规范
- 不在代码或文档中处理/提交账号凭证或 token

## External Dependencies
- Atlassian Confluence API（通过 `confluence.js`）
- Atlassian ADF schema/工具（`@atlaskit/*`）
- Obsidian 插件 API
- Mermaid 渲染（Electron/Puppeteer 渲染器）
