# Monorepo 与多包分析

> 译自 [project-analysis-skill](https://github.com/Bamzzo/project-analysis-skill)（MIT），中文译文；如有歧义以英文原文为准。

用于 monorepo、workspace、多语言仓库、多服务系统，或包含许多可部署/可发布单元的仓库。

## 首要问题

- 使用了哪个 workspace/包管理器？
- 包/服务的边界在哪里？
- 哪些包是应用、库、工具、配置或生成产物？
- 哪些包是可部署单元？
- 哪些包是共享依赖？
- 是否存在多种语言、运行时或构建系统？
- 归属关系是否通过 CODEOWNERS、文档、团队名或目录约定说明？

## 需要检查的文件

- `package.json`、`pnpm-workspace.yaml`、`yarn.lock`、`turbo.json`、`nx.json`、`lerna.json`
- `Cargo.toml`、`go.work`、`go.mod`、`pyproject.toml`、`poetry.lock`、`uv.lock`
- `settings.gradle`、`build.gradle`、`pom.xml`、`.sln`、`.csproj`
- CI 工作流、Dockerfile、部署清单、Makefile
- 根 README 与各包级 README

## 边界地图

对每个重要的包或服务，记录：

- 路径
- 类型：应用、服务、库、CLI、配置、测试夹具、生成物、基础设施
- 运行时与构建命令
- 公共导出或 API 面
- 内部依赖
- 外部依赖
- 测试与验证命令
- 部署或发布路径

## 依赖图

识别：

- 所有包共享的根级依赖
- 包与包之间的依赖
- 循环依赖或隐性耦合
- 生成的 client 或 schema
- 版本固定与发布策略
- 跨语言边界

## 常见失败模式

- 根脚本掩盖了各包的具体行为。
- 共享包的改动同时破坏多个应用。
- 构建缓存掩盖了陈旧的生成产物。
- 不小心混用了多个包管理器。
- 本地开发与 CI 使用不同的 workspace 过滤条件。
- 生成的 client 或 schema 已经过期。
- 包边界是组织性的，而非技术性的。
- 测试只覆盖叶子包，没有覆盖集成路径。

## 验证

优先使用定点命令：

- 列出 workspace/包
- 在相当安全时运行根级 lint/typecheck/build
- 针对被追踪路径运行一个包级测试
- 存在生成器时，校验生成代码是否新鲜
- 查看 CI matrix，那才是真实来源

## 建议的输出增补

对 monorepo，额外加入：

1. Workspace 地图
2. 包/服务边界表
3. 内部依赖图
4. 共享基础设施与工具链
5. 跨包改动风险
6. 定点验证命令
