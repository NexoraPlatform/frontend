"use client";

import type { ReactNode } from "react";

import { TrustoraLandingFooter } from "@/components/homepage/trustora-landing/footer";
import { TrustoraLandingNavigation } from "@/components/homepage/trustora-landing/navigation";
import { TrustoraLandingThemeStyles } from "@/components/homepage/trustora-landing/theme-styles";

type TrustoraAuthShellProps = {
  badge: string;
  children: ReactNode;
  pageClassName: string;
  subtitle: string;
  title: ReactNode;
};

export function TrustoraAuthShell({
  badge,
  children,
  pageClassName,
  subtitle,
  title,
}: TrustoraAuthShellProps) {
  return (
    <div className={`${pageClassName} relative isolate overflow-x-hidden bg-background text-foreground`}>
      <TrustoraLandingThemeStyles scopeClassName={pageClassName} />
      <TrustoraLandingNavigation />

      <main className="relative z-10">
        <section className="relative isolate overflow-hidden pt-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
            <div className="absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-[-6rem] top-36 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-24">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                <span className="mr-2 h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm font-medium">{badge}</span>
              </div>

              <div className="mx-auto max-w-4xl space-y-6">
                <h1 className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">{title}</h1>
                <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        </section>

        {children}
      </main>

      <TrustoraLandingFooter />
    </div>
  );
}
