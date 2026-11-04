/**
 * Сервіс для обробки та збереження заявок турніру UNBREAKABLE PHOENIX.
 * Працює напряму з Google Apps Script Webhook (безкоштовно на Vercel).
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
 * Зберігає копію заявки в localStorage браузера для надійності та локального тестування
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
 * Відправляє заявку до Google Таблиці через Google Apps Script Webhook
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

  // 1. Завжди бекапимо в localStorage на випадок втрати зв'язку
  backupToLocalStorage(payload);

  const googleScriptUrl = (import.meta.env.VITE_GOOGLE_SCRIPT_URL as string | undefined)?.trim();

  // Якщо URL скрипта ще не налаштовано в оточенні — повертаємо успіх для тестування
  if (!googleScriptUrl) {
    console.info(
      '[ApplicationService] VITE_GOOGLE_SCRIPT_URL не задано. Заявка збережена локально:',
      payload
    );
    // Імітуємо коротку затримку мережі
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true, id };
  }

  try {
    /**
     * Google Apps Script Web Apps повертають 302 редирект.
     * Використання mode: 'no-cors' з Content-Type: text/plain дозволяє відправити
     * повний POST payload без помилок блокування CORS у браузері.
     */
    await fetch(googleScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return { success: true, id };
  } catch (err) {
    console.error('[ApplicationService] Помилка відправки в Google Таблицю:', err);
    return {
      success: false,
      id,
      error: 'Не вдалося надіслати заявку на сервер. Будь ласка, перевірте з\'єднання та спробуйте ще раз.',
    };
  }
}
