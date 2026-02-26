import Hero from '@/components/Hero';
import Reframe from '@/components/Reframe';
import Personalization from '@/components/Personalization';
import ComparisonGrid from '@/components/ComparisonGrid';
import CallToAction from '@/components/CallToAction';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative flex flex-col items-center">
      <Hero />
      <Reframe />
      <Personalization />
      <ComparisonGrid />
      <CallToAction />
      <DarkModeToggle />
    </main>
  );
}
