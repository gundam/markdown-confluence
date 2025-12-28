## Context
- 目标用户为无需安装的普通用户
- 先以 MCP Server 形态实现，后续可扩展到 Codex Skill / Claude Skill
- 需要在 MCP 端完成 Markdown 语义整理、转换与本地预览

## Goals / Non-Goals
- Goals:
  - 提供 MCP Server 入口，接收 Markdown 并输出本地预览
  - 支持 ADF 输出
  - 内置基础语义整理（标题规范化、目录生成）
- Non-Goals:
  - 不实现复杂文档结构重写或跨文档合并
  - 不在本项目中处理或存储 Confluence 凭证

## Decisions
- 采用分层管线：语义层 → 转换层 → 预览/发布层
- 转换层接入 markdown-confluence
- 首期以本地预览输出，默认 ADF
- 发布对接作为后续扩展点

## Implementation Notes
### MCP 工具契约
- 工具名：`markdown_to_confluence_preview`
- 输入字段：
  - `markdown`（必填，string）
  - `confluenceBaseUrl`（可选，string）
  - `preview`（可选，boolean，默认 true）
  - `outputDir`（可选，string）
- 输出字段：
  - `normalizedMarkdown`（含 TOC 的 Markdown）
  - `tocMarkdown`（独立 TOC 文本）
  - `adf`（ADF JSON）
  - `publishPayload`（预留发布结构，含 contentType/body）
  - `previewHtmlPath`（HTML 预览文件路径）
  - `adfJsonPath`（ADF JSON 文件路径）

### 语义层处理
- 扫描标题（忽略代码块内的 `#`）
- 计算最小标题级别并归一化到 `#` 起始
- 生成 `## Table of Contents` 列表，插入文档开头

### 预览输出
- 使用 Markdown-it 将规范化后的 Markdown 渲染为 HTML
- 生成 HTML 预览文件，文件名 `preview-<timestamp>.html`
- 同目录输出 `preview-<timestamp>.adf.json` 便于调试
- 实际文件路径示例：
  - `/Users/yuanhailiang/Desktop/Github/markdown-confluence/.mcp-previews/preview-1766885522520.html`
  - `/Users/yuanhailiang/Desktop/Github/markdown-confluence/.mcp-previews/preview-1766885522520.adf.json`

### Docker 交付
- 提供 Dockerfile，用于构建 MCP Server 镜像
- 通过 `docker run -i` 以 stdio 方式运行
- 预览文件建议挂载卷输出，例如将 `outputDir` 指向 `/data`

## Risks / Trade-offs
- 未来发布接口的能力与稳定性会影响发布成功率

## Migration Plan
- 新增能力为可选入口，不影响现有 CLI/插件流程

## Open Questions
- MCP/Skill 的具体协议与运行环境约束
- 发布目标的定位参数（space/title/parentId/pageId）
