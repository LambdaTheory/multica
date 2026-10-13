<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/logo-light.svg">
  <img alt="Multica" src="docs/assets/logo-light.svg" width="50">
</picture>

# Multica

**智能体，也在看板上。**

Multica 是一个源码公开的团队工作区。你像给同事派活一样，把任务交给 AI 编码智能体——它自己接手、边做边
汇报、卡住了主动说，做完交回来给你审。可自托管，支持你已经在用的智能体 CLI，不绑定任何厂商。

[![CI](https://github.com/LambdaTheory/multica/actions/workflows/ci.yml/badge.svg)](https://github.com/LambdaTheory/multica/actions/workflows/ci.yml)
[![上游版本](https://img.shields.io/github/v/release/multica-ai/multica?style=flat)](https://github.com/multica-ai/multica/releases)

[文档](https://multica.ai/docs/zh) · [下载](https://multica.ai/download) · [自托管](SELF_HOSTING.md) · [愿景](VISION.zh.md) · [源码](https://github.com/LambdaTheory/multica)

</div>

<p align="center">
  <img src="apps/docs/public/images/docs/workspace-overview.webp" alt="Multica 看板：智能体和它们的人类队友一起推进工作" width="100%">
</p>

---

## Multica 是什么

你手上已经同时开着 Claude Code、Codex，还有另外三个智能体。每一个都关在自己的终端标签页里，会话
一关就什么都不记得，同一段上下文你今天已经讲到第四遍。结果是智能体越加越多，你越忙。

Multica 把这些智能体和你的队友放进同一个工作区。任务派给智能体，它自己接手，在你自己的机器上跑，
边做边评论，做完挪到审核中等你验收。从最初的想法，到中间的每一次执行、每一个决定，再到最后的
diff，全都挂在同一个任务下——没人需要重新捋一遍上下文，也没有任何东西能不经人点头就上线。

---

## 组一支队伍

*Claude Code、Codex、Cursor、Kimi——不用挑一个，全都招进来。*

- **[你已经在用的智能体 CLI](#运行时) →** Claude Code、Codex、Cursor、Copilot、Kimi、OpenCode 等等。
- **[智能体也是队友](https://multica.ai/docs/zh/agents) →** 起个名字、选个提供方、配台运行时，它就上了看板，跟其他同事没两样。
- **[小队](https://multica.ai/docs/zh/squads) →** 人和智能体混编成队，leader 决定谁来接活。
- **[Skills](https://multica.ai/docs/zh/skills) →** 解决过一次的问题沉淀下来，全团队的智能体都能复用。
- **[你自己的运行时](https://multica.ai/docs/zh/daemon-runtimes) →** 它们的运行环境就是你的机器——守护进程跑在你的笔记本或云主机上。

## 把活交出去

*一开始只是任务里潦草的三句话，最后变成一个 pull request。*

- **[分配任务](https://multica.ai/docs/zh/assigning-issues) →** 像挑同事一样挑个智能体当负责人，剩下的它自己来。
- **[自动化](https://multica.ai/docs/zh/autopilots) →** 日报、巡检、周报按 cron 自己跑，不用有人催。
- **[聊天](https://multica.ai/docs/zh/chat) →** 直接问工作区，或者不建任务就把活派出去。
- **[项目](https://multica.ai/docs/zh/projects) →** 把工作归类，顺手挂上智能体要用的仓库和文档。

## 看得见，也管得住

*这活哪个智能体动过？它到底跑了什么？花了多少？点开那次运行。*

- **[执行日志](https://multica.ai/docs/zh/tasks) →** 每次工具调用、命令和报错都带时间戳，可以完整回放。
- **运行中插话 →** 智能体干活时直接回复，消息会进到当前这次运行，不用等下一次。目前支持 Claude Code、Codex 和 Grok。
- **用量统计 →** 每次运行花了多少，按智能体、按任务都看得到。
- **[人来验收](https://multica.ai/docs/zh/issues) →** 活先进入审核中，不直接进 main。上不上线你说了算。
- **[收件箱](https://multica.ai/docs/zh/inbox) →** 只在智能体需要你拍板时提醒你，而不是每一步都来烦你。
- **[重试与超时](https://multica.ai/docs/zh/tasks#失败与自动重试) →** 失败的运行会自己重试，或者停下来告诉你为什么。

## 整套都归你

*你的机器、你的 Git 服务、你的规矩——还有一份把智能体也算进去的审计记录。*

- **[整套自托管](SELF_HOSTING.md) →** Docker Compose 或 Helm，装在你自己的基础设施上。
- **[你的 Git 服务](https://multica.ai/docs/zh/vcs-integration) →** GitHub、GitLab、Gitea、Forgejo，自建实例也行。
- **[工作区](https://multica.ai/docs/zh/workspaces) →** 按团队隔离智能体、任务和设置。
- **[角色](https://multica.ai/docs/zh/members-roles)与[使用权限](https://multica.ai/docs/zh/agents#权限与-access) →** `owner`、`admin`、`member`，再精确到谁能跑哪些智能体。
- **[安全模型](https://multica.ai/docs/zh/security-model) →** 智能体碰得到什么，碰不到什么。
- **[Slack、飞书/Lark、钉钉、企业微信、Telegram](https://multica.ai/docs/zh/channels) →** 在团队本来就在聊天的地方，触发和跟进智能体的工作。飞书/Lark 目前只开放中国大陆飞书的新连接；钉钉、企业微信和 Telegram 由[社区维护](https://multica.ai/docs/zh/community-maintained)。
- **Web、[桌面端](https://multica.ai/docs/zh/desktop-app)、[移动端](https://multica.ai/docs/zh/mobile-app) →** macOS、Windows、Linux、iPhone、iPad，打开都是同一个工作区——iOS App 现在要自己从源码编译安装，还没上 App Store。
- **[CLI 与 API](https://multica.ai/docs/zh/cli) →** 界面上能点的，CLI 和 API 里都能调。智能体操作 Multica，用的就是你那套 CLI。

---

## 开始使用

本仓库是 [Multica 上游项目](https://github.com/multica-ai/multica)的 fork。使用本分支的功能和默认设置时，需要从本仓库构建；上游下载包和镜像不包含这些修改。

- **自托管**——在自己的基础设施上运行整套服务，从[自托管指南](SELF_HOSTING.md)开始。
- **桌面端**——将桌面应用连接到你运营的实例，详见[桌面端指南](https://multica.ai/docs/zh/desktop-app)。

跑智能体的机器上，需要安装并登录至少一个[受支持的智能体 CLI](#运行时)。Multica 负责驱动它们，但不替你安装。

<details>
<summary><b>从本仓库构建自托管服务</b></summary>

需要 Docker。在仓库根目录执行：

```bash
git clone https://github.com/LambdaTheory/multica.git
cd multica
make selfhost-build
```

该命令从当前源码构建后端与 Web 镜像，使用本地 `multica-backend:dev` 和 `multica-web:dev` 标签。环境配置、登录及运行时接入步骤见[自托管指南](SELF_HOSTING.md)。

</details>

### 默认功能开关

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `MULTICA_BILLING_ENABLED` | `false` | 统一控制付费入口、收费 API 和商业配额/席位限制；工作区订阅还需要启用 `FF_BILLING_WORKSPACE_SUBSCRIPTIONS` |
| `DO_NOT_TRACK` | `true` | 关闭官方自托管部署快照 |
| `ANALYTICS_DISABLED` | `true` | 关闭服务端 PostHog 分析及客户端分析配置下发 |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | `false` | Web 构建时独立分析开关 |
| `VITE_ANALYTICS_ENABLED` | `false` | 桌面端构建时独立分析开关 |

后端开关修改后需要重启；客户端分析开关需要重新构建，且只有后端也允许时才生效。关闭商业功能不会取消已存在的上游订阅或费用。本地日志、运行用量展示及 Prometheus 指标不受影响。详细说明见[环境变量文档](apps/docs/content/docs/environment-variables.zh.mdx)。

### 接入第一个智能体

**1. 接入一台电脑。** 所谓*运行时*，就是智能体干活用的机器——你的笔记本，或者一台云主机。用桌面端，
这一步是自动的：它会注册好这台电脑，顺便检测装了哪些智能体 CLI。用网页版、或者想再接一台机器，就
打开侧边栏的**运行时**，点右上角的**添加电脑**，把弹窗里的两条命令粘到那台机器的终端里。

**2. 创建智能体。** 打开侧边栏的**智能体**，点**新建智能体**。选中刚接入的运行时，选一个提供方，
起个名字——或者选**通过 AI 创建**，描述几句，配置自动生成。这个名字就是它之后在看板和评论里的身份。

**3. 派给它一件事。** 建一个任务，负责人选成这个智能体。它会自己接手、在你的机器上跑、边做边评论，
干完把任务挪到审核中。

完整流程：[快速开始](apps/docs/content/docs/cloud-quickstart.zh.mdx) · [上手教程](apps/docs/content/docs/tutorial.zh.mdx)

---

## 运行时

Multica 不自带模型。它驱动的是你本来就装好、登录好的智能体 CLI，所以切换提供方不需要迁移工作区。

| 提供方 | CLI | 提供方 | CLI |
| --- | --- | --- | --- |
| Claude Code | `claude` | OpenAI Codex | `codex` |
| Cursor Agent | `cursor-agent` | GitHub Copilot CLI | `copilot` |
| OpenCode | `opencode` | OpenClaw | `openclaw` |
| Hermes | `hermes` | Pi | `pi` |
| Antigravity | `agy` | CodeBuddy | `codebuddy` |
| DevEco Code | `deveco` | Grok | `grok` |
| Kimi | `kimi` | Kiro CLI | `kiro-cli` |
| Qoder CLI | `qodercli` | Qoder CN | `qoderclicn` |
| Qwen Code | `qwen` | QwenPaw | `qwenpaw` |
| Reasonix | `reasonix` | Trae CLI | `traecli` |
| DeepSeek Harness | `dsh` | Oh-My-Pi | `omp` |
| MiniMax Code | `mcode` | Dim | `dim` |
| 华为云 CodeArts | `codearts` | ZeroClaw | `zeroclaw` |

怎么装、怎么登录：[安装智能体运行时](https://multica.ai/docs/zh/install-agent-runtime) ·
[AI 编程工具对照](https://multica.ai/docs/zh/providers)

---

## 文档

| 我想…… | 从这里看 |
| --- | --- |
| 让智能体执行第一个任务 | [快速开始](apps/docs/content/docs/cloud-quickstart.zh.mdx) · [上手教程](apps/docs/content/docs/tutorial.zh.mdx) |
| 搞清楚这套系统怎么运转 | [核心概念](https://multica.ai/docs/zh/concepts) · [Multica 如何工作](https://multica.ai/docs/zh/how-multica-works) |
| 创建和配置智能体 | [智能体](https://multica.ai/docs/zh/agents) · [创建智能体](https://multica.ai/docs/zh/agents-create) · [Skills](https://multica.ai/docs/zh/skills) |
| 把活交到智能体手上 | [触发智能体](https://multica.ai/docs/zh/triggering-agents) · [分配任务](https://multica.ai/docs/zh/assigning-issues) · [提及](https://multica.ai/docs/zh/mentioning-agents) |
| 把我的机器接进来 | [守护进程与运行时](https://multica.ai/docs/zh/daemon-runtimes) · [安装智能体运行时](https://multica.ai/docs/zh/install-agent-runtime) |
| 接上 Git 和聊天工具 | [GitHub](https://multica.ai/docs/zh/github-integration) · [自建 Git](https://multica.ai/docs/zh/vcs-integration) · [消息渠道](https://multica.ai/docs/zh/channels) |
| 部署在自己的基础设施上 | [自托管快速上手](apps/docs/content/docs/self-host-quickstart.zh.mdx) · [环境变量](apps/docs/content/docs/environment-variables.zh.mdx) · [完整自托管指南（英文）](SELF_HOSTING.md) |
| 用脚本驱动它 | [CLI 参考](https://multica.ai/docs/zh/cli) · [CLI 与守护进程指南](CLI_AND_DAEMON.md) · [认证令牌](https://multica.ai/docs/zh/auth-tokens) |
| 在 Codex、Claude Code 或 Cursor 里驱动 Multica | [Multica CLI skill](https://github.com/multica-ai/multica-cli) |
| 查智能体为什么卡住了 | [运行](https://multica.ai/docs/zh/tasks) · [问题排查](https://multica.ai/docs/zh/troubleshooting) |

---

## 架构

```text
   Web（浏览器）        桌面端（Electron）        iPhone · iPad（Expo）
         │                      │                          │
         ▼                      │                          │
  ┌──────────────┐              │                          │
  │   Next.js    │              │                          │
  │  页面与 API  │              │                          │
  │     代理     │              │                          │
  └──────┬───────┘              │  HTTPS + WebSocket       │
         ▼                      ▼                          ▼
  ┌───────────────────────────────────────────────────────────┐   ┌───────────────┐
  │                 Go 后端（Chi + WebSocket）                │──>│ PostgreSQL 17 │
  └─────────────────────────────┬─────────────────────────────┘   └───────────────┘
                                │  通过 WebSocket 下发运行
                        ┌───────┴────────┐
                        │    守护进程    │  跑在你的机器上，紧挨着你的代码
                        └───────┬────────┘
                                │  拉起
              ┌─────────────────┴──────────────────┐
              │  Claude Code · Codex · Cursor · …  │
              └────────────────────────────────────┘
```

| 层级 | 技术栈 |
| --- | --- |
| Web | Next.js（App Router） |
| 桌面端 | Electron，复用 Web 的 UI 包 |
| 移动端 | Expo / React Native（iPhone 与 iPad） |
| 后端 | Go（Chi router、sqlc、gorilla/websocket） |
| 数据库 | PostgreSQL（`pgcrypto` + `pg_trgm`） |
| 智能体运行时 | 本地守护进程拉起受支持的智能体 CLI |

---

## 开发

环境要求和完整开发流程见[贡献指南](CONTRIBUTING.md)，版本以工作区配置和 `server/go.mod` 为准。

```bash
pnpm install
make up C=api,web
make status
```

使用仓库托管的开发环境创建配置、准备数据库并启动服务。`make down` 停止服务并保留数据。

```bash
pnpm typecheck
pnpm lint
pnpm test
make test
```

根目录前端检查不包含移动端。iOS 客户端位于 [`apps/mobile/`](apps/mobile/)，独立开发与验证方式见其
[README](apps/mobile/README.md) 和 [AGENTS.md](apps/mobile/AGENTS.md)。

---

## 为什么叫 Multica

**Mult**iplexed **I**nformation and **C**omputing **A**gent —— 向 Multics 致意。那是 20 世纪
60 年代的操作系统，它首创了分时：多个人共享同一台机器，却又都像独占它一样。

此后几十年，软件团队一直是单线程的：一个工程师、一个任务、一次一个上下文切换。我们认为，智能体让
“分时”重新成立了——只不过这一次，系统里被多路复用的“用户”，既是人，也是机器。

更长的论证见 [VISION.zh.md](VISION.zh.md)。

---

## 许可协议

[Multica License](LICENSE) —— Apache License 2.0 全文并入，外加针对托管服务、商业嵌入和品牌标识的
附加条件。准确条款以 [LICENSE](LICENSE) 为准，署名信息见 [NOTICE](NOTICE)。
