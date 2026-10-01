import { Link } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'

export function NotFoundPage() {
  return (
    <MainLayout>
      <div className="container py-32 text-center">
        <h1 className="display-lg md:display-md font-display mb-4">404</h1>
        <h2 className="text-h2 md:text-h1 font-display mb-4">Page Not Found</h2>
        <p className="text-body-lg text-medium-grey mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
          <Link to="/shop" className="btn btn-secondary btn-lg">Continue Shopping</Link>
        </div>
      </div>
    </MainLayout>
  )
}
