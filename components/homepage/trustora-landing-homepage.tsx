"use client";

import { TrustoraLandingFeaturesSection } from "@/components/homepage/trustora-landing/features-section";
import { TrustoraLandingFinalCtaSection } from "@/components/homepage/trustora-landing/final-cta-section";
import { TrustoraLandingFooter } from "@/components/homepage/trustora-landing/footer";
import { TrustoraLandingHeroSection } from "@/components/homepage/trustora-landing/hero-section";
import { TrustoraLandingHowItWorksSection } from "@/components/homepage/trustora-landing/how-it-works-section";
import { TrustoraLandingNavigation } from "@/components/homepage/trustora-landing/navigation";
import { TrustoraLandingProblemSolutionSection } from "@/components/homepage/trustora-landing/problem-solution-section";
import { TrustoraLandingSecuritySection } from "@/components/homepage/trustora-landing/security-section";
import { TrustoraLandingSocialProofSection } from "@/components/homepage/trustora-landing/social-proof-section";
import { TrustoraLandingThemeStyles } from "@/components/homepage/trustora-landing/theme-styles";

export function TrustoraLandingHomepage() {
  return (
    <div className="project-homepage relative isolate overflow-x-hidden bg-background text-foreground">
      <TrustoraLandingThemeStyles />

      <TrustoraLandingNavigation />

      <TrustoraLandingHeroSection />
      <TrustoraLandingSocialProofSection />
      <TrustoraLandingProblemSolutionSection />
      <TrustoraLandingFeaturesSection />
      <TrustoraLandingHowItWorksSection />
      <TrustoraLandingSecuritySection />
      <TrustoraLandingFinalCtaSection />

      <TrustoraLandingFooter />
    </div>
  );
}
