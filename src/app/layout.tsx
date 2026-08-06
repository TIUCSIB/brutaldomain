import type { Metadata, Viewport } from 'next'

import './globals.css'

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
    <html lang="zh-CN" className="h-full">
      <body
        className="min-h-full"
        style={
          {
            '--font-app': 'Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif',
            '--font-code': '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  )
}
