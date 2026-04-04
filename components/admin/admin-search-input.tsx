"use client";

import type { ChangeEventHandler } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

type AdminSearchInputProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  className?: string;
  inputClassName?: string;
};

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className = "relative flex-1",
  inputClassName = "h-11 border-border bg-transparent pl-12",
}: AdminSearchInputProps) {
  return (
    <div className={className}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClassName}
      />
    </div>
  );
}
