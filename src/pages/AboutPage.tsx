import { MainLayout } from '@/layouts/MainLayout'
import { Mail, Phone, MapPin } from 'lucide-react'

export function AboutPage() {
  return (
    <MainLayout>
      <div className="container py-12">
        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="display-sm md:display-md font-display mb-6">About ARCHIVE 854105</h1>
          <p className="text-body-lg text-medium-grey max-w-2xl mx-auto">
            Premium luxury streetwear designed for the modern individual. Every piece tells a story of craftsmanship, innovation, and cultural relevance.
          </p>
        </div>

        {/* Brand Story */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-12 border-y border-soft-grey mb-12">
          <div>
            <h2 className="text-h3 font-display mb-4">Our Story</h2>
            <p className="text-body-lg text-medium-grey mb-4">
              ARCHIVE 854105 was born from a vision to create elevated streetwear that bridges the gap between luxury and accessibility. Each collection is meticulously curated to reflect contemporary culture while maintaining the highest standards of quality and design.
            </p>
            <p className="text-body-lg text-medium-grey">
              Our commitment to excellence extends beyond aesthetics to encompass sustainable practices and ethical manufacturing.
            </p>
          </div>
          <div className="bg-off-white p-8 rounded-md">
            <h3 className="text-h5 font-semibold mb-6">Our Values</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-gold font-bold">•</span>
                <div>
                  <p className="font-semibold">Quality Craftsmanship</p>
                  <p className="text-body-sm text-medium-grey">Every piece is designed with precision and attention to detail</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-bold">•</span>
                <div>
                  <p className="font-semibold">Sustainability</p>
                  <p className="text-body-sm text-medium-grey">Responsible sourcing and ethical production practices</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-gold font-bold">•</span>
                <div>
                  <p className="font-semibold">Innovation</p>
                  <p className="text-body-sm text-medium-grey">Pushing boundaries in design and functionality</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="py-12">
          <h2 className="text-h3 font-display mb-8 text-center">Get In Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <Phone className="mx-auto mb-4 text-gold" size={32} />
              <h3 className="font-semibold mb-2">Phone</h3>
              <a href="tel:+917033077553" className="text-medium-grey hover:underline">
                +91 70330 77553
              </a>
            </div>
            <div className="text-center">
              <MapPin className="mx-auto mb-4 text-gold" size={32} />
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-medium-grey">
                Katihar, Bihar<br />India
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
