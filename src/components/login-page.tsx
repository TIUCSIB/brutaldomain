import Link from 'next/link'
import { CircleDotDashed, Globe2, ShieldCheck, Waypoints } from 'lucide-react'

import { Button } from '@/components/ui/button'

const hardButton = 'rounded-none border-2 border-slate-950 shadow-[3px_3px_0_0_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'

const ERROR_MESSAGES: Record<string, string> = {
  oauth_not_configured: 'GitHub 登录尚未配置，请联系管理员。',
  access_denied: '你取消了 GitHub 授权。',
  invalid_state: '登录状态已失效，请重试。',
  missing_code: 'GitHub 未返回授权结果，请重试。',
  forbidden_user: '当前 GitHub 账号无权访问后台。',
  oauth_failed: 'GitHub 登录失败，请稍后重试。',
  session_expired: '登录已过期，请重新使用 GitHub 登录。',
}

function GitHubMark({ className = 'size-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 .5C5.73.5.75 5.48.75 11.76c0 4.97 3.22 9.18 7.69 10.66.56.1.77-.24.77-.54 0-.27-.01-1.16-.02-2.1-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.73 1.16 1.73 1.16 1 .1.72 1.73 2.72 1.23.08-.74.39-1.23.71-1.51-2.5-.28-5.12-1.25-5.12-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.11 1.15a10.8 10.8 0 0 1 5.66 0c2.16-1.45 3.11-1.15 3.11-1.15.61 1.54.23 2.68.11 2.96.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08 0 1.5-.01 2.71-.01 3.08 0 .3.2.65.78.54A11.02 11.02 0 0 0 23.25 11.76C23.25 5.48 18.27.5 12 .5Z" />
    </svg>
  )
}

interface LoginPageProps {
  error?: string | null
  nextPath?: string | null
}

export function LoginPage({ error, nextPath }: LoginPageProps) {
  const errorMessage = error ? ERROR_MESSAGES[error] || error : null
  const githubHref = nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? `/api/auth/github?next=${encodeURIComponent(nextPath)}` : '/api/auth/github'

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#edf4ff] text-slate-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'linear-gradient(#c9dbff 2px, transparent 2px), linear-gradient(90deg, #c9dbff 2px, transparent 2px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col justify-center gap-10 px-4 py-10 lg:flex-row lg:items-center lg:gap-16 lg:px-8">
        <section className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-3 border-4 border-slate-950 bg-white px-4 py-3 shadow-[6px_6px_0_0_#1261ff]">
            <span className="grid size-11 place-items-center border-2 border-slate-950 bg-[#ffd84d]">
              <CircleDotDashed className="size-6" strokeWidth={2.6} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">DNSHE</p>
              <p className="text-lg font-black">Domain Console</p>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">域名管理</h1>
            <p className="mt-4 max-w-lg text-base font-bold leading-7 text-slate-700">统一管理域名资产、DNS 解析记录、到期状态与账户配额。 登录后进入控制台。</p>
          </div>

          <ul className="space-y-3">
            {[
              { icon: Globe2, text: '域名注册、续期与状态查看' },
              { icon: Waypoints, text: 'DNS 记录集中管理' },
              { icon: ShieldCheck, text: '受保护的运营后台' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <li key={item.text} className="flex items-center gap-3 border-2 border-slate-950 bg-white px-4 py-3 text-sm font-black shadow-[3px_3px_0_0_#0f172a]">
                  <span className="grid size-9 shrink-0 place-items-center border-2 border-slate-950 bg-blue-100">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {item.text}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="w-full max-w-md border-4 border-slate-950 bg-white shadow-[8px_8px_0_0_#0f172a]">
          <div className="h-3 bg-[#1261ff]" aria-hidden="true" />
          <div className="space-y-6 p-6 sm:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">登录</p>
              <h2 className="mt-2 text-2xl font-black">进入控制台</h2>
              <p className="mt-2 text-sm font-bold text-slate-600">使用 GitHub 账号登录</p>
            </div>

            {errorMessage ?
              <div role="alert" className="border-2 border-slate-950 bg-[#fff0f3] px-4 py-3 text-sm font-bold text-red-700 shadow-[3px_3px_0_0_#ff5c7a]">
                {errorMessage}
              </div>
            : null}

            <Button asChild className={`h-12 w-full bg-slate-950 text-base text-white hover:bg-slate-800 ${hardButton}`}>
              <Link href={githubHref} prefetch={false}>
                <GitHubMark />
                使用 GitHub 登录
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
