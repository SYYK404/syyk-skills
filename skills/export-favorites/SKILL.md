---
name: export-favorites
description: 从抖音、B站、掘金导出用户自己账号的收藏到本地 JSON/Markdown/TXT。用 ZCode 内置浏览器登录后，按各站实测可行的路线提取（抖音=DOM 滚动、B站=页内 API、掘金=SSR 流式 DOM）。只要用户提到导出/备份/抓取收藏、收藏夹、收藏集、favorites，或想拿回自己账号的收藏数据——哪怕只提到其中一个平台——都使用本技能。
---

# 收藏导出（抖音 / B站 / 掘金）

帮用户把自己账号的收藏完整导出为本地文件。核心原则：**登录态来自用户本人（扫码或用户已登录的会话），数据只写本地文件，不经过任何第三方**。

## 总体流程

1. 加载 `browser-use:control-browser` 技能，用内置浏览器（IAB）操作。
2. 按下方「标签选择」绑定目标站点页面；未登录则引导用户登录（见各平台参考文件）。
3. 按平台路线提取全部收藏，**边提取边落盘**（每轮循环追加保存，中途失败不丢已抓数据）。
4. 用 `scripts/export-formats.mjs` 合并产出最终 JSON/Markdown/TXT。

## 平台路由

| 平台 | 提取路线 | 详细参考 |
|---|---|---|
| 抖音 | DOM 滚动 + 增量提取（内滚容器） | [references/douyin.md](references/douyin.md) |
| B站 | 页面上下文调用 B站自有 API（收藏夹 + 合集两种） | [references/bilibili.md](references/bilibili.md) |
| 掘金 | 收藏集 SSR 流式渲染，滚动等流推完再从 DOM 提取 | [references/juejin.md](references/juejin.md) |

进入某平台前**必须先读对应参考文件**——每个平台的关键选择器、接口参数都在里面，不要凭记忆猜。

## 通用执行协议

**标签选择**：
- 每批操作前先 `browser.tabs.list()` 返回完整列表，按 id/URL 匹配后 `tabs.get(id)` 绑定。
- **用户说「已登录 / 已经打开了」时，先 `browser.user.openTabs()` 找目标域名的标签，`claimTab` 接管使用；找不到匹配再新开标签**，不要新开重复页面。
- 每次 `mcp__node_repl__js` 都是全新内核：每次都重跑 bootstrap + `agent.browsers.get("iab")`。

**账号身份**：
- 需要 UID / 账号标识时，一律从**站点顶部导航的头像 / 个人主页链接**读取（各站选择器见参考文件）。内容区的用户链接（文章卡片、推荐流、评论区）指向的是内容作者，不是登录用户，禁止用来当身份。
- 身份存疑时（如页面昵称与用户预期不符），向用户展示当前识别到的账号名再继续。

**浏览器调用**：
- `playwright.evaluate` 单次上限 3000ms：**单次 evaluate 只做一件小事**（滚动一次、提取一次、请求一页）。循环放在 REPL 的 JS 里驱动，每轮调用一次 evaluate。
- `goto` 后必须 `waitForLoadState({ state: "domcontentloaded" })` 再观察。

**登录**（需要用户参与，脚本无法代替）：
- 验证码（滑块/拼图）无法自动化，提示用户在浏览器面板手动完成。
- 二维码登录：页面出现二维码后请用户扫码，用轮询循环检测登录态（每 5s 查一次页面特征，最多 ~100s）。检测条件选「登录后才消失/出现」的元素。

**提取循环的停止条件**（三平台通用）：
- 连续 N 轮（4~7，按平台）无新增 → 停止。
- 有官方计数时（页面显示的总数），达到计数即提前停止。
- 实抓数 < 官方计数是**正常现象**：差额是已删除/已失效条目，页面计数包含但列表不渲染。不要为此反复重试，如实记录差额即可。

**数据结构**：每个平台/收藏夹存一个原始 JSON 文件（含 `platform`、分组字段、`exportTime`、`data[]`），条目统一有 `title`、`url`，其余字段按平台（`author`/`uploader` 等）。去重一律用 `Map<url, item>`。

## 导出

提取完成后，把原始 JSON 所在目录交给打包脚本：

```bash
node <skill目录>/scripts/export-formats.mjs <原始JSON目录>
```

脚本会在该目录下生成 `final/`：每个平台一份 `xxx_favorites.{json,md,txt}`（MD 按收藏夹分节）+ 全平台合并的 `all_favorites.json`。

## 扩展：知乎（未实测）

知乎走与抖音相同的 DOM 路线，选择器参考 [favorites-manager 项目](https://github.com/rookiejefren/favorites-manager)（`.CollectionDetailPageItem`、`.List-item` 等，翻页用 `.PaginationButton-next`）。按「选择器降级 + 逐条 try/catch」的防御式写法处理，并把实际验证过的选择器回写进本技能。
