## ADDED Requirements
### Requirement: MCP/Skill 输入输出
系统 MUST 提供 MCP Server 入口，接收 Markdown 内容并返回转换/预览结果。

#### Scenario: 输入 Markdown 成功触发预览
- **WHEN** 用户提供 Markdown 内容
- **THEN** 系统返回转换/预览结果摘要

### Requirement: 本地预览输出
系统 MUST 提供用于调试的本地预览输出，包含 ADF 原文与 HTML 渲染文件。

#### Scenario: 返回原文与渲染预览
- **WHEN** 转换完成且请求预览
- **THEN** 系统返回 ADF 原文并生成 HTML 预览文件

### Requirement: ADF 调试文件
系统 MUST 在生成 HTML 预览时同步写出 ADF JSON 文件并返回其路径。

#### Scenario: 输出 ADF JSON 文件
- **WHEN** HTML 预览文件生成完成
- **THEN** 系统在同目录生成 ADF JSON 文件并返回路径

### Requirement: 语义整理（标题规范化与目录生成）
系统 MUST 在转换前执行标题规范化与目录生成，并将目录插入文档开头。

#### Scenario: 规范化标题并生成目录
- **WHEN** 输入 Markdown 包含标题层级
- **THEN** 系统输出规范化标题并在文档开头插入目录

### Requirement: ADF 转换
系统 MUST 支持将 Markdown 转换为 ADF 格式，并输出原文用于调试。

#### Scenario: 选择 ADF 转换路径
- **WHEN** 发布目标选择 ADF
- **THEN** 系统使用 markdown-confluence 输出 ADF

### Requirement: MCP 发布调用
系统 MUST 预留 Confluence MCP publish 接口对接点，以支持后续发布。

#### Scenario: 发布对接点可用
- **WHEN** 后续接入发布接口
- **THEN** 系统可将转换产物传递给发布层
