import type { LucideIcon } from "lucide-react";

export interface LandingLink {
  name: string;
  href: string;
}

export interface LandingMetric {
  value: string;
  label: string;
}

export interface LandingStatCard {
  label: string;
  value: string;
  trend: string;
}

export interface LandingTransaction {
  name: string;
  amount: string;
  time: string;
}

export interface LandingHeroPanel {
  balanceLabel: string;
  balanceValue: string;
  balanceGrowth: string;
  cards: LandingStatCard[];
  transactions: LandingTransaction[];
}

export interface LandingPartner {
  name: string;
  icon: LucideIcon;
}

export interface LandingIconItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface LandingStep {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface LandingFooterSection {
  title: string;
  links: LandingLink[];
}

export interface LandingSocialLink {
  icon: LucideIcon;
  href: string;
  label: string;
}
