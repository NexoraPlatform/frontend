"use client";

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Rocket,
  Sparkles,
  Target,
  Play,
  Users,
  CheckCircle,
  Star,
  Clock,
} from 'lucide-react';

// Memoized floating icons component for better performance
const FloatingIcons = memo(() => (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div
          className="absolute opacity-5 animate-pulse"
          style={{ left: '20%', top: '10%', animationDelay: '0s', animationDuration: '6s' }}
      >
        <div className="w-16 h-16 bg-blue-600 rounded-lg opacity-20" />
      </div>
      <div
          className="absolute opacity-5 animate-pulse"
          style={{ left: '75%', top: '20%', animationDelay: '2s', animationDuration: '8s' }}
      >
        <div className="w-12 h-12 bg-purple-600 rounded-full opacity-20" />
      </div>
      <div
          className="absolute opacity-5 animate-pulse"
          style={{ left: '10%', top: '60%', animationDelay: '4s', animationDuration: '7s' }}
      >
        <div className="w-14 h-14 bg-indigo-600 rounded-lg opacity-20" />
      </div>
    </div>
));

FloatingIcons.displayName = 'FloatingIcons';

// Optimized stats component
const StatsGrid = memo(() => {
  const stats = [
    { number: '500+', label: 'Experți Verificați', icon: Users, change: '+12%' },
    { number: '2,847', label: 'Proiecte Finalizate', icon: CheckCircle, change: '+23%' },
    { number: '98.5%', label: 'Rata de Satisfacție', icon: Star, change: '+2.1%' },
    { number: '24/7', label: 'Suport Tehnic', icon: Clock, change: 'Non-stop' },
  ];

  return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center" role="list" aria-label="Statistici platformă">
        {stats.map((stat, index) => (
            <div
                key={index}
                className="group"
                role="listitem"
                tabIndex={0}
                aria-label={`${stat.number} ${stat.label}, ${stat.change}`}
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <stat.icon className="w-10 h-10 text-blue-600" />
              </div>
              <div className="text-3xl lg:text-4xl font-black text-blue-600 mb-2" aria-label={`Numărul: ${stat.number}`}>
                {stat.number}
              </div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-green-600 font-semibold" aria-label={`Schimbare: ${stat.change}`}>
                {stat.change}
              </div>
            </div>
        ))}
      </div>
  );
});

StatsGrid.displayName = 'StatsGrid';

// Main hero component
export const HeroSection = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Optimized search handler
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  }, [searchTerm, router]);

  // Quick tag handler
  const handleTagClick = useCallback((tag: string) => {
    setSearchTerm(tag);
    router.push(`/services?search=${encodeURIComponent(tag)}`);
  }, [router]);

  // Reduced motion support for cursor effects
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let raf = 0;
    const onPointerMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--cursor-x", `${e.clientX}px`);
        el.style.setProperty("--cursor-y", `${e.clientY}px`);
        raf = 0;
      });
    };

    el.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
      <section
          ref={containerRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20"
          aria-labelledby="hero-heading"
          role="banner"
      >
        {/* Simplified background */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-100/20 to-purple-100/20 dark:from-transparent dark:via-blue-900/5 dark:to-purple-900/5" />
          <FloatingIcons />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            {/* Critical above-the-fold badge */}
            <Badge
                variant="secondary"
                className="inline-flex h-12 items-center px-8 mb-8 text-base font-semibold bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/50 dark:via-indigo-900/50 dark:to-purple-900/50 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-lg backdrop-blur-sm"
            >
              <Sparkles className="w-5 h-5 mr-3 text-blue-600" />
              🚀 Platforma #1 pentru servicii IT în România
              <span className="ml-3 inline-flex h-6 w-[36px] items-center justify-center bg-blue-600 text-white text-xs rounded-full">
              LIVE
            </span>
            </Badge>

            {/* Critical LCP element - main heading */}
            <h1 className="text-6xl lg:text-8xl font-black mb-8 leading-tight">
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Transformă-ți
            </span>
              <span className="block text-foreground mt-2">
              ideile în
            </span>
              <span className="block bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              realitate digitală
            </span>
            </h1>

            {/* Critical LCP description - this is the measured LCP element */}
            <p className="mx-auto max-w-4xl text-2xl lg:text-3xl text-muted-foreground leading-relaxed font-medium mb-12">
              Conectează-te cu <span className="text-blue-600 font-bold">cei mai buni experți IT</span> din România.
              <br />
              De la dezvoltare web la marketing digital, găsește soluția perfectă pentru proiectul tău.
            </p>

            {/* Enhanced search bar */}
            <div className="max-w-4xl mx-auto mb-12">
              <form onSubmit={handleSearch} className="relative group" role="search" aria-label="Căutare servicii IT">
                <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-3 shadow-xl border border-blue-200/20 dark:border-blue-800/20">
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-8 top-1/2 transform -translate-y-1/2 text-muted-foreground w-7 h-7" aria-hidden="true" />
                      <Input
                          placeholder="Caută servicii, tehnologii sau experți... (ex: dezvoltare React, logo design, SEO)"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-[98%] pl-20 pr-6 py-8 text-xl border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/70"
                          aria-label="Caută servicii IT, tehnologii sau experți"
                          autoComplete="off"
                          spellCheck="false"
                      />
                    </div>
                    <Button
                        type="submit"
                        size="lg"
                        className="mr-3 px-4 md:px-12 py-8 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg transition-all duration-200"
                        aria-label="Începe căutarea de servicii IT"
                    >
                      <Rocket className="w-6 h-6 md:mr-3" />
                      <span className="hidden md:inline">Caută Acum</span>
                    </Button>
                  </div>
                </div>
              </form>

              {/* Popular tags */}
              <div className="flex flex-wrap justify-center items-center gap-3 mt-8" role="group" aria-label="Căutări populare">
                <span className="text-sm text-muted-foreground font-medium">Populare:</span>
                {['React', 'WordPress', 'Logo Design', 'SEO', 'Mobile App', 'E-commerce'].map((tag) => (
                    <Button
                        key={tag}
                        variant="outline"
                        size="sm"
                        className="rounded-full border border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-600 dark:hover:bg-blue-950 transition-colors duration-200"
                        aria-label={`Caută servicii pentru ${tag}`}
                        onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </Button>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                  size="lg"
                  className="px-12 py-8 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-xl transition-all duration-200"
                  asChild
              >
                <Link href="/auth/signup?type=client">
                  <Target className="mr-3 w-6 h-6" />
                  Alătură-te ca client
                </Link>
              </Button>
              <Button
                  variant="outline"
                  size="lg"
                  className="px-12 py-8 text-xl font-bold border-2 border-blue-300 hover:border-blue-500 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950 rounded-2xl shadow-lg transition-all duration-200"
                  asChild
              >
                <Link href="/auth/signup?type=provider">
                  <Play className="mr-3 w-6 h-6" />
                  Alătură-te ca prestator
                </Link>
              </Button>
            </div>

            {/* Stats grid */}
            <StatsGrid />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2" aria-hidden="true">
          <div className="w-6 h-10 border-2 border-blue-600 rounded-full flex justify-center animate-bounce">
            <div className="w-1 h-3 bg-blue-600 rounded-full mt-2" />
          </div>
        </div>
      </section>
  );
});

HeroSection.displayName = 'HeroSection';
