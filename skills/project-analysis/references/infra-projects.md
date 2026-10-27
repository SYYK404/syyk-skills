# 基础设施、部署与 DevOps 项目分析

> 译自 [project-analysis-skill](https://github.com/Bamzzo/project-analysis-skill)（MIT），中文译文；如有歧义以英文原文为准。

用于 Terraform、Pulumi、CloudFormation、Kubernetes、Docker、CI/CD、部署脚本、平台工具链或云基础设施仓库。

## 首要问题

- 存在哪些环境：本地、dev、staging、production、preview？
- 目标是哪个云/供应商/运行时？
- 哪些文件定义基础设施状态？
- 哪些命令负责 plan、apply、deploy、roll back 或 destroy？
- 密钥、变量与远程状态配置在哪里？
- 哪些部分可以在本地安全地查看、plan 或运行？

## 需要定位的组件

- 基础设施根模块/stack
- 环境专属 overlay 或变量文件
- 容器构建文件与 compose 文件
- Kubernetes manifest、Helm chart 或 Kustomize overlay
- CI/CD 工作流定义
- 部署脚本与发布自动化
- 状态后端与锁配置
- 密钥引用与参数存储
- 监控、日志、告警与健康检查

## 环境地图

对每个环境，记录：

- 名称
- 配置路径
- 可见的供应商/账号/区域/集群
- 状态后端或部署目标
- 部署命令
- 审批或晋级门
- 回滚路径
- 风险与未知项

## 安全规则

- 除非明确要求，不要运行 apply、deploy、destroy、迁移或写入命令。
- 优先使用只读命令、配置检查、校验、格式检查或 dry-run/plan 命令。
- 对密钥与账号敏感值做脱敏。
- 区分"声明的基础设施"与"实际部署的基础设施"。

## 常见失败模式

- 环境变量默认值指向生产环境。
- 远程状态在多个环境间共享。
- CI 的部署路径与文档中的手工路径不一致。
- 资源名以不直观的方式生成。
- 镜像 tag 可变。
- Kubernetes overlay 与 base manifest 漂移。
- 必需的密钥没有文档说明。
- 回滚被认为存在，但实际未实现。

## 验证

优先采用：

- 语法校验
- 格式化/检查命令
- 不实际 apply 的 dry-run/plan
- 在安全时做容器构建 dry run
- CI 工作流检查
- 健康检查端点或 readiness/liveness 配置审查

## 建议的输出增补

对基础设施项目，额外加入：

1. 环境与部署地图
2. 状态与密钥处理
3. CI/CD 流程
4. Plan/Apply 或 Build/Deploy 边界
5. 运维风险
6. 安全验证命令
