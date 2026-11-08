# 抖音收藏提取

## 登录与页面

1. 打开 `https://www.douyin.com/user/self?showTab=favorite_collection`（**收藏**；`showTab=favorite` 是**喜欢**，两个列表独立，按用户要的 tab 走）。
2. 首次访问会弹滑块拼图验证码（iframe 内，`按住左边按钮拖动完成上方拼图`）→ 提示用户在浏览器面板手动完成。
3. 验证后页面展示登录二维码（「扫码登录」+ `img "二维码"`）→ 用户抖音 App 扫码。
4. 登录判定：`h1` 的「未登录」消失且「扫码登录」文本不再出现。

## 滚动容器

收藏列表在一个**内部滚动容器**里，`window.scrollTo` 无效（`body.scrollHeight` 恒定不变）。先探测真实容器，再滚动它：

```js
// 找出 overflowY 为 auto/scroll 且内容溢出的元素
[...document.querySelectorAll('*')].filter(el => {
  const s = getComputedStyle(el);
  return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 50;
}).map(el => ({ cls: String(el.className).slice(0, 60), clientH: el.clientHeight, scrollH: el.scrollHeight }))
```

每次都重新探测（站点改版会换类名），不硬编码。当前已知容器为 `.route-scroll-container`，可作为首选探测目标：

```js
const el = document.querySelector('.route-scroll-container') || document.scrollingElement;
el.scrollTop = el.scrollHeight;
```

## 提取（每轮滚动后执行）

列表是虚拟滚动（离屏节点回收），必须**边滚边增量存**，滚动间隔 ~1.4s：

```js
(() => {
  let root = document.querySelector('[data-e2e="user-collection-list"]')
          || document.querySelector('main') || document;
  const seen = new Set(); const out = [];
  root.querySelectorAll('a[href*="/video/"], a[href*="/note/"]').forEach(a => {
    const url = a.href;
    if (!url || seen.has(url)) return; seen.add(url);
    const img = a.querySelector('img');
    const alt = img ? (img.getAttribute('alt') || '') : '';
    const p = a.querySelector('p');
    let title = ((p && p.textContent) || alt || a.getAttribute('aria-label') || '').trim();
    let author = '';
    const m = alt.match(/^(.{1,30}?)[：:]/);           // alt 格式：「作者：标题 + 长文案 + 点赞数」
    if (m) author = m[1].trim();
    if (author && title.startsWith(author)) title = title.slice(author.length).replace(/^[：:]\s*/, '');
    title = title.split(/[\r\n]+/)[0]                  // 取第一行
                 .replace(/^\d+([.\d]+)?[万wW]?\s*/, '') // 去开头点赞数
                 .substring(0, 120);
    if (!title) return;
    out.push({ platform: 'douyin', title, url, author });
  });
  return { count: out.length, items: out };
})()
```

- 条目链接可能是 `/video/` 或 `/note/`（图文笔记），两者都收。
- 无官方总数显示，停止条件用：连续 6~7 轮无新增。

## 字段

`title`、`url`（完整 https）、`author`。抖音没有时长/播放量字段。
