# BrutalDomain

<div align="center">

**A neobrutalist domain management console with DNSHE integration.**

一个基于 **Next.js** 与 **DNSHE API** 的新拟物粗野风域名管理平台。

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-1261ff)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8)
![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-000000)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## Overview

BrutalDomain is a modern domain operations dashboard built with a **neobrutalist UI language** and a **server-side DNSHE integration layer**. It provides a clean console for managing domains, DNS records, API keys, quota, and WHOIS data, while preserving a safe server boundary for secrets.

BrutalDomain 是一个面向域名运维场景的管理后台，采用 **Neobrutalism** 风格界面，并通过 **服务端代理层** 接入 DNSHE。它只使用真实 DNSHE 数据，不再提供本地 mock 回退。

## Highlights

- **Neobrutalist UI** powered by local reusable components
- **Next.js App Router** architecture ready for Vercel deployment
- **Server-only DNSHE integration** with `X-API-Key` / `X-API-Secret`
- **Real data only**
  - no local fixture fallback
  - no demo localStorage store as source of truth
  - missing DNSHE credentials return a clear configuration error
- **Protected operator console**
  - public GitHub OAuth login page at `/`
  - session cookie gate for dashboard, DNS, settings, and APIs
- **Domain dashboard** with search, filters, sorting, pagination, and detail views
- **Settings console** for:
  - API key management
  - quota lookup
  - WHOIS lookup

## Feature Scope

### Implemented

#### Domain management
- Domain dashboard
- Domain detail page
- Search / filter / sort / pagination
- Real DNSHE subdomain operations

#### Subdomain actions
- `subdomains/list`
- `subdomains/get`
- `subdomains/register`
- `subdomains/delete`
- `subdomains/renew`

#### DNS records
- `dns_records/list`
- `dns_records/create`
- `dns_records/update`
- `dns_records/delete`
- Domain detail DNS editor with Cloudflare-style name preview

#### Settings console
- `keys/list`
- `keys/create`
- `keys/delete`
- `keys/regenerate`
- `quota`
- `whois`

### Intentionally excluded

- `permanent_upgrade`
- undocumented or ambiguous API behaviors
- audit log / webhook integration
- root-domain pricing or registration catalog pages

> This project follows the DNSHE knowledgebase documentation strictly and does **not guess undocumented request fields or behaviors**.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS v4, Radix UI, Lucide Icons
- **Language:** TypeScript (strict mode)
- **Notifications:** Sonner
- **Package manager:** pnpm
- **Deployment target:** Vercel

## Project Structure

```text
src/
  app/
    api/                  # Server-side route handlers
    dashboard/            # Dashboard page
    domains/[id]/         # Domain detail page
    settings/             # Settings console
  components/
    ui/                   # Local reusable UI primitives
  features/
    domains/              # Domain store and DNSHE repository
    settings/             # Settings API client types and helpers
  lib/
    dnshe/                # DNSHE client, types, mappers
    env/                  # Server-only environment helpers
```

## Runtime Model

This project is **DNSHE-only**.

If DNSHE environment variables are present:

- the app loads real data through internal Next.js API routes
- browser code never talks to DNSHE directly
- secrets remain on the server only

If DNSHE environment variables are missing:

- API routes return `503`
- pages show a clear configuration error
- the app does **not** fall back to local mock data

Main internal routes:

```text
/api/domains
/api/domains/[id]
/api/domains/[id]/renew
/api/domains/[id]/dns
/api/domains/[id]/dns/[recordId]
/api/settings/keys
/api/settings/keys/[id]
/api/settings/keys/[id]/regenerate
/api/settings/quota
/api/settings/whois
```

## Getting Started

### Requirements

- Node.js 20.9+
- pnpm 10+

### Install

```bash
pnpm install
```

### Configure environment

Create a local `.env.local` file:

```bash
# GitHub OAuth (required to enter the backend)
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
AUTH_SECRET=replace-with-a-long-random-string
# Optional allowlist, comma-separated GitHub usernames
GITHUB_ALLOWED_USERS=your-github-login

# DNSHE API (required for real domain/DNS data)
DNSHE_API_BASE_URL=https://api005.dnshe.com/index.php
DNSHE_API_KEY=your_dnshe_api_key
DNSHE_API_SECRET=your_dnshe_api_secret
```

Create a GitHub OAuth App and set the callback URL to:

```text
http://localhost:3000/api/auth/callback
```

For production, use your deployed origin, for example:

```text
https://your-domain.vercel.app/api/auth/callback
```

### Start development server

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

`/` is the public GitHub login page. After OAuth you enter the protected console at `/dashboard`.

## Environment Variables

### Console authentication (GitHub OAuth)

- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (**required**) enable GitHub login
- `AUTH_SECRET` (**required**) signs the session cookie; if omitted it falls back to `DNSHE_API_SECRET`
- `GITHUB_ALLOWED_USERS` optional comma-separated GitHub usernames; empty means any GitHub user can sign in

### DNSHE API

- `DNSHE_API_BASE_URL` defaults to `https://api005.dnshe.com/index.php`
- server requests are composed as:

```text
?m=domain_hub&endpoint=...&action=...
```

- DNSHE authentication uses request headers:
  - `X-API-Key`
  - `X-API-Secret`

> Never expose these values through `NEXT_PUBLIC_*` variables.

## Available Pages

| Route | Description |
| --- | --- |
| `/` | Public GitHub OAuth login page |
| `/dashboard` | Protected domain overview dashboard |
| `/domains` | Protected domain inventory and filters |
| `/domains/[id]` | Protected domain detail, DNS records, and activity view |
| `/whois` | Protected WHOIS lookup console |
| `/settings` | Protected API keys and quota console |

## Quality Checks

Run all validation commands before publishing changes:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Deployment

### Deploy to Vercel

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Keep the default Next.js settings.
4. Add GitHub OAuth + DNSHE environment variables.
5. Set the GitHub OAuth App callback URL to `https://<your-domain>/api/auth/callback`.
6. Deploy.

If GitHub OAuth is missing, console routes stay locked behind the login page. If DNSHE variables are missing, authenticated pages show configuration errors instead of mock data.

## Security Model

- Console pages and domain/settings APIs require a signed session cookie
- Login uses GitHub OAuth (`/api/auth/github` → `/api/auth/callback`)
- Optional `GITHUB_ALLOWED_USERS` allowlist restricts who can enter the console
- DNSHE credentials are read **server-side only**
- browser code only calls this app's `/api/...` routes
- all live write actions pass through server route handlers
- secrets must never be stored in localStorage, query strings, or client components

## Maintenance Rules

This repository follows the project rules defined in `AGENTS.md`:

- keep each component file under **300 lines**
- prefer existing `src/components/ui` primitives
- reuse existing patterns instead of rebuilding components unnecessarily
- keep secrets on the server boundary

## Roadmap

Potential next steps for the project:

- Global activity timeline with richer filters
- Better operator/audit metadata when backend support is available
- Brand assets and product screenshots
- Richer multi-tenant roles beyond the current GitHub allowlist

## License

MIT

---

<div align="center">
Built with Next.js, TypeScript, and a lot of bold borders.
</div>
