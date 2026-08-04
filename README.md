# Domain Console

基于 [Neobrutalism UI](https://www.neobrutalism.dev/docs/) 视觉体系构建的域名管理后台，面向 Vercel 部署。

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-1261ff) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)

## 当前范围

当前项目已经从纯前端原型推进到 **DNSHE 文档化接口接入版本**：

- GitHub 登录视觉页（不会发起真实 OAuth）
- 域名统计、搜索、筛选、排序和分页
- 真实 / mock 自动切换的域名列表与详情
- 真实 / mock 自动切换的 DNS 列表、创建、编辑、删除
- 真实 / mock 自动切换的子域名注册、删除、续期
- Settings 页面已接入：
  - API Keys 管理
  - Quota 配额查询
  - WHOIS 查询
- 无 DNSHE 环境变量时自动回退到本地 demo 数据
- 桌面侧栏与移动端导航
- 全局 `DNS Records`、`Activity` 页面仍保留为占位页

生产构建不依赖 Neobrutalism 远程 Registry；所有 UI 组件源码位于 `src/components/ui`，作为项目代码自行维护。

## 技术栈

- Next.js 16 App Router
- React 19 + TypeScript strict
- Tailwind CSS v4
- Radix UI primitives
- Lucide Icons
- Sonner Toast
- pnpm

## 本地运行

要求：Node.js 20.9+，推荐当前 LTS；pnpm 10+。

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:3000>。

### 质量检查

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## 页面

| 路由 | 说明 |
| --- | --- |
| `/` | GitHub 登录 UI Demo |
| `/dashboard` | 域名资产总览与当前数据源状态 |
| `/domains/[id]` | 域名详情、DNS、活动与危险操作 |
| `/dns-records` | 全局 DNS 后续功能占位 |
| `/activity` | 全局活动记录后续功能占位 |
| `/settings` | Keys / Quota / WHOIS 管理台 |

## 数据模式

项目存在两种运行模式：

### 1. Mock Demo 模式

未配置 DNSHE 环境变量时：

- 使用 `src/data/domains.ts` 中的 8 条初始数据
- 支持本地新增/删除/续期/刷新/DNS CRUD
- Settings 页展示的真实接口能力不可用
- 交互状态写入浏览器 localStorage：

```text
domain-console.demo-state.v1
```

清除该 key 或调用后续重置功能即可恢复初始数据。

### 2. DNSHE Live 模式

配置 DNSHE 环境变量后：

- Dashboard 列表走 `/api/domains`
- 详情页走 `/api/domains/[id]`
- 子域名创建走 `/api/domains`
- 子域名删除走 `/api/domains/[id]`
- 子域名续期走 `/api/domains/[id]/renew`
- DNS 写操作走：
  - `/api/domains/[id]/dns`
  - `/api/domains/[id]/dns/[recordId]`
- Settings 管理接口走：
  - `/api/settings/keys`
  - `/api/settings/keys/[id]`
  - `/api/settings/keys/[id]/regenerate`
  - `/api/settings/quota`
  - `/api/settings/whois`
- 所有 DNSHE 请求都在服务端完成，浏览器不会直接拿到密钥

## DNSHE 接入范围

当前按照文档已接入的接口：

- `subdomains/list`
- `subdomains/get`
- `subdomains/register`
- `subdomains/delete`
- `subdomains/renew`
- `dns_records/list`
- `dns_records/create`
- `dns_records/update`
- `dns_records/delete`
- `keys/list`
- `keys/create`
- `keys/delete`
- `keys/regenerate`
- `quota`
- `whois`

当前 **明确不接入** 的能力：

- `permanent_upgrade`（按需求排除）
- 域名状态刷新接口（文档与现有产品流未单独落地）
- 根域价格 / 可注册列表
- GitHub OAuth
- 审计日志 / Webhook

> 约束：以 DNSHE 知识库文档为准，不猜测未文档化字段或行为。

## 环境变量

在本地 `.env.local` 或 Vercel Project Settings 中配置：

```bash
DNSHE_API_BASE_URL=https://api005.dnshe.com/index.php
DNSHE_API_KEY=your_dnshe_api_key
DNSHE_API_SECRET=your_dnshe_api_secret
```

说明：

- `DNSHE_API_BASE_URL` 默认按知识库文档使用 `https://api005.dnshe.com/index.php`
- 请求会由服务端统一拼接：

```text
?m=domain_hub&endpoint=...&action=...
```

- 鉴权通过请求头：
  - `X-API-Key`
  - `X-API-Secret`

**不要**把这些值写成 `NEXT_PUBLIC_*`。

## 部署到 Vercel

1. 将此目录初始化为 Git 仓库并推送到 GitHub、GitLab 或 Bitbucket。
2. 登录 [Vercel](https://vercel.com/new)，选择 **Add New → Project**。
3. 导入仓库；Framework Preset 应自动识别为 **Next.js**。
4. 保持默认设置：
   - Install Command：`pnpm install --frozen-lockfile`
   - Build Command：`pnpm build`
   - Output：由 Next.js 自动处理
5. 如需启用真实 DNSHE 数据，在 Vercel 项目环境变量中设置：
   - `DNSHE_API_BASE_URL`
   - `DNSHE_API_KEY`
   - `DNSHE_API_SECRET`
6. 点击 **Deploy**。

如果不配置 DNSHE 环境变量，线上仍会以 mock 模式运行。

## 服务端安全约束

- DNSHE API Key / Secret 只能在 Route Handlers 或其他服务端模块中读取
- 浏览器端只能访问本项目自己的 `/api/...` 路由
- 所有真实写操作必须经过服务端边界
- 不要把服务端凭据透传到客户端组件、URL 参数或 localStorage

## 维护说明

Neobrutalism Components 上游已在 2025 年停止维护。本项目使用其设计语言与本地化组件源码，不在 Vercel 构建阶段下载上游文件。升级 Next.js、React、Radix 或 Tailwind 时，请对 Dialog、Menu、Select、Tabs 等交互组件逐项回归测试。

同时请遵守仓库根目录 `AGENTS.md`：

- 单个组件文件不得超过 300 行
- 优先复用现有 `src/components/ui`
- 能用官方 / 现有组件时不重复造轮子
- 服务端密钥禁止下放到客户端
