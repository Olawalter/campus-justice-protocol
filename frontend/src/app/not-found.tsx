import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
          <FileQuestion className="h-8 w-8 text-secondary" />
        </div>
        <div>
          <h2 className="text-6xl font-heading font-bold text-foreground mb-2">404</h2>
          <p className="text-muted-foreground">The page you are looking for does not exist or has been moved.</p>
        </div>
        <Link href="/">
          <Button className="bg-secondary hover:bg-secondary/90 text-white">Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}
