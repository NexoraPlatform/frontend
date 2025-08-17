"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeroSectionStatic } from './hero-section-static';

export function HeroSectionEnhanced() {
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated || !formRef.current) return;

    const form = formRef.current;
    const handleSubmit = (e: Event) => {
      e.preventDefault();
      const formData = new FormData(form);
      const search = formData.get('search') as string;
      if (search?.trim()) {
        router.push(`/services?search=${encodeURIComponent(search.trim())}`);
      }
    };

    form.addEventListener('submit', handleSubmit);
    return () => form.removeEventListener('submit', handleSubmit);
  }, [isHydrated, router]);

  useEffect(() => {
    if (!isHydrated || !containerRef.current) return;

    const container = containerRef.current;
    const handleTagClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.matches('[data-tag]')) {
        e.preventDefault();
        const tag = target.getAttribute('data-tag');
        if (tag) {
          router.push(`/services?search=${encodeURIComponent(tag)}`);
        }
      }
    };

    container.addEventListener('click', handleTagClick);
    return () => container.removeEventListener('click', handleTagClick);
  }, [isHydrated, router]);

  useEffect(() => {
    if (!isHydrated || !containerRef.current) return;

    const el = containerRef.current;
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
  }, [isHydrated]);

  return (
      <div ref={containerRef}>
        <HeroSectionStatic />

        {isHydrated && (
            <script
                dangerouslySetInnerHTML={{
                  __html: `
              // Enhanced interactions after hydration
              (function() {
                const form = document.querySelector('form[role="search"]');
                const tags = document.querySelectorAll('[data-tag]');
                
                // Add enhanced form validation
                if (form) {
                  const input = form.querySelector('input[name="search"]');
                  if (input) {
                    input.addEventListener('input', function(e) {
                      // Real-time validation or suggestions could go here
                    });
                  }
                }

                // Add enhanced tag interactions
                tags.forEach(tag => {
                  tag.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.05)';
                  });
                  tag.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1)';
                  });
                });
              })();
            `,
                }}
            />
        )}
      </div>
  );
}
