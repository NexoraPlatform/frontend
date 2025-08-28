'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAsyncTranslation } from '@/hooks/use-async-translation'
import { Locale } from '@/types/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function PublicError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const params = useParams()
    const locale = (params?.locale as Locale) || 'en'

    useEffect(() => {
        console.error('Public page error:', error)
    }, [error])

    const title = useAsyncTranslation(locale, 'errors.title')
    const description = useAsyncTranslation(locale, 'errors.description')
    const tryAgain = useAsyncTranslation(locale, 'errors.try_again')
    const goHome = useAsyncTranslation(locale, 'errors.go_home')

    return (
        <>
            <Header />
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
            <Footer />
        </>
    )
}
