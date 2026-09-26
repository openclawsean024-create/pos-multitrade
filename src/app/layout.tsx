import './globals.css'

export const metadata = {
  title: 'POS Multi-Trade · Commerce Console',
  description: 'Local-first POS for food & beverage, retail and service businesses.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}
