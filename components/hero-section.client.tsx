"use client";

import dynamic from 'next/dynamic';

const HeroSection = dynamic(
    () => import('./hero-section').then(m => m.HeroSection),
    { ssr: false, loading: () => <div className="min-h-48" /> }
);

export default function HeroSectionClient() {
    return <HeroSection />;
}
