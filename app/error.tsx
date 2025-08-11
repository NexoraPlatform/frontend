'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function PublicError({
                                        error,
                                        reset,
                                    }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Public page error:', error)
    }, [error])

    return (
        <>
            <Navbar />
            <main className="min-h-screen flex items-center justify-center pt-20 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle>Oops! Something went wrong</CardTitle>
                        <CardDescription>
                            We encountered an error while loading this page. Please try again.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={reset} className="w-full">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try again
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                            <a href="/">
                                <Home className="h-4 w-4 mr-2" />
                                Go to homepage
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </>
    )
}
