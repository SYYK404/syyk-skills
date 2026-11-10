# 掘金收藏提取

## 登录与 UID

登录与身份统一用掘金会话接口判定——头像链接的 DOM 结构随版本变化，DOM 选择器不可靠；内容区的 `/user/` 链接指向文章作者，也不能当登录身份：

```js
const res = await fetch('https://api.juejin.cn/user_api/v1/user/profile_id?aid=2608&spider=0', { credentials: 'include' });
const j = await res.json();
// 已登录：j.data.profile_id 为当前用户 UID；未登录：data 为空
const uid = j.data && j.data.profile_id;
```

注意返回字段是 `err_no` / `data.profile_id`，与常见接口的 `code` / `message` 命名不同。

未登录则打开 `juejin.cn` 让用户登录（掘金支持账号密码/短信，通常用户自己完成）。

## 收藏集清单（从 DOM 读）

打开 `https://juejin.cn/user/{uid}/collections?type=created`，收藏集列表直接 SSR 在页面里：

```
link "拓展 2026-10-31 更新 · 184篇文章 · 0订阅" → /collection/6959522577165320200
```

用 `a[href^="/collection/"]` 收集 `{id, 标题, 文章数}`。标题取链接文本中「YYYY-MM-DD 更新」日期前的部分；无日期的条目（如「我的收藏 默认 0篇文章 · 0订阅 编辑」）解析后带尾巴，需要再按「默认/我的收藏」裁剪。「我的收藏（默认）」可能为 0 篇，跳过。「我订阅的」（`?type=following`）如需要另开一页读。两个收藏集可能同名（如两个「待看」），以 id 区分。

## 提取机制：滚动 + 等流推完

收藏集页 `juejin.cn/collection/{id}` 的文章列表**无独立 API、无分页控件**，由初始 HTML 流式追加渲染——滚动后 DOM 文章数会持续增长且不产生新网络请求。

提取策略：

1. `goto` 收藏集页，`waitForLoadState` 后等 ~2s。
2. 循环：`window.scrollTo(0, document.body.scrollHeight)` → 等 1.2~1.5s → 提取增量。
3. 连续 4 轮无新增、或达到该收藏集官方计数即完成。184 篇约 35s。

## 提取脚本（每轮滚动后执行）

```js
(() => {
  const byHref = new Map();
  document.querySelectorAll('a[href^="/post/"]').forEach(a => {
    const href = a.getAttribute('href').split('?')[0];
    const text = (a.textContent || '').trim();
    if (!text) return;
    const prev = byHref.get(href);   // 同一文章有「标题」和「标题+摘要」两个 <a>
    if (!prev || text.length < prev.length) byHref.set(href, text);  // 取最短文本当标题
  });
  const items = [];
  byHref.forEach((title, href) => {
    const a = document.querySelector('a[href="' + href + '"]');
    let card = a, author = '';
    for (let i = 0; i < 8 && card && card !== document.body; i++) {  // 向上找卡片根
      card = card.parentElement;
      if (!card) break;
      const u = card.querySelector && card.querySelector('a[href^="/user/"]');
      if (u) { author = (u.textContent || '').trim(); break; }
    }
    items.push({ platform: 'juejin', title, url: 'https://juejin.cn' + href, author });
  });
  return { count: items.length, items };
})()
```

## 字段

`title`、`url`、`author`。掘金卡片有阅读/点赞/评论数字，但 DOM 位置易变，首版只收核心三字段，需要统计时再加。
