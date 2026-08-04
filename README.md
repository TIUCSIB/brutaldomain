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

BrutalDomain 是一个面向域名运维场景的管理后台，采用 **Neobrutalism** 风格界面，并通过 **服务端代理层** 接入 DNSHE。它支持域名列表、域名详情、DNS 记录管理、API Key 管理、配额查看与 WHOIS 查询，同时确保密钥不会暴露到浏览器端。

## Highlights

- **Neobrutalist UI** powered by local reusable components
- **Next.js App Router** architecture ready for Vercel deployment
- **Server-only DNSHE integration** with `X-API-Key` / `X-API-Secret`
- **Hybrid runtime mode**:
  - live DNSHE mode when environment variables are configured
  - local demo mode when they are not
- **Domain dashboard** with search, filters, sorting, pagination, and detail views
- **DNS record CRUD** through internal API routes
- **Settings console** for:
  - API key management
  - quota lookup
  - WHOIS lookup
- **Strict maintainability rules**:
  - reusable UI first
  - keep component files under 300 lines
  - avoid exposing secrets to client code

## Feature Scope

### Implemented

#### Domain management
- Domain dashboard
- Domain detail page
- Search / filter / sort / pagination
- Live/mock auto switching

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

#### Settings console
- `keys/list`
- `keys/create`
- `keys/delete`
- `keys/regenerate`
- `quota`
- `whois`

### Intentionally excluded

The following capabilities are **not implemented by design** at this stage:

- `permanent_upgrade`
- undocumented or ambiguous API behaviors
- GitHub OAuth sign-in flow
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
    domains/              # Domain store, repository, mock/live adapters
    settings/             # Settings API client types and helpers
  lib/
    dnshe/                # DNSHE client, types, mappers
    env/                  # Server-only environment helpers
```

## Runtime Modes

### 1. Demo mode

If DNSHE environment variables are missing:

- the app falls back to local demo data
- dashboard and detail pages remain fully usable for presentation
- local state is persisted in browser storage

Storage key:

```text
domain-console.demo-state.v1
```

### 2. Live DNSHE mode

If DNSHE environment variables are present:

- the app loads real data through internal Next.js API routes
- browser code never talks to DNSHE directly
- secrets remain on the server only

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

### Start development server

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Create a local `.env.local` file or configure the same variables in Vercel:

```bash
DNSHE_API_BASE_URL=https://api005.dnshe.com/index.php
DNSHE_API_KEY=your_dnshe_api_key
DNSHE_API_SECRET=your_dnshe_api_secret
```

Notes:

- `DNSHE_API_BASE_URL` defaults to `https://api005.dnshe.com/index.php`
- server requests are composed as:

```text
?m=domain_hub&endpoint=...&action=...
```

- authentication uses request headers:
  - `X-API-Key`
  - `X-API-Secret`

> Never expose these values through `NEXT_PUBLIC_*` variables.

## Available Pages

| Route | Description |
| --- | --- |
| `/` | GitHub-style login demo page |
| `/dashboard` | Main domain overview dashboard |
| `/domains/[id]` | Domain detail, DNS records, and activity view |
| `/settings` | API keys, quota, and WHOIS console |
| `/dns-records` | Placeholder for future global DNS workspace |
| `/activity` | Placeholder for future global activity timeline |

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
4. Add the DNSHE environment variables if you want live mode.
5. Deploy.

If no DNSHE variables are configured, the deployed app will still run in demo mode.

## Security Model

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

- Global DNS workspace across all domains
- Global activity timeline with richer filters
- Better operator/audit metadata when backend support is available
- Brand assets and product screenshots
- Optional authentication flow beyond the current demo login page

## License

MIT

---

<div align="center">
Built with Next.js, TypeScript, and a lot of bold borders.
</div>
