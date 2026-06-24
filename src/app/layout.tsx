import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '旅のしおり - みんなで作る旅のしおり',
  description: 'URLとパスワードで共有できる旅のしおり作成アプリ。スケジュール・TODOリスト・持ち物リストを共同編集。',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
