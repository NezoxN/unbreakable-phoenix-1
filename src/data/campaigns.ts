/**
 * Конфігурація мікрокампаній та атрибуції переходів у Telegram-бот.
 *
 * Модель «Перше джерело виграє» (First-touch attribution):
 * Якщо користувач прийшов за посиланням /a1, це джерело зберігається в localStorage
 * на 7 днів. Навіть якщо він пізніше відкриє /b1 або зайде напряму, він закріплюється
 * за першим джерелом (a1), і посилання веде на t.me/<BOT>?start=a1, а в Clarity
 * відправляється тег "a1".
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

const envBot = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TELEGRAM_BOT_USERNAME) as string | undefined;

/**
 * Юзернейм Telegram-бота (без @). За замовчуванням береться з VITE_TELEGRAM_BOT_USERNAME у .env.
 */
export const TELEGRAM_BOT_USERNAME =
  (envBot && envBot.trim() !== '' ? envBot.trim().replace(/^@/, '') : 'unbreakable_phoenix_bot');

/**
 * Генерує цільове посилання на бота з параметром start:
 * https://t.me/<BOT_NAME>?start=<source>
 */
export function getTelegramBotUrl(testKey: CampaignTestKey, botUsername = TELEGRAM_BOT_USERNAME): string {
  const cleanBot = (botUsername || TELEGRAM_BOT_USERNAME).replace(/^@/, '');
  return `https://t.me/${cleanBot}?start=${testKey}`;
}

/**
 * Сумісність для статичних звернень за ключем кампанії.
 */
export const TELEGRAM_CAMPAIGN_LINKS = {
  a1: getTelegramBotUrl('a1'),
  b1: getTelegramBotUrl('b1'),
  a2: getTelegramBotUrl('a2'),
  b2: getTelegramBotUrl('b2'),
  default: getTelegramBotUrl('direct'),
} as const;

/**
 * Валідує, чи є рядок допустимою назвою мікрокампанії.
 */
export function isValidCampaign(key: unknown): key is ValidCampaign {
  return typeof key === 'string' && (VALID_CAMPAIGNS as readonly string[]).includes(key);
}

/**
 * Визначає активну кампанію з First-Touch атрибуцією на 7 днів:
 * 1. Зчитує pathname (наприклад /a1 -> a1).
 * 2. Перевіряє збережений запис у localStorage. Якщо йому менше 7 днів — використовує його.
 * 3. Якщо збереженого немає, але поточний шлях валідний — фіксує його в localStorage на 7 днів.
 * 4. Якщо джерела немає взагалі — повертає 'direct'.
 */
export function getActiveCampaign(): CampaignInfo {
  if (typeof window === 'undefined') {
    return {
      testKey: 'direct',
      inviteUrl: getTelegramBotUrl('direct'),
    };
  }

  // 1. Отримуємо шлях з URL (/a1 -> a1)
  const rawPath = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const pathSrc: ValidCampaign | null = isValidCampaign(rawPath) ? rawPath : null;

  let savedSrc: ValidCampaign | null = null;

  // 2. Зчитуємо збережене значення з localStorage
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

    // 3. Якщо дійсного збереженого немає, а поточний шлях валідний — зберігаємо його
    if (!savedSrc && pathSrc) {
      const payload: StoredCampaign = { s: pathSrc, t: Date.now() };
      window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (err) {
    console.debug('[Campaigns] localStorage attribution error:', err);
  }

  // 4. Перше джерело виграє (savedSrc має пріоритет над новим шляхом)
  const effectiveKey: CampaignTestKey = savedSrc || pathSrc || 'direct';

  return {
    testKey: effectiveKey,
    inviteUrl: getTelegramBotUrl(effectiveKey),
  };
}
