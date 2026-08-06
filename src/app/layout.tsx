import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google'

import './globals.css'

const appFont = Space_Grotesk({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-app',
})

const codeFont = JetBrains_Mono({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-code',
})

export const metadata: Metadata = {
  title: {
    default: 'DNSHE',
    template: '%s | DNSHE 控制台',
  },
  description: 'A neobrutalist domain management console with DNSHE integration for domains, DNS records, API keys, quota, and WHOIS.',
  applicationName: 'DNSHE',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1261ff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${appFont.variable} ${codeFont.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  )
}
