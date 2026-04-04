import { TrustoraLogo } from "@/components/branding/trustora-logo";
import { cn } from "@/lib/utils";

interface TrustoraLandingBrandProps {
  className?: string;
  logoClassName?: string;
  priority?: boolean;
}

export function TrustoraLandingBrand({
  className,
  logoClassName = "h-14 w-auto",
  priority = false,
}: TrustoraLandingBrandProps) {
  return (
    <TrustoraLogo
      className={cn("inline-flex items-center", className)}
      imageClassName={logoClassName}
      priority={priority}
    />
  );
}
