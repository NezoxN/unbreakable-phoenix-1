import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { trackSubscribeClick } from '../lib/analytics';
import { getActiveCampaign } from '../data/campaigns';

interface NavigationProps {
  onRegister?: () => void;
  currentRoute?: string;
  onNavigate?: (route: string) => void;
}

interface NavLinkItem {
  href: string;
  label: string;
  route: string | null;
  badge?: string;
}

const navLinks: NavLinkItem[] = [
  { href: '#format', label: 'ФОРМАТ', route: null },
  { href: '#map', label: 'КАРТА', route: null },
  { href: '#prizes', label: 'ПРИЗИ', route: null },
  { href: '#schedule', label: 'РОЗКЛАД', route: null },
  { href: '#/stages', label: 'СІТКА', route: 'stages' },
  { href: '#results', label: 'РЕЗУЛЬТАТИ', route: null },
  { href: '#faq', label: 'FAQ', route: null },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentRoute = 'home',
  onNavigate,
}) => {
  const campaign = getActiveCampaign();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll spy to highlight active section on the main page
  useEffect(() => {
    if (currentRoute !== 'home') {
      setActiveSection('');
      return;
    }

    const sectionIds = ['format', 'map', 'prizes', 'schedule', 'results', 'faq'];
    const handleScrollSpy = () => {
      const scrollPos = window.scrollY + 250;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(id);
          return;
        }
      }
      setActiveSection('');
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    handleScrollSpy();
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [currentRoute]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);



  const handleNavClick = (link: NavLinkItem, e: React.MouseEvent) => {
    if (link.route) {
      e.preventDefault();
      if (onNavigate) {
        onNavigate(link.route);
      } else {
        window.location.hash = `/${link.route}`;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (currentRoute !== 'home') {
        e.preventDefault();
        if (onNavigate) {
          onNavigate('home');
        } else {
          window.location.hash = '';
        }
        setTimeout(() => {
          const el = document.querySelector(link.href);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      } else {
        const targetId = link.href.substring(1);
        const el = document.getElementById(targetId);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('home');
    } else {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-[1000] transition-all duration-300 ${
        scrolled
          ? 'bg-[#050505]/95 backdrop-blur-md py-2.5 sm:py-3 border-b border-[#FFD700]/20 shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
          : 'bg-[#050505]/85 backdrop-blur-md py-3.5 sm:py-4 border-b border-neutral-800/80'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between gap-4">
        {/* Brand Logo with Esports Tag */}
        <a
          href="#"
          onClick={handleLogoClick}
          className="font-head text-base sm:text-lg xl:text-xl tracking-[1.5px] font-bold uppercase flex items-center gap-2 text-[#FFD700] hover-target focus:outline-none shrink-0 group"
        >
          <span className="text-white group-hover:text-neutral-200 transition-colors">UNBREAKABLE</span>
          <span>PHOENIX</span>
        </a>

        {/* Desktop Styled Esports Tab Navigation ("Вкладки в нашому стилі") */}
        <nav
          className="hidden lg:flex items-center"
          aria-label="Основна навігація"
        >
          {navLinks.map((link) => {
            const isRouteActive = link.route
              ? currentRoute === link.route
              : currentRoute === 'home' && activeSection === link.href.replace('#', '');

            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(link, e)}
                className={`hover-target relative text-xs xl:text-sm font-head uppercase tracking-[1.2px] px-2.5 xl:px-3 py-1.5 whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 group select-none ${
                  isRouteActive ? 'text-[#FFD700] font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#FFD700] font-bold hidden xl:inline-block">
                    {link.badge}
                  </span>
                )}
                {/* Active/Hover Bottom Indicator */}
                <span
                  className={`absolute bottom-0 left-2 right-2 h-[2px] bg-[#FFD700] transition-all duration-200 ${
                    isRouteActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Action Buttons Hub */}
        <div className="hidden sm:flex items-center gap-2.5 xl:gap-3 shrink-0 relative justify-end">
          <a
            href={campaign.inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackSubscribeClick(campaign.testKey, 'navigation_header')}
            className="bg-[#FFD700] text-black font-head font-bold hover:bg-[#ffcc00] hover-target text-xs tracking-[1.5px] px-4 xl:px-5 py-2 transition-colors uppercase shadow-[0_0_15px_rgba(255,215,0,0.25)] whitespace-nowrap"
          >
            Стежити за оновленнями
          </a>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="lg:hidden p-2 text-neutral-300 hover:text-[#FFD700] border border-neutral-800 hover:border-[#FFD700]/50 transition-colors hover-target"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#050505]/98 border-b border-[#FFD700]/25 px-6 py-6 text-left shadow-2xl">
          <nav className="flex flex-col space-y-2" aria-label="Мобільна навігація">
            {navLinks.map((link, idx) => {
              const isRouteActive = link.route
                ? currentRoute === link.route
                : currentRoute === 'home' && activeSection === link.href.replace('#', '');

              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleNavClick(link, e);
                  }}
                  className={`font-head text-base uppercase tracking-[2px] py-2.5 px-3 flex items-center justify-between border-b border-neutral-900 transition-colors ${
                    isRouteActive
                      ? 'text-[#FFD700] bg-[#111] font-bold border-l-2 border-l-[#FFD700]'
                      : 'text-neutral-300 hover:text-[#FFD700] hover:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-neutral-600">0{idx + 1}</span>
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#FFD700] font-bold">
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
            <div className="pt-4 flex flex-col gap-2.5">
              <a
                href={campaign.inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackSubscribeClick(campaign.testKey, 'navigation_mobile');
                  setMobileMenuOpen(false);
                }}
                className="bg-[#FFD700] text-black font-head font-bold text-center py-3 text-xs tracking-[2px] uppercase"
              >
                Стежити за оновленнями
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
