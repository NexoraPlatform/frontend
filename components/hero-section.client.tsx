"use client";

import dynamic from 'next/dynamic';

// Simplified, performance-focused loading skeleton
const HeroSkeleton = () => (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="container mx-auto px-4 py-8 relative z-10">
            <div className="max-w-6xl mx-auto text-center">
                {/* Badge skeleton - simplified */}
                <div className="h-12 flex justify-center mb-8">
                    <div className="h-12 w-80 bg-blue-100 dark:bg-blue-900/50 rounded-full" />
                </div>

                {/* Title skeleton - reduced animation complexity */}
                <div className="space-y-4 mb-8">
                    <div className="h-16 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg mx-auto max-w-4xl" />
                    <div className="h-16 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-lg mx-auto max-w-3xl" />
                    <div className="h-16 bg-gradient-to-r from-cyan-200 to-blue-200 rounded-lg mx-auto max-w-4xl" />
                </div>

                {/* CRITICAL LCP ELEMENT SKELETON - Match exact dimensions */}
                <div
                    className="space-y-2 mb-12 max-w-4xl mx-auto"
                    style={{
                        height: '96px', // Match expected content height
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}
                >
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
                </div>

                {/* Search bar skeleton */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="h-20 bg-white/90 dark:bg-gray-900/90 rounded-3xl border-2 border-white/20" />
                    {/* Simplified tags skeleton */}
                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="h-8 w-20 bg-blue-100 dark:bg-blue-900 rounded-full" />
                        ))}
                    </div>
                </div>

                {/* Buttons skeleton */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                    <div className="h-16 w-64 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl" />
                    <div className="h-16 w-64 bg-transparent border-2 border-blue-300 rounded-2xl" />
                </div>

                {/* Stats skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="space-y-3">
                            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-2xl mx-auto" />
                            <div className="h-8 w-16 bg-blue-200 rounded mx-auto" />
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
                            <div className="h-3 w-12 bg-green-200 rounded mx-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Scroll indicator skeleton */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="w-6 h-10 border-2 border-blue-600 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-blue-600 rounded-full mt-2" />
            </div>
        </div>
    </section>
);

// Optimized dynamic import with better loading strategy
const HeroSection = dynamic(
    () => import('./hero-section').then(m => m.HeroSection),
    {
        ssr: false, // Client-side only for better performance
        loading: () => <HeroSkeleton />
    }
);

export default function HeroSectionClient() {
    return <HeroSection />;
}
