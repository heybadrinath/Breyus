import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-muted-foreground">
          {description || 'This feature is coming soon'}
        </p>
      </div>

      {/* Placeholder Card */}
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <Construction className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            This module is not yet implemented
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>
            Check the <strong>ADMIN_PORTAL_TASKS.md</strong> file to see the implementation timeline.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
