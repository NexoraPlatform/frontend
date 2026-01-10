'use client';

import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const TrustFlowNetwork3D = dynamic(() => import('@/components/TrustFlowNetwork3D'), { ssr: false });

export function TrustoraHeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <TrustFlowNetwork3D />

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B1C2D]/50 to-[#0B1C2D] pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
                <div className="space-y-8">
                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                        <span className="block text-white mb-4">
                            Hire and get paid
                        </span>
                        <span className="block bg-gradient-to-r from-[#1BC47D] via-[#2DD88F] to-[#1BC47D] bg-clip-text text-transparent">
                            with zero risk
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        Verified professionals. Protected payments. Enforced delivery.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                        <Button
                            size="lg"
                            className="bg-[#1BC47D] hover:bg-[#16A368] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg shadow-[#1BC47D]/20 transition-all hover:shadow-xl hover:shadow-[#1BC47D]/30 hover:scale-105"
                        >
                            Start a protected project
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30 px-8 py-6 text-lg font-semibold rounded-lg backdrop-blur-sm transition-all"
                        >
                            Learn how it works
                        </Button>
                    </div>

                    <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="space-y-2">
                            <div className="text-3xl font-bold text-[#1BC47D]">10,000+</div>
                            <div className="text-sm text-gray-400 uppercase tracking-wider">Protected Projects</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl font-bold text-[#3B82F6]">$50M+</div>
                            <div className="text-sm text-gray-400 uppercase tracking-wider">Secured Payments</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl font-bold text-white">99.8%</div>
                            <div className="text-sm text-gray-400 uppercase tracking-wider">Success Rate</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1C2D] to-transparent pointer-events-none" />
        </section>
    );
}
