"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

interface TrustoraLandingBrandProps {
  className?: string;
  priority?: boolean;
  textClassName?: string;
}

export function TrustoraLandingBrand({
  className,
  priority = false,
  textClassName = "text-xl font-bold",
}: TrustoraLandingBrandProps) {
  return (
    <span className={cn("inline-flex items-center space-x-3", className)}>
      <Image
        src="/trustora-logo2-60.webp"
        alt="Trustora Logo"
        width={60}
        height={75}
        className="h-10 w-auto"
        style={{ width: "auto", height: "2.5rem" }}
        priority={priority}
        quality={90}
      />
      <span className={textClassName}>Trustora</span>
    </span>
  );
}
