import './globals.css'

export const metadata = {
  title: 'POS 多行業系統',
  description: '餐飲 / 零售 / 服務業 · v3.0 production',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}