/** Людські назви дій з журналу адміністраторів (server/routes/admin.ts → log()) */
export const LOG_LABELS: Record<string, string> = {
  'verification.approve': 'Підтвердив студента',
  'verification.reject': 'Відхилив студентський',
  'user.update': 'Змінив дані гравця',
  'team.approve': 'Схвалив команду',
  'team.reject': 'Відхилив команду',
  'team.update': 'Змінив команду',
  'team.captain': 'Призначив капітана',
  'team.member.add': 'Додав гравця в склад',
  'team.member.remove': 'Видалив гравця зі складу',
  'team.member.slot': 'Змінив слот гравця',
  'match.create': 'Створив матч',
  'match.update': 'Змінив матч',
  'match.delete': 'Видалив матч',
  'match.result': 'Ввів результат матчу',
  'match.import': 'Імпортував матч з FACEIT',
};

export interface AdminLogItem {
  id: string;
  action: string;
  target: string | null;
  details: string | null;
  createdAt: string;
  admin: { faceitNickname: string };
}

export const logLabel = (action: string) => LOG_LABELS[action] ?? action;

/** details зберігається як JSON-рядок — показуємо коротко «ключ: значення» */
export function formatDetails(details: string | null) {
  if (!details) return '';
  try {
    const obj = JSON.parse(details) as Record<string, unknown>;
    return Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .join(' · ');
  } catch {
    return details;
  }
}
