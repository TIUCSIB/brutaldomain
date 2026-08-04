'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronDown, Code2, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, UserRound } from 'lucide-react'

import { ExpiryNotifications } from '@/components/expiry-notifications'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/components/ui/sonner'

export interface TopbarProps {
  sidebarCollapsed: boolean
  onSidebarCollapsedChange: (collapsed: boolean) => void
}

export function Topbar({ sidebarCollapsed, onSidebarCollapsedChange }: TopbarProps) {
  const router = useRouter()
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [username, setUsername] = useState('用户')
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        const payload = (await response.json()) as {
          authenticated?: boolean
          username?: string
          name?: string | null
          avatarUrl?: string | null
        }
        if (!cancelled && payload.authenticated && payload.username) {
          setUsername(payload.username)
          setDisplayName(payload.name ?? null)
          setAvatarUrl(payload.avatarUrl ?? null)
        }
      } catch {
        // Keep default label when session lookup fails.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('已退出登录')
      router.replace('/')
      router.refresh()
    } catch {
      toast.error('退出失败')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 flex min-h-14 items-center gap-2 border-b-4 border-border bg-[#edf4ff]/95 px-3 py-2 backdrop-blur sm:px-4 lg:px-5">
      <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" size="icon" aria-label="打开主导航" className="size-9 shrink-0 rounded-none border-2 border-border bg-secondary-background shadow-shadow md:hidden">
            <Menu className="size-4" strokeWidth={3} />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[min(88vw,320px)] border-r-4 border-border bg-main p-0 [&>button]:z-10 [&>button]:border-2 [&>button]:border-border [&>button]:bg-secondary-background [&>button]:p-1 [&>button]:text-foreground [&>button]:opacity-100"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>主导航</SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setMobileNavigationOpen(false)} />
        </SheetContent>
      </Sheet>

      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
              aria-pressed={sidebarCollapsed}
              onClick={() => onSidebarCollapsedChange(!sidebarCollapsed)}
              className="hidden size-9 shrink-0 rounded-none border-2 border-border bg-secondary-background shadow-shadow md:inline-flex"
            >
              {sidebarCollapsed ?
                <PanelLeftOpen className="size-4" strokeWidth={2.5} />
              : <PanelLeftClose className="size-4" strokeWidth={2.5} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="min-w-0 flex-1" aria-hidden="true" />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ExpiryNotifications />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              aria-label="打开用户菜单"
              className="h-9 shrink-0 gap-2 rounded-none border-2 border-border bg-main px-2 text-main-foreground shadow-shadow hover:bg-main/90 hover:text-main-foreground sm:px-2.5"
            >
              <span className="grid size-6 place-items-center overflow-hidden border-2 border-border bg-[#ffd84d] text-foreground">
                {avatarUrl ?
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                : <Code2 className="size-3.5" strokeWidth={2.5} />}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-xs font-black">{username}</span>
              </span>
              <ChevronDown className="hidden size-3.5 sm:block" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-none border-2 border-border bg-secondary-background p-1 text-foreground shadow-shadow">
            <DropdownMenuLabel className="font-black">
              {displayName || username}
              <span className="block text-xs font-medium text-foreground/55">@{username}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="rounded-none font-bold focus:bg-main/15">
              <Link href="/settings">
                <Settings className="size-4" />
                设置
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-none font-bold focus:bg-main/15">
              <a href={`https://github.com/${username}`} target="_blank" rel="noreferrer">
                <UserRound className="size-4" />
                GitHub 主页
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              disabled={signingOut}
              onSelect={(event) => {
                event.preventDefault()
                void handleSignOut()
              }}
              className="rounded-none font-bold text-red-700 focus:bg-red-100 focus:text-red-800"
            >
              <LogOut className="size-4" />
              {signingOut ? '正在退出…' : '退出登录'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Topbar
