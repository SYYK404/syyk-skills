# 贡献指南

这个仓库是自用集合，但加新 skill 时请守住下面几条，否则 agent 的触发行为会变得不可预测。

## 加一个 skill

1. 新建 `skills/<name>/SKILL.md`（单文件 skill 则为 `skills/<name>.md`）。
2. `<name>` 用 kebab-case，只允许小写字母、数字和连字符。
3. frontmatter 两个字段必填，且 `name` 必须与目录名一致：

```markdown
---
name: <name>
description: 什么场景下用；能做什么、产出什么。
---

# 标题

正文……
```

4. 重活拆到 `references/`，正文只留决策规则和加载时机；可执行的东西放 `scripts/`。
5. 跑校验：

```bash
node scripts/validate-skills.mjs
```

6. 在 `README.md` 和 `README.en.md` 的表格里各加一行。
7. 在 `CHANGELOG.md` 的 `[Unreleased]` 下记一条。

## `description` 怎么写

这是唯一影响「agent 会不会想起这个 skill」的字段，值得多花五分钟：

- **第一句写触发条件**，用用户可能说出口的词，而不是内部术语。中英双语触发词可以都写进去（例如「解析项目 / codebase overview」）。
- **第二句写产出**，让模型知道用了它之后手里会有什么。
- 别写「这是一个强大的工具」——这句不产生任何判断。
- 两个 skill 的触发条件不要重叠。重叠意味着模型在两份互相矛盾或互相覆盖的指令之间随机选，结果不稳定。

## 禁止事项

- 不要在 skill 正文里写死本机绝对路径（`C:\Users\...`）；用相对路径或说明性描述。
- 不要把密钥、token、私有 URL 写进任何文件。
- 不要为了「完备」堆砌字段；`SKILL.md` 里每一条指令都要能被遵守或验证。

## 提交信息

用 Conventional Commits，中文正文即可：

```
feat(project-analysis): 补充 monorepo 场景的判定规则
docs: 更新安装说明
fix(validate): 相对链接检查误报锚点
```

## 许可

提交即表示同意以本仓库的 [MIT](LICENSE) 许可发布。引入第三方内容时，务必在 `CREDITS.md` 记录来源与许可证。
