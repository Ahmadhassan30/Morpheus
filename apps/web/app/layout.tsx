import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Morpheus — Sketch to Code',
  description: 'Upload a wireframe. Get production-ready code instantly.',
  icons: {
    icon: '/logo_dark.png',
    shortcut: '/logo_dark.png',
    apple: '/logo_dark.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo_dark.png" type="image/png" />
        <link rel="shortcut icon" href="/logo_dark.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo_dark.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('morpheus-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        `}} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
