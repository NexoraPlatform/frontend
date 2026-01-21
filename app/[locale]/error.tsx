'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()
  const locale = params?.locale === 'ro' ? 'ro' : 'en'

  const copy = {
    en: {
      title: 'Something went wrong',
      description: 'An unexpected error occurred. Please try again.',
      tryAgain: 'Try again',
      goHome: 'Go home',
    },
    ro: {
      title: 'Ceva nu a mers bine',
      description: 'A apărut o eroare neașteptată. Te rugăm să încerci din nou.',
      tryAgain: 'Încearcă din nou',
      goHome: 'Mergi acasă',
    },
  } as const

  const { title, description, tryAgain, goHome } = copy[locale]

  useEffect(() => {
    console.error('Public page error:', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center pt-20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            {tryAgain}
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href={`/${locale}`}>
              <Home className="h-4 w-4 mr-2" />
              {goHome}
            </a>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
