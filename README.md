# syyk-skills

我自己的 Skill 集合，主要给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）用，同时遵循通用的 Agent Skills 约定——放进 Claude Code 等支持 `SKILL.md` 的 agent 里也能用。

## 安装

### DeepSeek Harness

仓库里的 `skills/` 不会被自动发现，得放进 DSH 实际读取的目录。DSH 会从这四个位置查找（`rank` 越小优先级越高，同名 skill 取 rank 小的那个）：

| 位置 | 作用域 | rank |
|---|---|---|
| `<项目>/.dsh/skills` | 当前项目 | 100 |
| `<项目>/.agents/skills` | 当前项目 | 200 |
| `~/.dsh/skills` | 所有项目 | 400 |
| `~/.agents/skills` | 所有项目 | 500 |

Windows 上一条命令装到用户级：

```powershell
.\scripts\install.ps1              # 复制到 ~\.dsh\skills
.\scripts\install.ps1 -Link        # 改用目录联接，改仓库即时生效
.\scripts\install.ps1 -Skill project-analysis
```

### 其他 agent

把 `skills/<name>/` 复制到 `~/.agents/skills/<name>/` 即可。

## 已收录

| Skill | 说明 | 出处 |
|---|---|---|
| [`project-analysis`](skills/project-analysis/SKILL.md) | 把陌生、庞大或历史包袱重的代码库解析成架构地图、风险清单和下一步行动 | 译自 [Bamzzo/project-analysis-skill](https://github.com/Bamzzo/project-analysis-skill)（MIT） |

## 目录约定

```
skills/
├── <name>/
│   ├── SKILL.md          # 必填
│   ├── references/       # 可选：按需加载的长文
│   └── scripts/          # 可选：可执行脚本
└── <name>.md             # 单文件 skill 的形态
```

- `<name>` 用 kebab-case，且必须与 `SKILL.md` frontmatter 里的 `name:` 完全一致。
- `description` 决定 agent 什么时候想起它：第一句写「什么场景用」，第二句写「能做什么、产出什么」。
- skill 正文里引用 `references/` 用相对路径，校验脚本会检查链接是否可达。

## 校验

```bash
node scripts/validate-skills.mjs
```

检查 frontmatter 是否完整、目录名与 `name:` 是否一致、Markdown 相对链接是否可达、skill 之间是否重名。CI 在每次 push / PR 跑同一套检查。

## 许可

本仓库以 [MIT](LICENSE) 发布。`skills/project-analysis` 是第三方 MIT 项目的中文译本，原作者与授权见 [CREDITS.md](CREDITS.md)。
