import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Preloader, ScrollProgress, WhatsAppFab } from '@/components/fx'
import '@/styles/store.css'

// hideFab: pages with a sticky bottom action bar (product, cart, checkout) hide the WhatsApp button.
export function MainLayout({ children, hideFab = false }: { children: ReactNode; hideFab?: boolean }) {
  return (
    <div className="storefront min-h-screen flex flex-col">
      <Preloader />
      <ScrollProgress />
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      {!hideFab && <WhatsAppFab />}
      <Toaster toastOptions={{ style: { background: '#F7F4EF', color: '#111', border: '1px solid #111', borderRadius: 0, boxShadow: 'none', fontSize: '14px' } }} />
    </div>
  )
}
