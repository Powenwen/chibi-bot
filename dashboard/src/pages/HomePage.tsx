import { HeroSection } from '../components/home/HeroSection';
import { FeaturesSection } from '../components/home/FeaturesSection';
import { StatsBar } from '../components/home/StatsBar';
import { FeatureDeepDive } from '../components/home/FeatureDeepDive';
import { CommandPreview } from '../components/home/CommandPreview';
import { Footer } from '../components/home/Footer';

export function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <StatsBar />
      <FeatureDeepDive />
      <CommandPreview />
      <Footer />
    </div>
  );
}
