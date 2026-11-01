/**
 * Microsoft Clarity Custom Event Tracking
 * Project ID: z6kaj97kz1
 */

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

/**
 * Ініціалізація тегу кампанії при завантаженні сторінки.
 * Встановлює clarity("set", "test", "<a1|b1|a2|b2|direct>") для фільтрації сесій у Clarity.
 */
export function initCampaignAnalytics(testKey: string): void {
  try {
    if (typeof window !== 'undefined') {
      const applyTag = () => {
        if (typeof window.clarity === 'function') {
          window.clarity('set', 'test', testKey);
        }
      };

      // Якщо clarity вже ініціалізовано — ставимо тег одразу
      applyTag();

      // Також страхуємо виклик через невелику затримку, поки скрипт завантажується
      window.setTimeout(applyTag, 1000);
      window.setTimeout(applyTag, 3000);
    }
  } catch (err) {
    console.debug('[Clarity] initCampaignAnalytics error:', err);
  }
}

/**
 * Фіксація кліку по кнопці підписки на новини турніру.
 * Викликає clarity("event", "subscribe_click") та clarity("set", "test", "<a1|b1|a2|b2|direct>").
 */
export function trackSubscribeClick(testKey: string, location: string = 'general'): void {
  try {
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
      window.clarity('event', 'subscribe_click');
      window.clarity('set', 'test', testKey);
      window.clarity('set', 'button_location', location);
    }
  } catch (err) {
    console.debug('[Clarity] trackSubscribeClick error:', err);
  }
}

/**
 * Send a custom event to Microsoft Clarity
 */
export function trackEvent(name: string, data?: Record<string, string | number | boolean>): void {
  try {
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
      window.clarity('event', name);
      if (data) {
        Object.entries(data).forEach(([key, val]) => {
          window.clarity?.('set', `${name}_${key}`, String(val));
        });
      }
    }
  } catch (err) {
    console.debug('[Clarity] Event tracking failed:', err);
  }
}

/**
 * Track transition to community (Discord, Telegram, Email, or section CTA)
 */
export function trackCommunityClick(target: 'discord' | 'telegram' | 'email' | 'join_community', location: string): void {
  trackEvent('community_transition', {
    target,
    location,
  });
}

/**
 * Track when the user reaches the tournament regulations/rules section
 */
let hasTrackedRules = false;
export function trackRulesReached(): void {
  if (hasTrackedRules) return;
  hasTrackedRules = true;
  trackEvent('rules_reached', {
    section: 'fair_play',
    timestamp: Date.now(),
  });
}

/**
 * Track scroll depth milestones (25%, 50%, 75%, 100%)
 */
export function setupScrollDepthTracking(): () => void {
  if (typeof window === 'undefined') return () => {};

  const milestones = new Set([25, 50, 75, 100]);
  const reached = new Set<number>();

  const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) return;

    const scrollPercent = Math.min(100, Math.round((scrollTop / docHeight) * 100));

    milestones.forEach((m) => {
      if (scrollPercent >= m && !reached.has(m)) {
        reached.add(m);
        trackEvent('scroll_depth', { milestone: `${m}%` });
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}
