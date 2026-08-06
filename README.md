# DNSHE Domain Console

> 面向 DNSHE 的中文域名运维控制台：集中管理域名、DNS、WHOIS、API Key 与配额，并由服务端安全执行自动续费。

[![Next.js](https://img.shields.io/badge/Next.js-16-0f172a?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-1261ff?logo=react&logoColor=white)](https://react.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-0f172a?logo=vercel)](https://vercel.com/)

## 核心能力

- **GitHub OAuth 登录与允许名单**：生产环境仅允许 `GITHUB_ALLOWED_USERS` 中的账号访问。
- **域名与 DNS 管理**：查看域名状态、编辑 DNS 记录、查询配额与 API Key。
- **WHOIS 与全局 DNS 查询**：在一个控制台中处理日常排查。
- **服务端自动续费**：每 10 天检查已保存的设置与域名列表，最多处理 10 个符合条件的域名。
- **续费成功通知**：可在设置中启用 Email（Resend）和 Telegram 摘要通知。
- **Neobrutalism 界面**：高对比色、粗边框和硬阴影；UI 使用自托管字体，不依赖浏览器访问第三方字体 CDN。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| Web 框架 | Next.js 16 App Router、React 19、TypeScript strict |
| 样式 | Tailwind CSS v4、Neobrutalism 组件 |
| 数据边界 | DNSHE Repository / Adapter、服务端 Route Handlers |
| 持久化与调度 | Vercel Blob、Vercel Cron |
| 鉴权 | GitHub OAuth、HMAC 签名会话 Cookie |
| 包管理与部署 | pnpm、Vercel |

## 快速开始

### 前置条件

- Node.js 22+
- pnpm 9+
- 可用的 DNSHE API 凭据
- GitHub OAuth App（用于登录）

### 本地运行

```bash
git clone https://github.com/TIUCSIB/brutaldomain.git
cd brutaldomain
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

打开 <http://localhost:3000>，在 `.env.local` 中补齐必要变量后使用 GitHub 登录。

> `.env.local` 仅属于本机或部署平台，绝不能提交。请以 [`.env.example`](./.env.example) 作为唯一变量模板。

## 环境变量

所有 DNSHE、OAuth、Cron、Blob、Resend 与 Telegram 凭据都只能在服务端环境变量中配置；**不要**使用 `NEXT_PUBLIC_*`，不要写入客户端 Bundle、localStorage、URL、Toast、日志或 Git。

### 登录与访问控制

| 变量 | 本地 | 生产 | 用途 |
| --- | :---: | :---: | --- |
| `APP_URL` | 推荐 | 必填 | 当前站点的 canonical origin；配置 OAuth 回调与重定向。 |
| `GITHUB_CLIENT_ID` | 必填 | 必填 | GitHub OAuth Client ID。 |
| `GITHUB_CLIENT_SECRET` | 必填 | 必填 | GitHub OAuth Client Secret。 |
| `AUTH_SECRET` | 必填 | 必填 | HMAC 会话签名密钥；必须独立于 DNSHE secret。 |
| `GITHUB_ALLOWED_USERS` | 推荐 | 必填 | 逗号分隔的 GitHub 用户名允许名单。 |

GitHub OAuth 回调地址：

```text
http://localhost:3000/api/auth/callback
```

生产环境改为：

```text
https://你的域名/api/auth/callback
```

### DNSHE 与自动续费

| 变量 | 本地 | 生产 | 用途 |
| --- | :---: | :---: | --- |
| `DNSHE_API_BASE_URL` | 必填 | 必填 | DNSHE API 地址，默认见 `.env.example`。 |
| `DNSHE_API_KEY` | 必填 | 必填 | DNSHE API Key。 |
| `DNSHE_API_SECRET` | 必填 | 必填 | DNSHE API Secret。 |
| `CRON_SECRET` | 推荐 | 必填 | 保护 `/api/cron/auto-renew` 的请求头密钥。 |
| `BLOB_READ_WRITE_TOKEN` | 可选 | 必填 | Vercel Blob 持久化状态、历史、租约锁和共享限流。 |

### 成功通知（可选）

通知的开关、收件邮箱和 Telegram Chat ID 保存在服务端自动续费设置中；以下变量只保存第三方服务密钥和首次设置前可选的默认收件目标。

| 变量 | 用途 |
| --- | --- |
| `RESEND_API_KEY` | Resend 邮件 API Key。 |
| `NOTIFY_FROM_EMAIL` | 已在 Resend 验证的发件人地址。 |
| `TELEGRAM_BOT_TOKEN` | 来自 `@BotFather` 的 Bot Token，仅服务端可见。 |
| `NOTIFY_EMAIL` | 可选：第一次在设置页保存前使用的默认收件邮箱。 |
| `TELEGRAM_CHAT_ID` | 可选：第一次在设置页保存前使用的默认 Telegram Chat ID。 |

## 自动续费运行方式

1. Vercel Cron 在每月 **1、11、21 日 01:00 UTC** 请求 `/api/cron/auto-renew`；持久化的 `lastRunAt` 进一步确保检查间隔至少为 10 天。
2. Route Handler 验证 `x-cron-secret`（或 Bearer 格式的 Cron secret）、生产配置与 Blob 存储可用性。
3. 读取设置中的 `autoRenewEnabled`。关闭时直接返回 `disabled`，不请求 DNSHE 域名列表。
4. 读取域名列表，只选择剩余天数不大于设置窗口且最大不超过 **180 天**的候选；单次最多执行 **10** 个。
5. 使用 DNSHE `subdomains?action=renew` 的 `POST` 请求逐个续费。
6. 使用 Vercel Blob 的 ETag / `if-match` 乐观并发控制保存执行记录和租约，减少多实例重复执行。
7. 仅在启用 `notifyOnSuccess` 且已配置渠道时，发送成功域名摘要。

在设置页可使用「预检候选」查看不会真正调用续费接口的 dry run。也可由授权管理员调用：

```bash
curl -H "x-cron-secret: $CRON_SECRET" \
  "https://your-app.vercel.app/api/cron/auto-renew?dryRun=1"
```

常见跳过结果：

| `reason` | 含义 |
| --- | --- |
| `disabled` | 自动续费尚未启用。 |
| `not_due` | 距上次执行未满 10 天。 |
| `lease_active` | 其他实例正在执行。 |

## 页面地图

| 路由 | 说明 |
| --- | --- |
| `/` | GitHub OAuth 登录页 |
| `/dashboard` | 域名健康度与配额概览 |
| `/domains` | 域名清单、筛选与管理 |
| `/domains/[id]` | 域名详情、DNS 记录与活动 |
| `/dns` | 全局 DNS 查询 |
| `/whois` | WHOIS 查询控制台 |
| `/settings` | API Key、配额与自动续费设置 |

## 部署到 Vercel

1. 将仓库导入 Vercel，构建命令保持 `pnpm build`。
2. 在 **Project Settings → Environment Variables** 填写上述生产变量，尤其是 OAuth、允许名单、`AUTH_SECRET`、DNSHE、`CRON_SECRET` 与 `BLOB_READ_WRITE_TOKEN`。
3. 在 **Storage → Blob** 创建并连接 Blob Store；Vercel 会为项目注入 `BLOB_READ_WRITE_TOKEN`。
4. 在 GitHub OAuth App 中添加生产回调地址：`https://你的域名/api/auth/callback`。
5. 仓库的 [`vercel.json`](./vercel.json) 已声明 Cron，无需在界面再建一个重复任务。
6. 在设置页启用自动续费前，确认 Blob、DNSHE 凭据与 Cron secret 均已配置；生产环境会在缺失配置时拒绝真实续费。

## 目录约定

```text
src/app/                 路由、Metadata、Server Component 入口
src/components/ui/       Neobrutalism / shadcn 基础组件
src/components/          跨页面业务组件
src/features/domains/    域名类型、Store、Repository、业务规则
src/features/settings/   设置状态、自动续费配置
src/lib/                 鉴权、DNSHE、通知、安全与通用工具
src/lib/renew/           自动续费策略、状态、Blob CAS 租约
src/data/                Demo fixture 数据
```

## 视觉与字体

- 图标使用 DNSHE 现有的黄底、深色粗边框、蓝色 target 标识，与侧栏和登录页保持一致。
- 界面字体使用 `Space Grotesk`，技术值与 DNS 内容使用 `JetBrains Mono`。
- 字体由 `next/font` 在构建期自托管；中文使用系统的 PingFang SC、Microsoft YaHei、Noto Sans CJK SC 等回退字体。
- 不要添加 Google Fonts `<link>`、CSS `@import` 或其他外部字体 CDN：当前 CSP 只允许本站字体资源。

## 安全边界

- 所有写操作统一检查认证会话和同源请求；不要绕过 `requireAuthenticatedMutation()`。
- 所有 JSON 写请求都应使用 `readJsonBody()` 与运行时输入校验，错误响应不得暴露上游密钥或内部详情。
- 高风险写操作按用户进行共享限流；新增路由时应复用 `await enforceRateLimit()`。
- Cron 只接受 header 中的 secret，不接受 URL query secret。
- Session Cookie 使用签名、`HttpOnly`、`SameSite=Lax`，并在生产环境开启 `Secure`。
- 发现密钥泄露时，立即在 DNSHE、GitHub、Vercel Blob、Resend、Telegram 等平台轮换对应凭据。

## 验证与 CI

提交前运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

CI 也会运行同一组检查。UI 改动还应在桌面端、390px 移动端、键盘 focus、长域名/DNS 内容与浏览器控制台错误状态下进行验收。

## 许可证

当前仓库未声明开源许可证；在复用、分发或公开前，请先补充适用许可证。
