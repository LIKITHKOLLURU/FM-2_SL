import { Compass } from 'lucide-react'
import { EmptyState } from '../../components/ui/Display.jsx'
import Button from '../../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState icon={Compass} title="Page not found" message="The page you are looking for does not exist or has moved." action={<Button to="/">Go home</Button>} />
    </div>
  )
}
