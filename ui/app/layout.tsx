import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '简谱编辑器',
  description: '在线简谱编辑和解析工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
