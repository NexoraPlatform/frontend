import Image from "next/image";

import { cn } from "@/lib/utils";

type TrustoraBrandVariant = "theme" | "light" | "dark";

type TrustoraBrandProps = {
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  variant?: TrustoraBrandVariant;
};

const LOGO_DIMENSIONS = {
  width: 340,
  height: 64,
} as const;

const MARK_DIMENSIONS = {
  width: 64,
  height: 64,
} as const;

function BrandImage({
  alt,
  className,
  dimensions,
  priority = false,
  sizes,
  src,
}: {
  alt: string;
  className?: string;
  dimensions: { width: number; height: number };
  priority?: boolean;
  sizes?: string;
  src: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}

function ThemedBrandImage({
  alt,
  className,
  darkSrc,
  dimensions,
  lightSrc,
  priority = false,
  sizes,
  variant = "theme",
}: {
  alt: string;
  className?: string;
  darkSrc: string;
  dimensions: { width: number; height: number };
  lightSrc: string;
  priority?: boolean;
  sizes?: string;
  variant?: TrustoraBrandVariant;
}) {
  if (variant === "dark") {
    return (
      <BrandImage
        src={darkSrc}
        alt={alt}
        dimensions={dimensions}
        priority={priority}
        sizes={sizes}
        className={className}
      />
    );
  }

  if (variant === "light") {
    return (
      <BrandImage
        src={lightSrc}
        alt={alt}
        dimensions={dimensions}
        priority={priority}
        sizes={sizes}
        className={className}
      />
    );
  }

  return (
    <>
      <BrandImage
        src={lightSrc}
        alt={alt}
        dimensions={dimensions}
        priority={priority}
        sizes={sizes}
        className={cn("dark:hidden", className)}
      />
      <BrandImage
        src={darkSrc}
        alt={alt}
        dimensions={dimensions}
        sizes={sizes}
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}

export function TrustoraLogo({
  alt = "Trustora logo",
  className,
  imageClassName,
  priority = false,
  sizes = "(max-width: 640px) 180px, 220px",
  variant = "theme",
}: TrustoraBrandProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      <ThemedBrandImage
        alt={alt}
        className={imageClassName}
        darkSrc="/trustora-logo-dark.svg"
        dimensions={LOGO_DIMENSIONS}
        lightSrc="/trustora-logo-light.svg"
        priority={priority}
        sizes={sizes}
        variant={variant}
      />
    </span>
  );
}

export function TrustoraMark({
  alt = "Trustora icon",
  className,
  imageClassName,
  priority = false,
  sizes = "32px",
  variant = "theme",
}: TrustoraBrandProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      <ThemedBrandImage
        alt={alt}
        className={imageClassName}
        darkSrc="/trustora-icon-dark.svg"
        dimensions={MARK_DIMENSIONS}
        lightSrc="/trustora-icon-white.svg"
        priority={priority}
        sizes={sizes}
        variant={variant}
      />
    </span>
  );
}
