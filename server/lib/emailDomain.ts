/** Розбирає рядок доменів ЗВО ("@kpi.ua,lll.kpi.ua") у нормалізований список */
export function parseDomains(raw: string): string[] {
  return raw
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
}

/** Пошта належить ЗВО: точний домен або його піддомен (student.karazin.ua → karazin.ua) */
export function emailMatchesDomains(email: string, domains: string[]): boolean {
  const at = email.lastIndexOf('@');
  if (at < 1) return false;
  const host = email.slice(at + 1).toLowerCase();
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}
