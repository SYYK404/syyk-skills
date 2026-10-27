# syyk-skills

My personal collection of agent skills, built primarily for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) and following the common Agent Skills convention, so the same files also work in any agent that reads `SKILL.md`.

## Install

DSH discovers skills from four roots (lower rank wins on name collisions):

| Path | Scope | rank |
|---|---|---|
| `<project>/.dsh/skills` | project | 100 |
| `<project>/.agents/skills` | project | 200 |
| `~/.dsh/skills` | user | 400 |
| `~/.agents/skills` | user | 500 |

Windows:

```powershell
.\scripts\install.ps1              # copy into ~\.dsh\skills
.\scripts\install.ps1 -Link        # directory junctions instead (live edits)
```

For other agents, copy `skills/<name>/` into `~/.agents/skills/<name>/`.

## Skills

| Skill | What it does | Origin |
|---|---|---|
| [`project-analysis`](skills/project-analysis/SKILL.md) | Turns an unfamiliar or messy codebase into an architecture map, risk list, and next actions | Chinese translation of [Bamzzo/project-analysis-skill](https://github.com/Bamzzo/project-analysis-skill) (MIT) |

## Layout

```
skills/<name>/SKILL.md     # required; `name` and `description` in frontmatter
skills/<name>/references/  # optional long-form docs, loaded on demand
skills/<name>/scripts/     # optional executables
skills/<name>.md           # single-file form
```

`<name>` is kebab-case and must equal the frontmatter `name:`. Keep relative links inside a skill resolvable — CI checks them.

## Validate

```bash
node scripts/validate-skills.mjs
```

## License

[MIT](LICENSE). `skills/project-analysis` is a translation of a third-party MIT project — see [CREDITS.md](CREDITS.md).
