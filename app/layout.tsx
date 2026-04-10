import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ACA Build – Site Register',
  description: 'Trade sign-in, document upload, and site compliance for ACA Build',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#2C1706',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream">{children}</body>
    </html>
  )
}
