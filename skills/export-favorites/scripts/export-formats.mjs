// 用法: node export-formats.mjs <原始JSON目录>
// 读取目录下各平台原始收藏 JSON（douyin_favorites_raw.json / bilibili_fav_*.json /
// bilibili_season_*.json / juejin_*.json），在该目录下生成 final/：
//   {platform}_favorites.{json,md,txt}  +  all_favorites.json（全平台合并）
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error("用法: node export-formats.mjs <原始JSON目录>");
  process.exit(1);
}
const OUT = path.join(dir, "final");
fs.mkdirSync(OUT, { recursive: true });

const escMd = (t) => String(t).replace(/[\[\]]/g, " ").replace(/\r?\n/g, " ").trim();
const fmtDur = (s) => {
  if (!s && s !== 0) return "";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// ---------- 收集所有原始 JSON，按平台分组 ----------
const byPlatform = new Map(); // platform -> { groups: [], all: [] }
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith(".json") || f.startsWith("all_")) continue;
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { continue; }
  if (!j.platform || !Array.isArray(j.data)) continue;
  if (!byPlatform.has(j.platform)) byPlatform.set(j.platform, []);
  const groups = byPlatform.get(j.platform);
  // 分组键：收藏夹/合集/收藏集标题；抖音无分组
  const groupTitle = j.folderTitle || j.seasonTitle || j.collectionTitle || null;
  const extra = j.seasonId ? { type: "合集(追更)" } : (j.followed ? { type: "收藏夹(追更)" } : {});
  if (groupTitle) {
    groups.push({ title: groupTitle, count: j.data.length, data: j.data, ...extra });
  } else {
    // 无分组文件（如抖音整站一份）直接作为一组
    groups.push({ title: null, count: j.data.length, data: j.data });
  }
}

// ---------- 逐平台导出 ----------
const secondary = (it) => it.uploader || it.author || "";
const statsLine = (it) =>
  [it.duration != null && it.duration !== "" ? fmtDur(it.duration) : "",
   it.playCount ? `播放:${it.playCount}` : ""].filter(Boolean).join(" ｜ ");

for (const [platform, groupsRaw] of byPlatform) {
  // 去重分组（同名组可能来自多个文件）并按数量降序
  const merged = new Map();
  for (const g of groupsRaw) {
    const key = g.title || "__all__";
    if (!merged.has(key)) merged.set(key, g);
    else merged.get(key).data = [...merged.get(key).data, ...g.data];
  }
  const groups = [...merged.values()].map((g) => ({
    ...g,
    data: dedupe(g.data),
  })).sort((a, b) => b.data.length - a.data.length);
  const all = groups.flatMap((g) => g.data);
  const total = all.length;

  fs.writeFileSync(path.join(OUT, `${platform}_favorites.json`), JSON.stringify({
    platform, exportTime: new Date().toISOString(), total, groups,
  }, null, 2));

  let md = `# ${platform} 收藏导出\n\n> 导出时间: ${new Date().toLocaleString()} ｜ 共 ${total} 条\n\n---\n\n`;
  let txt = `# 收藏导出 - ${platform}\n# 导出时间: ${new Date().toLocaleString()}\n# 总数: ${total}\n`;
  for (const g of groups) {
    const head = g.title ? `${g.title}${g.type ? `（${g.type}）` : ""}（${g.data.length} 条）` : `全部（${g.data.length} 条）`;
    md += `## ${head}\n\n`;
    txt += `\n===== ${head} =====\n\n`;
    g.data.forEach((it, i) => {
      md += `### ${i + 1}. [${escMd(it.title)}](${it.url})\n`;
      const sec = secondary(it), st = statsLine(it);
      if (sec) md += `- **作者**: ${sec}\n`;
      if (st) md += `- ${st}\n`;
      md += `\n`;
      txt += `${i + 1}. ${it.title}${sec ? ` [${sec}]` : ""}\n   ${it.url}${st ? `\n   ${st}` : ""}\n\n`;
    });
  }
  fs.writeFileSync(path.join(OUT, `${platform}_favorites.md`), md);
  fs.writeFileSync(path.join(OUT, `${platform}_favorites.txt`), txt);
  console.log(`${platform}: ${groups.map((g) => `${g.title || "全部"}(${g.data.length})`).join(" | ")} — 共 ${total}`);
}

function dedupe(items) {
  const m = new Map();
  for (const it of items) if (it.url && !m.has(it.url)) m.set(it.url, it);
  return [...m.values()];
}

// ---------- 全平台合并总表 ----------
const combined = [];
for (const [platform, groups] of byPlatform) {
  for (const g of groups) for (const it of dedupe(g.data)) combined.push({ ...it, collection: g.title || undefined, platformLabel: platform });
}
fs.writeFileSync(path.join(OUT, "all_favorites.json"), JSON.stringify({
  exportTime: new Date().toISOString(), total: combined.length, data: combined,
}, null, 2));
console.log(`\n合计 ${combined.length} 条 → ${OUT}`);
