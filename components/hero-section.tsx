"use client";

import {useState, useEffect, useRef} from 'react';
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
  Code,
  Palette,
  Smartphone,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react';

export function HeroSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      el.style.setProperty("--cursor-alpha", "0");
      return;
    }

    let raf = 0;
    let lastX = 0;
    let lastY = 0;
    let framePending = false;

    const onPointerMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;

      if (!framePending) {
        framePending = true;
        raf = requestAnimationFrame(() => {
          framePending = false;
          el.style.setProperty("--cursor-x", `${lastX}px`);
          el.style.setProperty("--cursor-y", `${lastY}px`);
        });
      }
    };

    el.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const stats = [
    { number: '500+', label: 'Experți Verificați', icon: Users, change: '+12%' },
    { number: '2,847', label: 'Proiecte Finalizate', icon: CheckCircle, change: '+23%' },
    { number: '98.5%', label: 'Rata de Satisfacție', icon: Star, change: '+2.1%' },
    { number: '24/7', label: 'Suport Tehnic', icon: Clock, change: 'Non-stop' },
  ];

  const floatingElements = [
    { icon: Code, delay: 0, duration: 6 },
    { icon: Palette, delay: 1, duration: 8 },
    { icon: Smartphone, delay: 2, duration: 7 },
    { icon: TrendingUp, delay: 3, duration: 9 },
    { icon: Shield, delay: 4, duration: 6 },
    { icon: Zap, delay: 5, duration: 8 },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
      <section
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          aria-labelledby="hero-heading"
          role="banner"
      >
        {/* Animated Background */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-100/30 to-purple-100/30 dark:from-transparent dark:via-blue-900/10 dark:to-purple-900/10" />

          {/* Floating geometric shapes */}
          <div className="absolute inset-0">
            {floatingElements.map((element, index) => (
                <div
                    key={index}
                    className="absolute animate-pulse opacity-10 dark:opacity-5"
                    aria-hidden="true"
                    style={{
                      left: `${20 + index * 15}%`,
                      top: `${10 + index * 12}%`,
                      animationDelay: `${element.delay}s`,
                      animationDuration: `${element.duration}s`,
                    }}
                >
                  <element.icon className="w-16 h-16 text-blue-600" />
                </div>
            ))}
          </div>


        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            {/* Animated Badge */}
            <div className="transform translate-y-0 opacity-100">
              <div className="h-12 flex justify-center">
                <Badge
                    variant="secondary"
                    className="inline-flex h-12 items-center px-8 text-base font-semibold
                 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100
                 dark:from-blue-900/50 dark:via-indigo-900/50 dark:to-purple-900/50
                 border-2 border-blue-200/50 dark:border-blue-800/50
                 shadow-lg backdrop-blur-sm"
                >
                  <Sparkles className="w-5 h-5 mr-3 text-blue-600 shrink-0" />
                  <span className="whitespace-nowrap">
        🚀 Platforma #1 pentru servicii IT în România
      </span>
                  <span className="ml-3 inline-flex h-6 w-[36px] items-center justify-center bg-blue-600 text-white text-xs rounded-full">
        LIVE
      </span>
                </Badge>
              </div>
            </div>


            {/* Main Heading with Staggered Animation */}
            <div className="transform transition-all duration-1000 delay-200 translate-y-0 opacity-100">
              <h1 className="text-6xl lg:text-8xl font-black animate-fadeIn">
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                Transformă-ți
              </span>
                <span className="block text-foreground mt-2">
                <span className="relative">
                  ideile în
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 animate-pulse" aria-hidden="true"></div>
                </span>
              </span>
                <span className="block bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                realitate digitală
              </span>
              </h1>
            </div>

            {/* Enhanced Description */}
            <p className="mx-auto max-w-4xl text-2xl lg:text-3xl text-muted-foreground leading-relaxed font-medium text-pretty mb-12">
              Conectează-te cu <span className="text-blue-600 font-bold">cei mai buni experți IT</span> din România.
              <br />De la dezvoltare web la marketing digital, găsește soluția perfectă pentru proiectul tău.
            </p>

            {/* Enhanced Search Bar */}
            <div className="transform transition-all duration-1000 delay-600 translate-y-0 opacity-100">
              <div className="max-w-4xl mx-auto mb-12">
                <form onSubmit={handleSearch} className="relative group" role="search" aria-label="Căutare servicii IT">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" aria-hidden="true"></div>
                  <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-3 shadow-2xl border-2 border-white/20 dark:border-gray-800/20">
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
                          className="mr-3 px-4 md:px-12 py-8 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center md:justify-start"
                          aria-label="Începe căutarea de servicii IT"
                      >
                        <Rocket className="w-6 h-6 md:mr-3" />
                        <span className="hidden md:inline">Caută Acum</span>
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Popular Tags */}
                <div className="flex flex-wrap justify-center items-center gap-3 mt-8" role="group" aria-label="Căutări populare">
                  <span className="text-sm text-muted-foreground font-medium">Populare:</span>
                  {['React', 'WordPress', 'Logo Design', 'SEO', 'Mobile App', 'E-commerce'].map((tag) => (
                      <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          className="rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-600 dark:hover:bg-blue-950 transition-all duration-200 transform hover:scale-105"
                          aria-label={`Caută servicii pentru ${tag}`}
                          onClick={() => {
                            setSearchTerm(tag);
                            router.push(`/services?search=${encodeURIComponent(tag)}`);
                          }}
                      >
                        {tag}
                      </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="transform transition-all duration-1000 delay-800 translate-y-0 opacity-100">
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Button
                    size="lg"
                    className="px-12 py-8 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
                    asChild
                >
                  <Link href="#">
                    <Target className="mr-3 w-6 h-6" />
                    Alătură-te ca si client
                  </Link>
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    className="px-12 py-8 text-xl font-bold border-3 border-blue-300 hover:border-blue-500 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                    aria-label="Înregistrează-te ca prestator de servicii IT"
                >
                  <Play className="mr-3 w-6 h-6" />
                  Alătură-te ca prestator
                </Button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="transform transition-all duration-1000 delay-1000 translate-y-0 opacity-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center" role="list" aria-label="Statistici platformă">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="group"
                        role="listitem"
                        tabIndex={0}
                        aria-label={`${stat.number} ${stat.label}, ${stat.change}`}
                    >
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center …">
                        <stat.icon className="w-10 h-10" />
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
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce" aria-hidden="true">
          <div className="w-6 h-10 border-2 border-blue-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-blue-600 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
  );
}

