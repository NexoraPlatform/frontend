import { Navigation } from '@/components/navigation';
import { HeroSection } from '@/components/hero-section';
import { SocialProof } from '@/components/social-proof';
import { ProblemSolution } from '@/components/problem-solution';
import { FeaturesSection } from '@/components/features-section';
import { HowItWorks } from '@/components/how-it-works';
import { TrustSecurity } from '@/components/trust-security';
import { FinalCTA } from '@/components/final-cta';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <main className="relative overflow-x-hidden">
      <Navigation />
      <HeroSection />
      <SocialProof />
      <ProblemSolution />
      <FeaturesSection />
      <HowItWorks />
      <TrustSecurity />
      <FinalCTA />
      <Footer />
    </main>
  );
}
