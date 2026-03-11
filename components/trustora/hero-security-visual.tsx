"use client";

import { useEffect, useRef } from "react";

export function TrustoraHeroSecurityVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const shieldImg = logoRef.current;

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

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
      centerX = width / 2;
      centerY = height / 2;
    };
    window.addEventListener("resize", resize);
    resize();

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
      radius: number;
      color: string;
      state: "attacking" | "repelled";
      alpha: number;
      trail: Array<{ x: number; y: number }>;

      constructor() {
        const edge = Math.floor(Math.random() * 3);
        if (edge === 0) {
          this.x = Math.random() * width;
          this.y = -50;
        } else if (edge === 1) {
          this.x = width + 50;
          this.y = Math.random() * height;
        } else {
          this.x = Math.random() * width;
          this.y = height + 50;
        }

        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const dist = Math.hypot(dx, dy);

        const speed = Math.random() * 2 + 2.5;
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;

        this.radius = Math.random() * 2 + 2;
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

            if (shieldImg) {
              shieldImg.style.filter = "drop-shadow(0 0 30px rgba(255, 42, 75, 0.6))";
              setTimeout(() => {
                if (shieldImg) shieldImg.style.filter = "drop-shadow(0 0 25px rgba(0, 229, 255, 0.15))";
              }, 150);
            }
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
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
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

      if (Math.random() < 0.04) {
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
          <img
            ref={logoRef}
            src="https://preview.trustora.ro/trustora-logo2.png"
            alt="Trustora Shield Logo"
            draggable={false}
            className="h-auto w-[220px] object-contain transition-[filter] duration-100 ease-in sm:w-[260px]"
            style={{
              mixBlendMode: "screen",
              filter: "drop-shadow(0 0 25px rgba(0, 229, 255, 0.15))",
            }}
          />
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
          `,
        }}
      />
    </>
  );
}
