# 小黑盒（heybox）收藏提取

## 登录与身份

1. 打开 `https://www.xiaoheihe.cn/`。已登录用户顶部导航有 `button "玩家{heybox_id}头像"`；未登录则显示「登录」入口，点击后走 App 扫码/账号登录。
2. **头像下拉必须用真实鼠标事件**（`tab.cua.click` 点头像右侧箭头，坐标取自截图右上角）；JS click 与 hover 都不触发。下拉菜单含「我的主页」。
3. 个人主页 URL：`https://www.xiaoheihe.cn/app/user/profile/{heybox_id}`（不要猜 `/community/profile/`，那是 404）。身份即登录时拿到的 heybox_id。

## 收藏页入口

个人主页点「收藏」tab（SPAN，JS 点击），URL 变为 `https://www.xiaoheihe.cn/app/user/favour/content`。DOM 卡片的帖子链接形如 `/app/bbs/link/{linkid}`。

## 提取路线：页面上下文 fetch 重放收藏 API（首选，DOM 滚动不需要）

API 无重签名壁垒：任意一次页面自己发出的收藏请求，把完整 URL 从 `performance.getEntriesByType('resource')` 取出来做模板，改 `offset` 参数后直接 `fetch(url, { credentials: 'include' })` 重放即可。

```
GET https://api.xiaoheihe.cn/bbs/app/profile/fav/folder/v2/links?app=heybox&heybox_id={id}&...&offset=0&limit=30&...（保留模板原有全部参数，只改 offset）
→ { status: "ok", result: { has_next: "1"|"0", links: [{ link: {...}, unread, is_deleted }] } }
```

分页：offset 按 30 递增，`has_next !== "1"` 或 links 为空即停止。

进入收藏页一次（让页面自己发出首个请求）→ 从 performance 取 URL 模板 → 循环改 offset 拉全量。**不依赖 DOM 滚动**，13 页 ≈ 375 条 10 秒内拉完。

## 字段映射

| API 字段（item.link） | 导出字段 |
|---|---|
| `linkid` | `url` = `https://www.xiaoheihe.cn/app/bbs/link/` + linkid |
| `title`（空则取 `description`） | `title`；description 为「内容已失效」视为失效条目 |
| `user.username` | `author` |
| `happy` | `likes` |
| `comment_num` | `commentNum` |
| `has_video` | `type` = video/normal |
| `create_at`（Unix 秒） | `createdAt` |
| `item.is_deleted` | `isDeleted` |

失效条目（title 空、description「内容已失效」）保留并标记，不计入有效数。

## 网络捕获注意

页面上下文包装 `window.fetch` 捕获响应体时**必须存完整 URL（含 query）**——`url.split('?')[0]` 会丢掉 offset/limit/nonce 等参数，模板就废了。
