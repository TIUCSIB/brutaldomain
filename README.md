# Domain Console

DNSHEDomain 的管理控制台，基于 Next.js App Router、React、TypeScript strict 和 Neobrutalism 风格组件构建。

## Features

- GitHub OAuth 登录
- DNSHE 域名与 DNS 数据管理
- API Key 与配额查看
- 服务端自动续费
- 自动续费成功后的可选 Email / Telegram 通知

## Environment

### GitHub OAuth

- `APP_URL`（生产推荐，指向你的 Vercel / 自定义域名 origin）
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `AUTH_SECRET`（必须单独配置，不再回退到 DNSHE secret）
- `GITHUB_ALLOWED_USERS`（生产必填）

### DNSHE

- `DNSHE_API_BASE_URL`
- `DNSHE_API_KEY`
- `DNSHE_API_SECRET`

> Never expose these values through `NEXT_PUBLIC_*` variables.

### Auto renew notifications (Email / Telegram)

自动续费成功后的通知渠道由 **设置页 → 自动续费** 保存：

- `notifyOnSuccess`
- Email / Telegram 渠道开关
- 收件邮箱 / Telegram Chat ID

**存储后端（自动选择）：**

| Priority | Backend                             | When                                               |
| -------- | ----------------------------------- | -------------------------------------------------- |
| 1        | **Vercel Blob** (private JSON)      | `BLOB_READ_WRITE_TOKEN` is set (production required) |
| 2        | Local `.data/auto-renew-state.json` | Dev / Node with writable disk                      |
| 3        | Process memory                      | Last resort if both fail                           |

**环境变量只用于密钥、bootstrap 默认值和存储 token：**

| Variable                | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob RW token (Storage → Blob store)           |
| `RESEND_API_KEY`        | Send email via [Resend](https://resend.com)           |
| `NOTIFY_FROM_EMAIL`     | From header (default Resend onboarding sender)        |
| `TELEGRAM_BOT_TOKEN`    | Bot token from `@BotFather`                           |
| `CRON_SECRET`           | Protects `/api/cron/auto-renew` (header auth only)    |
| `NOTIFY_EMAIL`          | Optional bootstrap email before first Settings save   |
| `TELEGRAM_CHAT_ID`      | Optional bootstrap chat id before first Settings save |

### Auto renew

Automatic renewal is server-backed and uses **saved Settings UI prefs**, not browser localStorage. It is disabled by default and currently runs on the same 1 / 11 / 21 Cron cadence via `/api/cron/auto-renew`.

Rules:

- only domains within the configured window, capped at **180 days**
- domains with remaining time `<= 180` are considered DNSHE-renewable
- can restrict to `Registered` domains only
- processes at most **10** domains per run
- records recent results in a separate persisted state file
- uses **Blob ETag / if-match optimistic concurrency** to reduce duplicate execution in production

Manual preview: **设置 → 自动续费 → 预检候选**.

When `notifyOnSuccess` is enabled, Email / Telegram channel fields appear below that toggle and are reused only for successful auto-renew summaries.

Cron uses **saved server prefs**, not browser localStorage:

```bash
curl -H "x-cron-secret: $CRON_SECRET" \
  "https://your-app.vercel.app/api/cron/auto-renew"
```

Vercel Cron is declared in `vercel.json` to trigger on the 1st, 11th, and 21st of each month at 01:00. The route uses the persisted `lastRunAt` value as a second guard and performs the DNSHE renewal scan only when the 10-day interval is due.

Production auto-renew requires:

- `BLOB_READ_WRITE_TOKEN` for persisted state/history

Calls before the next window return `200` with `skipped: true` and `reason: "not_due"`; disabling auto-renew returns `reason: "disabled"`; lock contention returns `reason: "lease_active"`. Add `?dryRun=1` for an authenticated manual preflight that bypasses the 10-day wait without updating `lastRunAt`.

## Available Pages

| Route           | Description                                             |
| --------------- | ------------------------------------------------------- |
| `/`             | Public GitHub OAuth login page                          |
| `/dashboard`    | Protected domain overview dashboard                     |
| `/domains`      | Protected domain inventory and filters                  |
| `/domains/[id]` | Protected domain detail, DNS records, and activity view |
| `/whois`        | Protected WHOIS lookup console                          |
| `/settings`     | Protected API keys, quota, and auto-renew prefs         |
| `/dns`          | Protected global DNS search                             |

## Quality Checks

Run all validation commands before publishing changes:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
