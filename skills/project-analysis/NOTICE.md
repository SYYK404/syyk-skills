# NOTICE / 版权说明

本目录下的 skill 基于 [project-analysis-skill](https://github.com/Bamzzo/project-analysis-skill)（MIT License）改编，原作品版权归属原作者（Bamzzo 及上游贡献者），依 MIT License 使用。

- 改编基础：上游 commit `0d594bec048c0abd701e8bc04fa4f42909dc6436`（2026-05-28）。
- 本版本为中文改编版，**不是纯翻译**——在翻译基础上做了内容修改与增补，与上游存在实质差异，主要包括：
  - 修复 `agents/openai.yaml`（上游之外本仓库曾存在的无效 YAML 问题）
  - 合并重复的探查清单，明确「核心工作流」与「大项目协议」的适用边界
  - 补充填充示例（output-templates.md）、证据类 anti-pattern、参考文件加载表格
- 上游更新时，diff 上游变更与本版差异后酌情合并，并更新各文件头部与本文的 commit 标注。
