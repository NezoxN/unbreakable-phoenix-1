/**
 * Конфігурація посилань мікрокампаній для Telegram-каналу.
 * Усі посилання зібрані тут для зручної та швидкої заміни.
 */
export const TELEGRAM_CAMPAIGN_LINKS = {
  a1: 'https://t.me/+unbreakable_k1_a', // К1 А (/a1)
  b1: 'https://t.me/+unbreakable_k1_b', // К1 Б (/b1)
  a2: 'https://t.me/+unbreakable_k2_a', // К2 А (/a2)
  b2: 'https://t.me/+unbreakable_k2_b', // К2 Б (/b2)
  default: 'https://t.me/unbreakable_phoenix_cs2', // Загальне посилання на канал
} as const;

export type CampaignTestKey = 'a1' | 'b1' | 'a2' | 'b2' | 'direct';

export interface CampaignInfo {
  testKey: CampaignTestKey;
  inviteUrl: string;
}

/**
 * Читає location.pathname, зводить до нижнього регістру, прибирає слеш
 * та повертає відповідне посилання й ключ тесту для аналітики Clarity.
 */
export function getActiveCampaign(): CampaignInfo {
  if (typeof window === 'undefined') {
    return { testKey: 'direct', inviteUrl: TELEGRAM_CAMPAIGN_LINKS.default };
  }

  // Отримуємо шлях, зводимо до нижнього регістру та прибираємо початкові/кінцеві слеші
  const rawPath = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');

  if (rawPath === 'a1' || rawPath === 'b1' || rawPath === 'a2' || rawPath === 'b2') {
    return {
      testKey: rawPath as CampaignTestKey,
      inviteUrl: TELEGRAM_CAMPAIGN_LINKS[rawPath as keyof typeof TELEGRAM_CAMPAIGN_LINKS] || TELEGRAM_CAMPAIGN_LINKS.default,
    };
  }

  // Будь-який інший шлях або головна сторінка -> загальне посилання на канал
  return {
    testKey: 'direct',
    inviteUrl: TELEGRAM_CAMPAIGN_LINKS.default,
  };
}
