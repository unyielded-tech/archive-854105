import { useEffect, useState } from 'react'
import { MainLayout } from '@/layouts/MainLayout'
import { getCollections } from '@/services/firestore'
import { Link } from 'react-router-dom'
import type { Collection } from '@/types'

export function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCollections()
        setCollections(data)
      } catch (error) {
        console.error('Failed to load collections:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <MainLayout>
      <div className="container py-12">
        <h1 className="text-display-sm md:text-display-md font-display mb-4">Collections</h1>
        <p className="text-body-lg text-medium-grey mb-12 max-w-2xl">
          Explore our curated collections of premium streetwear and contemporary fashion.
        </p>

        {loading ? (
          <div className="text-center py-20"><p className="text-medium-grey">Loading...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                to={`/shop?collection=${collection.slug}`}
                className="group cursor-pointer"
              >
                <div className="mb-4 bg-soft-grey aspect-square overflow-hidden rounded-md relative">
                  {collection.image && (
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                </div>
                <h3 className="text-h5 font-display group-hover:opacity-75">{collection.name}</h3>
                <p className="text-body-sm text-medium-grey mt-2">{collection.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
