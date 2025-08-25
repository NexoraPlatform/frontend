import { Skeleton } from '@/components/ui/skeleton'
import { Footer } from '@/components/footer'
import {Header} from "@/components/header";

export default function PublicLoading() {
    return (
        <>
            <Header />
            <main className="min-h-screen pt-20">
                <div className="container py-16">
                    {/* Hero Section Skeleton */}
                    <div className="text-center max-w-4xl mx-auto mb-16">
                        <Skeleton className="h-6 w-32 mx-auto mb-6" />
                        <Skeleton className="h-16 w-full mb-6" />
                        <Skeleton className="h-6 w-3/4 mx-auto mb-8" />
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Skeleton className="h-12 w-48" />
                            <Skeleton className="h-12 w-48" />
                        </div>
                    </div>

                    {/* Content Skeleton */}
                    <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-48 w-full rounded-lg" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    )
}
