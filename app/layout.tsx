import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Blender Building Assistant',
  description: 'AI-powered assistant to generate and modify buildings in Blender',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
