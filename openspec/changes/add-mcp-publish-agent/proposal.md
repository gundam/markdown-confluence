# Change: 新增 Confluence 发布 Agent（MCP/Skills）

## Why
需要一个 0 安装、面向普通用户的入口，将 Markdown 经语义整理后转换为 ADF。首期以 MCP Server 形态实现，并支持本地预览流程。

## What Changes
- 新增 MCP Server 接口，接收 Markdown 内容并驱动转换/预览流程（原文 + 可选渲染预览）
- 提供 AI 语义层能力（标题规范化、目录生成）
- 支持 ADF 转换：Markdown → ADF（markdown-confluence）
- 为后续 Confluence 发布接口预留对接点

## Impact
- Affected specs: confluence-publish-agent
- Affected code: 新增 MCP Server 入口与转换编排代码；接入 markdown-confluence；本地预览输出
