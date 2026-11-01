import React, { useState, useEffect } from 'react';
import { setupScrollDepthTracking, initCampaignAnalytics } from './lib/analytics';
import { getActiveCampaign } from './data/campaigns';
import { AmbientEffects } from './components/AmbientEffects';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { CountdownSection } from './components/CountdownSection';
import { StepsSection } from './components/StepsSection';
import { MapSection } from './components/MapSection';
import { PrizesSection } from './components/PrizesSection';
import { RegistrationSection } from './components/RegistrationSection';
import { ScheduleSection } from './components/ScheduleSection';
import { FairPlaySection } from './components/FairPlaySection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { ResultsSection } from './components/ResultsSection';
import { StagesPage } from './pages/StagesPage';
import { AdminPage } from './pages/AdminPage';

type RouteType = 'home' | 'stages' | 'admin';

function resolveRoute(): RouteType {
  const hash = window.location.hash.toLowerCase().split('?')[0];
  const path = window.location.pathname.toLowerCase();

  if (hash.includes('stages') || path === '/stages') return 'stages';
  if (hash.includes('admin') || path === '/admin') return 'admin';
  return 'home';
}

export const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<RouteType>(resolveRoute);

  useEffect(() => {
    const campaign = getActiveCampaign();
    initCampaignAnalytics(campaign.testKey);

    const handleLocationChange = () => {
      setCurrentRoute(resolveRoute());
      const updatedCampaign = getActiveCampaign();
      initCampaignAnalytics(updatedCampaign.testKey);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    const cleanupScrollTracking = setupScrollDepthTracking();

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
      cleanupScrollTracking();
    };
  }, []);

  const navigateTo = (route: string) => {
    if (route === 'stages') {
      window.location.hash = '/stages';
      setCurrentRoute('stages');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (route === 'admin') {
      window.location.hash = '/admin';
      setCurrentRoute('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (route === 'register') {
      if (currentRoute !== 'home') {
        window.location.hash = '';
        setCurrentRoute('home');
        setTimeout(() => {
          document.getElementById('registration')?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      } else {
        document.getElementById('registration')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.hash = '';
      setCurrentRoute('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative selection:bg-[#FFD700] selection:text-[#050505]">
      {/* Custom Crosshair Cursor & Ember Particle System */}
      <AmbientEffects />

      {/* Top Navigation */}
      <Navigation
        currentRoute={currentRoute}
        onNavigate={navigateTo}
      />

      {/* Route-Based Content Rendering */}
      {currentRoute === 'stages' ? (
        <StagesPage
          onBack={() => navigateTo('home')}
        />
      ) : currentRoute === 'admin' ? (
        <AdminPage onBack={() => navigateTo('home')} />
      ) : (
        /* Main Landing Page */
        <main>
          {/* 1. Preserved Hero & Phoenix SVG Animation */}
          <HeroSection />

          {/* 2. Overview Banner, Registration Status & Expanded Golden Marquee */}
          <CountdownSection />

          {/* 3. Три кроки до сцени & Чесне жеребкування за кошиками */}
          <StepsSection />

          {/* 4. Одна ліга — вся Україна & Інтерактивна мапа хабів з інтегрованими ЗВО */}
          <MapSection />

          {/* 5. Граєш не лише за честь: призовий фонд 100 000 ₴ та девайси (тонкі 3px лінії) */}
          <PrizesSection />

          {/* 6. Офіційна реєстрація: блок зі статусом СКОРО */}
          <RegistrationSection />

          {/* 7. Розклад турніру (календар сезону) */}
          <ScheduleSection />

          {/* 8. Окремий блок «Результати турніру: СКОРО» */}
          <ResultsSection />

          {/* 9. Чесний турнір — справжній чемпіон (Fair Play) */}
          <FairPlaySection />

          {/* 10. Відповіді на типові питання (FAQ акордеон) */}
          <FaqSection />
        </main>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;

