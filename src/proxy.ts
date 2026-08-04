import { NextResponse, type NextRequest } from 'next/server'

import { AUTH_UNAUTHORIZED_MESSAGE } from '@/lib/auth/constants'
import { getSessionCookieValue, readEdgeAuthSecret, verifyEdgeSessionToken } from '@/lib/auth/edge'

const PROTECTED_PAGE_PREFIXES = ['/dashboard', '/domains', '/whois', '/settings']

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isProtectedApi(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return false
  if (pathname.startsWith('/api/auth/')) return false
  return true
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const needsAuth = isProtectedPage(pathname) || isProtectedApi(pathname)
  if (!needsAuth) return NextResponse.next()

  const secret = readEdgeAuthSecret()
  const token = getSessionCookieValue(request)
  const session = secret && token ? await verifyEdgeSessionToken(token, secret) : null

  if (session) return NextResponse.next()

  if (isProtectedApi(pathname)) {
    return NextResponse.json({ message: AUTH_UNAUTHORIZED_MESSAGE }, { status: 401 })
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/'
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/dashboard/:path*', '/domains/:path*', '/whois/:path*', '/settings/:path*', '/api/domains/:path*', '/api/settings/:path*'],
}
