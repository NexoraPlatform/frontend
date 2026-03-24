"use client";

import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";

import { revealEase } from "./constants";
import type { LandingMetric } from "./types";

export function TrustoraLandingHeroSection() {
  const t = useTranslations("trustora.landing");
  const shouldReduceMotion = useReducedMotion();
  const chartPathRef = useRef<SVGPathElement | null>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);
  const chartProgress = useMotionValue(0);
  const chartDotX = useMotionValue(300);
  const chartDotY = useMotionValue(5);
  const chartDotOpacity = useMotionValue(1);
  const springRotateX = useSpring(rotateX, { stiffness: 140, damping: 18, mass: 0.6 });
  const springRotateY = useSpring(rotateY, { stiffness: 140, damping: 18, mass: 0.6 });
  const springGlowX = useSpring(glowX, { stiffness: 120, damping: 20, mass: 0.7 });
  const springGlowY = useSpring(glowY, { stiffness: 120, damping: 20, mass: 0.7 });
  const chartPath =
    "M0,50 Q30,45 60,35 T120,25 T180,30 T240,20 T300,5";

  const metrics: LandingMetric[] = [
    { value: "99.9%", label: t("hero.metrics.uptime_label") },
    { value: "$2B+", label: t("hero.metrics.secured_label") },
    { value: "500K+", label: t("hero.metrics.transactions_label") },
  ];

  const panelStats = [
    {
      label: t("hero.panel.stats.first.label"),
      value: t("hero.panel.stats.first.value"),
      change: t("hero.panel.stats.first.change"),
    },
    {
      label: t("hero.panel.stats.second.label"),
      value: t("hero.panel.stats.second.value"),
      change: t("hero.panel.stats.second.change"),
    },
    {
      label: t("hero.panel.stats.third.label"),
      value: t("hero.panel.stats.third.value"),
      change: t("hero.panel.stats.third.change"),
    },
  ];

  const checks = [
    {
      name: t("hero.panel.checks.first.name"),
      status: t("hero.panel.checks.first.status"),
      tone: "success" as const,
    },
    {
      name: t("hero.panel.checks.second.name"),
      status: t("hero.panel.checks.second.status"),
      tone: "success" as const,
    },
    {
      name: t("hero.panel.checks.third.name"),
      status: t("hero.panel.checks.third.status"),
      tone: "accent" as const,
    },
  ];

  const handlePanelPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left;
    const offsetY = event.clientY - bounds.top;
    const percentX = offsetX / bounds.width - 0.5;
    const percentY = offsetY / bounds.height - 0.5;

    rotateX.set(percentY * -14);
    rotateY.set(percentX * 14);
    glowX.set((percentX * bounds.width) / 2);
    glowY.set((percentY * bounds.height) / 2);
  };

  const handlePanelPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glowX.set(0);
    glowY.set(0);
  };

  useEffect(() => {
    const path = chartPathRef.current;
    if (!path || typeof path.getTotalLength !== "function" || typeof path.getPointAtLength !== "function") {
      chartDotX.set(300);
      chartDotY.set(5);
      chartDotOpacity.set(1);
      return;
    }

    const totalLength = path.getTotalLength();
    const syncDotWithPath = (value: number) => {
      const point = path.getPointAtLength(totalLength * value);
      const edgeFade = 0.08;
      let opacity = 1;

      if (value < edgeFade) {
        opacity = value / edgeFade;
      } else if (value > 1 - edgeFade) {
        opacity = (1 - value) / edgeFade;
      }

      chartDotX.set(point.x);
      chartDotY.set(point.y);
      chartDotOpacity.set(Math.max(0, Math.min(1, opacity)));
    };

    syncDotWithPath(shouldReduceMotion ? 1 : 0);

    if (shouldReduceMotion) {
      return;
    }

    const unsubscribe = chartProgress.on("change", syncDotWithPath);
    const controls = animate(chartProgress, 1, {
      duration: 3.6,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });

    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [chartDotOpacity, chartDotX, chartDotY, chartProgress, shouldReduceMotion]);

  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: revealEase }}
              className="glass-effect inline-flex items-center rounded-full px-4 py-2"
            >
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-sm font-medium">{t("hero.badge")}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: revealEase }}
              className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl"
            >
              {t("hero.title")} <span className="text-gradient">{t("hero.title_highlight")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: revealEase }}
              className="max-w-2xl text-xl leading-relaxed text-muted-foreground"
            >
              {t("hero.description")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: revealEase }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Button
                asChild
                size="lg"
                className="group rounded-xl bg-primary px-8 py-6 text-base font-medium text-white transition-all duration-200 active:scale-[0.98] hover:bg-primary/90"
              >
                <Link href="/projects">
                  {t("hero.primary_cta")}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group rounded-xl border-2 px-8 py-6 text-base font-medium transition-all duration-200 active:scale-[0.98]"
              >
                <a href="#how-it-works">
                  <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  {t("hero.secondary_cta")}
                </a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: revealEase }}
              className="flex items-center space-x-8 pt-8"
            >
              {metrics.map((metric, index) => (
                <div key={metric.label} className="flex items-center space-x-8">
                  <div>
                    <div className="text-gradient text-3xl font-bold">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                  </div>
                  {index < metrics.length - 1 ? <div className="h-12 w-px bg-border" /> : null}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: revealEase }}
              className="relative w-full max-w-lg"
              style={{ perspective: "1200px" }}
            >
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 -m-8 rounded-3xl bg-[#1BC47D]/10 blur-3xl"
                animate={
                  shouldReduceMotion
                    ? { opacity: 0.18, scale: 1 }
                    : { opacity: [0.12, 0.25, 0.16], scale: [0.94, 1.06, 0.98] }
                }
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.div
                className="relative"
                onPointerMove={handlePanelPointerMove}
                onPointerLeave={handlePanelPointerLeave}
                animate={shouldReduceMotion ? { y: 0 } : { y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={
                  shouldReduceMotion
                    ? { transformStyle: "preserve-3d" }
                    : {
                        rotateX: springRotateX,
                        rotateY: springRotateY,
                        transformStyle: "preserve-3d",
                      }
                }
              >
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <motion.div
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"
                    style={shouldReduceMotion ? undefined : { x: springGlowX, y: springGlowY }}
                    animate={
                      shouldReduceMotion
                        ? { opacity: 0.14, scale: 1 }
                        : { opacity: [0.08, 0.18, 0.12], scale: [0.92, 1.08, 1] }
                    }
                    transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    aria-hidden="true"
                    className="absolute -inset-y-10 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-40 dark:via-white/15"
                    animate={shouldReduceMotion ? { x: "20%" } : { x: ["0%", "220%"] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] dark:border-white/10 dark:bg-[#111B27]">
                  <div className="flex items-center gap-2 border-b border-black/5 bg-black/5 px-4 py-3 dark:border-white/5 dark:bg-white/5">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                    </div>
                    <div className="mx-4 flex-1">
                      <div className="flex h-5 items-center rounded-md bg-black/5 px-3 dark:bg-white/5">
                        <span className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                          {t("hero.panel.browser_url")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-3 gap-3">
                      {panelStats.map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45 + index * 0.08, duration: 0.5, ease: "easeOut" }}
                          className="rounded-xl bg-black/5 p-3 dark:bg-white/5"
                        >
                          <p className="mb-1 text-[10px] text-[#64748B] dark:text-[#94A3B8]">{item.label}</p>
                          <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F5F7FA]">{item.value}</p>
                          <p className="text-[10px] font-medium text-[#1BC47D]">{item.change}</p>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.68, duration: 0.55 }}
                      className="relative h-28 overflow-hidden rounded-xl bg-black/5 p-4 dark:bg-white/5"
                    >
                      <motion.div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 blur-xl"
                        animate={shouldReduceMotion ? { x: "10%" } : { x: ["-30%", "240%"] }}
                        transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
                      />

                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                          {t("hero.panel.chart.title")}
                        </span>
                        <motion.span
                          className="text-[10px] font-medium text-[#1BC47D]"
                          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {t("hero.panel.chart.live")}
                        </motion.span>
                      </div>

                      <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="h-14 w-full">
                        <defs>
                          <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1BC47D" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#1BC47D" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <motion.path
                          ref={chartPathRef}
                          d={chartPath}
                          fill="none"
                          stroke="#1BC47D"
                          strokeWidth="2"
                          initial={{ pathLength: 0, opacity: 0.7 }}
                          animate={
                            shouldReduceMotion
                              ? { pathLength: 1, opacity: 1 }
                              : { pathLength: 1, opacity: [0.75, 1, 0.82] }
                          }
                          transition={{
                            pathLength: { delay: 0.88, duration: 1.3, ease: "easeOut" },
                            opacity: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
                          }}
                        />
                        <path
                          d={`${chartPath} L300,60 L0,60Z`}
                          fill="url(#heroChartGrad)"
                        />
                        <motion.g
                          aria-hidden="true"
                          style={{ x: chartDotX, y: chartDotY, opacity: chartDotOpacity }}
                        >
                          <circle
                            r="8"
                            fill="rgba(27,196,125,0.18)"
                            stroke="rgba(27,196,125,0.1)"
                            strokeWidth="10"
                          />
                          <circle
                            r="4.5"
                            fill="#1BC47D"
                            stroke="rgba(255,255,255,0.9)"
                            strokeWidth="1.5"
                          />
                        </motion.g>
                      </svg>
                    </motion.div>

                    <div className="space-y-2">
                      {checks.map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.08, duration: 0.45, ease: "easeOut" }}
                          className="flex items-center justify-between rounded-lg bg-black/[0.03] px-3 py-2 dark:bg-white/[0.03]"
                        >
                          <span className="text-xs text-[#0F172A] dark:text-[#F5F7FA]">{item.name}</span>
                          <motion.span
                            animate={{ scale: 1 }}
                            transition={{ duration: 0 }}
                            className={
                              item.tone === "accent"
                                ? "rounded-full px-2 py-0.5 text-[10px] font-medium text-[#21D19F] bg-[rgba(33,209,159,0.082)]"
                                : "rounded-full bg-[rgba(27,196,125,0.082)] px-2 py-0.5 text-[10px] font-medium text-[#1BC47D]"
                            }
                          >
                            {item.status}
                          </motion.span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
