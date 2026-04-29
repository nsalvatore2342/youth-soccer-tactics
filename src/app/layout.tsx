import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Youth Soccer Tactics Board',
  description: 'Interactive soccer field tactics board for youth coaches — formations, patterns, drawing tools, and coaching overlays.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white antialiased h-screen overflow-hidden">
        {children}
      </body>
    </html>
  )
}
