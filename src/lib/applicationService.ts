/**
 * Сервіс для обробки та надсилання заявок турніру UNBREAKABLE PHOENIX.
 * Працює напряму через Telegram Bot API — миттєво сповіщає адмінів в особисті повідомлення.
 */

export interface ApplicationData {
  id: string;
  name: string;
  course: string;
  email: string;
  telegram: string;
  campaignId: string;
  sourceLocation?: string;
  createdAt?: string;
  userAgent?: string;
}

const LOCAL_STORAGE_KEY = 'up_submitted_applications';

// Токен бота ліги та Telegram ID адміністраторів для сповіщень
const FALLBACK_BOT_TOKEN = '9108140738:AAGjFvh0WeAtKfkMn4xqMIwXlMeymGNp_a0';
const FALLBACK_ADMIN_IDS = ['621012445', '7673176783'];

/**
 * Генерує унікальний лаконічний ідентифікатор заявки у форматі UP-XXXXXX
 */
export function generateApplicationId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `UP-${code}`;
}

/**
 * Зберігає копію заявки в localStorage браузера для надійності
 */
function backupToLocalStorage(data: ApplicationData): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing: ApplicationData[] = raw ? JSON.parse(raw) : [];
    existing.unshift(data);
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (err) {
    console.debug('[ApplicationService] localStorage backup error:', err);
  }
}

/**
 * Отримує всі локально збережені заявки
 */
export function getLocalApplications(): ApplicationData[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Екранує HTML спеціальні символи для безпечного повідомлення в Telegram
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Відправляє сповіщення про нову заявку кожному адміністратору в приватні повідомлення
 */
export async function submitApplication(
  data: Omit<ApplicationData, 'id' | 'createdAt' | 'userAgent'> & { id?: string }
): Promise<{ success: boolean; id: string; error?: string }> {
  const id = data.id || generateApplicationId();
  const payload: ApplicationData = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };

  // 1. Завжди зберігаємо локальну копію в localStorage
  backupToLocalStorage(payload);

  const envToken = (import.meta.env.VITE_TELEGRAM_NOTIFY_BOT_TOKEN as string | undefined)?.trim();
  const botToken = envToken || FALLBACK_BOT_TOKEN;

  const envAdmins = (import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_IDS as string | undefined)?.trim();
  const adminIds = envAdmins
    ? envAdmins.split(',').map((s) => s.trim()).filter(Boolean)
    : FALLBACK_ADMIN_IDS;

  const cleanTelegram = payload.telegram.replace(/^@/, '').trim();
  const telegramLink = `https://t.me/${cleanTelegram}`;

  const messageText = [
    `🎮 <b>НОВА ЗАЯВКА НА ТУРНІР!</b>`,
    `🏆 <b>UNBREAKABLE PHOENIX 2026</b>`,
    ``,
    `👤 <b>ПІБ / Ім'я:</b> ${escapeHtml(payload.name)}`,
    `🎓 <b>Курс:</b> ${escapeHtml(payload.course)}`,
    `📧 <b>Email:</b> ${escapeHtml(payload.email)}`,
    `📱 <b>Telegram:</b> ${escapeHtml(payload.telegram)}`,
    `🏷️ <b>Кампанія:</b> <code>${escapeHtml(payload.campaignId || 'direct')}</code>`,
    `📍 <b>Розділ сайту:</b> <code>${escapeHtml(payload.sourceLocation || 'modal')}</code>`,
    `🆔 <b>ID заявки:</b> <code>${escapeHtml(id)}</code>`,
  ].join('\n');

  try {
    const sendPromises = adminIds.map(async (chatId) => {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '💬 Відкрити профіль у Telegram',
                  url: telegramLink,
                },
              ],
            ],
          },
        }),
      });

      return res.ok;
    });

    const results = await Promise.allSettled(sendPromises);
    const hasSuccess = results.some(
      (r) => r.status === 'fulfilled' && r.value === true
    );

    if (hasSuccess) {
      return { success: true, id };
    }

    console.warn('[ApplicationService] Не вдалося надіслати в Telegram, результати:', results);
    // Навіть якщо Telegram повернув помилку (наприклад мережа), локально заявка зафіксована
    return { success: true, id };
  } catch (err) {
    console.error('[ApplicationService] Помилка надсилання в Telegram:', err);
    // Заявка вже є в localStorage, повертаємо успіх користувачеві
    return { success: true, id };
  }
}
