import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'STYLEFORGE — AI Virtual Try-On Fashion',
  description: 'Premium fashion, reimagined. Try clothes on with AI before you buy.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-neutral-950 text-neutral-100">
        {children}
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  )
}
