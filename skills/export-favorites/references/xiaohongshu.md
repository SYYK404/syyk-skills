# 小红书收藏提取

## 登录与身份

1. 打开 `xiaohongshu.com`，未登录时登录弹窗自动弹出（小红书 App / 微信扫码，或手机号）。
2. **登录判定禁用全文文本匹配**（`textContent` 包含隐藏组件文本，弹窗关闭后文案仍残留，会导致永远检测不到）：用可见性判断——「登录」按钮 `offsetParent` 为空且弹窗元素无可见高度即已登录。
3. 身份从头部头像链接取（banner 与侧栏各出现一次，同链接）：`a[href*="/user/profile/"]`，去掉 `?channel...` 参数得 uid。

## 入口与结构

1. 打开 `https://www.xiaohongshu.com/user/profile/{uid}`，点「收藏」tab（SPAN 无 href，JS 点击），URL 变为 `?tab=fav&subTab=note`——此为收藏列表的 URL 特征。
2. 收藏可能有子维度（`subTab=note` 笔记 / `album` 专辑）。当前无专辑的账号只显示「笔记」；有专辑账号的结构待确认，出现时按 B站收藏夹模式逐组提取。
3. 列表在**内部滚动容器**里（当前为 `.channel-list`），`window.scrollTo` 无效。每次运行时重新探测溢出容器，规则同抖音。

## 提取（每轮滚动后执行）

卡片是虚拟滚动，边滚边增量存，间隔 ≥1.5s（小红书风控较严，别压到 1s 以下）：

```js
(() => {
  const out = [];
  document.querySelectorAll('section.note-item[data-note-id]').forEach(sec => {
    try {
      const id = sec.getAttribute('data-note-id');
      const coverA = sec.querySelector('a.cover[href*="xsec_token"]');
      const tEl = sec.querySelector('[class*="title"]');
      const authorEl = sec.querySelector('[class*="author"] [class*="name"], .author .name');
      const likeEl = sec.querySelector('[class*="like"] .count, [class*="likes"]');
      out.push({
        platform: 'xiaohongshu',
        noteId: id,
        title: tEl ? tEl.textContent.trim() : null,
        author: authorEl ? authorEl.textContent.trim() : '',
        likes: likeEl ? likeEl.textContent.trim() : '',
        type: sec.querySelector('.play-icon') ? 'video' : 'normal',
        // 必须用带 xsec_token 的封面锚点链接；裸 /explore/{id} 无 token 打不开
        url: coverA ? 'https://www.xiaohongshu.com' + coverA.getAttribute('href') : 'https://www.xiaohongshu.com/explore/' + id,
      });
    } catch (e) {}
  });
  return { count: out.length, items: out };
})()
```

- 卡片文本是「标题+作者+点赞」连串，**不要**用 `textContent` 当标题；标题在 `[class*="title"]` 元素里。
- `xsec_token` 由站点自身生成、可能有时效，重新提取会拿到新 token——原始数据以最新一轮为准。
- 无「没有更多」标记、无官方计数，**停止条件 = 连续 6 轮无新增**（列表全部加载后滚动不再触发请求，实测 30 条全量直出）。

## API 说明（只被动取证，禁止主动构造）

- 收藏列表端点：`edith.xiaohongshu.com/api/sns/web/v2/note/collect/page`（performance 可见，每次进页/翻页发出）。
- 该请求需混淆 JS 生成的 `x-s` / `x-s-common` 签名头，**在页面里主动构造 fetch 拿不到数据**，禁止尝试。
- 被动捕获响应体也走不通：站点打包时提前缓存了 `window.fetch` 引用（后装补丁被绕过），`Response.prototype.json/text` 拦截实测同样未命中。**结论：放弃 API 捕获，DOM 提取为主**——上表字段已够用。
- 风控：滚动过快或异常操作会弹验证码/「环境异常」，检测到即停止等人工处理，不重试不绕过。
