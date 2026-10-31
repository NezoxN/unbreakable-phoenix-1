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
    // Silently fail without impacting user experience
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
