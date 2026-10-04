import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="card">
      <EmptyState
        icon={Compass}
        title="Page not found"
        text="This admin page doesn’t exist or has moved."
        action={
          <Link to="/" className="btn btn--primary">
            Back to dashboard
          </Link>
        }
      />
    </div>
  )
}
