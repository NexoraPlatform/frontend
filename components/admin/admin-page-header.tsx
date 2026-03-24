"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AdminPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  backHref?: string;
  className?: string;
  titleClassName?: string;
  delay?: number;
};

export function AdminPageHeader({
  title,
  description,
  action,
  backHref,
  className,
  titleClassName,
  delay = 0,
}: AdminPageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {backHref ? (
          <Link href={backHref}>
            <Button variant="outline" size="icon" className="border-border bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        ) : null}

        <div>
          <h1 className={cn("text-3xl font-bold", titleClassName)}>{title}</h1>
          {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </motion.div>
  );
}
