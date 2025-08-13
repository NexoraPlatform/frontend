// app/access-denied/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useSearchParams } from 'next/navigation';

export default function AccessDeniedPage() {
    const searchParams = useSearchParams();
    const from = searchParams.get('from');
    return (
        <>
            <Header />
            <main className="min-h-screen flex items-center justify-center pt-20 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>
                            You do not have permission to view this page.
                            {from && (
                                <p className="text-sm text-muted-foreground">
                                    You tried to access: {from}
                                </p>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

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
    );
}
