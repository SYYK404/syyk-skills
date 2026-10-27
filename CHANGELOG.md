# 变更记录

格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

Skill 的版本号跟仓库一致：`.github` 之外任何会改变 skill 行为的内容（增删 skill、改 `description`、改指令措辞）都算 **minor** 以上，只改错字或改链接算 **patch**。

## [0.1.0] - 2026-10-27

### 新增

- `skills/project-analysis`：项目分析 skill 的中文译本，含 `SKILL.md`、12 份按项目类型划分的参考文档，以及 `agents/openai.yaml` 界面文案。
- 仓库脚手架：`scripts/validate-skills.mjs` 校验脚本、`scripts/install.ps1` 安装脚本、GitHub Actions 校验流水线。
- `README.md` / `README.en.md` / `CONTRIBUTING.md` / `CREDITS.md`。
