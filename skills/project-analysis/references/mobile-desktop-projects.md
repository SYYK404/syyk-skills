# 移动端与桌面端项目分析

> 基于 [project-analysis-skill](https://github.com/Bamzzo/project-analysis-skill)（MIT）commit 0d594be（2026-05-28）改编，含内容修改与增补。

用于 Android、iOS、Flutter、React Native、Electron、Tauri、桌面 webview 或原生桌面项目。

## 首要问题

- 目标平台有哪些：Android、iOS、macOS、Windows、Linux、Web，还是混合？
- 哪些是原生外壳代码，哪些是共享应用代码？
- 应用入口、导航根与平台生命周期钩子在哪里？
- 使用了哪些权限、entitlement、deep link、后台模式或原生能力？
- 应用如何存储本地状态、凭据、缓存与用户偏好？
- 开发、调试、staging、production 与 release 构建如何配置？
- 应用如何打包、签名与分发？

## 需要定位的组件

- Android：`AndroidManifest.xml`、Gradle 文件、`MainActivity`、`Application`、权限、flavor、签名配置。
- iOS/macOS：`Info.plist`、entitlements、`AppDelegate`、`SceneDelegate`、SwiftUI `App`、Xcode project/workspace、scheme。
- Flutter：`pubspec.yaml`、`lib/main.dart`、平台目录、method channel、构建 flavor。
- React Native/Expo：`package.json`、`app.json`/`app.config.*`、`index.*`、原生模块、Metro 配置、EAS 或原生构建配置。
- Electron：主进程、preload 脚本、渲染进程应用、IPC 通道、打包配置。
- Tauri：`tauri.conf.*`、Rust command、前端应用、权限/capability、sidecar 二进制。
- 共享应用层：路由/导航、状态管理、API client、持久化、错误上报、分析、更新机制。

## 运行时流程模式

移动/原生：

```text
平台启动
-> 原生生命周期钩子
-> 应用根/导航
-> 页面/视图模型/状态
-> 服务/API/持久化/原生桥
-> UI 更新或平台副作用
```

Electron/Tauri：

```text
桌面进程
-> 主进程/原生运行时
-> preload/桥 或 command 注册表
-> 渲染进程 UI
-> IPC/原生命令/API client
-> 文件系统/网络/OS 副作用
```

## 常见失败模式

- 调试构建与发布构建使用不同的 API 端点或权限。
- 原生桥契约是隐式的或弱类型的。
- 平台生命周期事件与异步初始化竞争。
- 本地存储或 keychain 访问因平台/版本而异。
- deep link、推送通知、后台任务或文件关联在多处配置。
- 桌面 preload/IPC 向渲染进程暴露了过多权限。
- 构建签名、provisioning 或应用标识符没有文档。
- 打包后的应用行为与 dev-server 行为不一致。

## 验证

优先采用：

- 构建前先检查平台 manifest/配置
- 对共享代码运行 typecheck/单元测试
- 在可用时运行平台 lint 或配置检查
- 只有在依赖就绪且安全时才启动模拟器/仿真器/dev 构建
- 验证一条导航/API/原生桥冒烟路径
- 检查打包/签名工作流，但不实际发布

## 建议的输出增补

对移动端或桌面端项目，额外加入：

1. 平台目标地图
2. 原生 vs 共享代码边界
3. 生命周期与导航入口点
4. 权限、entitlement 与原生能力地图
5. 本地状态与安全存储
6. 构建、签名与分发路径
7. 平台特有风险
