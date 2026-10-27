#!/usr/bin/env node
/**
 * 校验 skills/ 下的每个 skill 是否满足本仓库的约定。
 *
 * 只依赖 Node 内置模块，无第三方依赖，CI 与本地跑的是同一份逻辑。
 * 退出码：0 全部通过（允许有 warning）；1 存在 error。
 *
 * 检查项：
 *   1. SKILL.md 存在，且 frontmatter 完整（name / description 必填）
 *   2. name 为 kebab-case，且与目录名（或文件名）一致
 *   3. description 长度合理（20 ~ 1024 字符）
 *   4. skill 内部 Markdown 的相对链接都能解析到真实文件
 *   5. 不同 skill 之间不重名
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SKILLS_DIR = join(ROOT, 'skills')
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const errors = []
const warnings = []
const ok = []

const rel = (p) => relative(ROOT, p).split(sep).join('/')

/** 极简 frontmatter 解析：够用即可，不引入 yaml 依赖。 */
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end === -1) return null

  const data = {}
  let key = null
  for (const line of text.slice(3, end).split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue

    if (!/^\s/.test(line)) {
      const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
      if (!m) continue
      key = m[1]
      const value = m[2].trim()
      data[key] = /^[>|][+-]?$/.test(value) ? '' : stripQuotes(value)
      continue
    }

    if (key && data[key] !== undefined) {
      const more = line.trim()
      data[key] = data[key] ? `${data[key]} ${more}` : more
    }
  }
  return data
}

const stripQuotes = (v) =>
  (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))
    ? v.slice(1, -1)
    : v

/** 收集目录下所有 .md 文件 */
function collectMarkdown(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      collectMarkdown(full, out)
    } else if (entry.name.endsWith('.md')) {
      out.push(full)
    }
  }
  return out
}

/** 检查文件里的相对链接是否可达 */
function checkLinks(file, skillName) {
  const text = readFileSync(file, 'utf8')
  const linkRe = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  const base = dirname(file)
  let m
  while ((m = linkRe.exec(text)) !== null) {
    const target = m[1]
    if (/^(https?:|mailto:|#)/i.test(target)) continue
    if (target.startsWith('<')) continue
    const clean = decodeURIComponent(target.split('#')[0])
    if (!clean) continue
    if (!existsSync(resolve(base, clean))) {
      errors.push(`${rel(file)}: 链接目标不存在 → ${target}`)
    }
  }
}

/** 校验单个 skill */
function checkSkill(name, dir) {
  const skillFile = join(dir, 'SKILL.md')
  if (!existsSync(skillFile)) {
    errors.push(`${rel(skillFile)}: 缺少 SKILL.md`)
    return
  }

  const text = readFileSync(skillFile, 'utf8')
  const fm = parseFrontmatter(text)
  if (!fm) {
    errors.push(`${rel(skillFile)}: 缺少合法 frontmatter（--- 包裹）`)
    return
  }

  if (!fm.name) errors.push(`${rel(skillFile)}: frontmatter 缺少 name`)
  if (!fm.description) errors.push(`${rel(skillFile)}: frontmatter 缺少 description`)

  if (fm.name) {
    if (!NAME_RE.test(fm.name)) {
      errors.push(`${rel(skillFile)}: name "${fm.name}" 不是 kebab-case`)
    }
    if (fm.name !== name) {
      errors.push(`${rel(skillFile)}: name "${fm.name}" 与目录名 "${name}" 不一致`)
    }
  }

  if (fm.description) {
    const len = [...fm.description].length
    if (len < 20) errors.push(`${rel(skillFile)}: description 过短（${len} 字符），无法判断触发场景`)
    else if (len > 1024) warnings.push(`${rel(skillFile)}: description 长度 ${len}，超出常见上限 1024`)
  }

  for (const md of collectMarkdown(dir)) checkLinks(md, name)
  ok.push(`${name}（${collectMarkdown(dir).length} 个 Markdown 文件）`)
}

function main() {
  if (!existsSync(SKILLS_DIR)) {
    errors.push('skills/ 目录不存在')
    return report()
  }

  const seen = new Map()
  for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.') || entry.name === 'README.md') continue

    let name, dir
    if (entry.isDirectory()) {
      name = entry.name
      dir = join(SKILLS_DIR, entry.name)
    } else if (entry.name.endsWith('.md')) {
      // 单文件 skill：skills/<name>.md，没有附属目录
      name = entry.name.slice(0, -3)
      const text = readFileSync(join(SKILLS_DIR, entry.name), 'utf8')
      const fm = parseFrontmatter(text)
      if (!fm) errors.push(`skills/${entry.name}: 缺少合法 frontmatter`)
      else {
        if (!fm.name) errors.push(`skills/${entry.name}: frontmatter 缺少 name`)
        else if (fm.name !== name) errors.push(`skills/${entry.name}: name "${fm.name}" 与文件名 "${name}" 不一致`)
        if (!fm.description) errors.push(`skills/${entry.name}: frontmatter 缺少 description`)
      }
      checkLinks(join(SKILLS_DIR, entry.name), name)
      ok.push(`${name}（单文件）`)
      if (seen.has(name)) errors.push(`skill 重名：${name}（${seen.get(name)} 与 skills/${entry.name}）`)
      seen.set(name, `skills/${entry.name}`)
      continue
    } else {
      continue
    }

    if (!NAME_RE.test(name)) errors.push(`skills/${name}: 目录名不是 kebab-case`)
    if (seen.has(name)) errors.push(`skill 重名：${name}`)
    seen.set(name, `skills/${name}`)
    checkSkill(name, dir)
  }

  report()
}

function report() {
  for (const line of ok) console.log(`  ok    ${line}`)
  for (const line of warnings) console.warn(`  warn  ${line}`)
  for (const line of errors) console.error(`  FAIL  ${line}`)

  const total = ok.length
  if (errors.length) {
    console.error(`\n${errors.length} 个错误、${warnings.length} 个警告，校验未通过。`)
    process.exit(1)
  }
  console.log(`\n${total} 个 skill 通过校验${warnings.length ? `，${warnings.length} 个警告` : ''}。`)
}

main()
