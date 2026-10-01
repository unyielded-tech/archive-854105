import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Preloader, ScrollProgress, WhatsAppFab } from '@/components/fx'

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="storefront min-h-screen flex flex-col">
      <Preloader />
      <ScrollProgress />
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <WhatsAppFab />
      <Toaster />
    </div>
  )
}
