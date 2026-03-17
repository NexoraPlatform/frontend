"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {CheckCircle2, Lock} from "lucide-react";

export function TrustoraHeroSecurityVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contractCardRef = useRef<HTMLDivElement | null>(null);
  const t = useTranslations();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const contractCard = contractCardRef.current;

    if (!canvas || !container) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    const ctx: CanvasRenderingContext2D = context;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;

    const SHIELD_RADIUS = 140;
    const getThreatSpawnBand = () => ({
      horizontalOverflow: Math.max(80, width * 0.16),
      topDepth: Math.max(70, height * 0.12),
      bottomDepth: Math.max(120, height * 0.22),
      sideDepth: Math.max(70, width * 0.08),
    });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
      centerX = width / 2;
      centerY = height / 2;
    };
    window.addEventListener("resize", resize);
    resize();

    const getContractBounds = () => {
      if (!contractCard) {
        return null;
      }

      const containerRect = container.getBoundingClientRect();
      const cardRect = contractCard.getBoundingClientRect();

      return {
        left: cardRect.left - containerRect.left,
        top: cardRect.top - containerRect.top,
        right: cardRect.right - containerRect.left,
        bottom: cardRect.bottom - containerRect.top,
      };
    };

    const triggerContractImpact = () => {
      if (!contractCard) {
        return;
      }

      contractCard.style.boxShadow =
        "0 40px 90px rgba(2, 6, 23, 0.54), 0 0 0 1px rgba(255, 42, 75, 0.3), 0 0 46px rgba(255, 42, 75, 0.22)";
      contractCard.style.borderColor = "rgba(255, 42, 75, 0.28)";

      window.setTimeout(() => {
        if (!contractCard) {
          return;
        }

        contractCard.style.boxShadow =
          "0 32px 72px rgba(2, 6, 23, 0.48), 0 0 0 1px rgba(51, 65, 85, 0.8)";
        contractCard.style.borderColor = "rgba(51, 65, 85, 0.9)";
      }, 150);
    };

    class DataStream {
      x: number;
      y: number;
      vx: number;
      length: number;
      thickness: number;
      color: string;
      alpha: number;
      glow: number;

      constructor() {
        this.x = Math.random() * -200;
        this.y = Math.random() * height;
        this.vx = Math.random() * 3 + 2;
        this.length = Math.random() * 40 + 10;
        this.thickness = Math.random() * 1.5 + 0.5;
        this.color = "#0088cc";
        this.alpha = 0.3;
        this.glow = 0;
      }

      update() {
        this.x += this.vx;

        const distToCenter = Math.hypot(this.x - centerX, this.y - centerY);
        if (distToCenter < SHIELD_RADIUS + 50) {
          this.color = "#00ffff";
          this.alpha = 1;
          this.glow = 15;
        } else {
          this.color = "#0088cc";
          this.alpha = 0.3;
          this.glow = 0;
        }

        if (this.x - this.length > width) {
          this.x = -100;
          this.y = Math.random() * height;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.length, this.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = this.glow;
        ctx.shadowColor = this.color;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    class Threat {
      x: number;
      y: number;
      vx: number;
      vy: number;
      targetX: number;
      targetY: number;
      radius: number;
      color: string;
      state: "attacking" | "repelled";
      alpha: number;
      trail: Array<{ x: number; y: number }>;

      constructor() {
        const { horizontalOverflow, topDepth, bottomDepth, sideDepth } = getThreatSpawnBand();
        const contractBounds = getContractBounds();
        const edgeRoll = Math.random();
        let spawnEdge: "top" | "bottom" | "right" = "top";

        if (edgeRoll < 0.38) {
          spawnEdge = "top";
          this.x = Math.random() * (width + horizontalOverflow * 2) - horizontalOverflow;
          this.y = -(Math.random() * topDepth + 10);
        } else if (edgeRoll < 0.78) {
          spawnEdge = "bottom";
          this.x = Math.random() * (width + horizontalOverflow * 2) - horizontalOverflow;
          this.y = height + Math.random() * bottomDepth + 10;
        } else {
          spawnEdge = "right";
          this.x = width + Math.random() * sideDepth + 14;
          this.y = Math.random() * (height * 0.84) + height * 0.08;
        }

        if (contractBounds) {
          const targetPadding = 18;
          const minTargetX = contractBounds.left + targetPadding;
          const maxTargetX = contractBounds.right - targetPadding;
          this.targetX = minTargetX + Math.random() * Math.max(1, maxTargetX - minTargetX);

          if (spawnEdge === "top") {
            this.targetY = contractBounds.top + 28;
          } else if (spawnEdge === "bottom") {
            this.targetY = contractBounds.bottom - 8;
          } else {
            this.targetY = contractBounds.top + (contractBounds.bottom - contractBounds.top) * 0.55;
          }
        } else {
          this.targetX = centerX;
          this.targetY = centerY;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy);

        const speed =
          spawnEdge === "bottom"
            ? Math.random() * 2 + 3.2
            : Math.random() * 2 + 2.5;
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;

        this.radius = Math.random() * 2.8 + 4;
        this.color = "#ff2a4b";
        this.state = "attacking";
        this.alpha = 1;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;

        if (this.state === "attacking") {
          const contractBounds = getContractBounds();
          if (contractBounds) {
            const nearestX = Math.max(contractBounds.left, Math.min(this.x, contractBounds.right));
            const nearestY = Math.max(contractBounds.top, Math.min(this.y, contractBounds.bottom));
            const offsetX = this.x - nearestX;
            const offsetY = this.y - nearestY;
            const collisionDistance = Math.hypot(offsetX, offsetY);

            if (collisionDistance <= this.radius + 6) {
              this.state = "repelled";

              let normalX = 0;
              let normalY = 0;

              if (collisionDistance > 0.001) {
                normalX = offsetX / collisionDistance;
                normalY = offsetY / collisionDistance;
              } else {
                const distLeft = Math.abs(this.x - contractBounds.left);
                const distRight = Math.abs(this.x - contractBounds.right);
                const distTop = Math.abs(this.y - contractBounds.top);
                const distBottom = Math.abs(this.y - contractBounds.bottom);
                const minDistance = Math.min(distLeft, distRight, distTop, distBottom);

                if (minDistance === distLeft) normalX = -1;
                else if (minDistance === distRight) normalX = 1;
                else if (minDistance === distTop) normalY = -1;
                else normalY = 1;
              }

              const projection = this.vx * normalX + this.vy * normalY;
              const ricochetBoost = Math.random() * 0.35 + 1.2;

              this.vx = (this.vx - 2 * projection * normalX) * ricochetBoost;
              this.vy = (this.vy - 2 * projection * normalY) * ricochetBoost;

              const impactX = nearestX + normalX * 2;
              const impactY = nearestY + normalY * 2;

              impacts.push(new ImpactRipple(impactX, impactY));
              for (let i = 0; i < 8; i++) {
                sparks.push(new Spark(impactX, impactY, this.vx, this.vy));
              }

              triggerContractImpact();
              return;
            }
          }

          const floatOffset = Math.sin(Date.now() / 636) * 10;
          const distToCenter = Math.hypot(this.x - centerX, this.y - (centerY + floatOffset));

          if (distToCenter <= SHIELD_RADIUS) {
            this.state = "repelled";

            this.vx = -this.vx * (Math.random() * 1.5 + 1.5);
            this.vy = -this.vy * (Math.random() * 1.5 + 1.5);

            impacts.push(new ImpactRipple(this.x, this.y));
            for (let i = 0; i < 8; i++) {
              sparks.push(new Spark(this.x, this.y, this.vx, this.vy));
            }

            triggerContractImpact();
          }
        } else if (this.state === "repelled") {
          this.alpha -= 0.02;
        }
      }

      draw() {
        if (this.alpha <= 0) return;

        ctx.globalAlpha = this.alpha;

        if (this.trail.length > 0) {
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          for (let i = this.trail.length - 1; i >= 0; i--) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
          }
          ctx.strokeStyle = `rgba(255, 42, 75, ${this.alpha * 0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 16;
        ctx.shadowColor = this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.52, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    class Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      size: number;

      constructor(x: number, y: number, baseVx: number, baseVy: number) {
        this.x = x;
        this.y = y;
        this.vx = baseVx * 0.5 + (Math.random() - 0.5) * 5;
        this.vy = baseVy * 0.5 + (Math.random() - 0.5) * 5;
        this.alpha = 1;
        this.color = Math.random() > 0.5 ? "#ff2a4b" : "#ffaa00";
        this.size = Math.random() * 1.5 + 0.5;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.04;
      }
      draw() {
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    class ImpactRipple {
      x: number;
      y: number;
      radius: number;
      alpha: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.alpha = 0.8;
      }
      update() {
        this.radius += 2;
        this.alpha -= 0.05;
      }
      draw() {
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    const dataParticles: DataStream[] = [];
    const threats: Threat[] = [];
    const sparks: Spark[] = [];
    const impacts: ImpactRipple[] = [];

    for (let i = 0; i < 60; i++) dataParticles.push(new DataStream());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      if (Math.random() < 0.055) {
        threats.push(new Threat());
      }

      dataParticles.forEach((p) => {
        p.update();
        p.draw();
      });

      for (let i = threats.length - 1; i >= 0; i--) {
        const t = threats[i];
        t.update();
        t.draw();
        if (t.alpha <= 0 || t.x < -100 || t.x > width + 100 || t.y < -100 || t.y > height + 100) {
          threats.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        sparks[i].update();
        sparks[i].draw();
        if (sparks[i].alpha <= 0) sparks.splice(i, 1);
      }

      for (let i = impacts.length - 1; i >= 0; i--) {
        impacts[i].update();
        impacts[i].draw();
        if (impacts[i].alpha <= 0) impacts.splice(i, 1);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div
        className="relative h-[400px] w-full overflow-hidden sm:h-[500px] lg:h-[600px]"
        ref={containerRef}
        style={{ perspective: "1000px" }}
      >
        <div className="absolute inset-0 z-0 opacity-70 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        />

        {/*<div className="absolute inset-x-[12%] top-1/2 z-20 h-[260px] -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl sm:h-[320px]" />*/}

        <div className="relative z-20 flex h-full items-center justify-center pointer-events-none animate-[float_4s_ease-in-out_infinite]">
          <div className="relative">
            <div
              ref={contractCardRef}
              className="relative overflow-hidden rounded-xl border border-slate-700/90 bg-[linear-gradient(180deg,#0b1220_0%,#09111f_100%)] shadow-[0_32px_72px_rgba(2,6,23,0.48),0_0_0_1px_rgba(51,65,85,0.8)] transition-[box-shadow,border-color] duration-300 animate-[contractPulse_6s_ease-in-out_infinite]"
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(27,196,125,0.12),transparent_32%),linear-gradient(125deg,rgba(255,255,255,0.04),transparent_34%,rgba(148,163,184,0.03)_78%)]" />
                <div className="absolute -inset-y-10 -left-1/3 w-1/2 rotate-[12deg] bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-50 blur-xl animate-[contractSweep_7s_ease-in-out_infinite]" />
              </div>
              <div className="bg-slate-900/80 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <span className="font-mono text-sm font-semibold text-slate-100">
                  {t("trustora.hero_visual.contract_id")}
                </span>
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/12 px-3 py-1.5 ring-1 ring-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="text-xs font-semibold text-emerald-200">
                    {t("trustora.hero_visual.international_verification")}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/65 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">
                      {t("trustora.hero_visual.client_label")}
                    </p>
                    <p className="font-semibold text-slate-100">
                      {t("trustora.hero_visual.client_company")}
                    </p>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{t("trustora.hero_visual.client_verification")}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/65 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-medium">
                      {t("trustora.hero_visual.provider_label")}
                    </p>
                    <p className="font-semibold text-slate-100">
                      {t("trustora.hero_visual.provider_company")}
                    </p>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{t("trustora.hero_visual.provider_verification")}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
                    {t("trustora.hero_visual.section_title")}
                  </h3>

                  <div className="overflow-hidden rounded-lg border border-slate-800">
                    <div className="grid grid-cols-12 gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs uppercase tracking-wide text-slate-400 font-medium">
                      <div className="col-span-5">{t("trustora.hero_visual.columns.milestone")}</div>
                      <div className="col-span-2">{t("trustora.hero_visual.columns.timeline")}</div>
                      <div className="col-span-2 text-right">{t("trustora.hero_visual.columns.amount")}</div>
                      <div className="col-span-3">{t("trustora.hero_visual.columns.status")}</div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center border-b border-slate-800/80 px-4 py-3">
                      <div className="col-span-5 text-sm text-slate-100">
                        {t("trustora.hero_visual.milestone_1.title")}
                      </div>
                      <div className="col-span-2 text-sm text-slate-400">
                        {t("trustora.hero_visual.milestone_1.timeline")}
                      </div>
                      <div className="col-span-2 text-right font-mono text-sm font-semibold text-slate-100">
                        €2,160.00
                      </div>
                      <div className="col-span-3">
                        <span className="inline-flex rounded bg-emerald-500/14 px-2.5 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/20">
                          {t("trustora.hero_visual.status.released")}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center px-4 py-3">
                      <div className="col-span-5 text-sm text-slate-100">
                        {t("trustora.hero_visual.milestone_2.title")}
                      </div>
                      <div className="col-span-2 text-sm text-slate-400">
                        {t("trustora.hero_visual.milestone_2.timeline")}
                      </div>
                      <div className="col-span-2 text-right font-mono text-sm font-semibold text-slate-100">
                        €5,040.00
                      </div>
                      <div className="col-span-3">
                        <span className="inline-flex items-center gap-1.5 rounded bg-blue-500/14 px-2.5 py-1 text-xs font-semibold text-blue-200 ring-1 ring-blue-500/20">
                          <Lock className="w-3 h-3" />
                          {t("trustora.hero_visual.status.held_in_escrow")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-800 bg-slate-950/75 px-6 py-3">
                <p className="text-xs text-slate-500 font-mono">
                  {t("trustora.hero_visual.hash_label")} 9f86d081884c7d65...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-15px); }
              100% { transform: translateY(0px); }
            }
            @keyframes contractSweep {
              0% { transform: translateX(-18%) rotate(12deg); opacity: 0; }
              14% { opacity: 0.7; }
              50% { transform: translateX(118%) rotate(12deg); opacity: 0.18; }
              100% { transform: translateX(118%) rotate(12deg); opacity: 0; }
            }
            @keyframes contractPulse {
              0%, 100% { box-shadow: 0 32px 72px rgba(2, 6, 23, 0.48), 0 0 0 1px rgba(51, 65, 85, 0.8); }
              50% { box-shadow: 0 38px 82px rgba(2, 6, 23, 0.58), 0 0 0 1px rgba(27, 196, 125, 0.18); }
            }
          `,
        }}
      />
    </>
  );
}
