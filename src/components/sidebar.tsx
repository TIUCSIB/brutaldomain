'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CircleDotDashed, Globe2, LayoutDashboard, Network, Radar, Settings, type LucideIcon } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type NavigationItem = {
  label: string
  href: string
  icon: LucideIcon
}

const navigation: NavigationItem[] = [
  { label: '概览', href: '/dashboard', icon: LayoutDashboard },
  { label: '域名', href: '/domains', icon: Globe2 },
  { label: 'DNS', href: '/dns', icon: Network },
  { label: 'WHOIS', href: '/whois', icon: Radar },
  { label: '设置', href: '/settings', icon: Settings },
]

export interface SidebarProps {
  className?: string
  collapsed?: boolean
  onNavigate?: () => void
}

function isRouteActive(pathname: string, href: string) {
  if (href === '/') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({ className = '', collapsed = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={`flex h-full min-h-0 flex-col bg-main text-main-foreground ${className}`}>
      <div className={`flex h-14 shrink-0 items-center border-b-4 border-border ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-4'}`}>
        <div aria-hidden="true" className="grid size-9 place-items-center border-2 border-border bg-[#ffd84d] text-foreground shadow-shadow">
          <CircleDotDashed className="size-5" strokeWidth={2.5} />
        </div>
        {!collapsed ?
          <div className="min-w-0 leading-none">
            <p className="text-base font-black tracking-tight">DNSHE</p>
            <p className="mt-1 text-[11px] font-bold text-main-foreground/80">域名控制台</p>
          </div>
        : null}
      </div>

      <TooltipProvider delayDuration={300}>
        <nav aria-label="主导航" className={`flex-1 space-y-1.5 overflow-y-auto ${collapsed ? 'p-2' : 'p-3'}`}>
          {!collapsed ?
            <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-main-foreground/75">工作台</p>
          : null}
          {navigation.map((item) => {
            const active = isRouteActive(pathname, item.href)
            const Icon = item.icon

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                    className={`group flex min-h-10 items-center border-2 border-border text-sm font-black transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd84d] focus-visible:ring-offset-2 focus-visible:ring-offset-main active:translate-x-0.5 active:translate-y-0.5 ${
                      collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-2'
                    } ${
                      active ?
                        'translate-x-[-1px] translate-y-[-1px] bg-secondary-background text-foreground shadow-shadow'
                      : 'border-transparent text-main-foreground hover:border-border hover:bg-main/80 hover:shadow-shadow'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={2.5} />
                    {!collapsed ?
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    : null}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" hidden={!collapsed}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
      </TooltipProvider>

      {!collapsed ?
        <div className="shrink-0 border-t-4 border-border p-3">
          <div className="border-2 border-border bg-main/80 p-2.5 shadow-shadow">
            <p className="text-[11px] font-black uppercase tracking-wider">系统状态</p>
            <p className="mt-1.5 flex items-center gap-2 text-[11px] font-bold text-main-foreground/80">
              <span className="size-2 rounded-full border border-border bg-[#66e58a]" />
              DNSHE 实时模式
            </p>
          </div>
        </div>
      : <div className="shrink-0 border-t-4 border-border p-2">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div aria-label="DNSHE 实时模式" className="mx-auto grid size-8 place-items-center border-2 border-border bg-main/80 shadow-shadow">
                  <span className="size-2.5 rounded-full border border-border bg-[#66e58a]" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">DNSHE 实时模式</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      }
    </div>
  )
}

export default Sidebar
