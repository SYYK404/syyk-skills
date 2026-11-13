// 用法: node build-overview-html.mjs <原始JSON目录>
// 读取 <目录>/final/ 下各平台 JSON（export-formats.mjs 的产物），在 <目录> 下生成
// 收藏总览.html —— 自包含单文件（数据内嵌、离线可用）：搜索、平台/收藏夹筛选、排序、跨收藏夹去重。
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error("用法: node build-overview-html.mjs <原始JSON目录>（需先跑 export-formats.mjs 生成 final/）");
  process.exit(1);
}
const finalDir = path.join(dir, "final");
if (!fs.existsSync(finalDir)) {
  console.error("未找到 final/ 子目录，请先运行 export-formats.mjs");
  process.exit(1);
}
const OUT = path.join(dir, "收藏总览.html");

const PLATFORMS = {
  douyin: { label: "抖音", color: "#111827" },
  bilibili: { label: "B站", color: "#FB7299" },
  juejin: { label: "掘金", color: "#1E80FF" },
  xiaohongshu: { label: "小红书", color: "#FF2442" },
  xiaoheihe: { label: "小黑盒", color: "#2F54EB" },
};
const fmtDur = (s) => (s == null || s === "" ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);

// ---------- 读取并归一化 ----------
const items = [];
for (const f of fs.readdirSync(finalDir)) {
  if (!f.endsWith(".json") || f.startsWith("all_")) continue;
  const j = JSON.parse(fs.readFileSync(path.join(finalDir, f), "utf8"));
  const plat = j.platform;
  for (const g of j.groups || []) {
    for (const it of g.data) {
      items.push({
        p: plat,                       // platform key
        c: g.title || "全部",           // collection
        t: it.title || it.noteId || it.url,
        u: it.url,
        a: it.uploader || it.author || "",
        dur: it.duration ?? null,
        play: it.playCount ?? null,
        likes: it.likes ?? null,
        type: it.type || null,
        favTime: it.favTime || null,
      });
    }
  }
}
const json = JSON.stringify(items).replace(/</g, "\\u003c");

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>收藏总览（抖音 / B站 / 掘金 / 小红书）</title>
<style>
  :root { --bg:#f6f7f9; --card:#fff; --line:#e5e7eb; --text:#1f2328; --muted:#6b7280; --accent:#2563eb; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif; background: var(--bg); color: var(--text); }
  header { position: sticky; top: 0; background: var(--card); border-bottom: 1px solid var(--line); padding: 14px 20px; z-index: 10; }
  h1 { font-size: 18px; margin-bottom: 10px; }
  .stats { font-size: 13px; color: var(--muted); margin-bottom: 12px; }
  .controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .chip { border: 1.5px solid var(--line); background: var(--card); border-radius: 999px; padding: 5px 14px; font-size: 13px; cursor: pointer; user-select: none; }
  .chip.on { color: #fff; }
  input, select { padding: 7px 10px; border: 1px solid var(--line); border-radius: 8px; font-size: 13px; background: var(--card); color: var(--text); }
  input#q { flex: 1 1 220px; min-width: 180px; }
  label.dupe { font-size: 13px; color: var(--muted); display: flex; gap: 4px; align-items: center; cursor: pointer; }
  main { max-width: 1000px; margin: 16px auto; padding: 0 16px; }
  .row { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; margin-bottom: 8px; display: flex; gap: 12px; align-items: center; }
  .badge { flex: 0 0 auto; font-size: 12px; color: #fff; border-radius: 6px; padding: 3px 8px; white-space: nowrap; }
  .body { flex: 1; min-width: 0; }
  .title { font-size: 14px; font-weight: 500; }
  .title a { color: var(--text); text-decoration: none; }
  .title a:hover { color: var(--accent); }
  .meta { font-size: 12px; color: var(--muted); margin-top: 3px; display: flex; flex-wrap: wrap; gap: 10px; }
  .ctag { font-size: 12px; color: var(--muted); background: var(--bg); border-radius: 6px; padding: 2px 8px; white-space: nowrap; }
  .copy { flex: 0 0 auto; border: 1px solid var(--line); background: var(--card); border-radius: 6px; font-size: 12px; padding: 4px 8px; cursor: pointer; color: var(--muted); }
  .copy:hover { color: var(--accent); border-color: var(--accent); }
  .empty { text-align: center; color: var(--muted); padding: 60px 0; }
  kbd { border: 1px solid var(--line); border-radius: 4px; padding: 0 5px; font-size: 12px; background: var(--bg); }
</style>
</head>
<body>
<header>
  <h1>📚 收藏总览</h1>
  <div class="stats" id="stats"></div>
  <div class="controls">
    <input id="q" type="search" placeholder="搜索标题 / 作者（按 / 聚焦）">
    <span id="chips"></span>
    <select id="col"></select>
    <select id="sort">
      <option value="default">默认（按平台·收藏夹）</option>
      <option value="hot">热度降序（播放 / 点赞）</option>
      <option value="time">收藏时间降序（仅B站有）</option>
      <option value="title">标题 A-Z</option>
    </select>
    <label class="dupe"><input type="checkbox" id="dupe">跨收藏夹去重</label>
  </div>
</header>
<main id="list"></main>
<script>
const DATA = __DATA__;
const PLAT = {
  douyin: { label: "抖音", color: "#111827" },
  bilibili: { label: "B站", color: "#FB7299" },
  juejin: { label: "掘金", color: "#1E80FF" },
  xiaohongshu: { label: "小红书", color: "#FF2442" },
  xiaoheihe: { label: "小黑盒", color: "#2F54EB" },
};
const order = { douyin: 0, bilibili: 1, juejin: 2, xiaohongshu: 3, xiaoheihe: 4 };
const fmtDur = (s) => (s == null || s === "" ? "" : Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const state = { plats: new Set(Object.keys(PLAT)), col: "__all__", q: "", sort: "default", dupe: false };
const chipsEl = document.getElementById("chips");
const colEl = document.getElementById("col");
const qEl = document.getElementById("q");
const sortEl = document.getElementById("sort");
const dupeEl = document.getElementById("dupe");
const listEl = document.getElementById("list");
const statsEl = document.getElementById("stats");

// 平台 chips
Object.entries(PLAT).forEach(([key, p]) => {
  const b = document.createElement("button");
  b.className = "chip on";
  b.style.borderColor = p.color;
  b.textContent = p.label + " " + DATA.filter(d => d.p === key).length;
  b.onclick = () => {
    if (state.plats.has(key) && state.plats.size === 1) return; // 至少保留一个平台
    state.plats.has(key) ? state.plats.delete(key) : state.plats.add(key);
    b.classList.toggle("on");
    b.style.background = state.plats.has(key) ? p.color : "";
    b.style.color = state.plats.has(key) ? "#fff" : "";
    renderCols(); render();
  };
  b.style.background = p.color; b.style.color = "#fff";
  chipsEl.appendChild(b);
});

function renderCols() {
  const cols = new Map();
  DATA.filter(d => state.plats.has(d.p)).forEach(d => {
    const k = d.p + "::" + d.c;
    cols.set(k, (cols.get(k) || 0) + 1);
  });
  colEl.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "__all__"; optAll.textContent = "全部收藏夹";
  colEl.appendChild(optAll);
  [...cols.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => {
    const [p, c] = k.split("::");
    const o = document.createElement("option");
    o.value = k; o.textContent = PLAT[p].label + " · " + c + " (" + n + ")";
    colEl.appendChild(o);
  });
  state.col = "__all__";
}

function filtered() {
  let out = DATA.filter(d =>
    state.plats.has(d.p) &&
    (state.col === "__all__" || d.p + "::" + d.c === state.col) &&
    (!state.q || (d.t + " " + d.a).toLowerCase().includes(state.q))
  );
  if (state.dupe) {
    const seen = new Set();
    out = out.filter(d => { const k = d.u.split("?")[0]; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  const num = (v) => typeof v === "number" ? v : (parseInt(String(v).replace(/[^0-9]/g, "")) || 0);
  if (state.sort === "hot") out.sort((x, y) => num(y.play) + num(y.likes) - (num(x.play) + num(x.likes)));
  else if (state.sort === "time") out.sort((x, y) => (y.favTime || "").localeCompare(x.favTime || ""));
  else if (state.sort === "title") out.sort((x, y) => x.t.localeCompare(y.t, "zh"));
  else out.sort((x, y) => order[x.p] - order[y.p] || x.c.localeCompare(y.c, "zh"));
  return out;
}

function render() {
  const rows = filtered();
  const counts = {};
  Object.keys(PLAT).forEach(k => counts[k] = DATA.filter(d => d.p === k).length);
  statsEl.textContent = "共 " + rows.length + " 条（总 " + DATA.length + " ｜ " +
    Object.keys(PLAT).map(k => PLAT[k].label + " " + counts[k]).join(" · ") + "）";
  if (rows.length === 0) { listEl.innerHTML = '<div class="empty">没有匹配的收藏</div>'; return; }
  const frag = [];
  for (const d of rows) {
    const p = PLAT[d.p];
    const meta = [];
    if (d.dur != null && d.dur !== "") meta.push("时长 " + fmtDur(d.dur));
    if (d.play != null && d.play !== "") meta.push("播放 " + d.play);
    if (d.likes != null && d.likes !== "") meta.push("❤ " + d.likes);
    if (d.type === "video") meta.push("视频");
    if (d.favTime) meta.push("收藏于 " + d.favTime.slice(0, 10));
    frag.push('<div class="row">' +
      '<span class="badge" style="background:' + p.color + '">' + p.label + '</span>' +
      '<div class="body"><div class="title"><a href="' + esc(d.u) + '" target="_blank" rel="noopener">' + esc(d.t) + '</a></div>' +
      '<div class="meta">' + (d.a ? '<span>' + esc(d.a) + '</span>' : '') + meta.map(m => '<span>' + esc(m) + '</span>').join("") + '</div></div>' +
      '<span class="ctag">' + esc(d.c) + '</span>' +
      '<button class="copy" data-u="' + esc(d.u) + '">复制</button></div>');
  }
  listEl.innerHTML = frag.join("");
}

listEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".copy");
  if (!btn) return;
  navigator.clipboard.writeText(btn.dataset.u).then(() => {
    btn.textContent = "已复制"; setTimeout(() => btn.textContent = "复制", 1200);
  });
});
let deb;
qEl.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(() => { state.q = qEl.value.trim().toLowerCase(); render(); }, 150); });
qEl.addEventListener("keydown", (e) => { if (e.key === "Escape") { qEl.value = ""; state.q = ""; render(); } });
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== qEl) { e.preventDefault(); qEl.focus(); }
});
colEl.addEventListener("change", () => { state.col = colEl.value; render(); });
sortEl.addEventListener("change", () => { state.sort = sortEl.value; render(); });
dupeEl.addEventListener("change", () => { state.dupe = dupeEl.checked; render(); });

renderCols();
render();
</script>
</body>
</html>`;

fs.writeFileSync(OUT, html.split("__DATA__").join(json), "utf8");
console.log("条目:", items.length, "→", OUT, "大小:", Math.round(fs.statSync(OUT).size / 1024) + " KB");
