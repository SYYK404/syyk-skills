# B站收藏提取

## 提取路线：页面上下文调用 B站自有 API

收藏夹页（`space.bilibili.com/{uid}/favlist`）既不滚动加载、也无可探测的分页 DOM，页面数据本身来自 API，所以直接在页面上下文里 `fetch` 同一 API：与页面同登录态（`credentials: 'include'`）、只读、数据不出本机。

**单次 evaluate 必须在 3s 内**：一次 fetch 一页，分页循环放在 REPL 的 JS 里驱动，每页之间 `setTimeout` 400ms 防风控。返回 `code !== 0` 时退避 2s 重试，连续 3 次失败再放弃该夹；页数上限用 `ceil(media_count / 20) + 2` 兜底。

## 登录与 UID

1. 打开 `bilibili.com`，点右上角「登录」→ 弹二维码（`img "登录二维码"`）→ 用户 B站 App 扫码。
2. 登录判定：二维码弹窗和「登录」入口文本都消失。
3. UID 按通用协议从顶部导航头像链接取：

```js
const a = document.querySelector('a[href*="space.bilibili.com/"]');
const uid = a.href.match(/space\.bilibili\.com\/(\d+)/)[1];
```

拿到后进 `https://space.bilibili.com/{uid}/favlist`（页面用于展示收藏夹清单，提取走 API）。

## API 三件套

### 1. 自建收藏夹列表

```
GET https://api.bilibili.com/x/v3/fav/folder/created/list?up_mid={uid}&pn=1&ps=20
→ data.list[].{id, title, media_count}, data.count
```

### 2. 收藏夹内视频（自建与追更收藏夹通用）

```
GET https://api.bilibili.com/x/v3/fav/resource/list?media_id={id}&pn={pn}&ps=20&keyword=&order=mtime&type=0&tid=0&platform=web&new_web_tag=1&order_avoided=true
→ data.medias[], data.has_more, data.info.media_count
```

字段映射：

| API 字段 | 导出字段 |
|---|---|
| `bvid` | `url` = `https://www.bilibili.com/video/` + bvid |
| `title` | `title` |
| `upper.name` | `uploader` |
| `duration`（秒） | `duration` |
| `cnt_info.play` | `playCount` |
| `fav_time`（Unix 秒） | `favTime`（转 ISO） |

### 3. 追更列表——按 `type` 分流

```
GET https://api.bilibili.com/x/v3/fav/folder/collected/list?up_mid={uid}&pn=1&ps=20&platform=web
```

返回条目按 `type` 分两类，接口不同，`id` 含义也不同，**不能混用**：

- `type === 21`：UGC 合集（season）。`id` 是 season_id，条目自带 owner `mid`。走：

  ```
  GET https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid={ownerMid}&season_id={id}&page_num={pn}&page_size=100
  → data.archives[], data.page.total
  ```

  字段：`bvid`/`title`/`owner.name`/`duration`/`stat.view`/`pubdate`。

- 其他 type：普通收藏夹。`id` 即 media_id，直接走上面第 2 个接口。

### 数量差额

API 的 `media_count` 含已失效视频，但 `medias` 不下发它们——实抓数小于计数是正常现象（如 414 抓到 412），如实记录，不重试。
