import { MainLayout } from '@/layouts/MainLayout'
import { StoreMap, ContactBlock } from '@/components/StoreMap'

export function ContactPage() {
  return (
    <MainLayout>
      <section className="px-5 md:px-12 pt-32 pb-20 grid md:grid-cols-2 gap-10">
        <div>
          <h1 className="text-5xl md:text-8xl mb-8">Visit us</h1>
          <ContactBlock />
        </div>
        <StoreMap height={460} />
      </section>
    </MainLayout>
  )
}
