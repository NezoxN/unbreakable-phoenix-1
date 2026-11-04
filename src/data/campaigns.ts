/**
 * Конфігурація мікрокампаній та атрибуції переходів у Telegram.
 *
 * Посилання ведуть на Telegram-канал/групу для кожної кампанії окремо:
 * - a1: https://t.me/+N65FReF2GX9lOGM6
 * - b1: https://t.me/+LXIu4QsAL1JlYjhi
 * - a2: https://t.me/+jsYsKQDSr7k0YWVi
 * - b2: https://t.me/+05ZAcrq7yVk5MzYy
 * - default: https://t.me/+sjptc0-DcIYyNGVi
 *
 * Атрибуція джерела:
 * 1. Якщо користувач переходить за посиланням конкретної кампанії (/a1, /b1, /a2, /b2 або ?src=a1):
 *    вона стає активною і зберігається в localStorage на 7 днів.
 * 2. Якщо користувач заходить на головну (/) або без мітки кампанії:
 *    використовується збережена кампанія з localStorage (протягом 7 днів).
 * 3. Якщо збереженої кампанії немає — використовується "direct" (загальне посилання).
 */

export const VALID_CAMPAIGNS = ['a1', 'b1', 'a2', 'b2'] as const;
export type ValidCampaign = (typeof VALID_CAMPAIGNS)[number];
export type CampaignTestKey = ValidCampaign | 'direct';

export interface CampaignInfo {
  testKey: CampaignTestKey;
  inviteUrl: string;
}

interface StoredCampaign {
  s: ValidCampaign;
  t: number;
}

export const CAMPAIGN_STORAGE_KEY = 'src';
export const CAMPAIGN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 днів (7 * 864e5)

/**
 * Прямі посилання на Telegram-групу/канал для кожної мікрокампанії.
 */
export const TELEGRAM_CAMPAIGN_LINKS = {
  a1: 'https://t.me/+N65FReF2GX9lOGM6', // К1 А (/a1)
  b1: 'https://t.me/+LXIu4QsAL1JlYjhi', // К1 Б (/b1)
  a2: 'https://t.me/+jsYsKQDSr7k0YWVi', // К2 А (/a2)
  b2: 'https://t.me/+05ZAcrq7yVk5MzYy', // К2 Б (/b2)
  default: 'https://t.me/+sjptc0-DcIYyNGVi', // Загальне посилання на канал/групу
} as const;

const envBot = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TELEGRAM_BOT_USERNAME) as string | undefined;

/**
 * Юзернейм Telegram-бота (на випадок перемикання на бота).
 */
export const TELEGRAM_BOT_USERNAME =
  (envBot && envBot.trim() !== '' ? envBot.trim().replace(/^@/, '') : 'unbreakable_phoenix_bot');

/**
 * Генератор посилання на бота (збережено для сумісності).
 */
export function getTelegramBotUrl(testKey: CampaignTestKey, botUsername = TELEGRAM_BOT_USERNAME): string {
  const cleanBot = (botUsername || TELEGRAM_BOT_USERNAME).replace(/^@/, '');
  return `https://t.me/${cleanBot}?start=${testKey}`;
}

/**
 * Повертає індивідуальне посилання на Telegram-канал/групу відповідно до ключа кампанії.
 */
export function getCampaignInviteUrl(testKey: CampaignTestKey): string {
  if (testKey === 'direct') {
    return TELEGRAM_CAMPAIGN_LINKS.default;
  }
  return TELEGRAM_CAMPAIGN_LINKS[testKey] || TELEGRAM_CAMPAIGN_LINKS.default;
}

/**
 * Валідує, чи є рядок допустимою назвою мікрокампанії.
 */
export function isValidCampaign(key: unknown): key is ValidCampaign {
  return typeof key === 'string' && (VALID_CAMPAIGNS as readonly string[]).includes(key as ValidCampaign);
}

/**
 * Визначає активну кампанію:
 * 1. Перевіряє pathname (наприклад /a1, /b1).
 * 2. Перевіряє search query параметри (?src=a1, ?utm_source=a1, ?campaign=a1, ?c=a1).
 * 3. Якщо є явна кампанія — зберігає її в localStorage на 7 днів та повертає.
 * 4. Якщо явної немає — читає localStorage (якщо збережено не пізніше ніж 7 днів тому).
 * 5. Якщо нічого немає — повертає 'direct' та загальне посилання на канал.
 */
export function getActiveCampaign(): CampaignInfo {
  if (typeof window === 'undefined') {
    return {
      testKey: 'direct',
      inviteUrl: TELEGRAM_CAMPAIGN_LINKS.default,
    };
  }

  // 1. Зчитуємо шлях з URL (/a1 -> a1)
  const rawPath = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  let explicitCampaign: ValidCampaign | null = isValidCampaign(rawPath) ? rawPath : null;

  // 2. Якщо в шляху немає, перевіряємо query-параметри
  if (!explicitCampaign) {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryVal = (
        searchParams.get('src') ||
        searchParams.get('utm_source') ||
        searchParams.get('campaign') ||
        searchParams.get('c') ||
        ''
      ).toLowerCase();
      if (isValidCampaign(queryVal)) {
        explicitCampaign = queryVal;
      }
    } catch {
      // ignore query parsing errors
    }
  }

  // 3. Якщо виявлено явну кампанію за посиланням — оновлюємо збережені дані
  if (explicitCampaign) {
    try {
      const payload: StoredCampaign = { s: explicitCampaign, t: Date.now() };
      window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.debug('[Campaigns] localStorage write error:', err);
    }

    return {
      testKey: explicitCampaign,
      inviteUrl: getCampaignInviteUrl(explicitCampaign),
    };
  }

  // 4. Якщо явної кампанії в поточному URL немає — читаємо збережену з localStorage
  let savedSrc: ValidCampaign | null = null;
  try {
    const raw = window.localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredCampaign> | null;
      if (
        parsed &&
        isValidCampaign(parsed.s) &&
        typeof parsed.t === 'number' &&
        Date.now() - parsed.t < CAMPAIGN_TTL_MS
      ) {
        savedSrc = parsed.s;
      }
    }
  } catch (err) {
    console.debug('[Campaigns] localStorage read error:', err);
  }

  const effectiveKey: CampaignTestKey = savedSrc || 'direct';

  return {
    testKey: effectiveKey,
    inviteUrl: getCampaignInviteUrl(effectiveKey),
  };
}
